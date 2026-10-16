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

  describe('POST /api/friends/accept', () => {
    test('main success scenario: the non-requester accepts a pending request', async () => {
      seedUser('alice');
      seedUser('bob');
      const pending = await Friendship.create({ userA: 'alice', userB: 'bob', requesterId: 'alice' });

      const res = await request(server)
        .post('/api/friends/accept')
        .set('x-test-user-id', 'bob')
        .send({ requestId: pending.id });

      expect(res.status).toBe(200);
      expect(res.body.friendship.status).toBe('accepted');
      expect(res.body.friendship.acceptedAt).not.toBeNull();

      const stored = await Friendship.findById(pending.id);
      expect(stored.status).toBe('accepted');
    });

    test('extension: the requester cannot accept their own request -> 403', async () => {
      seedUser('alice');
      seedUser('bob');
      const pending = await Friendship.create({ userA: 'alice', userB: 'bob', requesterId: 'alice' });

      const res = await request(server)
        .post('/api/friends/accept')
        .set('x-test-user-id', 'alice')
        .send({ requestId: pending.id });

      expect(res.status).toBe(403);
    });

    test('extension: request not found -> 404', async () => {
      seedUser('bob');

      const res = await request(server)
        .post('/api/friends/accept')
        .set('x-test-user-id', 'bob')
        .send({ requestId: 'nonexistent_id' });

      expect(res.status).toBe(404);
    });

    test('extension: already accepted -> 400', async () => {
      seedUser('alice');
      seedUser('bob');
      const pending = await Friendship.create({ userA: 'alice', userB: 'bob', requesterId: 'alice' });
      await pending.accept();

      const res = await request(server)
        .post('/api/friends/accept')
        .set('x-test-user-id', 'bob')
        .send({ requestId: pending.id });

      expect(res.status).toBe(400);
    });

    test('extension: a caller who is neither userA nor userB -> 403, doc unchanged', async () => {
      seedUser('alice');
      seedUser('bob');
      seedUser('carol');
      const pending = await Friendship.create({ userA: 'alice', userB: 'bob', requesterId: 'alice' });

      const res = await request(server)
        .post('/api/friends/accept')
        .set('x-test-user-id', 'carol')
        .send({ requestId: pending.id });

      expect(res.status).toBe(403);

      const stored = await Friendship.findById(pending.id);
      expect(stored.status).toBe('pending');
      expect(stored.acceptedAt).toBeNull();
    });
  });

  describe('POST /api/friends/reject', () => {
    test('main success scenario: the recipient rejects a pending request, deleting it', async () => {
      seedUser('alice');
      seedUser('bob');
      const pending = await Friendship.create({ userA: 'alice', userB: 'bob', requesterId: 'alice' });

      const res = await request(server)
        .post('/api/friends/reject')
        .set('x-test-user-id', 'bob')
        .send({ requestId: pending.id });

      expect(res.status).toBe(200);

      const stored = await Friendship.findById(pending.id);
      expect(stored).toBeNull();
    });

    test('extension: the requester cannot reject their own sent request -> 403', async () => {
      seedUser('alice');
      seedUser('bob');
      const pending = await Friendship.create({ userA: 'alice', userB: 'bob', requesterId: 'alice' });

      const res = await request(server)
        .post('/api/friends/reject')
        .set('x-test-user-id', 'alice')
        .send({ requestId: pending.id });

      expect(res.status).toBe(403);

      // request must still exist -- the 403'd call must not have deleted it
      const stored = await Friendship.findById(pending.id);
      expect(stored).not.toBeNull();
    });

    test('extension: a caller who is neither userA nor userB -> 403, doc unchanged', async () => {
      seedUser('alice');
      seedUser('bob');
      seedUser('carol');
      const pending = await Friendship.create({ userA: 'alice', userB: 'bob', requesterId: 'alice' });

      const res = await request(server)
        .post('/api/friends/reject')
        .set('x-test-user-id', 'carol')
        .send({ requestId: pending.id });

      expect(res.status).toBe(403);

      const stored = await Friendship.findById(pending.id);
      expect(stored).not.toBeNull();
      expect(stored.status).toBe('pending');
    });
  });

  describe('GET /api/friends/list', () => {
    test('main success scenario: merges accepted friendships from both directions', async () => {
      seedUser('alice');
      seedUser('bob'); // alice is userA here (alice < bob)
      seedUser('__ahmed'); // alice is userB here (__ahmed < alice)

      const f1 = await Friendship.create({ userA: 'alice', userB: 'bob', requesterId: 'alice' });
      await f1.accept();
      const f2 = await Friendship.create({ userA: '__ahmed', userB: 'alice', requesterId: '__ahmed' });
      await f2.accept();

      const res = await request(server)
        .get('/api/friends/list')
        .set('x-test-user-id', 'alice');

      expect(res.status).toBe(200);
      expect(res.body.friends).toHaveLength(2);

      const ids = res.body.friends.map((f) => f.userId).sort();
      expect(ids).toEqual(['__ahmed', 'bob']);

      const bobEntry = res.body.friends.find((f) => f.userId === 'bob');
      expect(bobEntry.name).toBe('bob'); // seedUser sets profile.name = id
    });

    test('extension: pending friendships are excluded', async () => {
      seedUser('alice');
      seedUser('bob');
      seedUser('zoe');

      const accepted = await Friendship.create({ userA: 'alice', userB: 'bob', requesterId: 'alice' });
      await accepted.accept();
      await Friendship.create({ userA: 'alice', userB: 'zoe', requesterId: 'zoe' }); // left pending

      const res = await request(server)
        .get('/api/friends/list')
        .set('x-test-user-id', 'alice');

      expect(res.status).toBe(200);
      expect(res.body.friends).toHaveLength(1);
      expect(res.body.friends[0].userId).toBe('bob');
    });

    test('extension: a user with no friendships gets an empty list, not an error', async () => {
      seedUser('alice');

      const res = await request(server)
        .get('/api/friends/list')
        .set('x-test-user-id', 'alice');

      expect(res.status).toBe(200);
      expect(res.body.friends).toEqual([]);
    });
  });
});
