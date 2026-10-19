// server/services/leaderboardService.js
// Pure score/ranking functions for M2 (issue #30). No Firestore access here
// -- callers fetch points/badges/order data and pass plain values in.
// Formula + rationale: proj2/docs/plans/m2-leaderboard.md §6.

// Named so they're easy to retune (see §6's "Update (issue #30, following
// #51)" note -- these have already been retuned once, for M1's actual
// points scale, and are expected to move again).
const POINTS_WEIGHT = 1;
const BADGE_TIER_WEIGHT = 2;
const DONATED_MEAL_WEIGHT = 5;

// Meal-for-a-Meal rule (routes/donations.js:15): 1 meal per 10 delivered orders.
const DELIVERED_ORDERS_PER_DONATED_MEAL = 10;

/**
 * Combined leaderboard score for one user.
 * score = POINTS_WEIGHT * totalPoints
 *       + BADGE_TIER_WEIGHT * badgeTiers
 *       + DONATED_MEAL_WEIGHT * floor(deliveredOrderCount / DELIVERED_ORDERS_PER_DONATED_MEAL)
 *
 * Pure function: no Firestore access, no I/O. Missing/undefined
 * totalPoints, badgeTiers, or deliveredOrderCount are treated as 0.
 *
 * @param {{ totalPoints?: number, badgeTiers?: number, deliveredOrderCount?: number }} user
 * @returns {number}
 */
function computeScore(user = {}) {
  const totalPoints = user.totalPoints || 0;
  const badgeTiers = user.badgeTiers || 0;
  const deliveredOrderCount = user.deliveredOrderCount || 0;
  const donatedMeals = Math.floor(deliveredOrderCount / DELIVERED_ORDERS_PER_DONATED_MEAL);

  return (
    POINTS_WEIGHT * totalPoints +
    BADGE_TIER_WEIGHT * badgeTiers +
    DONATED_MEAL_WEIGHT * donatedMeals
  );
}

module.exports = {
  computeScore,
  POINTS_WEIGHT,
  BADGE_TIER_WEIGHT,
  DONATED_MEAL_WEIGHT,
  DELIVERED_ORDERS_PER_DONATED_MEAL,
};
