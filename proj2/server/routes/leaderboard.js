// server/routes/leaderboard.js
// Contract: proj2/docs/plans/m2-leaderboard.md §5.
// Caller identity comes from req.user.id, set upstream by the temporary
// auth stub (server/middleware/authStub.js) mounted ahead of this router in
// server/index.js -- same as server/routes/friends.js.
const express = require('express');
const { db } = require('../config/firebase');
const { rankUsers, DELIVERED_ORDERS_PER_DONATED_MEAL } = require('../services/leaderboardService');
const { loadUserScoreDataForIds } = require('../services/leaderboardDataLoader');

const router = express.Router();

const DEFAULT_LIMIT = 20;

function parseLimit(rawLimit) {
  const parsed = parseInt(rawLimit, 10);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    return DEFAULT_LIMIT;
  }
  return parsed;
}

// All customer ids -- the leaderboard is a customer-facing feature; restaurant
// and delivery accounts never earn points/badges the same way and are
// excluded from the board.
async function getAllCustomerIds() {
  const snapshot = await db.collection('users').where('role', '==', 'customer').get();
  return snapshot.docs.map((doc) => doc.id);
}

// Attaches display name + the response-shape fields (points, badgeTierCount,
// donatedMeals) to a rankUsers() result. One extra `users` read per entry,
// run only for the entries that made the (limited) board.
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

// GET /api/leaderboard?limit=
// Global board: live computation over every customer (design doc invariant
// 8's cached top-K snapshot is explicitly deferred -- see plan doc §8, a
// known limit carried into Project 3).
router.get('/', async (req, res) => {
  try {
    const scope = req.query.scope === 'friends' ? 'friends' : 'global';
    const limit = parseLimit(req.query.limit);

    if (scope === 'friends') {
      // Implemented in a later piece of issue #31.
      return res.status(501).json({ error: 'scope=friends not yet implemented' });
    }

    const userIds = await getAllCustomerIds();
    const rawData = await loadUserScoreDataForIds(userIds);
    const ranked = rankUsers(rawData).slice(0, limit);
    const entries = await hydrateEntries(ranked);

    res.status(200).json({ scope: 'global', entries });
  } catch (error) {
    console.error('Leaderboard error:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
