/**
 * M3 issue #15 — exactly-once challenge reward payout.
 *
 * The payout must: verify achievement through the pure evaluator, pay through
 * a transaction keyed on the deterministic challengeProgress id, increment the
 * global donation counter exactly once, and leave a donationHistory audit row.
 * Same bug class as the 1a points double-spend — concurrency is the point.
 */

jest.mock('../server/config/firebase', () =>
  require('./helpers/fakeFirestore').createFirestoreMock()
);

const { db } = require('../server/config/firebase');
const { claimChallengeReward } = require('../server/services/challengeService');
const { getUtcIsoWeek } = require('../src/challenges/isoWeek');

const WEEK = getUtcIsoWeek(new Date('2026-10-14T12:00:00.000Z'));
const MEMBERS = ['m1', 'm2', 'm3'];
const TEAM = 'team-abc';

// 15 delivered member orders inside WEEK — achieves weekly-team-orders-15.
const achievingOrders = () =>
  Array.from({ length: 15 }, (_, i) => ({
    id: `ord-${i}`,
    customerId: MEMBERS[i % 2],
    timestamp: `2026-10-${String(12 + (i % 7)).padStart(2, '0')}T18:00:00.000Z`,
    totalAmount: 20,
    status: 'delivered',
  }));

const claim = (overrides = {}) =>
  claimChallengeReward({
    definitionId: 'weekly-team-orders-15',
    teamId: TEAM,
    weekKey: WEEK,
    memberIds: MEMBERS,
    orders: achievingOrders(),
    ...overrides,
  });

describe('M3: exactly-once challenge reward payout (#15)', () => {
  beforeEach(() => {
    db.__reset();
    db.__seed('settings', 'donations', { counter: 100 });
  });

  test('an achieved challenge pays out: counter up, ledger row, audit row', async () => {
    const result = await claim();

    expect(result).toMatchObject({ rewarded: true, alreadyRewarded: false });

    const counter = await db.collection('settings').doc('donations').get();
    expect(counter.data().counter).toBe(105); // +5 from the definition

    const progress = await db.collection('challengeProgress').doc(result.progressId).get();
    expect(progress.data()).toMatchObject({
      definitionId: 'weekly-team-orders-15',
      teamId: TEAM,
      weekKey: WEEK,
      status: 'rewarded',
      rewardRef: result.rewardRef,
    });

    const audit = await db.collection('donationHistory').doc(result.rewardRef).get();
    expect(audit.exists).toBe(true);
    expect(audit.data().amount).toBe(5);
    expect(audit.data().challengeProgressId).toBe(result.progressId);
  });

  test('an unachieved challenge pays nothing and writes nothing', async () => {
    await expect(claim({ orders: achievingOrders().slice(0, 3) })).rejects.toMatchObject({
      code: 'NOT_ACHIEVED',
    });

    const counter = await db.collection('settings').doc('donations').get();
    expect(counter.data().counter).toBe(100);
    const progress = await db
      .collection('challengeProgress')
      .doc(`weekly-team-orders-15_${TEAM}_${WEEK}`)
      .get();
    expect(progress.exists).toBe(false);
  });

  test('a second claim is a no-op: alreadyRewarded, counter unchanged', async () => {
    await claim();
    const second = await claim();

    expect(second).toMatchObject({ rewarded: false, alreadyRewarded: true });
    const counter = await db.collection('settings').doc('donations').get();
    expect(counter.data().counter).toBe(105); // still exactly one payout
  });

  test('CONCURRENCY: simultaneous claims reward exactly once', async () => {
    const outcomes = await Promise.all([claim(), claim(), claim()]);

    const rewarded = outcomes.filter((o) => o.rewarded);
    const deduped = outcomes.filter((o) => o.alreadyRewarded);
    expect(rewarded).toHaveLength(1);
    expect(deduped).toHaveLength(2);

    const counter = await db.collection('settings').doc('donations').get();
    expect(counter.data().counter).toBe(105); // +5 once, not +15

    const audits = await db.collection('donationHistory').where('amount', '==', 5).get();
    expect(audits.size).toBe(1); // deterministic audit id → one row
  });

  test('different weeks are independent payouts', async () => {
    await claim();

    const nextWeek = getUtcIsoWeek(new Date('2026-10-21T12:00:00.000Z'));
    const nextWeekOrders = achievingOrders().map((o, i) => ({
      ...o,
      id: `w2-${i}`,
      timestamp: `2026-10-${String(19 + (i % 7)).padStart(2, '0')}T18:00:00.000Z`,
    }));
    const result = await claim({ weekKey: nextWeek, orders: nextWeekOrders });

    expect(result.rewarded).toBe(true);
    const counter = await db.collection('settings').doc('donations').get();
    expect(counter.data().counter).toBe(110); // two independent weeks
  });

  test('missing counter doc is created rather than crashing', async () => {
    db.__reset(); // no settings/donations seeded
    const result = await claim();
    expect(result.rewarded).toBe(true);
    const counter = await db.collection('settings').doc('donations').get();
    expect(counter.data().counter).toBe(5);
  });

  test('unknown definition -> UNKNOWN_CHALLENGE', async () => {
    await expect(claim({ definitionId: 'nope' })).rejects.toMatchObject({
      code: 'UNKNOWN_CHALLENGE',
    });
  });

  test('pre-existing active doc: createdAt/extra fields preserved, stored (lower) target honored', async () => {
    const progressId = `weekly-team-orders-15_${TEAM}_${WEEK}`;
    db.__seed('challengeProgress', progressId, {
      id: progressId,
      status: 'active',
      target: 3, // terms at creation — lower than the definition's current 15
      createdAt: '2026-10-01T00:00:00.000Z',
      note: 'created by the progress API',
    });

    // Only 5 delivered orders: meets the stored target (3), NOT the current
    // definition target (15) — the stored terms must win (design doc §2.3).
    const result = await claim({ orders: achievingOrders().slice(0, 5) });
    expect(result.rewarded).toBe(true);

    const progress = await db.collection('challengeProgress').doc(progressId).get();
    expect(progress.data().status).toBe('rewarded');
    expect(progress.data().target).toBe(3); // not clobbered to 15
    expect(progress.data().createdAt).toBe('2026-10-01T00:00:00.000Z'); // preserved
    expect(progress.data().note).toBe('created by the progress API'); // merge keeps extras

    const counter = await db.collection('settings').doc('donations').get();
    expect(counter.data().counter).toBe(105); // still exactly one payout
  });

  test('pre-existing active doc: stored (higher) target is honored too', async () => {
    const progressId = `weekly-team-orders-15_${TEAM}_${WEEK}`;
    db.__seed('challengeProgress', progressId, { id: progressId, status: 'active', target: 999 });

    await expect(claim()).rejects.toMatchObject({ code: 'NOT_ACHIEVED' });

    const progress = await db.collection('challengeProgress').doc(progressId).get();
    expect(progress.data().status).toBe('active'); // untouched
    const counter = await db.collection('settings').doc('donations').get();
    expect(counter.data().counter).toBe(100);
  });

  test('replay after orders no longer achieve -> alreadyRewarded, not NOT_ACHIEVED', async () => {
    await claim();
    // Statuses can be flipped back while transitions are unguarded; a replay
    // of a paid claim must say "already rewarded", not surface a false error.
    const replay = await claim({ orders: [] });
    expect(replay).toMatchObject({ rewarded: false, alreadyRewarded: true });
  });

  test('a donatedMeals definition with a bad amount -> INVALID_REWARD, counter untouched', async () => {
    const bad = {
      id: 'bad-amount',
      label: 'Bad',
      scope: 'team',
      period: 'weekly',
      metric: 'teamDeliveredOrders',
      target: 1,
      reward: { type: 'donatedMeals' }, // amount missing -> would make counter NaN
    };
    await expect(claim({ definitionId: 'bad-amount', definitions: [bad] })).rejects.toMatchObject({
      code: 'INVALID_REWARD',
    });
    const counter = await db.collection('settings').doc('donations').get();
    expect(counter.data().counter).toBe(100);
  });

  describe('badge rewards (#17)', () => {
    const squadOrders = () => [
      ...achievingOrders(),
      {
        id: 'm3-order',
        customerId: 'm3',
        timestamp: '2026-10-15T18:00:00.000Z',
        totalAmount: 10,
        status: 'delivered',
      },
    ];

    beforeEach(() => {
      MEMBERS.forEach((m) => db.__seed('users', m, { id: m, profile: { name: m }, teamId: TEAM }));
    });

    test('grants the badge to every team member in users.challengeBadges — never users.badges', async () => {
      const result = await claim({ definitionId: 'weekly-whole-squad', orders: squadOrders() });

      expect(result.rewarded).toBe(true);
      expect(result.rewardRef).toBe('badge:team_player');

      for (const m of MEMBERS) {
        const user = await db.collection('users').doc(m).get();
        expect(user.data().challengeBadges.team_player).toMatchObject({
          badgeId: 'team_player',
          definitionId: 'weekly-whole-squad',
          teamId: TEAM,
          weekKey: WEEK,
        });
        expect(user.data().badges).toBeUndefined(); // badgeService's snapshot untouched
      }
      // No donation side effects for badge rewards
      const counter = await db.collection('settings').doc('donations').get();
      expect(counter.data().counter).toBe(100);
    });

    test('badge payout is exactly-once too', async () => {
      await claim({ definitionId: 'weekly-whole-squad', orders: squadOrders() });
      const replay = await claim({ definitionId: 'weekly-whole-squad', orders: squadOrders() });
      expect(replay).toMatchObject({
        rewarded: false,
        alreadyRewarded: true,
        rewardRef: 'badge:team_player',
      });
    });

    test('a missing member is skipped with a warning, not a failed payout', async () => {
      // m3 has no users doc
      db.__reset();
      db.__seed('settings', 'donations', { counter: 100 });
      ['m1', 'm2'].forEach((m) =>
        db.__seed('users', m, { id: m, profile: { name: m }, teamId: TEAM })
      );

      const result = await claim({ definitionId: 'weekly-whole-squad', orders: squadOrders() });
      expect(result.rewarded).toBe(true);
      const m1 = await db.collection('users').doc('m1').get();
      expect(m1.data().challengeBadges.team_player).toBeDefined();
    });

    test('a badge reward without badgeId -> INVALID_REWARD', async () => {
      const bad = {
        id: 'bad-badge',
        label: 'Bad',
        scope: 'team',
        period: 'weekly',
        metric: 'teamDeliveredOrders',
        target: 1,
        reward: { type: 'badge' },
      };
      await expect(claim({ definitionId: 'bad-badge', definitions: [bad] })).rejects.toMatchObject({
        code: 'INVALID_REWARD',
      });
    });

    test('an unknown reward type still refuses loudly', async () => {
      const weird = {
        id: 'weird',
        label: 'W',
        scope: 'team',
        period: 'weekly',
        metric: 'teamDeliveredOrders',
        target: 1,
        reward: { type: 'cash' },
      };
      await expect(claim({ definitionId: 'weird', definitions: [weird] })).rejects.toMatchObject({
        code: 'REWARD_TYPE_NOT_IMPLEMENTED',
      });
    });
  });
});
