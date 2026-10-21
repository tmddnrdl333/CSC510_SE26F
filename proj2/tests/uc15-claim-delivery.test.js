// UC15: Claim a delivery job (Delivery partner)
// Source under test: server/routes/delivery.js (POST /accept/:orderId)
// See proj1a-report/usecases.md for the authoritative main scenario + extensions.
// Shares its fixture (two delivery partners + one ready order) with UC16 via
// tests/helpers/deliveryFixtures.js.
//
// Environment note: Firestore is mocked (see tests/helpers/fakeFirestore.js) because neither
// Docker nor the Firestore emulator toolchain is available in this environment.

jest.mock('../server/config/firebase', () =>
  require('./helpers/fakeFirestore').createFirestoreMock()
);

const request = require('supertest');
const { db } = require('../server/config/firebase');
const deliveryRoutes = require('../server/routes/delivery');
const { buildApp } = require('./helpers/buildApp');
const { seedDeliveryFixture } = require('./helpers/deliveryFixtures');
const { bearer } = require('./helpers/authToken');

describe('UC15: Claim a delivery job (Delivery partner)', () => {
  let server;

  beforeAll(() => {
    const app = buildApp({ '/api/delivery': deliveryRoutes });
    server = app.listen(0);
  });

  afterAll((done) => {
    server.close(done);
  });

  beforeEach(() => db.__reset());

  test('main success scenario: partner accepts a ready, unassigned order and it is assigned to them (delivery.js: POST /accept/:orderId)', async () => {
    const { riderA, orderId } = seedDeliveryFixture(db);

    const res = await request(server)
      .post(`/api/delivery/accept/${orderId}`)
      .set(bearer(riderA.id, 'delivery'))
      .send({ riderId: riderA.id });

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('out_for_delivery');

    const orderDoc = await db.collection('orders').doc(orderId).get();
    expect(orderDoc.data().deliveryPartnerId).toBe(riderA.id);

    // Extension/oddity 3a, also feeds UC16 1a: acceptance ALREADY sets the order to
    // out_for_delivery, before any real pickup has happened.
    expect(orderDoc.data().status).toBe('out_for_delivery');
  });

  test('extension 2a: another partner got it first -> 409 (delivery.js:111)', async () => {
    const { riderA, riderB, orderId } = seedDeliveryFixture(db);

    const first = await request(server)
      .post(`/api/delivery/accept/${orderId}`)
      .set(bearer(riderA.id, 'delivery'))
      .send({ riderId: riderA.id });
    expect(first.status).toBe(200);

    const second = await request(server)
      .post(`/api/delivery/accept/${orderId}`)
      .set(bearer(riderB.id, 'delivery'))
      .send({ riderId: riderB.id });
    expect(second.status).toBe(409);

    const orderDoc = await db.collection('orders').doc(orderId).get();
    expect(orderDoc.data().deliveryPartnerId).toBe(riderA.id); // unchanged
  });

  test('extension 2b: order no longer ready -> 400 (delivery.js:116)', async () => {
    const { riderA, orderId } = seedDeliveryFixture(db, { order: { status: 'preparing' } });

    const res = await request(server)
      .post(`/api/delivery/accept/${orderId}`)
      .set(bearer(riderA.id, 'delivery'))
      .send({ riderId: riderA.id });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/not ready/i);
  });

  test('extension 2c: partner record not found -> 400 (delivery.js:123)', async () => {
    const { orderId } = seedDeliveryFixture(db);

    const res = await request(server)
      .post(`/api/delivery/accept/${orderId}`)
      .set(bearer('no-such-rider', 'delivery'))
      .send({ riderId: 'no-such-rider' });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/rider not found/i);
  });

  test('extension 2d: partner already has an active order -> 400, one-at-a-time (delivery.js:134)', async () => {
    const { riderA } = seedDeliveryFixture(db, {
      orderId: 'order-1',
      order: { deliveryPartnerId: 'rider-A', status: 'out_for_delivery' }, // already busy
    });
    // A second ready order, not yet assigned to anyone.
    seedDeliveryFixture(db, { orderId: 'order-2' });

    const res = await request(server)
      .post('/api/delivery/accept/order-2')
      .set(bearer(riderA.id, 'delivery'))
      .send({ riderId: riderA.id });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/already have an active order/i);
  });

  // --- Race condition (fixed in M1) ---
  // 1a: the accept handler did `get() -> check -> update()` with no transaction, so two partners
  // racing for the same order BOTH got 200 "Order accepted" (last write won the assignment).
  // M1 does the check-and-claim inside db.runTransaction(), so the loser sees the winner's claim.
  test('FIXED (M1): two partners concurrently claim the same ready order -- exactly one 200, the other 409', async () => {
    const { riderA, riderB, orderId } = seedDeliveryFixture(db);

    const [resA, resB] = await Promise.all([
      request(server)
        .post(`/api/delivery/accept/${orderId}`)
        .set(bearer(riderA.id, 'delivery'))
        .send({ riderId: riderA.id }),
      request(server)
        .post(`/api/delivery/accept/${orderId}`)
        .set(bearer(riderB.id, 'delivery'))
        .send({ riderId: riderB.id }),
    ]);

    expect([resA.status, resB.status].sort()).toEqual([200, 409]);
    const winner = resA.status === 200 ? riderA.id : riderB.id;
    const finalOrder = await db.collection('orders').doc(orderId).get();
    expect(finalOrder.data().deliveryPartnerId).toBe(winner);
  });

  // --- M1 auth ---
  test('M1: accepting without a token -> 401, order stays unassigned', async () => {
    const { riderA, orderId } = seedDeliveryFixture(db);
    const res = await request(server)
      .post(`/api/delivery/accept/${orderId}`)
      .send({ riderId: riderA.id });
    expect(res.status).toBe(401);
    const orderDoc = await db.collection('orders').doc(orderId).get();
    expect(orderDoc.data().deliveryPartnerId).toBeNull();
  });

  test('M1: a customer token cannot accept delivery jobs -> 403', async () => {
    const { orderId } = seedDeliveryFixture(db);
    const res = await request(server)
      .post(`/api/delivery/accept/${orderId}`)
      .set(bearer('customer-1', 'customer'))
      .send({});
    expect(res.status).toBe(403);
  });

  test("M1: a rider cannot claim a job in another rider's name (body riderId must match the token) -> 403", async () => {
    const { riderA, riderB, orderId } = seedDeliveryFixture(db);
    const res = await request(server)
      .post(`/api/delivery/accept/${orderId}`)
      .set(bearer(riderB.id, 'delivery'))
      .send({ riderId: riderA.id });
    expect(res.status).toBe(403);
    const orderDoc = await db.collection('orders').doc(orderId).get();
    expect(orderDoc.data().deliveryPartnerId).toBeNull();
  });

  test('M1: the token alone is enough -- no riderId in the body still claims the job for the logged-in rider', async () => {
    const { riderA, orderId } = seedDeliveryFixture(db);
    const res = await request(server)
      .post(`/api/delivery/accept/${orderId}`)
      .set(bearer(riderA.id, 'delivery'))
      .send({});
    expect(res.status).toBe(200);
    const orderDoc = await db.collection('orders').doc(orderId).get();
    expect(orderDoc.data().deliveryPartnerId).toBe(riderA.id);
  });

  test('accepting an order that does not exist -> 404', async () => {
    const { riderA } = seedDeliveryFixture(db);
    const res = await request(server)
      .post('/api/delivery/accept/no-such-order')
      .set(bearer(riderA.id, 'delivery'))
      .send({});
    expect(res.status).toBe(404);
  });

  test('main scenario step 1: GET /available lists only ready, unassigned orders (delivery.js:299-331)', async () => {
    const { orderId } = seedDeliveryFixture(db); // order-1: ready, unassigned by default
    db.__seed('orders', 'order-already-assigned', {
      id: 'order-already-assigned',
      status: 'ready',
      deliveryPartnerId: 'rider-A',
    });
    db.__seed('orders', 'order-preparing', {
      id: 'order-preparing',
      status: 'preparing',
      deliveryPartnerId: null,
    });

    const res = await request(server).get('/api/delivery/available');
    expect(res.status).toBe(200);
    const ids = res.body.orders.map((o) => o.id);
    expect(ids).toContain(orderId);
    expect(ids).not.toContain('order-already-assigned'); // ready, but already claimed
    expect(ids).not.toContain('order-preparing'); // not ready yet
  });

  test('extension 2e: POST /reject releases a claimed order back to ready/unassigned (delivery.js:164-191)', async () => {
    const { riderA, orderId } = seedDeliveryFixture(db);
    const claimRes = await request(server)
      .post(`/api/delivery/accept/${orderId}`)
      .set(bearer(riderA.id, 'delivery'))
      .send({ riderId: riderA.id });
    expect(claimRes.status).toBe(200);

    const res = await request(server)
      .post(`/api/delivery/reject/${orderId}`)
      .set(bearer(riderA.id, 'delivery'))
      .send({ riderId: riderA.id });
    expect(res.status).toBe(200);

    const orderDoc = await db.collection('orders').doc(orderId).get();
    expect(orderDoc.data().status).toBe('ready');
    expect(orderDoc.data().deliveryPartnerId).toBeNull();
  });

  // Found while adding the /reject coverage above (1a BONUS FINDING, fixed in M1): /reject
  // never checked that the caller was the assigned partner, so any rider could un-assign
  // someone else's claimed order.
  test("FIXED (M1): an uninvolved rider can no longer reject someone else's claimed order -> 403, claim intact", async () => {
    const { riderA, riderB, orderId } = seedDeliveryFixture(db);
    const claimRes = await request(server)
      .post(`/api/delivery/accept/${orderId}`)
      .set(bearer(riderA.id, 'delivery'))
      .send({ riderId: riderA.id });
    expect(claimRes.status).toBe(200);

    const res = await request(server)
      .post(`/api/delivery/reject/${orderId}`)
      .set(bearer(riderB.id, 'delivery'))
      .send({ riderId: riderB.id });
    expect(res.status).toBe(403);

    const orderDoc = await db.collection('orders').doc(orderId).get();
    expect(orderDoc.data().status).toBe('out_for_delivery');
    expect(orderDoc.data().deliveryPartnerId).toBe(riderA.id);
  });

  test('M1: a delivered order cannot be "rejected" back to ready by its rider -> 409', async () => {
    const { riderA, orderId } = seedDeliveryFixture(db, {
      order: { status: 'delivered', deliveryPartnerId: 'rider-A' },
    });
    const res = await request(server)
      .post(`/api/delivery/reject/${orderId}`)
      .set(bearer(riderA.id, 'delivery'))
      .send({});
    expect(res.status).toBe(409);
    const orderDoc = await db.collection('orders').doc(orderId).get();
    expect(orderDoc.data().status).toBe('delivered');
  });
});
