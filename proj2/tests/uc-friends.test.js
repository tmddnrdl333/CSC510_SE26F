// M2: Friendships routes (issue #28).
// Source under test: server/routes/friends.js, mounted behind the temporary
// auth stub (server/middleware/authStub.js) exactly as server/index.js does.
// Contract: proj2/docs/plans/m2-leaderboard.md §4, §5, §7.

jest.mock('../server/config/firebase', () => require('./helpers/fakeFirestore').createFirestoreMock());

const request = require('supertest');
const express = require('express');
const { db } = require('../server/config/firebase');
const { authStub } = require('../server/middleware/authStub');
const friendsRoutes = require('../server/routes/friends');
const Friendship = require('../server/models/Friendship');

function seedUser(id, overrides = {}) {
  const now = new Date();
  const user = {
    id,
    email: `${id}@example.com`,
    password: 'pw',
    role: 'customer',
    profile: { name: id },
    deliveryStatus: null,
    location: null,
    totalEarnings: 0,
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
  db.__seed('users', id, user);
  return user;
}

describe('UC28 (M2): Friendships', () => {
  let server;

  beforeAll(() => {
    const app = express();
    app.use(express.json());
    // Mirrors server/index.js: app.use('/api/friends', authStub, friendsRoutes)
    app.use('/api/friends', authStub, friendsRoutes);
    server = app.listen(0);
  });

  afterAll((done) => { server.close(done); });

  beforeEach(() => db.__reset());

  describe('POST /api/friends/request', () => {
    test('main success scenario: caller sends a request to a real, unrelated user', async () => {
      seedUser('alice');
      seedUser('bob');

      const res = await request(server)
        .post('/api/friends/request')
        .set('x-test-user-id', 'alice')
        .send({ toUserId: 'bob' });

      expect(res.status).toBe(201);
      expect(res.body.friendship.status).toBe('pending');
      expect(res.body.friendship.requesterId).toBe('alice');
      expect(res.body.friendship.id).toBe(Friendship.computeId('alice', 'bob'));

      const stored = await Friendship.findByPair('alice', 'bob');
      expect(stored.status).toBe('pending');
    });

    test('extension: self-request -> 400', async () => {
      seedUser('alice');

      const res = await request(server)
        .post('/api/friends/request')
        .set('x-test-user-id', 'alice')
        .send({ toUserId: 'alice' });

      expect(res.status).toBe(400);
    });

    test('extension: already friends -> 400', async () => {
      seedUser('alice');
      seedUser('bob');
      const existing = await Friendship.create({ userA: 'alice', userB: 'bob', requesterId: 'alice' });
      await existing.accept();

      const res = await request(server)
        .post('/api/friends/request')
        .set('x-test-user-id', 'alice')
        .send({ toUserId: 'bob' });

      expect(res.status).toBe(400);
    });

    test('extension: duplicate pending request is idempotent, not an error', async () => {
      seedUser('alice');
      seedUser('bob');
      await Friendship.create({ userA: 'alice', userB: 'bob', requesterId: 'alice' });

      const res = await request(server)
        .post('/api/friends/request')
        .set('x-test-user-id', 'alice')
        .send({ toUserId: 'bob' });

      expect(res.status).toBe(200);
      expect(res.body.friendship.status).toBe('pending');

      // still exactly one doc for the pair
      const list = await Friendship.listForUser('alice');
      expect(list).toHaveLength(1);
    });

    test('extension: toUserId does not resolve to a real user -> 404', async () => {
      seedUser('alice');

      const res = await request(server)
        .post('/api/friends/request')
        .set('x-test-user-id', 'alice')
        .send({ toUserId: 'nobody' });

      expect(res.status).toBe(404);
    });

    test('extension: no x-test-user-id header -> 401', async () => {
      const res = await request(server)
        .post('/api/friends/request')
        .send({ toUserId: 'bob' });

      expect(res.status).toBe(401);
    });
  });
});
