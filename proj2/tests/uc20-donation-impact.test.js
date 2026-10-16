// UC20: See the donation impact (Meal-for-a-Meal)
// Source under test: server/routes/donations.js
// See proj1a-report/usecases.md for the authoritative main scenario + extensions.
//
// Environment note: Firestore is mocked (see tests/helpers/fakeFirestore.js) because neither
// Docker nor the Firestore emulator toolchain is available in this environment.

jest.mock('../server/config/firebase', () => require('./helpers/fakeFirestore').createFirestoreMock());

const request = require('supertest');
const { db } = require('../server/config/firebase');
const donationRoutes = require('../server/routes/donations');
const { buildApp } = require('./helpers/buildApp');
const { bearer } = require('./helpers/authToken');

describe('UC20: See the donation impact (Meal-for-a-Meal)', () => {
  let server;

  beforeAll(() => {
    const app = buildApp({ '/api/donations': donationRoutes });
    server = app.listen(0);
  });

  afterAll((done) => { server.close(done); });

  beforeEach(() => db.__reset());

  function seedDeliveredOrders(count) {
    for (let i = 0; i < count; i++) {
      db.__seed('orders', `order-${i}`, { id: `order-${i}`, status: 'delivered' });
    }
  }

  test('main success scenario: meals donated = floor(delivered/10) (donations.js:15)', async () => {
    seedDeliveredOrders(37);
    const res = await request(server).get('/api/donations/stats');
    expect(res.status).toBe(200);
    expect(res.body.totalOrders).toBe(37);
    expect(res.body.mealsDonated).toBe(3); // floor(37/10)
    expect(res.body.nextDonationIn).toBe(3); // 10 - (37 % 10)
  });

  test('main scenario edge case: zero delivered orders -> zero meals donated', async () => {
    const res = await request(server).get('/api/donations/stats');
    expect(res.status).toBe(200);
    expect(res.body.totalOrders).toBe(0);
    expect(res.body.mealsDonated).toBe(0);
  });

  test('extension 2a (partial): POST /update rejects zero/negative meal amounts -> 400 (donations.js:47)', async () => {
    const zero = await request(server).post('/api/donations/update').set(bearer('customer-1', 'customer')).send({ mealsToAdd: 0 });
    expect(zero.status).toBe(400);

    const negative = await request(server).post('/api/donations/update').set(bearer('customer-1', 'customer')).send({ mealsToAdd: -5 });
    expect(negative.status).toBe(400);
  });

  // --- HEADLINE FINDING (fixed in M1) ---
  // 1a: POST /update had no auth of any kind, so anyone could add 999,999,999 meals to the
  // stored counter. M1 requires a logged-in user.
  test('FIXED (M1): an unauthenticated caller can no longer inflate the stored donation counter -> 401 (donations.js:59)', async () => {
    seedDeliveredOrders(5);

    const updateRes = await request(server).post('/api/donations/update').send({ mealsToAdd: 999999999 });
    expect(updateRes.status).toBe(401);

    const settingsDoc = await db.collection('settings').doc('donations').get();
    expect(settingsDoc.exists).toBe(false); // nothing was written

    // GET /stats is still computed from real delivered orders, never from the counter.
    const statsRes = await request(server).get('/api/donations/stats');
    expect(statsRes.body.mealsDonated).toBe(0); // floor(5/10)
  });

  test('FIXED (M1): a forged/garbage token is rejected the same way -> 401', async () => {
    const res = await request(server)
      .post('/api/donations/update')
      .set({ Authorization: 'Bearer not-a-real-token' })
      .send({ mealsToAdd: 10 });
    expect(res.status).toBe(401);
  });

  test('M1: a logged-in user can still update the counter (milestone scope is "requires login")', async () => {
    const res = await request(server)
      .post('/api/donations/update')
      .set(bearer('customer-1', 'customer'))
      .send({ mealsToAdd: 2 });
    expect(res.status).toBe(200);
    expect(res.body.mealsDonated).toBe(2);
  });

  test('M1: non-integer meal amounts are rejected -> 400', async () => {
    const res = await request(server)
      .post('/api/donations/update')
      .set(bearer('customer-1', 'customer'))
      .send({ mealsToAdd: 1.5 });
    expect(res.status).toBe(400);
  });

  test('M1: POST /record without a token -> 401 and nothing is logged', async () => {
    const res = await request(server).post('/api/donations/record').send({ amount: 50 });
    expect(res.status).toBe(401);
    const history = await request(server).get('/api/donations/history');
    expect(history.body.history).toEqual([]);
  });

  // Still true after M1 for logged-in callers -- see docs/plans/m1-trust-layer.md §5.
  test('the counter has no upper bound and keeps compounding across repeated calls (donations.js:59)', async () => {
    await request(server).post('/api/donations/update').set(bearer('customer-1', 'customer')).send({ mealsToAdd: 1000 });
    const second = await request(server).post('/api/donations/update').set(bearer('customer-1', 'customer')).send({ mealsToAdd: 2000 });
    expect(second.status).toBe(200);
    expect(second.body.mealsDonated).toBe(3000);
  });

  test('POST /record logs a donation entry (donations.js:96-126)', async () => {
    const res = await request(server)
      .post('/api/donations/record')
      .set(bearer('customer-1', 'customer'))
      .send({ amount: 25, description: 'Test meal drive' });
    expect(res.status).toBe(200);
    expect(res.body.donation.amount).toBe(25);

    const historySnap = await db.collection('donationHistory').get();
    expect(historySnap.size).toBe(1);
  });

  test('POST /record rejects zero/negative amounts -> 400 (donations.js:101)', async () => {
    const zero = await request(server).post('/api/donations/record').set(bearer('customer-1', 'customer')).send({ amount: 0 });
    expect(zero.status).toBe(400);
    const negative = await request(server).post('/api/donations/record').set(bearer('customer-1', 'customer')).send({ amount: -5 });
    expect(negative.status).toBe(400);
  });

  test('GET /history returns recorded donations, most recent first (donations.js:76-94)', async () => {
    db.__seed('donationHistory', 'd1', { id: 'd1', amount: 10, createdAt: new Date('2026-01-01T00:00:00Z') });
    db.__seed('donationHistory', 'd2', { id: 'd2', amount: 20, createdAt: new Date('2026-06-01T00:00:00Z') });

    const res = await request(server).get('/api/donations/history');
    expect(res.status).toBe(200);
    expect(res.body.history).toHaveLength(2);
    expect(res.body.history[0].id).toBe('d2'); // most recently created, listed first
    expect(res.body.history[1].id).toBe('d1');
  });
});
