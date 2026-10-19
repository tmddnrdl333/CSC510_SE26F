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
  db.__seed('points', `points-${id}`, {
    id: `points-${id}`,
    userId: id,
    totalPoints,
  });
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
});
