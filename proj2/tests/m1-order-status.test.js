// M1 / UC12: guarded order status transitions.
// Source under test: server/routes/orders.js PUT /:id/status, src/orders/statusTransitions.js
// DB_DESIGN_M2_M3.md §6: delivered-order counts feed donations, badges, the M2
// leaderboard and M3 challenges, so `delivered` must not be settable here.

jest.mock('../server/config/firebase', () => require('./helpers/fakeFirestore').createFirestoreMock());

const request = require('supertest');
const { db } = require('../server/config/firebase');
const orderRoutes = require('../server/routes/orders');
const deliveryRoutes = require('../server/routes/delivery');
const { buildApp } = require('./helpers/buildApp');
const { bearer } = require('./helpers/authToken');
const {
  RESTAURANT_TRANSITIONS,
  RESTAURANT_SETTABLE_STATUSES,
  canRestaurantTransition,
} = require('../src/orders/statusTransitions');

describe('M1: canRestaurantTransition', () => {
  test('the kitchen workflow moves forward one step at a time', () => {
    expect(canRestaurantTransition('pending', 'confirmed')).toBe(true);
    expect(canRestaurantTransition('confirmed', 'preparing')).toBe(true);
    expect(canRestaurantTransition('preparing', 'ready')).toBe(true);
  });

  test('skipping ahead or going backwards is refused', () => {
    expect(canRestaurantTransition('pending', 'ready')).toBe(false);
    expect(canRestaurantTransition('ready', 'preparing')).toBe(false);
    expect(canRestaurantTransition('confirmed', 'pending')).toBe(false);
  });

  test('delivery statuses are never reachable through this table', () => {
    for (const from of Object.keys(RESTAURANT_TRANSITIONS)) {
      expect(canRestaurantTransition(from, 'out_for_delivery')).toBe(false);
      expect(canRestaurantTransition(from, 'delivered')).toBe(false);
    }
    expect(RESTAURANT_SETTABLE_STATUSES).not.toContain('delivered');
  });

  test('terminal states stay terminal', () => {
    for (const to of RESTAURANT_SETTABLE_STATUSES) {
      expect(canRestaurantTransition('delivered', to)).toBe(false);
      expect(canRestaurantTransition('cancelled', to)).toBe(false);
    }
  });

  test('unknown current status -> nothing allowed', () => {
    expect(canRestaurantTransition('mystery', 'confirmed')).toBe(false);
  });
});

describe('M1: PUT /api/orders/:id/status', () => {
  const app = buildApp({ '/api/orders': orderRoutes, '/api/delivery': deliveryRoutes });
  const asOwner = bearer('restaurant-1', 'restaurant');

  beforeEach(() => db.__reset());

  function seedOrder(status, extra = {}) {
    db.__seed('orders', 'o1', {
      id: 'o1',
      customerId: 'cust-1',
      restaurantId: 'restaurant-1',
      totalAmount: 30,
      deliveryFee: 3,
      tipAmount: 1,
      status,
      deliveryPartnerId: null,
      ...extra,
    });
  }

  const statusOf = async () => (await db.collection('orders').doc('o1').get()).data().status;

  test('the owning restaurant walks an order pending -> confirmed -> preparing -> ready, stamping timestamps', async () => {
    seedOrder('pending');
    for (const status of ['confirmed', 'preparing', 'ready']) {
      const res = await request(app).put('/api/orders/o1/status').set(asOwner).send({ status });
      expect(res.status).toBe(200);
    }
    const data = (await db.collection('orders').doc('o1').get()).data();
    expect(data.status).toBe('ready');
    expect(data.confirmedAt).toBeTruthy();
    expect(data.readyAt).toBeTruthy();
  });

  test('no token -> 401', async () => {
    seedOrder('pending');
    const res = await request(app).put('/api/orders/o1/status').send({ status: 'confirmed' });
    expect(res.status).toBe(401);
    expect(await statusOf()).toBe('pending');
  });

  test('a customer (or rider) token -> 403', async () => {
    seedOrder('pending');
    for (const role of ['customer', 'delivery']) {
      const res = await request(app).put('/api/orders/o1/status').set(bearer('someone', role)).send({ status: 'confirmed' });
      expect(res.status).toBe(403);
    }
    expect(await statusOf()).toBe('pending');
  });

  test("another restaurant cannot move this restaurant's order -> 403", async () => {
    seedOrder('pending');
    const res = await request(app)
      .put('/api/orders/o1/status')
      .set(bearer('restaurant-2', 'restaurant'))
      .send({ status: 'cancelled' });
    expect(res.status).toBe(403);
    expect(await statusOf()).toBe('pending');
  });

  test('skipping a step (pending -> ready) -> 409', async () => {
    seedOrder('pending');
    const res = await request(app).put('/api/orders/o1/status').set(asOwner).send({ status: 'ready' });
    expect(res.status).toBe(409);
    expect(await statusOf()).toBe('pending');
  });

  test('setting out_for_delivery or delivered directly -> 400 (only the rider can, via /api/delivery)', async () => {
    seedOrder('ready');
    for (const status of ['out_for_delivery', 'delivered']) {
      const res = await request(app).put('/api/orders/o1/status').set(asOwner).send({ status });
      expect(res.status).toBe(400);
    }
    expect(await statusOf()).toBe('ready');
  });

  test('a delivered order cannot be cancelled afterwards -> 409', async () => {
    seedOrder('delivered');
    const res = await request(app).put('/api/orders/o1/status').set(asOwner).send({ status: 'cancelled' });
    expect(res.status).toBe(409);
    expect(await statusOf()).toBe('delivered');
  });

  test('nonexistent order -> 404', async () => {
    const res = await request(app).put('/api/orders/nope/status').set(asOwner).send({ status: 'confirmed' });
    expect(res.status).toBe(404);
  });

  test('end to end: restaurant readies the order, the rider who claims it is the only one who can deliver it', async () => {
    seedOrder('preparing');
    db.__seed('users', 'rider-A', { id: 'rider-A', role: 'delivery', totalEarnings: 0, deliveryStatus: 'free' });
    db.__seed('users', 'rider-B', { id: 'rider-B', role: 'delivery', totalEarnings: 0, deliveryStatus: 'free' });

    expect((await request(app).put('/api/orders/o1/status').set(asOwner).send({ status: 'ready' })).status).toBe(200);
    expect((await request(app).post('/api/delivery/accept/o1').set(bearer('rider-A', 'delivery')).send({})).status).toBe(200);
    expect((await request(app).post('/api/delivery/deliver/o1').set(bearer('rider-B', 'delivery')).send({})).status).toBe(403);
    expect((await request(app).post('/api/delivery/deliver/o1').set(bearer('rider-A', 'delivery')).send({})).status).toBe(200);

    expect(await statusOf()).toBe('delivered');
    expect((await db.collection('users').doc('rider-A').get()).data().totalEarnings).toBe(4);
    expect((await db.collection('users').doc('rider-B').get()).data().totalEarnings).toBe(0);
    expect((await db.collection('points').doc('cust-1').get()).data().availablePoints).toBe(3); // 10% of $30
  });
});

describe('M1 / UC6: POST /api/orders rejects negative money fields', () => {
  const app = buildApp({ '/api/orders': orderRoutes });
  const base = {
    restaurantId: 'restaurant-1',
    customerId: 'cust-1',
    items: [{ menuItemId: 'm1', quantity: 1, price: 10 }],
    deliveryAddress: { street: '1 Main St' },
    totalAmount: 10,
  };

  beforeEach(() => db.__reset());

  test.each([
    ['totalAmount', -5],
    ['tipAmount', -1],
    ['deliveryFee', -3],
  ])('%s = %p -> 400', async (field, value) => {
    const res = await request(app).post('/api/orders').send({ ...base, [field]: value });
    expect(res.status).toBe(400);
  });

  test('a normal order is still created -> 201', async () => {
    const res = await request(app).post('/api/orders').send({ ...base, tipAmount: 2, deliveryFee: 3 });
    expect(res.status).toBe(201);
  });
});
