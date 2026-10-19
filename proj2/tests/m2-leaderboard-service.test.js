// M2: leaderboardService.computeScore unit tests (issue #30).
// Source under test: server/services/leaderboardService.js
// Formula: proj2/docs/plans/m2-leaderboard.md §6. Pure function -- no
// Firestore mock needed.

const {
  computeScore,
  rankUsers,
  POINTS_WEIGHT,
  BADGE_TIER_WEIGHT,
  DONATED_MEAL_WEIGHT,
  DELIVERED_ORDERS_PER_DONATED_MEAL,
} = require('../server/services/leaderboardService');

describe('computeScore', () => {
  test('normal case: combines all three terms with their weights', () => {
    const user = { totalPoints: 50, badgeTiers: 10, deliveredOrderCount: 23 };
    // donatedMeals = floor(23 / 10) = 2
    const expected =
      POINTS_WEIGHT * 50 + BADGE_TIER_WEIGHT * 10 + DONATED_MEAL_WEIGHT * 2;

    expect(computeScore(user)).toBe(expected);
    expect(computeScore(user)).toBe(80); // pinned, given the current weights (1, 2, 5)
  });

  test('all-zero user scores 0', () => {
    expect(computeScore({ totalPoints: 0, badgeTiers: 0, deliveredOrderCount: 0 })).toBe(0);
  });

  test('missing fields default to 0, not NaN/undefined', () => {
    expect(computeScore({})).toBe(0);
    expect(computeScore(undefined)).toBe(0);
    expect(computeScore({ totalPoints: 10 })).toBe(10); // badgeTiers, deliveredOrderCount missing
    expect(computeScore({ badgeTiers: 4 })).toBe(BADGE_TIER_WEIGHT * 4);
    expect(computeScore({ deliveredOrderCount: 30 })).toBe(DONATED_MEAL_WEIGHT * 3); // floor(30/10)=3
  });

  test('each weight constant is actually applied', () => {
    // Vary one field at a time, others held at 0, and confirm the score
    // moves by exactly that field's named weight -- not a hardcoded number,
    // so this stays correct if the constants are retuned.
    expect(computeScore({ totalPoints: 7 })).toBe(POINTS_WEIGHT * 7);
    expect(computeScore({ badgeTiers: 7 })).toBe(BADGE_TIER_WEIGHT * 7);
    expect(computeScore({ deliveredOrderCount: DELIVERED_ORDERS_PER_DONATED_MEAL * 7 })).toBe(
      DONATED_MEAL_WEIGHT * 7
    );
  });

  test('donatedMeals term floors, not rounds (fewer than 10 delivered orders contributes 0)', () => {
    expect(computeScore({ deliveredOrderCount: DELIVERED_ORDERS_PER_DONATED_MEAL - 1 })).toBe(0);
  });
});

describe('rankUsers', () => {
  test('orders by score descending and assigns sequential ranks', () => {
    const ranked = rankUsers([
      { userId: 'low', totalPoints: 5 },
      { userId: 'high', totalPoints: 50 },
      { userId: 'mid', totalPoints: 20 },
    ]);

    expect(ranked.map((u) => u.userId)).toEqual(['high', 'mid', 'low']);
    expect(ranked.map((u) => u.rank)).toEqual([1, 2, 3]);
    expect(ranked.map((u) => u.score)).toEqual([50, 20, 5]);
  });

  test('ties break deterministically by ascending userId, with distinct sequential ranks', () => {
    const ranked = rankUsers([
      { userId: 'charlie', totalPoints: 10 },
      { userId: 'alice', totalPoints: 10 },
      { userId: 'bob', totalPoints: 10 },
    ]);

    expect(ranked.map((u) => u.userId)).toEqual(['alice', 'bob', 'charlie']);
    expect(ranked.map((u) => u.rank)).toEqual([1, 2, 3]);

    // deterministic across repeated calls / input orderings
    const rankedAgain = rankUsers([
      { userId: 'bob', totalPoints: 10 },
      { userId: 'charlie', totalPoints: 10 },
      { userId: 'alice', totalPoints: 10 },
    ]);
    expect(rankedAgain.map((u) => u.userId)).toEqual(['alice', 'bob', 'charlie']);
  });

  test('empty list returns an empty array', () => {
    expect(rankUsers([])).toEqual([]);
    expect(rankUsers()).toEqual([]);
  });

  test('a single user is ranked 1', () => {
    const ranked = rankUsers([{ userId: 'solo', totalPoints: 5, badgeTiers: 2 }]);

    expect(ranked).toHaveLength(1);
    expect(ranked[0].rank).toBe(1);
    expect(ranked[0].score).toBe(POINTS_WEIGHT * 5 + BADGE_TIER_WEIGHT * 2);
  });
});
