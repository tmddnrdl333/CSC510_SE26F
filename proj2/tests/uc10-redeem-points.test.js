// UC10: Redeem points for a discount (Customer)
// Source under test: server/routes/points.js
// See proj1a-report/usecases.md for the authoritative main scenario + extensions.
//
// Environment note: Firestore is mocked (see tests/helpers/fakeFirestore.js) because neither
// Docker nor the Firestore emulator toolchain is available in this environment. The mock's
// get()/set()/update() resolve on a real (delayed) setTimeout rather than an immediate
// microtask specifically so that two concurrently-fired HTTP requests can genuinely interleave
// at the `await pointsRef.get()` boundary -- this is what makes the race-condition test below a
// faithful reproduction of the check-then-act bug rather than an artifact of the mock.

jest.mock('../server/config/firebase', () => require('./helpers/fakeFirestore').createFirestoreMock());

const request = require('supertest');
const { db } = require('../server/config/firebase');
const { router: pointsRoutes } = require('../server/routes/points');
const { buildApp } = require('./helpers/buildApp');
const { bearer } = require('./helpers/authToken');

describe('UC10: Redeem points for a discount (Customer)', () => {
  let server;

  beforeAll(() => {
    const app = buildApp({ '/api/points': pointsRoutes });
    server = app.listen(0);
  });

  afterAll((done) => { server.close(done); });

  beforeEach(() => db.__reset());

  function seedPoints(customerId, availablePoints) {
    db.__seed('points', customerId, {
      totalPoints: availablePoints,
      availablePoints,
      usedPoints: 0,
      transactions: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }

  test('main success scenario: redeem points at 1 point = $0.01, balance deducted and redemption logged (points.js:68-140)', async () => {
    seedPoints('cust-1', 500);

    const res = await request(server)
      .post('/api/points/use')
      .set(bearer('cust-1', 'customer'))
      .send({ customerId: 'cust-1', points: 200 });

    expect(res.status).toBe(200);
    expect(res.body.discountAmount).toBeCloseTo(2.0);
    expect(res.body.remainingPoints).toBe(300);

    const doc = await db.collection('points').doc('cust-1').get();
    expect(doc.data().availablePoints).toBe(300);
    expect(doc.data().usedPoints).toBe(200);
    expect(doc.data().transactions[0]).toMatchObject({ type: 'used', amount: -200 });
  });

  test('extension 2a: points < 1 or non-integer -> 400 (points.js:69)', async () => {
    seedPoints('cust-1', 500);

    const zero = await request(server).post('/api/points/use').set(bearer('cust-1', 'customer')).send({ customerId: 'cust-1', points: 0 });
    expect(zero.status).toBe(400);

    const decimal = await request(server)
      .post('/api/points/use')
      .set(bearer('cust-1', 'customer'))
      .send({ customerId: 'cust-1', points: 12.5 });
    expect(decimal.status).toBe(400);

    const negative = await request(server)
      .post('/api/points/use')
      .set(bearer('cust-1', 'customer'))
      .send({ customerId: 'cust-1', points: -10 });
    expect(negative.status).toBe(400);
  });

  test('extension 3a: insufficient balance -> 400 with available vs. requested points (points.js:92-97)', async () => {
    seedPoints('cust-1', 50);

    const res = await request(server).post('/api/points/use').set(bearer('cust-1', 'customer')).send({ customerId: 'cust-1', points: 100 });
    expect(res.status).toBe(400);
    expect(res.body.availablePoints).toBe(50);
    expect(res.body.requestedPoints).toBe(100);
  });

  test('extension 3b: no points record for the customer -> 404 (points.js:85-88)', async () => {
    const res = await request(server)
      .post('/api/points/use')
      .set(bearer('never-seen-customer', 'customer'))
      .send({ customerId: 'never-seen-customer', points: 10 });
    expect(res.status).toBe(404);
    expect(res.body.error).toMatch(/Points account not found/i);
  });

  // --- HEADLINE FINDING (fixed in M1) ---
  // 1a: points.js read the points doc, checked the balance in JS, then update()d with no
  // transaction, so two concurrent 60-point redemptions against 100 points BOTH got 200
  // (a double-spend) and one of the two log entries was lost. M1 wraps read+check+write in
  // db.runTransaction(), so the second request sees the first one's write.
  test('FIXED (M1): concurrent redemptions are serialized -- one succeeds, the other is refused, both are accounted for (points.js /use, db.runTransaction)', async () => {
    seedPoints('cust-1', 100);

    const [resA, resB] = await Promise.all([
      request(server).post('/api/points/use').set(bearer('cust-1', 'customer')).send({ points: 60 }),
      request(server).post('/api/points/use').set(bearer('cust-1', 'customer')).send({ points: 60 }),
    ]);

    expect([resA.status, resB.status].sort()).toEqual([200, 400]);
    const refused = resA.status === 400 ? resA : resB;
    expect(refused.body.availablePoints).toBe(40); // the loser saw the winner's write

    const finalDoc = await db.collection('points').doc('cust-1').get();
    expect(finalDoc.data().availablePoints).toBe(40);
    expect(finalDoc.data().usedPoints).toBe(60);
    expect(finalDoc.data().transactions.filter((t) => t.type === 'used')).toHaveLength(1);
  });

  test('FIXED (M1): three concurrent redemptions that each fit but together overspend -- the balance never goes below what was actually granted', async () => {
    seedPoints('cust-1', 100);

    const results = await Promise.all(
      [40, 40, 40].map((points) =>
        request(server).post('/api/points/use').set(bearer('cust-1', 'customer')).send({ points })
      )
    );

    const granted = results.filter((r) => r.status === 200).length;
    expect(granted).toBe(2); // 40 + 40 = 80 <= 100; the third would overspend
    const finalDoc = await db.collection('points').doc('cust-1').get();
    expect(finalDoc.data().availablePoints).toBe(20);
    expect(finalDoc.data().transactions.filter((t) => t.type === 'used')).toHaveLength(2);
  });

  // --- M1 auth: identity comes from the token, not the body ---
  test('M1: redeeming without a token -> 401, balance untouched', async () => {
    seedPoints('cust-1', 500);
    const res = await request(server).post('/api/points/use').send({ customerId: 'cust-1', points: 100 });
    expect(res.status).toBe(401);
    const doc = await db.collection('points').doc('cust-1').get();
    expect(doc.data().availablePoints).toBe(500);
  });

  test("M1: a logged-in customer cannot spend someone else's points by naming them in the body -> 403", async () => {
    seedPoints('victim', 500);
    const res = await request(server)
      .post('/api/points/use')
      .set(bearer('attacker', 'customer'))
      .send({ customerId: 'victim', points: 100 });
    expect(res.status).toBe(403);
    const doc = await db.collection('points').doc('victim').get();
    expect(doc.data().availablePoints).toBe(500);
  });

  test('M1: a non-customer role cannot redeem points -> 403', async () => {
    seedPoints('rider-A', 500);
    const res = await request(server)
      .post('/api/points/use')
      .set(bearer('rider-A', 'delivery'))
      .send({ points: 100 });
    expect(res.status).toBe(403);
  });

  test('M1: a forged token (wrong signature) -> 401', async () => {
    seedPoints('cust-1', 500);
    const res = await request(server)
      .post('/api/points/use')
      .set({ Authorization: 'Bearer eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJjdXN0LTEiLCJyb2xlIjoiY3VzdG9tZXIifQ.bad' })
      .send({ points: 100 });
    expect(res.status).toBe(401);
  });

  // POST /calculate-discount shares /use's balance-check logic but is meant as a pure preview
  // (e.g. showing the discount live as a customer types a points amount, before they commit).
  test('POST /calculate-discount previews the discount WITHOUT deducting any points (points.js:142-186)', async () => {
    seedPoints('cust-1', 500);

    const res = await request(server)
      .post('/api/points/calculate-discount')
      .send({ customerId: 'cust-1', points: 200 });

    expect(res.status).toBe(200);
    expect(res.body.discountAmount).toBeCloseTo(2.0);
    expect(res.body.maxDiscount).toBeCloseTo(5.0); // 500 available points * $0.01

    // Confirm this really is a preview -- the stored balance is untouched.
    const doc = await db.collection('points').doc('cust-1').get();
    expect(doc.data().availablePoints).toBe(500);
  });

  test('POST /calculate-discount: insufficient balance -> 400, same guard as /use (points.js:166-172)', async () => {
    seedPoints('cust-1', 50);
    const res = await request(server)
      .post('/api/points/calculate-discount')
      .send({ customerId: 'cust-1', points: 100 });
    expect(res.status).toBe(400);
    expect(res.body.availablePoints).toBe(50);
    expect(res.body.requestedPoints).toBe(100);
  });

  test('POST /calculate-discount: no points record -> 404 (points.js:159-161)', async () => {
    const res = await request(server)
      .post('/api/points/calculate-discount')
      .send({ customerId: 'never-seen-customer', points: 10 });
    expect(res.status).toBe(404);
  });

  // Secondary finding (per assignment brief): points are deducted before the order is created,
  // and order creation is fired without awaiting the result
  // (client/src/components/customer/Cart.tsx:84-85, 120) -- if order creation fails there is no
  // rollback of the point deduction.
  //
  // We read Cart.tsx to confirm this is real: handlePlaceOrder awaits
  // `usePointsMutation.mutateAsync(pointsToUse)` first (Cart.tsx:85, so the deduction itself
  // does complete/fail synchronously w.r.t. the handler), then loops over per-restaurant groups
  // calling `placeOrderMutation.mutate({...})` (Cart.tsx:121) -- `.mutate()`, not `.mutateAsync()`,
  // inside a plain (unawaited) `.forEach` -- so order creation is fire-and-forget relative to the
  // already-completed point deduction. There is no compensating "refund points" call anywhere in
  // this file or in points.js, so a later order-creation failure leaves the points gone with
  // nothing to show for them. We did NOT add an automated test for it here: this is React
  // component logic and this suite runs under jest testEnvironment:'node' with no DOM.
  // (Correction to an earlier version of this note: a frontend test stack DOES exist — the CRA
  // jsdom/@testing-library runner in proj2/client works for router-free components, as
  // uc5-build-cart.test.tsx later proved. Exercising Cart.tsx that way remains open work.)

  // --- "Doc expectation" test from 1a ---
  // Was intentionally red until M1 put a transaction around read-then-update; now green.
  test('[DOC EXPECTATION] concurrent redemptions must not exceed the available balance (fixed in M1)', async () => {
    seedPoints('cust-1', 100);

    const [resA, resB] = await Promise.all([
      request(server).post('/api/points/use').set(bearer('cust-1', 'customer')).send({ customerId: 'cust-1', points: 60 }),
      request(server).post('/api/points/use').set(bearer('cust-1', 'customer')).send({ customerId: 'cust-1', points: 60 }),
    ]);

    const successCount = [resA, resB].filter((r) => r.status === 200).length;
    expect(successCount).toBe(1); // exactly one of the two should be affordable
  });
});
