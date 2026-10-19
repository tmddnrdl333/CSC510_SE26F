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
//   - If a progress doc already exists (e.g. created 'active' by the progress
//     API), its stored `target` is the authoritative goal — the terms at
//     creation survive later definition changes (design doc §2.3) — and its
//     other fields are preserved (merge write).
//
// Reward types: 'donatedMeals' increments the global counter + writes a
// donationHistory audit row; 'badge' grants users.challengeBadges.<badgeId>
// to every team member (separate from the badgeService-owned users.badges
// snapshot). Both happen inside the same exactly-once transaction.
//
// Precedence: an already-rewarded claim returns `alreadyRewarded` even if the
// supplied orders no longer evaluate as achieved (statuses can be flipped back
// while transitions are unguarded — invariant 6), so a replay never surfaces
// a confusing NOT_ACHIEVED for a challenge that was in fact paid.
//
// This module is service-layer only: no express, no auth. Routes (#16) sit on
// top, MUST fetch `orders`/`memberIds` server-side and derive `weekKey`
// server-side (caller-supplied values would make "achieved" forgeable), and
// map the thrown `error.code` values to HTTP statuses.

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
 * @returns {Promise<{rewarded: boolean, alreadyRewarded: boolean,
 *                    progressId: string, reward: Object, rewardRef: ?string}>}
 * @throws {Error} code 'UNKNOWN_CHALLENGE' | 'INVALID_REWARD' |
 *                 'REWARD_TYPE_NOT_IMPLEMENTED' | 'NOT_ACHIEVED'
 */
async function claimChallengeReward({
  definitionId,
  teamId,
  weekKey,
  memberIds,
  orders,
  definitions = challengeDefinitions,
}) {
  const definition = definitions.find((d) => d.id === definitionId);
  if (!definition) {
    throw codedError('UNKNOWN_CHALLENGE', `Unknown challenge definition "${definitionId}"`);
  }

  // Definitions are added without touching this service ("definition-only"
  // extensibility), so malformed rewards must be rejected before they can
  // touch any stored state. Two reward types exist (#15 meals, #17 badges);
  // anything else refuses loudly rather than marking a reward paid without
  // granting anything.
  const rewardType = definition.reward && definition.reward.type;
  let rewardAmount = 0;
  if (rewardType === 'donatedMeals') {
    rewardAmount = Number(definition.reward.amount);
    if (!Number.isInteger(rewardAmount) || rewardAmount <= 0) {
      throw codedError(
        'INVALID_REWARD',
        `Definition "${definitionId}" has an invalid reward.amount (${definition.reward.amount})`
      );
    }
  } else if (rewardType === 'badge') {
    if (typeof definition.reward.badgeId !== 'string' || !definition.reward.badgeId.trim()) {
      throw codedError(
        'INVALID_REWARD',
        `Definition "${definitionId}" has a badge reward without a badgeId`
      );
    }
  } else {
    throw codedError(
      'REWARD_TYPE_NOT_IMPLEMENTED',
      `Reward type "${rewardType}" is not implemented`
    );
  }

  // Derive progress with the pure evaluator — never from stored state. The
  // achievement *decision* happens inside the transaction, where the stored
  // target (if any) is authoritative.
  const [evaluation] = evaluateChallenges({
    orders,
    memberIds,
    weekKey,
    definitions: [definition],
  });

  const progressId = buildChallengeProgressId(definitionId, teamId, weekKey);
  const progressRef = db.collection('challengeProgress').doc(progressId);
  const counterRef = db.collection('settings').doc('donations');
  // Deterministic audit id: a replayed payout cannot create a second row.
  const auditId = `challenge_${progressId}`;
  const auditRef = db.collection('donationHistory').doc(auditId);

  return db.runTransaction(async (txn) => {
    const progressDoc = await txn.get(progressRef);
    const existing = progressDoc.exists ? progressDoc.data() : null;

    if (existing && existing.status === 'rewarded') {
      return {
        rewarded: false,
        alreadyRewarded: true,
        progressId,
        reward: { ...definition.reward },
        rewardRef: existing.rewardRef || null,
      };
    }

    const storedTarget = existing ? Number(existing.target) : NaN;
    const effectiveTarget =
      Number.isFinite(storedTarget) && storedTarget > 0 ? storedTarget : evaluation.target;
    if (evaluation.progress < effectiveTarget) {
      throw codedError(
        'NOT_ACHIEVED',
        `Challenge "${definitionId}" is at ${evaluation.progress}/${effectiveTarget} for ${weekKey} — not achieved`
      );
    }

    const now = new Date();
    let rewardRef;

    if (rewardType === 'donatedMeals') {
      const counterDoc = await txn.get(counterRef);
      const currentCounter = counterDoc.exists ? (counterDoc.data().counter || 0) : 0;
      rewardRef = auditId;
      txn.set(counterRef, {
        counter: currentCounter + rewardAmount,
        lastUpdated: now,
      }, { merge: true });
      txn.set(auditRef, {
        id: auditId,
        amount: rewardAmount,
        description: `Team challenge reward: ${definition.label} (${teamId}, ${weekKey})`,
        challengeProgressId: progressId,
        createdAt: now,
      });
    } else {
      // Badge reward (#17): grant to every team member. Stored in the
      // SEPARATE users.challengeBadges field — never in users.badges, which
      // badgeService recomputes from orders and overwrites wholesale (the
      // snapshot would silently swallow anything we put there).
      const badgeId = definition.reward.badgeId;
      rewardRef = `badge:${badgeId}`;
      const memberRefs = (memberIds || []).map((id) => db.collection('users').doc(id));
      const memberDocs = await Promise.all(memberRefs.map((ref) => txn.get(ref)));
      memberDocs.forEach((doc, i) => {
        if (!doc.exists) {
          console.warn(`challengeService: member ${memberIds[i]} not found during badge grant`);
          return;
        }
        txn.update(memberRefs[i], {
          [`challengeBadges.${badgeId}`]: {
            badgeId,
            definitionId,
            teamId,
            weekKey,
            awardedAt: now,
          },
          updatedAt: now,
        });
      });
    }

    // merge: preserve createdAt and any fields the progress API stored.
    txn.set(progressRef, {
      id: progressId,
      definitionId,
      teamId,
      weekKey,
      target: effectiveTarget,
      status: 'rewarded',
      rewardedAt: now,
      rewardRef,
      updatedAt: now,
      ...(existing ? {} : { createdAt: now }),
    }, { merge: true });

    return {
      rewarded: true,
      alreadyRewarded: false,
      progressId,
      reward: { ...definition.reward },
      rewardRef,
    };
  });
}

module.exports = { claimChallengeReward };
