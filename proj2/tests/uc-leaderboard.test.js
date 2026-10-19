// M2: GET /api/leaderboard (issue #31).
// Source under test: server/routes/leaderboard.js, mounted behind the
// temporary auth stub exactly as server/index.js does.
// Contract: proj2/docs/plans/m2-leaderboard.md §5, §7.

jest.mock('../server/config/firebase', () => require('./helpers/fakeFirestore').createFirestoreMock());

const request = require('supertest');
const express = require('express');
const { db } = require('../server/config/firebase');
const { authStub } = require('../server/middleware/authStub');
const leaderboardRoutes = require('../server/routes/leaderboard');
const Friendship = require('../server/models/Friendship');

function seedCustomer(id, { totalPoints = 0 } = {}) {
  const now = new Date();
  db.__seed('users', id, {
    id,
    email: `${id}@example.com`,
    password: 'pw',
    role: 'customer',
    profile: { name: id },
    createdAt: now,
    updatedAt: now,
  });
  // Real scheme (#55): doc id === customerId, no `userId` field -- matches
  // awardPointsForOrder (server/routes/points.js) and GET /api/points.
  db.__seed('points', id, { totalPoints, availablePoints: totalPoints, usedPoints: 0, transactions: [] });
}

describe('UC31 (M2): GET /api/leaderboard -- global scope', () => {
  let server;

  beforeAll(() => {
    const app = express();
    app.use(express.json());
    app.use('/api/leaderboard', authStub, leaderboardRoutes);
    server = app.listen(0);
  });

  afterAll((done) => { server.close(done); });

  beforeEach(() => db.__reset());

  test('main success scenario: entries are ranked descending by score', async () => {
    seedCustomer('carol', { totalPoints: 90 });
    seedCustomer('alice', { totalPoints: 10 });
    seedCustomer('bob', { totalPoints: 50 });

    const res = await request(server)
      .get('/api/leaderboard')
      .set('x-test-user-id', 'alice');

    expect(res.status).toBe(200);
    expect(res.body.scope).toBe('global');
    expect(res.body.entries.map((e) => e.userId)).toEqual(['carol', 'bob', 'alice']);
    expect(res.body.entries.map((e) => e.rank)).toEqual([1, 2, 3]);
    expect(res.body.entries.map((e) => e.score)).toEqual([90, 50, 10]);
  });

  test('extension: ?limit caps the number of entries returned', async () => {
    seedCustomer('carol', { totalPoints: 90 });
    seedCustomer('alice', { totalPoints: 10 });
    seedCustomer('bob', { totalPoints: 50 });

    const res = await request(server)
      .get('/api/leaderboard')
      .query({ limit: 2 })
      .set('x-test-user-id', 'alice');

    expect(res.status).toBe(200);
    expect(res.body.entries).toHaveLength(2);
    expect(res.body.entries.map((e) => e.userId)).toEqual(['carol', 'bob']);
  });

  test('extension: default limit is 20 when omitted', async () => {
    for (let i = 0; i < 21; i += 1) {
      seedCustomer(`customer-${i}`, { totalPoints: 21 - i }); // distinct, descending scores
    }

    const res = await request(server)
      .get('/api/leaderboard')
      .set('x-test-user-id', 'customer-0');

    expect(res.status).toBe(200);
    expect(res.body.entries).toHaveLength(20);
    // top 20 by score (customer-0 .. customer-19), customer-20 dropped
    expect(res.body.entries[0].userId).toBe('customer-0');
    expect(res.body.entries[19].userId).toBe('customer-19');
  });

  test('extension: no x-test-user-id header -> 401', async () => {
    const res = await request(server).get('/api/leaderboard');

    expect(res.status).toBe(401);
  });

  // Issue #55: awardPointsForOrder (server/routes/points.js, the real
  // order-completion path) and GET /api/points (the dashboard) both write/read
  // db.collection('points').doc(customerId) directly, with NO `userId` field --
  // confirmed against M1's branch (origin/Liwen-M1, commit 1561cb7), which kept
  // this same addressing scheme. The loader instead uses Points.findByUserId(),
  // which queries by a `userId` field no real points doc ever has. This test
  // writes points exactly the way awardPointsForOrder does and should FAIL
  // until the loader is fixed to match.
  test('BUG (#55): points written the way awardPointsForOrder writes them are invisible to the leaderboard', async () => {
    db.__seed('users', 'dave', {
      id: 'dave',
      email: 'dave@example.com',
      password: 'pw',
      role: 'customer',
      profile: { name: 'Dave' },
    });
    // Exactly awardPointsForOrder's write shape: doc id = customerId, no
    // `userId` field anywhere on the doc.
    db.__seed('points', 'dave', {
      totalPoints: 77,
      availablePoints: 77,
      usedPoints: 0,
      transactions: [],
    });

    const res = await request(server)
      .get('/api/leaderboard')
      .set('x-test-user-id', 'dave');

    expect(res.status).toBe(200);
    const daveEntry = res.body.entries.find((e) => e.userId === 'dave');
    expect(daveEntry).toBeDefined();
    expect(daveEntry.points).toBe(77);
  });
});

describe('UC31 (M2): GET /api/leaderboard?scope=friends', () => {
  let server;

  beforeAll(() => {
    const app = express();
    app.use(express.json());
    app.use('/api/leaderboard', authStub, leaderboardRoutes);
    server = app.listen(0);
  });

  afterAll((done) => { server.close(done); });

  beforeEach(() => db.__reset());

  test('excludes a seeded user who is not a friend of the caller', async () => {
    seedCustomer('alice', { totalPoints: 10 });
    seedCustomer('bob', { totalPoints: 50 });
    seedCustomer('carol', { totalPoints: 90 }); // not a friend of alice

    const accepted = await Friendship.create({ userA: 'alice', userB: 'bob', requesterId: 'alice' });
    await accepted.accept();

    const res = await request(server)
      .get('/api/leaderboard')
      .query({ scope: 'friends' })
      .set('x-test-user-id', 'alice');

    expect(res.status).toBe(200);
    expect(res.body.scope).toBe('friends');
    expect(res.body.entries.map((e) => e.userId).sort()).toEqual(['alice', 'bob']);
  });

  test('includes the caller even if they have the lowest score', async () => {
    seedCustomer('alice', { totalPoints: 5 }); // lowest
    seedCustomer('bob', { totalPoints: 50 });

    const accepted = await Friendship.create({ userA: 'alice', userB: 'bob', requesterId: 'alice' });
    await accepted.accept();

    const res = await request(server)
      .get('/api/leaderboard')
      .query({ scope: 'friends' })
      .set('x-test-user-id', 'alice');

    expect(res.status).toBe(200);
    const aliceEntry = res.body.entries.find((e) => e.userId === 'alice');
    expect(aliceEntry).toBeDefined();
    expect(aliceEntry.rank).toBe(2); // ranked last, but present
  });

  test('a caller with no accepted friends gets a single-entry board (just themself)', async () => {
    seedCustomer('alice', { totalPoints: 10 });

    const res = await request(server)
      .get('/api/leaderboard')
      .query({ scope: 'friends' })
      .set('x-test-user-id', 'alice');

    expect(res.status).toBe(200);
    expect(res.body.entries).toHaveLength(1);
    expect(res.body.entries[0].userId).toBe('alice');
  });

  test('pending (not yet accepted) friendships are excluded', async () => {
    seedCustomer('alice', { totalPoints: 10 });
    seedCustomer('dave', { totalPoints: 999 });
    await Friendship.create({ userA: 'alice', userB: 'dave', requesterId: 'dave' }); // left pending

    const res = await request(server)
      .get('/api/leaderboard')
      .query({ scope: 'friends' })
      .set('x-test-user-id', 'alice');

    expect(res.status).toBe(200);
    expect(res.body.entries).toHaveLength(1);
    expect(res.body.entries[0].userId).toBe('alice');
  });
});
