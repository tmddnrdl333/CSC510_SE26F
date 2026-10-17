/**
 * M3 issue #15 — exactly-once challenge reward payout.
 *
 * The payout must: verify achievement through the pure evaluator, pay through
 * a transaction keyed on the deterministic challengeProgress id, increment the
 * global donation counter exactly once, and leave a donationHistory audit row.
 * Same bug class as the 1a points double-spend — concurrency is the point.
 */

jest.mock('../server/config/firebase', () => require('./helpers/fakeFirestore').createFirestoreMock());

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
    await expect(claim({ orders: achievingOrders().slice(0, 3) }))
      .rejects.toMatchObject({ code: 'NOT_ACHIEVED' });

    const counter = await db.collection('settings').doc('donations').get();
    expect(counter.data().counter).toBe(100);
    const progress = await db.collection('challengeProgress')
      .doc(`weekly-team-orders-15_${TEAM}_${WEEK}`).get();
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
    await expect(claim({ definitionId: 'nope' }))
      .rejects.toMatchObject({ code: 'UNKNOWN_CHALLENGE' });
  });

  test('badge-type reward refuses loudly until #17 wires it', async () => {
    // weekly-whole-squad needs 3 distinct ordering members and pays a badge.
    await expect(claim({ definitionId: 'weekly-whole-squad', orders: [
      ...achievingOrders(),
      { id: 'm3-order', customerId: 'm3', timestamp: '2026-10-15T18:00:00.000Z', totalAmount: 10, status: 'delivered' },
    ] })).rejects.toMatchObject({ code: 'REWARD_TYPE_NOT_IMPLEMENTED' });

    const progress = await db.collection('challengeProgress')
      .doc(`weekly-whole-squad_${TEAM}_${WEEK}`).get();
    expect(progress.exists).toBe(false); // refused BEFORE marking anything rewarded
  });
});
