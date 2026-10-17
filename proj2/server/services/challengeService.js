// M3 challenge payout — the exactly-once reward path (issue #15).
//
// Invariants (proj2/docs/DB_DESIGN_M2_M3.md §4):
//   - challengeProgress stores the REWARD LEDGER only; progress itself is
//     derived at read time by the pure evaluator (src/challenges/) so there is
//     never a second copy of a number that `orders` already proves.
//   - The challengeProgress doc id is deterministic
//     (`${definitionId}_${teamId}_${weekKey}`), so concurrent claim attempts
//     collide on the same document and the transaction serializes them —
//     the same discipline that fixed the 1a points double-spend.
//
// This module is service-layer only: no express, no auth. Routes (#16) sit on
// top and map the thrown `error.code` values to HTTP statuses.

const { db } = require('../config/firebase');
const { challengeDefinitions } = require('../../src/challenges/challengeDefinitions');
const {
  evaluateChallenges,
  buildChallengeProgressId,
} = require('../../src/challenges/evaluateChallenges');

function codedError(code, message) {
  const err = new Error(message);
  err.code = code;
  return err;
}

/**
 * Claims the reward for one (challenge, team, week) — at most once, ever.
 *
 * The caller supplies the raw orders (any status/customer; the evaluator
 * filters), typically the current week's orders for the team's members.
 *
 * @returns {Promise<{rewarded: boolean, alreadyRewarded: boolean,
 *                    progressId: string, reward: Object, rewardRef: ?string}>}
 * @throws {Error} code 'UNKNOWN_CHALLENGE' | 'NOT_ACHIEVED' |
 *                 'REWARD_TYPE_NOT_IMPLEMENTED'
 */
async function claimChallengeReward({ definitionId, teamId, weekKey, memberIds, orders }) {
  const definition = challengeDefinitions.find((d) => d.id === definitionId);
  if (!definition) {
    throw codedError('UNKNOWN_CHALLENGE', `Unknown challenge definition "${definitionId}"`);
  }

  // Derive progress with the pure evaluator — never from stored state.
  const [evaluation] = evaluateChallenges({
    orders,
    memberIds,
    weekKey,
    definitions: [definition],
  });
  if (!evaluation.achieved) {
    throw codedError(
      'NOT_ACHIEVED',
      `Challenge "${definitionId}" is at ${evaluation.progress}/${evaluation.target} for ${weekKey} — not achieved`
    );
  }

  // Badge-type rewards are wired in #17; refuse loudly rather than marking a
  // reward paid without granting anything.
  if (definition.reward.type !== 'donatedMeals') {
    throw codedError(
      'REWARD_TYPE_NOT_IMPLEMENTED',
      `Reward type "${definition.reward.type}" is not implemented yet (see issue #17)`
    );
  }

  const progressId = buildChallengeProgressId(definitionId, teamId, weekKey);
  const progressRef = db.collection('challengeProgress').doc(progressId);
  const counterRef = db.collection('settings').doc('donations');
  // Deterministic audit id: a replayed payout cannot create a second row.
  const auditId = `challenge_${progressId}`;
  const auditRef = db.collection('donationHistory').doc(auditId);

  return db.runTransaction(async (txn) => {
    const progressDoc = await txn.get(progressRef);
    if (progressDoc.exists && progressDoc.data().status === 'rewarded') {
      return {
        rewarded: false,
        alreadyRewarded: true,
        progressId,
        reward: definition.reward,
        rewardRef: progressDoc.data().rewardRef || null,
      };
    }

    const counterDoc = await txn.get(counterRef);
    const currentCounter = counterDoc.exists ? (counterDoc.data().counter || 0) : 0;
    const now = new Date();

    txn.set(progressRef, {
      id: progressId,
      definitionId,
      teamId,
      weekKey,
      target: evaluation.target,
      status: 'rewarded',
      rewardedAt: now,
      rewardRef: auditId,
      createdAt: progressDoc.exists ? progressDoc.data().createdAt : now,
      updatedAt: now,
    });
    txn.set(counterRef, {
      counter: currentCounter + definition.reward.amount,
      lastUpdated: now,
    }, { merge: true });
    txn.set(auditRef, {
      id: auditId,
      amount: definition.reward.amount,
      description: `Team challenge reward: ${definition.label} (${teamId}, ${weekKey})`,
      challengeProgressId: progressId,
      createdAt: now,
    });

    return {
      rewarded: true,
      alreadyRewarded: false,
      progressId,
      reward: definition.reward,
      rewardRef: auditId,
    };
  });
}

module.exports = { claimChallengeReward };
