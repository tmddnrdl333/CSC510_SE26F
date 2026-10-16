// UC16: Pick up and deliver an order (Delivery partner)
// Source under test: server/routes/delivery.js (POST /pickup/:orderId, POST /deliver/:orderId)
// See proj1a-report/usecases.md for the authoritative main scenario + extensions.
// Shares its fixture (two delivery partners + one ready order) with UC15 via
// tests/helpers/deliveryFixtures.js.
//
// Environment note: Firestore is mocked (see tests/helpers/fakeFirestore.js) because neither
// Docker nor the Firestore emulator toolchain is available in this environment.

jest.mock('../server/config/firebase', () => require('./helpers/fakeFirestore').createFirestoreMock());

const request = require('supertest');
const { db } = require('../server/config/firebase');
const deliveryRoutes = require('../server/routes/delivery');
const { buildApp } = require('./helpers/buildApp');
const { seedDeliveryFixture } = require('./helpers/deliveryFixtures');
const { bearer } = require('./helpers/authToken');

describe('UC16: Pick up and deliver an order (Delivery partner)', () => {
  let server;

  beforeAll(() => {
    const app = buildApp({ '/api/delivery': deliveryRoutes });
    server = app.listen(0);
  });

  afterAll((done) => { server.close(done); });

  beforeEach(() => db.__reset());

  async function claim(riderId, orderId) {
    const res = await request(server).post(`/api/delivery/accept/${orderId}`).set(bearer(riderId, 'delivery')).send({ riderId });
    expect(res.status).toBe(200); // sanity: claim step of the shared UC15/UC16 flow must succeed
  }

  function deliver(riderId, orderId) {
    return request(server).post(`/api/delivery/deliver/${orderId}`).set(bearer(riderId, 'delivery')).send({ riderId });
  }

  test('FIXED (M1): pickup on a NONEXISTENT order is a clean 404, not an uncontrolled 500 (1a: delivery.js:204-209 updated blind)', async () => {
    const res = await request(server)
      .post('/api/delivery/pickup/no-such-order')
      .set(bearer('rider-A', 'delivery'))
      .send({ riderId: 'rider-A' });
    expect(res.status).toBe(404);
  });

  test('FIXED (M1): pickup can no longer stomp an already-delivered order back to out_for_delivery -> 409', async () => {
    const { orderId } = seedDeliveryFixture(db, { order: { status: 'delivered', deliveryPartnerId: 'rider-A' } });

    const res = await request(server)
      .post(`/api/delivery/pickup/${orderId}`)
      .set(bearer('rider-A', 'delivery'))
      .send({ riderId: 'rider-A' });

    expect(res.status).toBe(409);
    const orderDoc = await db.collection('orders').doc(orderId).get();
    expect(orderDoc.data().status).toBe('delivered');
  });

  test("M1: only the assigned partner can mark an order picked up -> 403 for anyone else", async () => {
    const { riderA, riderB, orderId } = seedDeliveryFixture(db);
    await claim(riderA.id, orderId);

    const res = await request(server).post(`/api/delivery/pickup/${orderId}`).set(bearer(riderB.id, 'delivery')).send({});
    expect(res.status).toBe(403);
    const orderDoc = await db.collection('orders').doc(orderId).get();
    expect(orderDoc.data().pickedUpAt).toBeUndefined();
  });

  test('main success scenario: the assigned partner picks up then delivers; order is delivered and they are paid fee + tip', async () => {
    const { riderA, orderId } = seedDeliveryFixture(db);
    await claim(riderA.id, orderId);

    const pickup = await request(server).post(`/api/delivery/pickup/${orderId}`).set(bearer(riderA.id, 'delivery')).send({});
    expect(pickup.status).toBe(200);

    const res = await deliver(riderA.id, orderId);
    expect(res.status).toBe(200);
    expect(res.body.earning).toBe(5); // deliveryFee(3) + tipAmount(2)

    const orderDoc = await db.collection('orders').doc(orderId).get();
    const riderDoc = await db.collection('users').doc(riderA.id).get();
    expect(orderDoc.data().status).toBe('delivered');
    expect(orderDoc.data().pickedUpAt).toBeTruthy();
    expect(riderDoc.data().totalEarnings).toBe(5);
  });

  test('extension 2a: order not found at delivery -> 404 (delivery.js:234-236)', async () => {
    const res = await request(server)
      .post('/api/delivery/deliver/no-such-order')
      .set(bearer('rider-A', 'delivery'))
      .send({ riderId: 'rider-A' });
    expect(res.status).toBe(404);
  });

  // --- HEADLINE FINDING (fixed in M1) ---
  // 1a: /deliver read `riderId` from the body and credited that user without ever comparing it
  // to orderData.deliveryPartnerId, so Partner B could complete Partner A's delivery and be paid.
  // M1 takes the rider from the JWT and refuses anyone but the assigned partner.
  test("FIXED (M1): Partner B, never assigned, tries to complete Partner A's delivery -> 403; nobody is paid and the order is untouched", async () => {
    const { riderA, riderB, orderId } = seedDeliveryFixture(db);
    await claim(riderA.id, orderId);

    const res = await deliver(riderB.id, orderId);
    expect(res.status).toBe(403);

    const orderDoc = await db.collection('orders').doc(orderId).get();
    const riderADoc = await db.collection('users').doc(riderA.id).get();
    const riderBDoc = await db.collection('users').doc(riderB.id).get();
    expect(orderDoc.data().status).toBe('out_for_delivery');
    expect(riderBDoc.data().totalEarnings).toBe(0);
    expect(riderADoc.data().totalEarnings).toBe(0);

    const points = await db.collection('points').doc('customer-1').get();
    expect(points.exists).toBe(false); // no points minted off the forged completion

    // Partner A can still complete it normally afterwards.
    const legit = await deliver(riderA.id, orderId);
    expect(legit.status).toBe(200);
    expect((await db.collection('users').doc(riderA.id).get()).data().totalEarnings).toBe(5);
  });

  test("FIXED (M1): Partner B cannot get paid by putting Partner A's id in the body while logged in as B -> 403", async () => {
    const { riderA, riderB, orderId } = seedDeliveryFixture(db);
    await claim(riderA.id, orderId);

    const res = await request(server)
      .post(`/api/delivery/deliver/${orderId}`)
      .set(bearer(riderB.id, 'delivery'))
      .send({ riderId: riderA.id });
    expect(res.status).toBe(403);
    expect((await db.collection('orders').doc(orderId).get()).data().status).toBe('out_for_delivery');
  });

  test('M1: completing a delivery without a token -> 401, nothing changes', async () => {
    const { riderA, orderId } = seedDeliveryFixture(db);
    await claim(riderA.id, orderId);

    const res = await request(server).post(`/api/delivery/deliver/${orderId}`).send({ riderId: riderA.id });
    expect(res.status).toBe(401);
    expect((await db.collection('orders').doc(orderId).get()).data().status).toBe('out_for_delivery');
  });

  // --- 1a UNRELATED BUG (fixed in M1) ---
  // User.js never defined `updateDeliveryStatus`, so a rider completing their only active order
  // (the common case, since UC15 enforces one at a time) got a 500 AFTER being paid.
  test('FIXED (M1): completing a rider\'s only active order returns 200 and sets them back to free (User.updateDeliveryStatus now exists)', async () => {
    const { riderA, orderId } = seedDeliveryFixture(db, { riderA: { deliveryStatus: 'busy' } });
    await claim(riderA.id, orderId);

    const res = await deliver(riderA.id, orderId);
    expect(res.status).toBe(200);

    const riderDoc = await db.collection('users').doc(riderA.id).get();
    expect(riderDoc.data().totalEarnings).toBe(5);
    expect(riderDoc.data().deliveryStatus).toBe('free');
  });

  test('M1: a rider with another active order stays busy after delivering one of them', async () => {
    const { riderA, orderId } = seedDeliveryFixture(db, { riderA: { deliveryStatus: 'busy' } });
    await claim(riderA.id, orderId);
    db.__seed('orders', 'order-other', { id: 'order-other', deliveryPartnerId: riderA.id, status: 'out_for_delivery' });

    const res = await deliver(riderA.id, orderId);
    expect(res.status).toBe(200);
    expect((await db.collection('users').doc(riderA.id).get()).data().deliveryStatus).toBe('busy');
  });

  // --- Found while fixing the above: /deliver could be replayed ---
  test('M1: delivering the same order twice pays the rider and awards points only once (second call -> 409)', async () => {
    const { riderA, orderId } = seedDeliveryFixture(db);
    await claim(riderA.id, orderId);

    const first = await deliver(riderA.id, orderId);
    const second = await deliver(riderA.id, orderId);
    expect(first.status).toBe(200);
    expect(second.status).toBe(409);

    expect((await db.collection('users').doc(riderA.id).get()).data().totalEarnings).toBe(5);
    const points = (await db.collection('points').doc('customer-1').get()).data();
    expect(points.transactions.filter((t) => t.type === 'earned')).toHaveLength(1);
  });

  test('M1: two concurrent deliver calls for the same order -- exactly one succeeds', async () => {
    const { riderA, orderId } = seedDeliveryFixture(db);
    await claim(riderA.id, orderId);

    const results = await Promise.all([deliver(riderA.id, orderId), deliver(riderA.id, orderId)]);
    expect(results.map((r) => r.status).sort()).toEqual([200, 409]);
    expect((await db.collection('users').doc(riderA.id).get()).data().totalEarnings).toBe(5);
  });

  test('M1 / UC9: delivery awards the customer 10% of the bill in points (a $20 order -> 2 points)', async () => {
    const { riderA, orderId } = seedDeliveryFixture(db); // totalAmount: 20
    await claim(riderA.id, orderId);
    await deliver(riderA.id, orderId);

    const points = (await db.collection('points').doc('customer-1').get()).data();
    expect(points.availablePoints).toBe(2);
    expect(points.transactions[0]).toMatchObject({ type: 'earned', amount: 2, orderId });
  });

  test('M1 / UC9: an order from a Local Legend restaurant earns 15% (a $20 order -> 3 points)', async () => {
    const { riderA, orderId } = seedDeliveryFixture(db);
    db.__seed('users', 'restaurant-1', { id: 'restaurant-1', role: 'restaurant', profile: { name: 'Mom & Pop', isLocalLegend: true } });
    await claim(riderA.id, orderId);
    await deliver(riderA.id, orderId);

    const points = (await db.collection('points').doc('customer-1').get()).data();
    expect(points.availablePoints).toBe(3);
  });

  test('note (time-permitting): an unreasonably large deliveryFee/tipAmount is accepted and paid out with no upper bound (delivery.js:244)', async () => {
    const { riderA, orderId } = seedDeliveryFixture(db, {
      order: { deliveryFee: 999999, tipAmount: 999999 },
    });
    await claim(riderA.id, orderId);

    const res = await deliver(riderA.id, orderId);

    // Still true after M1 (out of scope: fees are set by order creation, not by the rider).
    expect(res.status).toBe(200);
    const riderDoc = await db.collection('users').doc(riderA.id).get();
    expect(riderDoc.data().totalEarnings).toBe(1999998); // 999999 + 999999, no cap enforced anywhere
  });

  test('GET /orders (a rider reviewing their assignments) includes a computed earning field (delivery.js:37-85)', async () => {
    const { riderA, orderId } = seedDeliveryFixture(db, { order: { deliveryFee: 4, tipAmount: 6 } });
    await claim(riderA.id, orderId);

    const res = await request(server).get('/api/delivery/orders').query({ riderId: riderA.id });
    expect(res.status).toBe(200);

    const order = res.body.orders.find((o) => o.id === orderId);
    expect(order).toBeDefined();
    expect(order.earning).toBe(10); // deliveryFee(4) + tipAmount(6), computed at read time (delivery.js:60-62)
  });

  test('GET /orders requires a riderId -> 400 (delivery.js:42-44)', async () => {
    const res = await request(server).get('/api/delivery/orders');
    expect(res.status).toBe(400);
  });

  // Note only, no test: usecases.md 3a ("no proof of delivery exists at all") describes an
  // absent feature, not a code path we can exercise -- there is nothing to call.

  // --- "Doc expectation" test from 1a ---
  // Was intentionally red until M1 compared the caller against orderData.deliveryPartnerId.
  test('[DOC EXPECTATION] only the assigned delivery partner should be able to complete an order and be paid (fixed in M1)', async () => {
    const { riderA, riderB, orderId } = seedDeliveryFixture(db);
    // Give riderB an unrelated active order so the separate updateDeliveryStatus crash doesn't
    // muddy this specific assertion -- this test is about the ownership check, not that bug.
    db.__seed('orders', 'order-decoy', {
      id: 'order-decoy',
      customerId: 'customer-2',
      restaurantId: 'restaurant-1',
      deliveryPartnerId: riderB.id,
      status: 'out_for_delivery',
      deliveryFee: 1,
      tipAmount: 0,
      totalAmount: 10,
    });
    await claim(riderA.id, orderId);

    await request(server).post(`/api/delivery/deliver/${orderId}`).set(bearer(riderB.id, 'delivery')).send({ riderId: riderB.id });

    const riderBDoc = await db.collection('users').doc(riderB.id).get();
    expect(riderBDoc.data().totalEarnings).toBe(0); // riderB was never assigned -- should never be paid
  });
});
