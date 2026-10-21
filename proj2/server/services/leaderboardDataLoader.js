// server/services/leaderboardDataLoader.js
// Firestore I/O for the leaderboard (issue #31). Gathers the raw per-user
// inputs that server/services/leaderboardService.js's computeScore() needs
// -- that file stays pure/Firestore-free per
// proj2/docs/plans/m2-leaderboard.md §5's implementation map, so the I/O
// lives here instead.
//
// Reads the users doc directly (not via models/User.js) for the badges
// snapshot: User's constructor doesn't expose a `badges` field even though
// server/services/badgeService.js writes badges/badgesStats directly onto
// the same doc (server/services/badgeService.js:17-25), bypassing the User
// model -- so User.findById(id).badges would silently be undefined.
//
// Also reads the points doc directly (not via models/Points.js) for the same
// reason: models/Points.js (getOrCreate/findByUserId) uses an auto-generated
// doc id plus a `userId` field, queried via `.where('userId','==',...)`. The
// REAL points-awarding path -- awardPointsForOrder in server/routes/points.js,
// and GET /api/points (the dashboard) -- both read/write
// db.collection('points').doc(customerId) directly and never set a `userId`
// field. Confirmed against M1's branch (origin/Liwen-M1, commit 1561cb7),
// which kept this same addressing scheme when it changed the points formula.
// Using Points.findByUserId() here meant this loader could never see real,
// production-earned points for any user (issue #55). models/Points.js's
// scheme is the odd one out and should not be used for reading points here.
const { db } = require('../config/firebase');

const TIER_RANK = { bronze: 1, silver: 2, gold: 3, diamond: 4 };

/**
 * Sum of tier levels across a user's `badges` snapshot (0-4 per badge, 18
 * badges -> 0-72 range). A missing/stale snapshot, or a badge entry with no
 * tier yet, counts as 0 -- per design doc invariant 9, not a synchronous
 * recompute on this path.
 *
 * @param {object|null|undefined} badgesSnapshot - `users.<id>.badges`, keyed
 *   by badge id -> `{ currentTier, progress, nextTierThreshold, lastUpdatedAt }`.
 * @returns {number}
 */
function sumBadgeTiers(badgesSnapshot) {
  if (!badgesSnapshot) return 0;
  return Object.values(badgesSnapshot).reduce((total, badge) => {
    const tier = badge && badge.currentTier;
    return total + (TIER_RANK[tier] || 0);
  }, 0);
}

/**
 * Counts a customer's delivered orders (feeds the donatedMeals term of the
 * score formula via `floor(count / 10)`, computed in leaderboardService.js).
 *
 * @param {string} userId
 * @returns {Promise<number>}
 */
async function countDeliveredOrders(userId) {
  const snapshot = await db
    .collection('orders')
    .where('customerId', '==', userId)
    .where('status', '==', 'delivered')
    .get();
  return snapshot.size;
}

/**
 * Loads the raw score inputs (totalPoints, badgeTiers, deliveredOrderCount)
 * for one user id, for server/services/leaderboardService.js's
 * computeScore()/rankUsers(). A missing points doc, missing badges
 * snapshot, or zero matching orders all resolve to 0 -- never an error.
 *
 * @param {string} userId
 * @returns {Promise<{ userId: string, totalPoints: number, badgeTiers: number, deliveredOrderCount: number }>}
 */
async function loadUserScoreData(userId) {
  const [userDoc, pointsDoc, deliveredOrderCount] = await Promise.all([
    db.collection('users').doc(userId).get(),
    db.collection('points').doc(userId).get(),
    countDeliveredOrders(userId),
  ]);

  const badgesSnapshot = userDoc.exists ? userDoc.data().badges : null;

  return {
    userId,
    totalPoints: pointsDoc.exists ? pointsDoc.data().totalPoints || 0 : 0,
    badgeTiers: sumBadgeTiers(badgesSnapshot),
    deliveredOrderCount,
  };
}

/**
 * Same as loadUserScoreData, for a list of user ids, run concurrently.
 *
 * @param {string[]} userIds
 * @returns {Promise<Array<ReturnType<typeof loadUserScoreData>>>}
 */
async function loadUserScoreDataForIds(userIds) {
  return Promise.all(userIds.map((userId) => loadUserScoreData(userId)));
}

module.exports = {
  loadUserScoreData,
  loadUserScoreDataForIds,
};
