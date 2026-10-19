/**
 * M3 issue #14 — teams: create / join / leave / me.
 *
 * Invariant under test (DB design §4.7): teams.memberIds is the source of
 * truth, users.teamId is a cache, and every mutation updates both atomically.
 * Join requires an ACCEPTED friendship with the team owner (M2 dependency,
 * checked via the deterministic friendship doc id).
 */

jest.mock('../server/config/firebase', () => require('./helpers/fakeFirestore').createFirestoreMock());

const request = require('supertest');
const express = require('express');
const { db } = require('../server/config/firebase');
const { bearer } = require('./helpers/authToken');
const { requireAuth } = require('../server/middleware/auth');
const teamsRoutes = require('../server/routes/teams');
const Friendship = require('../server/models/Friendship');

function seedUser(id, overrides = {}) {
  db.__seed('users', id, {
    id, email: `${id}@example.com`, password: 'pw', role: 'customer',
    profile: { name: id }, teamId: null, ...overrides,
  });
}

function seedAcceptedFriendship(a, b) {
  const id = Friendship.computeId(a, b);
  const [userA, userB] = [a, b].sort();
  db.__seed('friendships', id, {
    id, userA, userB, requesterId: a, status: 'accepted',
    members: [userA, userB], acceptedAt: new Date(),
  });
}

function seedTeam(id, ownerId, memberIds, overrides = {}) {
  db.__seed('teams', id, {
    id, name: `team-${id}`, ownerId, memberIds,
    createdAt: new Date(), updatedAt: new Date(), ...overrides,
  });
  memberIds.forEach((m) => db.__seed('users', m, {
    id: m, email: `${m}@example.com`, password: 'pw', role: 'customer',
    profile: { name: m }, teamId: id,
  }));
}

const as = (userId) => bearer(userId, 'customer');

describe('M3: teams create/join/leave/me (#14)', () => {
  let server;

  beforeAll(() => {
    const app = express();
    app.use(express.json());
    // Mirrors server/index.js: app.use('/api/teams', requireAuth, teamsRoutes)
    app.use('/api/teams', requireAuth, teamsRoutes);
    server = app.listen(0);
  });

  afterAll((done) => { server.close(done); });

  beforeEach(() => db.__reset());

  describe('POST /api/teams (create)', () => {
    test('main success scenario: creator becomes owner and sole member; users.teamId cache set', async () => {
      seedUser('alice');
      const res = await request(server).post('/api/teams').set(as('alice')).send({ name: 'Wolf Pack' });

      expect(res.status).toBe(201);
      expect(res.body.team).toMatchObject({ name: 'Wolf Pack', ownerId: 'alice', memberIds: ['alice'] });

      const team = await db.collection('teams').doc(res.body.team.id).get();
      const user = await db.collection('users').doc('alice').get();
      expect(team.data().memberIds).toEqual(['alice']); // source of truth
      expect(user.data().teamId).toBe(res.body.team.id); // cache
    });

    test('extension: missing name -> 400', async () => {
      seedUser('alice');
      const res = await request(server).post('/api/teams').set(as('alice')).send({});
      expect(res.status).toBe(400);
    });

    test('extension: already in a team -> 400', async () => {
      seedTeam('t1', 'alice', ['alice']);
      const res = await request(server).post('/api/teams').set(as('alice')).send({ name: 'Second' });
      expect(res.status).toBe(400);
    });

    test('extension: unknown user -> 404; no header -> 401', async () => {
      const noUser = await request(server).post('/api/teams').set(as('ghost')).send({ name: 'X' });
      expect(noUser.status).toBe(404);
      const noAuth = await request(server).post('/api/teams').send({ name: 'X' });
      expect(noAuth.status).toBe(401);
    });
  });

  describe('POST /api/teams/join', () => {
    test('main success scenario: an accepted friend of the owner joins; both docs updated', async () => {
      seedTeam('t1', 'alice', ['alice']);
      seedUser('bob');
      seedAcceptedFriendship('bob', 'alice');

      const res = await request(server).post('/api/teams/join').set(as('bob')).send({ teamId: 't1' });

      expect(res.status).toBe(200);
      const team = await db.collection('teams').doc('t1').get();
      const bob = await db.collection('users').doc('bob').get();
      expect(team.data().memberIds).toEqual(['alice', 'bob']);
      expect(bob.data().teamId).toBe('t1');
    });

    test('extension: not an accepted friend of the owner -> 403 (pending does not count)', async () => {
      seedTeam('t1', 'alice', ['alice']);
      seedUser('mallory');
      const stranger = await request(server).post('/api/teams/join').set(as('mallory')).send({ teamId: 't1' });
      expect(stranger.status).toBe(403);

      const id = Friendship.computeId('mallory', 'alice');
      const [userA, userB] = ['mallory', 'alice'].sort();
      db.__seed('friendships', id, { id, userA, userB, requesterId: 'mallory', status: 'pending', members: [userA, userB] });
      const pending = await request(server).post('/api/teams/join').set(as('mallory')).send({ teamId: 't1' });
      expect(pending.status).toBe(403);

      const team = await db.collection('teams').doc('t1').get();
      expect(team.data().memberIds).toEqual(['alice']); // untouched
    });

    test('extension: team full (10) -> 400', async () => {
      const members = ['alice', ...Array.from({ length: 9 }, (_, i) => `m${i}`)];
      seedTeam('t1', 'alice', members);
      seedUser('bob');
      seedAcceptedFriendship('bob', 'alice');

      const res = await request(server).post('/api/teams/join').set(as('bob')).send({ teamId: 't1' });
      expect(res.status).toBe(400);
      expect(res.body.error).toMatch(/full/);
    });

    test('CONCURRENCY: two friends race for the last slot — exactly one gets in', async () => {
      const members = ['alice', ...Array.from({ length: 8 }, (_, i) => `m${i}`)]; // 9/10
      seedTeam('t1', 'alice', members);
      seedUser('bob'); seedUser('carol');
      seedAcceptedFriendship('bob', 'alice');
      seedAcceptedFriendship('carol', 'alice');

      const [r1, r2] = await Promise.all([
        request(server).post('/api/teams/join').set(as('bob')).send({ teamId: 't1' }),
        request(server).post('/api/teams/join').set(as('carol')).send({ teamId: 't1' }),
      ]);

      expect([r1.status, r2.status].sort()).toEqual([200, 400]);
      const team = await db.collection('teams').doc('t1').get();
      expect(team.data().memberIds).toHaveLength(10); // never 11
    });

    test('extension: already in some team -> 400; unknown team -> 404', async () => {
      seedTeam('t1', 'alice', ['alice']);
      seedTeam('t2', 'dave', ['dave']);
      seedAcceptedFriendship('dave', 'alice');
      const inTeam = await request(server).post('/api/teams/join').set(as('dave')).send({ teamId: 't1' });
      expect(inTeam.status).toBe(400);

      seedUser('bob');
      const noTeam = await request(server).post('/api/teams/join').set(as('bob')).send({ teamId: 'nope' });
      expect(noTeam.status).toBe(404);
    });
  });

  describe('POST /api/teams/leave', () => {
    test('main success scenario: member leaves — removed from memberIds, cache cleared', async () => {
      seedTeam('t1', 'alice', ['alice', 'bob']);
      const res = await request(server).post('/api/teams/leave').set(as('bob'));

      expect(res.status).toBe(200);
      const team = await db.collection('teams').doc('t1').get();
      const bob = await db.collection('users').doc('bob').get();
      expect(team.data().memberIds).toEqual(['alice']);
      expect(bob.data().teamId).toBeNull();
    });

    test('extension: owner with other members -> 400 (v1: no transfer)', async () => {
      seedTeam('t1', 'alice', ['alice', 'bob']);
      const res = await request(server).post('/api/teams/leave').set(as('alice'));
      expect(res.status).toBe(400);
      const team = await db.collection('teams').doc('t1').get();
      expect(team.data().memberIds).toEqual(['alice', 'bob']); // untouched
    });

    test('extension: sole owner leaves -> team deleted', async () => {
      seedTeam('t1', 'alice', ['alice']);
      const res = await request(server).post('/api/teams/leave').set(as('alice'));
      expect(res.status).toBe(200);
      expect(res.body.teamDeleted).toBe(true);
      const team = await db.collection('teams').doc('t1').get();
      expect(team.exists).toBe(false);
    });

    test('extension: not in a team -> 400', async () => {
      seedUser('bob');
      const res = await request(server).post('/api/teams/leave').set(as('bob'));
      expect(res.status).toBe(400);
    });
  });

  describe('GET /api/teams/me', () => {
    test('returns my team, or null when not in one', async () => {
      seedTeam('t1', 'alice', ['alice']);
      seedUser('bob');

      const mine = await request(server).get('/api/teams/me').set(as('alice'));
      expect(mine.status).toBe(200);
      expect(mine.body.team).toMatchObject({ id: 't1', ownerId: 'alice' });

      const none = await request(server).get('/api/teams/me').set(as('bob'));
      expect(none.status).toBe(200);
      expect(none.body.team).toBeNull();
    });
  });
});
