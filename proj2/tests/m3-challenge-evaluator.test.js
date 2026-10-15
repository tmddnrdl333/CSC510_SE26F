/**
 * M3 issue #12 — Challenge definitions + pure evaluator.
 *
 * Covers: ISO week helper, team/week/status filtering, the three v1 metrics,
 * the definition-only extensibility promise (a new challenge type is a new
 * definition object, not evaluator code), and the deterministic
 * challengeProgress id used by the exactly-once payout (#15).
 */

const { getUtcIsoWeek } = require('../src/challenges/isoWeek');
const { challengeDefinitions } = require('../src/challenges/challengeDefinitions');
const {
  evaluateChallenges,
  filterTeamWeekOrders,
  buildChallengeProgressId,
} = require('../src/challenges/evaluateChallenges');

// 2026-10-12 is a Monday (UTC) — the week under test.
const WEEK = getUtcIsoWeek(new Date('2026-10-14T12:00:00.000Z'));
const MEMBERS = ['m1', 'm2', 'm3'];

const order = (customerId, isoDate, overrides = {}) => ({
  id: `ord-${customerId}-${isoDate}`,
  customerId,
  timestamp: `${isoDate}T18:00:00.000Z`,
  totalAmount: 20,
  status: 'delivered',
  ...overrides,
});

describe('M3: challenge definitions + pure evaluator (#12)', () => {
  describe('getUtcIsoWeek (UTC ISO week keys)', () => {
    test('Monday and Sunday of the same ISO week share a key', () => {
      expect(getUtcIsoWeek(new Date('2026-10-12T00:00:00.000Z')))
        .toBe(getUtcIsoWeek(new Date('2026-10-18T23:59:59.000Z')));
    });

    test('Sunday vs the following Monday fall in different weeks', () => {
      expect(getUtcIsoWeek(new Date('2026-10-11T23:59:59.000Z')))
        .not.toBe(getUtcIsoWeek(new Date('2026-10-12T00:00:00.000Z')));
    });

    test('week key has the YYYY-Www shape', () => {
      expect(getUtcIsoWeek(new Date('2026-01-01T00:00:00.000Z'))).toMatch(/^\d{4}-W\d{2}$/);
    });
  });

  describe('filterTeamWeekOrders', () => {
    test('keeps only delivered orders by team members inside the week', () => {
      const orders = [
        order('m1', '2026-10-13'),                                  // counts
        order('m2', '2026-10-14'),                                  // counts
        order('outsider', '2026-10-14'),                            // not a member
        order('m1', '2026-10-05'),                                  // previous week
        order('m2', '2026-10-15', { status: 'pending' }),           // not delivered
        order('m3', '2026-10-16', { timestamp: 'not-a-date' }),     // bad timestamp
      ];
      const kept = filterTeamWeekOrders(orders, { memberIds: MEMBERS, weekKey: WEEK });
      expect(kept.map((o) => o.id)).toEqual([
        'ord-m1-2026-10-13',
        'ord-m2-2026-10-14',
      ]);
    });

    test('accepts createdAt as a fallback timestamp field', () => {
      const orders = [{
        id: 'o1', customerId: 'm1', status: 'delivered',
        createdAt: '2026-10-13T12:00:00.000Z',
      }];
      expect(filterTeamWeekOrders(orders, { memberIds: MEMBERS, weekKey: WEEK })).toHaveLength(1);
    });
  });

  describe('metric evaluation', () => {
    const fifteenOrders = Array.from({ length: 15 }, (_, i) =>
      order(MEMBERS[i % 2], `2026-10-${String(12 + (i % 7)).padStart(2, '0')}`,
        { id: `bulk-${i}`, totalAmount: 21 }));

    test('teamDeliveredOrders: 15 delivered team orders achieves the 15-order challenge', () => {
      const results = evaluateChallenges({ orders: fifteenOrders, memberIds: MEMBERS, weekKey: WEEK });
      const feast = results.find((r) => r.definitionId === 'weekly-team-orders-15');
      expect(feast.progress).toBe(15);
      expect(feast.achieved).toBe(true);
      expect(feast.percent).toBe(100);
      expect(feast.reward).toEqual({ type: 'donatedMeals', amount: 5 });
    });

    test('teamDeliveredSpend: sums totalAmount of counted orders only', () => {
      const results = evaluateChallenges({ orders: fifteenOrders, memberIds: MEMBERS, weekKey: WEEK });
      const spend = results.find((r) => r.definitionId === 'weekly-team-spend-300');
      expect(spend.progress).toBe(15 * 21); // 315
      expect(spend.achieved).toBe(true);
    });

    test('uniqueActiveMembers: counts distinct ordering members', () => {
      const orders = [
        order('m1', '2026-10-13'),
        order('m1', '2026-10-14', { id: 'dup-m1' }),
        order('m2', '2026-10-15'),
      ];
      const results = evaluateChallenges({ orders, memberIds: MEMBERS, weekKey: WEEK });
      const squad = results.find((r) => r.definitionId === 'weekly-whole-squad');
      expect(squad.progress).toBe(2);
      expect(squad.achieved).toBe(false); // target is 3 distinct members
    });

    test('below-target progress reports achieved=false with a capped percent', () => {
      const orders = [order('m1', '2026-10-13'), order('m2', '2026-10-14')];
      const results = evaluateChallenges({ orders, memberIds: MEMBERS, weekKey: WEEK });
      const feast = results.find((r) => r.definitionId === 'weekly-team-orders-15');
      expect(feast.progress).toBe(2);
      expect(feast.achieved).toBe(false);
      expect(feast.percent).toBe(Math.round((2 / 15) * 100));
    });
  });

  describe('definition-only extensibility (the M3 selling point)', () => {
    test('a NEW challenge type works by adding a definition object — no evaluator change', () => {
      const newDefinition = {
        id: 'weekly-team-orders-3',
        label: 'Warm-up Week',
        description: 'Three team orders this week.',
        icon: '🥉',
        scope: 'team',
        period: 'weekly',
        metric: 'teamDeliveredOrders', // existing metric, new type
        target: 3,
        reward: { type: 'donatedMeals', amount: 1 },
      };
      const orders = [
        order('m1', '2026-10-13'),
        order('m2', '2026-10-14'),
        order('m3', '2026-10-15'),
      ];
      const results = evaluateChallenges({
        orders,
        memberIds: MEMBERS,
        weekKey: WEEK,
        definitions: [...challengeDefinitions, newDefinition],
      });
      const warmup = results.find((r) => r.definitionId === 'weekly-team-orders-3');
      expect(warmup).toBeDefined();
      expect(warmup.progress).toBe(3);
      expect(warmup.achieved).toBe(true);
    });

    test('a definition with an unknown metric fails loudly, not silently with 0', () => {
      const bad = { id: 'bad', metric: 'nope', target: 1, reward: {} };
      expect(() =>
        evaluateChallenges({ orders: [], memberIds: MEMBERS, weekKey: WEEK, definitions: [bad] })
      ).toThrow(/unknown metric "nope"/);
    });

    test('weekKey is required', () => {
      expect(() => evaluateChallenges({ orders: [], memberIds: MEMBERS })).toThrow(/weekKey/);
    });
  });

  describe('buildChallengeProgressId (deterministic payout id, feeds #15)', () => {
    test('is the definitionId_teamId_weekKey join', () => {
      expect(buildChallengeProgressId('weekly-team-orders-15', 'team-abc', '2026-W42'))
        .toBe('weekly-team-orders-15_team-abc_2026-W42');
    });

    test('same inputs always collide on the same id', () => {
      const a = buildChallengeProgressId('d', 't', '2026-W42');
      const b = buildChallengeProgressId('d', 't', '2026-W42');
      expect(a).toBe(b);
    });
  });
});
