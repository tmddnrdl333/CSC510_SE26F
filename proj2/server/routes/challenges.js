// server/routes/challenges.js — M3 challenge progress API (issue #16).
//
// SECURITY NOTE (per challengeService's contract): `orders`, `memberIds`, and
// `weekKey` are ALWAYS fetched/derived server-side here — never accepted from
// the request — because caller-supplied values would make "achieved" forgeable.
// Progress is derived at read time from orders (design doc §4 invariant 1);
// the only stored state is the reward ledger (challengeProgress).
//
// Identity via req.user.id (requireAuth, server/middleware/auth.js).

const express = require('express');
const { db } = require('../config/firebase');
const { challengeDefinitions } = require('../../src/challenges/challengeDefinitions');
const { evaluateChallenges, buildChallengeProgressId } = require('../../src/challenges/evaluateChallenges');
const { getUtcIsoWeek } = require('../../src/challenges/isoWeek');
const { claimChallengeReward } = require('../services/challengeService');

const router = express.Router();

const ERROR_STATUS = {
  UNKNOWN_CHALLENGE: 404,
  NOT_ACHIEVED: 400,
  REWARD_TYPE_NOT_IMPLEMENTED: 501,
  INVALID_REWARD: 500,
};

/** Loads the caller's team and this week's member orders — the server-side
 *  inputs for both routes. Returns null when the caller has no team. */
async function loadTeamContext(callerId) {
  const userDoc = await db.collection('users').doc(callerId).get();
  if (!userDoc.exists) return { error: { status: 404, message: 'User not found' } };

  const teamId = userDoc.data().teamId;
  if (!teamId) return { team: null };

  const teamDoc = await db.collection('teams').doc(teamId).get();
  if (!teamDoc.exists) return { team: null }; // stale cache; /teams/leave heals it

  const team = teamDoc.data();
  // memberIds is capped at 10 (design doc §2.2), matching Firestore's `in` limit.
  const ordersSnap = await db.collection('orders')
    .where('customerId', 'in', team.memberIds)
    .get();
  const orders = ordersSnap.docs.map((d) => d.data());
  return { team, orders, weekKey: getUtcIsoWeek(new Date()) };
}

// GET /api/challenges — my team's challenges with live progress + reward status.
router.get('/', async (req, res) => {
  try {
    const ctx = await loadTeamContext(req.user.id);
    if (ctx.error) return res.status(ctx.error.status).json({ error: ctx.error.message });
    if (!ctx.team) return res.status(200).json({ team: null, challenges: [] });

    const evaluations = evaluateChallenges({
      orders: ctx.orders,
      memberIds: ctx.team.memberIds,
      weekKey: ctx.weekKey,
    });

    const challenges = await Promise.all(evaluations.map(async (evaluation) => {
      const progressId = buildChallengeProgressId(evaluation.definitionId, ctx.team.id, ctx.weekKey);
      const progressDoc = await db.collection('challengeProgress').doc(progressId).get();
      const rewarded = progressDoc.exists && progressDoc.data().status === 'rewarded';
      return {
        ...evaluation,
        progressId,
        status: rewarded ? 'rewarded' : 'active',
        rewardRef: rewarded ? (progressDoc.data().rewardRef || null) : null,
        claimable: evaluation.achieved && !rewarded,
      };
    }));

    res.status(200).json({
      teamId: ctx.team.id,
      teamName: ctx.team.name,
      weekKey: ctx.weekKey,
      challenges,
    });
  } catch (error) {
    console.error('Challenges list error:', error);
    res.status(500).json({ error: error.message });
  }
});

// POST /api/challenges/:definitionId/claim — pay the reward, exactly once.
router.post('/:definitionId/claim', async (req, res) => {
  try {
    const ctx = await loadTeamContext(req.user.id);
    if (ctx.error) return res.status(ctx.error.status).json({ error: ctx.error.message });
    if (!ctx.team) return res.status(400).json({ error: 'You are not in a team' });

    const result = await claimChallengeReward({
      definitionId: req.params.definitionId,
      teamId: ctx.team.id,
      weekKey: ctx.weekKey,
      memberIds: ctx.team.memberIds,
      orders: ctx.orders,
    });

    res.status(200).json({
      message: result.rewarded
        ? 'Challenge reward granted'
        : 'Challenge reward was already granted',
      ...result,
    });
  } catch (error) {
    const status = ERROR_STATUS[error.code];
    if (status) return res.status(status).json({ error: error.message, code: error.code });
    console.error('Challenge claim error:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
