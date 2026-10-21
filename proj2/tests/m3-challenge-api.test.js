/**
 * M3 issue #16 — challenge progress API.
 *
 * GET /api/challenges derives live progress from this week's member orders
 * (server-side inputs only); POST /:definitionId/claim pays through the #15
 * transaction. Orders in these tests are stamped with the CURRENT date so the
 * route's server-derived weekKey matches — the route must never accept a
 * client-supplied week.
 */

jest.mock('../server/config/firebase', () =>
  require('./helpers/fakeFirestore').createFirestoreMock()
);

const request = require('supertest');
const express = require('express');
const { db } = require('../server/config/firebase');
const { bearer } = require('./helpers/authToken');
const { requireAuth } = require('../server/middleware/auth');
const challengesRoutes = require('../server/routes/challenges');

const as = (userId) => bearer(userId, 'customer');

function seedUser(id, teamId = null) {
  db.__seed('users', id, {
    id,
    email: `${id}@x.com`,
    password: 'pw',
    role: 'customer',
    profile: { name: id },
    teamId,
  });
}

function seedTeam(id, ownerId, memberIds) {
  db.__seed('teams', id, {
    id,
    name: `team-${id}`,
    ownerId,
    memberIds,
    createdAt: new Date(),
    updatedAt: new Date(),
  });
  memberIds.forEach((m) => seedUser(m, id));
}

// Delivered orders stamped "now" so they land in the route's current week.
function seedDeliveredOrders(count, memberIds) {
  for (let i = 0; i < count; i++) {
    db.__seed('orders', `ord-${i}`, {
      id: `ord-${i}`,
      customerId: memberIds[i % memberIds.length],
      status: 'delivered',
      totalAmount: 20,
      timestamp: new Date().toISOString(),
    });
  }
}

describe('M3: challenge progress API (#16)', () => {
  let server;

  beforeAll(() => {
    const app = express();
    app.use(express.json());
    // Mirrors server/index.js: app.use('/api/challenges', requireAuth, challengesRoutes)
    app.use('/api/challenges', requireAuth, challengesRoutes);
    server = app.listen(0);
  });

  afterAll((done) => {
    server.close(done);
  });

  beforeEach(() => {
    db.__reset();
    db.__seed('settings', 'donations', { counter: 100 });
  });

  describe('GET /api/challenges', () => {
    test('main success scenario: live progress for every definition, derived from orders', async () => {
      seedTeam('t1', 'alice', ['alice', 'bob']);
      seedDeliveredOrders(5, ['alice', 'bob']);

      const res = await request(server).get('/api/challenges').set(as('alice'));

      expect(res.status).toBe(200);
      expect(res.body.teamId).toBe('t1');
      expect(res.body.weekKey).toMatch(/^\d{4}-W\d{2}$/);

      const orders15 = res.body.challenges.find((c) => c.definitionId === 'weekly-team-orders-15');
      expect(orders15).toMatchObject({
        progress: 5,
        target: 15,
        achieved: false,
        status: 'active',
        claimable: false,
      });

      const squad = res.body.challenges.find((c) => c.definitionId === 'weekly-whole-squad');
      expect(squad.progress).toBe(2); // two distinct ordering members
    });

    test('extension: no team -> 200 with team:null (UI-friendly, not an error)', async () => {
      seedUser('loner');
      const res = await request(server).get('/api/challenges').set(as('loner'));
      expect(res.status).toBe(200);
      expect(res.body).toEqual({ team: null, challenges: [] });
    });

    test('extension: non-delivered and non-member orders do not count', async () => {
      seedTeam('t1', 'alice', ['alice']);
      db.__seed('orders', 'pending-1', {
        id: 'pending-1',
        customerId: 'alice',
        status: 'pending',
        totalAmount: 20,
        timestamp: new Date().toISOString(),
      });
      db.__seed('orders', 'outsider-1', {
        id: 'outsider-1',
        customerId: 'mallory',
        status: 'delivered',
        totalAmount: 20,
        timestamp: new Date().toISOString(),
      });

      const res = await request(server).get('/api/challenges').set(as('alice'));
      const orders15 = res.body.challenges.find((c) => c.definitionId === 'weekly-team-orders-15');
      expect(orders15.progress).toBe(0);
    });

    test('extension: no auth header -> 401; unknown user -> 404', async () => {
      expect((await request(server).get('/api/challenges')).status).toBe(401);
      expect((await request(server).get('/api/challenges').set(as('ghost'))).status).toBe(404);
    });
  });

  describe('POST /api/challenges/:definitionId/claim', () => {
    test('main success scenario: achieved challenge pays once, then reports already granted', async () => {
      seedTeam('t1', 'alice', ['alice', 'bob']);
      seedDeliveredOrders(15, ['alice', 'bob']);

      const first = await request(server)
        .post('/api/challenges/weekly-team-orders-15/claim')
        .set(as('alice'));
      expect(first.status).toBe(200);
      expect(first.body.rewarded).toBe(true);

      const counter = await db.collection('settings').doc('donations').get();
      expect(counter.data().counter).toBe(105);

      const second = await request(server)
        .post('/api/challenges/weekly-team-orders-15/claim')
        .set(as('bob'));
      expect(second.status).toBe(200);
      expect(second.body.alreadyRewarded).toBe(true);
      expect((await db.collection('settings').doc('donations').get()).data().counter).toBe(105);

      // The list now shows it rewarded and not claimable.
      const list = await request(server).get('/api/challenges').set(as('alice'));
      const row = list.body.challenges.find((c) => c.definitionId === 'weekly-team-orders-15');
      expect(row.status).toBe('rewarded');
      expect(row.claimable).toBe(false);
    });

    test('extension: unachieved -> 400 NOT_ACHIEVED, nothing paid', async () => {
      seedTeam('t1', 'alice', ['alice']);
      seedDeliveredOrders(3, ['alice']);
      const res = await request(server)
        .post('/api/challenges/weekly-team-orders-15/claim')
        .set(as('alice'));
      expect(res.status).toBe(400);
      expect(res.body.code).toBe('NOT_ACHIEVED');
      expect((await db.collection('settings').doc('donations').get()).data().counter).toBe(100);
    });

    test('extension: unknown definition -> 404; no team -> 400', async () => {
      seedTeam('t1', 'alice', ['alice', 'bob', 'carol']);
      seedDeliveredOrders(6, ['alice', 'bob', 'carol']);

      expect(
        (await request(server).post('/api/challenges/nope/claim').set(as('alice'))).status
      ).toBe(404);

      seedUser('loner');
      expect(
        (await request(server).post('/api/challenges/weekly-team-orders-15/claim').set(as('loner')))
          .status
      ).toBe(400);
    });

    test('badge challenge (#17): claim grants users.challengeBadges to every member', async () => {
      seedTeam('t1', 'alice', ['alice', 'bob', 'carol']);
      seedDeliveredOrders(6, ['alice', 'bob', 'carol']); // 3 distinct members -> squad achieved

      const res = await request(server)
        .post('/api/challenges/weekly-whole-squad/claim')
        .set(as('alice'));
      expect(res.status).toBe(200);
      expect(res.body.rewardRef).toBe('badge:team_player');

      for (const m of ['alice', 'bob', 'carol']) {
        const user = await db.collection('users').doc(m).get();
        expect(user.data().challengeBadges.team_player).toBeDefined();
      }
      // donation counter untouched by badge rewards
      expect((await db.collection('settings').doc('donations').get()).data().counter).toBe(100);
    });
  });
});
