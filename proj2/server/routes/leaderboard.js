// server/routes/leaderboard.js
// Contract: proj2/docs/plans/m2-leaderboard.md §5.
// Caller identity comes from req.user.id, set upstream by the temporary
// auth stub (server/middleware/authStub.js) mounted ahead of this router in
// server/index.js -- same as server/routes/friends.js.
const express = require('express');
const { db } = require('../config/firebase');
const { rankUsers, DELIVERED_ORDERS_PER_DONATED_MEAL } = require('../services/leaderboardService');
const { loadUserScoreDataForIds } = require('../services/leaderboardDataLoader');
const Friendship = require('../models/Friendship');

const router = express.Router();

const DEFAULT_LIMIT = 20;

/**
 * Parses the `?limit=` query param, falling back to `DEFAULT_LIMIT` for
 * anything missing, non-numeric, or not a positive integer.
 *
 * @param {string|undefined} rawLimit - `req.query.limit`.
 * @returns {number}
 */
function parseLimit(rawLimit) {
  const parsed = parseInt(rawLimit, 10);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    return DEFAULT_LIMIT;
  }
  return parsed;
}

/**
 * All customer ids -- the leaderboard is a customer-facing feature;
 * restaurant and delivery accounts never earn points/badges the same way
 * and are excluded from the board.
 *
 * @returns {Promise<string[]>}
 */
async function getAllCustomerIds() {
  const snapshot = await db.collection('users').where('role', '==', 'customer').get();
  return snapshot.docs.map((doc) => doc.id);
}

/**
 * Attaches display name + the response-shape fields (points, badgeTierCount,
 * donatedMeals) to a `rankUsers()` result. One extra `users` read per entry,
 * run only for the entries that made the (limited) board.
 *
 * @param {Array<object>} rankedUsers - Output of `rankUsers()`, already
 *   sliced to the requested limit.
 * @returns {Promise<Array<{userId: string, name: string|null, score: number,
 *   rank: number, points: number, badgeTierCount: number, donatedMeals: number}>>}
 */
async function hydrateEntries(rankedUsers) {
  return Promise.all(rankedUsers.map(async (u) => {
    const userDoc = await db.collection('users').doc(u.userId).get();
    const name = userDoc.exists ? userDoc.data().profile?.name : null;
    return {
      userId: u.userId,
      name: name || null,
      score: u.score,
      rank: u.rank,
      points: u.totalPoints,
      badgeTierCount: u.badgeTiers,
      donatedMeals: Math.floor(u.deliveredOrderCount / DELIVERED_ORDERS_PER_DONATED_MEAL),
    };
  }));
}

/**
 * Loads, ranks, caps at `limit`, and hydrates the board for a given set of
 * user ids -- shared by both scopes below.
 *
 * @param {string[]} userIds
 * @param {number} limit
 * @returns {Promise<Array<object>>} See `hydrateEntries`'s return shape.
 */
async function buildEntries(userIds, limit) {
  const rawData = await loadUserScoreDataForIds(userIds);
  const ranked = rankUsers(rawData).slice(0, limit);
  return hydrateEntries(ranked);
}

/**
 * GET /api/leaderboard
 * Global board: live computation over every customer (design doc invariant
 * 8's cached top-K snapshot is explicitly deferred -- see plan doc §8, a
 * known limit carried into Project 3).
 * `?scope=friends`: caller (`req.user.id`) plus their accepted friends
 * (`Friendship.getFriends`, #29) only -- bounded by friend count, so this
 * path is naive/live even once the global board eventually gets a cache.
 *
 * @query {string} [scope] - `'friends'` for the friends-only board; anything
 *   else (including omitted) is the global board.
 * @query {string} [limit] - Caps the number of entries returned (both
 *   scopes). Defaults to `DEFAULT_LIMIT` (20) if missing/invalid.
 * @returns {200} `{ scope, entries }` - `entries` per `hydrateEntries`'s
 *   shape. Empty friend list on `?scope=friends` still returns a 1-entry
 *   board (just the caller), not an error.
 * @returns {401} No/invalid `req.user.id` (auth stub).
 */
router.get('/', async (req, res) => {
  try {
    const callerId = req.user.id;
    const scope = req.query.scope === 'friends' ? 'friends' : 'global';
    const limit = parseLimit(req.query.limit);

    if (scope === 'friends') {
      const friendIds = await Friendship.getFriends(callerId);
      const entries = await buildEntries([callerId, ...friendIds], limit);
      return res.status(200).json({ scope: 'friends', entries });
    }

    const userIds = await getAllCustomerIds();
    const entries = await buildEntries(userIds, limit);

    res.status(200).json({ scope: 'global', entries });
  } catch (error) {
    console.error('Leaderboard error:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
