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

  // --- HEADLINE FINDING (fixed in M1) ---
  // 1a: POST /update had no auth of any kind, so anyone could add 999,999,999 meals to the
  // stored counter. M1 first required login (#44), then removed the endpoint entirely (#75,
  // decided in #36): nothing called it, and any logged-in user could still inflate the counter.
  test('FIXED (M1, #75): POST /update no longer exists -- anonymous callers get 404 and nothing is written', async () => {
    seedDeliveredOrders(5);

    const updateRes = await request(server).post('/api/donations/update').send({ mealsToAdd: 999999999 });
    expect(updateRes.status).toBe(404);

    const settingsDoc = await db.collection('settings').doc('donations').get();
    expect(settingsDoc.exists).toBe(false); // nothing was written

    // GET /stats is still computed from real delivered orders, never from the counter.
    const statsRes = await request(server).get('/api/donations/stats');
    expect(statsRes.body.mealsDonated).toBe(0); // floor(5/10)
  });

  test('FIXED (M1, #75): a logged-in user cannot inflate the counter either -- 404, stats unchanged', async () => {
    seedDeliveredOrders(12);

    for (const mealsToAdd of [2, 1000, 999999999]) {
      const res = await request(server)
        .post('/api/donations/update')
        .set(bearer('customer-1', 'customer'))
        .send({ mealsToAdd });
      expect(res.status).toBe(404);
    }

    const statsRes = await request(server).get('/api/donations/stats');
    expect(statsRes.body.mealsDonated).toBe(1); // floor(12/10), untouched
  });

  test('M1: POST /record without a token -> 401 and nothing is logged', async () => {
    const res = await request(server).post('/api/donations/record').send({ amount: 50 });
    expect(res.status).toBe(401);
    const history = await request(server).get('/api/donations/history');
    expect(history.body.history).toEqual([]);
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

  test('regression #64: challenge-donated meals appear in the public stat', async () => {
    // Bonus meals derive from the challengeProgress ledger (written only by
    // the exactly-once payout transaction) — never from the inflatable
    // settings counter.
    seedDeliveredOrders(25); // derived: floor(25/10) = 2
    db.__seed('challengeProgress', 'weekly-team-orders-15_t1_2026-W43', {
      definitionId: 'weekly-team-orders-15', status: 'rewarded', // +5 meals
    });
    db.__seed('challengeProgress', 'weekly-whole-squad_t1_2026-W43', {
      definitionId: 'weekly-whole-squad', status: 'rewarded', // badge, +0 meals
    });
    db.__seed('challengeProgress', 'weekly-team-spend-300_t1_2026-W43', {
      definitionId: 'weekly-team-spend-300', status: 'active', // unrewarded, +0
    });

    const res = await request(server).get('/api/donations/stats');
    expect(res.status).toBe(200);
    expect(res.body.derivedMeals).toBe(2);
    expect(res.body.challengeBonusMeals).toBe(5);
    expect(res.body.mealsDonated).toBe(7);
  });

  test('regression #64: an inflated settings counter still cannot leak into the public stat', async () => {
    seedDeliveredOrders(10); // derived: 1
    db.__seed('settings', 'donations', { counter: 999999999 });

    const res = await request(server).get('/api/donations/stats');
    expect(res.body.mealsDonated).toBe(1); // tamper-proof: ledger-derived only
  });
});
