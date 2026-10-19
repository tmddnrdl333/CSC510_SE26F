/**
 * M3 issue #20 — end-to-end: a team completes a weekly challenge.
 *
 * The milestone's done-when, walked through the real routes in one story:
 * friends connect (M2) -> team forms (#14) -> orders land through the week ->
 * progress fills (#16) -> target hit -> reward granted exactly once (#15),
 * visible in the donation counter and donationHistory -> badge challenge too
 * (#17).
 *
 * Orders are seeded directly as delivered documents: creating/delivering
 * orders through the ordering pipeline is M1/M2 territory (and its status
 * transitions are being rebuilt there) — M3's contract starts at "delivered
 * orders exist", per the design doc's derive-from-orders invariant.
 */

jest.mock('../server/config/firebase', () => require('./helpers/fakeFirestore').createFirestoreMock());

const request = require('supertest');
const express = require('express');
const { db } = require('../server/config/firebase');
const { authStub } = require('../server/middleware/authStub');
const friendsRoutes = require('../server/routes/friends');
const teamsRoutes = require('../server/routes/teams');
const challengesRoutes = require('../server/routes/challenges');

const as = (userId) => ({ 'x-test-user-id': userId });

function seedUser(id) {
  db.__seed('users', id, {
    id, email: `${id}@x.com`, password: 'pw', role: 'customer',
    profile: { name: id }, teamId: null,
  });
}

let orderSeq = 0;
function landDeliveredOrder(customerId, amount = 22) {
  orderSeq += 1;
  db.__seed('orders', `e2e-ord-${orderSeq}`, {
    id: `e2e-ord-${orderSeq}`,
    customerId,
    status: 'delivered',
    totalAmount: amount,
    timestamp: new Date().toISOString(), // current week — matches the API's server-derived weekKey
  });
}

describe('M3 E2E: a team completes a weekly challenge (#20)', () => {
  let server;

  beforeAll(() => {
    const app = express();
    app.use(express.json());
    // Mirrors server/index.js mounting exactly.
    app.use('/api/friends', authStub, friendsRoutes);
    app.use('/api/teams', authStub, teamsRoutes);
    app.use('/api/challenges', authStub, challengesRoutes);
    server = app.listen(0);
  });

  afterAll((done) => { server.close(done); });

  test('friends -> team -> orders -> progress -> exactly-once rewards (meals + badge)', async () => {
    db.__seed('settings', 'donations', { counter: 40 });
    ['alice', 'bob', 'carol'].forEach(seedUser);

    // --- Act 1: friendships form (M2) -------------------------------------
    for (const friend of ['bob', 'carol']) {
      const req1 = await request(server).post('/api/friends/request')
        .set(as(friend)).send({ toUserId: 'alice' });
      expect(req1.status).toBe(201);
      const acc = await request(server).post('/api/friends/accept')
        .set(as('alice')).send({ otherUserId: friend });
      expect(acc.status).toBe(200);
    }

    // --- Act 2: the team forms (#14) ---------------------------------------
    const created = await request(server).post('/api/teams')
      .set(as('alice')).send({ name: 'Wolf Pack' });
    expect(created.status).toBe(201);
    const teamId = created.body.team.id;

    for (const friend of ['bob', 'carol']) {
      const joined = await request(server).post('/api/teams/join')
        .set(as(friend)).send({ teamId });
      expect(joined.status).toBe(200);
    }
    const me = await request(server).get('/api/teams/me').set(as('carol'));
    expect(me.body.team.memberIds).toEqual(['alice', 'bob', 'carol']);

    // --- Act 3: orders land, progress fills (#16) --------------------------
    for (let i = 0; i < 7; i++) landDeliveredOrder(['alice', 'bob'][i % 2]);

    let list = await request(server).get('/api/challenges').set(as('alice'));
    let orders15 = list.body.challenges.find((c) => c.definitionId === 'weekly-team-orders-15');
    expect(orders15).toMatchObject({ progress: 7, achieved: false, claimable: false, status: 'active' });

    // An early claim must refuse and pay nothing.
    const early = await request(server).post('/api/challenges/weekly-team-orders-15/claim').set(as('bob'));
    expect(early.status).toBe(400);
    expect(early.body.code).toBe('NOT_ACHIEVED');

    for (let i = 0; i < 8; i++) landDeliveredOrder(['bob', 'carol'][i % 2]);

    list = await request(server).get('/api/challenges').set(as('bob'));
    orders15 = list.body.challenges.find((c) => c.definitionId === 'weekly-team-orders-15');
    expect(orders15).toMatchObject({ progress: 15, achieved: true, claimable: true });

    // --- Act 4: the meal reward, exactly once (#15) ------------------------
    const [claimA, claimB] = await Promise.all([
      request(server).post('/api/challenges/weekly-team-orders-15/claim').set(as('alice')),
      request(server).post('/api/challenges/weekly-team-orders-15/claim').set(as('bob')),
    ]);
    const bodies = [claimA.body, claimB.body];
    expect(bodies.filter((b) => b.rewarded)).toHaveLength(1);
    expect(bodies.filter((b) => b.alreadyRewarded)).toHaveLength(1);

    const counter = await db.collection('settings').doc('donations').get();
    expect(counter.data().counter).toBe(45); // +5 exactly once

    const rewardRef = bodies.find((b) => b.rewarded).rewardRef;
    const audit = await db.collection('donationHistory').doc(rewardRef).get();
    expect(audit.exists).toBe(true);
    expect(audit.data().amount).toBe(5);

    // The list reflects it for every member.
    list = await request(server).get('/api/challenges').set(as('carol'));
    orders15 = list.body.challenges.find((c) => c.definitionId === 'weekly-team-orders-15');
    expect(orders15.status).toBe('rewarded');
    expect(orders15.claimable).toBe(false);

    // --- Act 5: the badge challenge (#17) ----------------------------------
    // All three members have ordered this week -> weekly-whole-squad achieved.
    const squad = await request(server).post('/api/challenges/weekly-whole-squad/claim').set(as('carol'));
    expect(squad.status).toBe(200);
    expect(squad.body.rewardRef).toBe('badge:team_player');

    for (const m of ['alice', 'bob', 'carol']) {
      const user = await db.collection('users').doc(m).get();
      expect(user.data().challengeBadges.team_player).toBeDefined();
    }
    // Badge reward never touches the donation counter.
    expect((await db.collection('settings').doc('donations').get()).data().counter).toBe(45);

    // --- Epilogue: the spend challenge also resolved along the way ---------
    // 15 orders x $22 = $330 >= $300 -> claimable too; claim and verify +3.
    const spend = await request(server).post('/api/challenges/weekly-team-spend-300/claim').set(as('alice'));
    expect(spend.status).toBe(200);
    expect((await db.collection('settings').doc('donations').get()).data().counter).toBe(48);
  });
});
