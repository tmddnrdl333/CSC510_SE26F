// server/routes/teams.js — M3 teams (issue #14).
//
// Schema/contract: proj2/docs/DB_DESIGN_M2_M3.md §2.2 and §4 invariant 7:
//   - `teams.memberIds` is the SOURCE OF TRUTH for membership (max 10,
//     owner included); `users.teamId` is a cache of the same fact.
//   - Every join/leave/create updates both documents atomically. The design
//     doc says "batched write"; we use a transaction instead — strictly
//     stronger, and it lets the size/membership checks read inside the same
//     atomic unit (the test double implements runTransaction, not batch()).
//   - Join rule (M2 dependency): the caller must have an ACCEPTED friendship
//     with the team owner, checked via the deterministic friendship doc id.
//
// Caller identity comes from req.user.id (temporary authStub today, M1's
// requireAuth after it merges) — never from the body.
//
// v1 scope per the issue: create / join / leave / list ("me"). No invites, no
// member removal by the owner, no ownership transfer. The owner may leave
// only as the last member, which deletes the team.

const express = require('express');
const { db } = require('../config/firebase');
const Friendship = require('../models/Friendship');

const router = express.Router();

const MAX_TEAM_SIZE = 10; // Firestore `in`-query limit; see design doc §2.2

function httpError(status, message) {
  const err = new Error(message);
  err.status = status;
  return err;
}

function sendError(res, error) {
  if (error && error.status) {
    res.status(error.status).json({ error: error.message });
    return true;
  }
  return false;
}

// POST /api/teams  { name } — create a team; caller becomes owner + member.
router.post('/', async (req, res) => {
  try {
    const callerId = req.user.id;
    const { name } = req.body;
    if (!name || typeof name !== 'string' || !name.trim()) {
      return res.status(400).json({ error: 'name required' });
    }

    const teamRef = db.collection('teams').doc();
    const userRef = db.collection('users').doc(callerId);

    const team = await db.runTransaction(async (txn) => {
      const userDoc = await txn.get(userRef);
      if (!userDoc.exists) throw httpError(404, 'User not found');
      if (userDoc.data().teamId) throw httpError(400, 'Already in a team — leave it first');

      const now = new Date();
      const doc = {
        id: teamRef.id,
        name: name.trim(),
        ownerId: callerId,
        memberIds: [callerId],
        createdAt: now,
        updatedAt: now,
      };
      txn.set(teamRef, doc);
      txn.update(userRef, { teamId: teamRef.id, updatedAt: now });
      return doc;
    });

    res.status(201).json({ team });
  } catch (error) {
    if (sendError(res, error)) return;
    console.error('Team create error:', error);
    res.status(500).json({ error: error.message });
  }
});

// POST /api/teams/join  { teamId } — join a team whose owner is an accepted friend.
router.post('/join', async (req, res) => {
  try {
    const callerId = req.user.id;
    const { teamId } = req.body;
    if (!teamId) return res.status(400).json({ error: 'teamId required' });

    const teamRef = db.collection('teams').doc(teamId);
    const userRef = db.collection('users').doc(callerId);

    const team = await db.runTransaction(async (txn) => {
      const teamDoc = await txn.get(teamRef);
      if (!teamDoc.exists) throw httpError(404, 'Team not found');
      const teamData = teamDoc.data();

      const userDoc = await txn.get(userRef);
      if (!userDoc.exists) throw httpError(404, 'User not found');
      if (userDoc.data().teamId) throw httpError(400, 'Already in a team — leave it first');

      if (teamData.memberIds.includes(callerId)) {
        throw httpError(400, 'Already a member of this team');
      }
      if (teamData.memberIds.length >= MAX_TEAM_SIZE) {
        throw httpError(400, `Team is full (max ${MAX_TEAM_SIZE} members)`);
      }

      // M2 dependency: accepted friendship with the owner, looked up by the
      // deterministic pair id inside the same transaction.
      const friendshipRef = db
        .collection('friendships')
        .doc(Friendship.computeId(teamData.ownerId, callerId));
      const friendshipDoc = await txn.get(friendshipRef);
      if (!friendshipDoc.exists || friendshipDoc.data().status !== 'accepted') {
        throw httpError(403, 'You must be an accepted friend of the team owner to join');
      }

      const now = new Date();
      const memberIds = [...teamData.memberIds, callerId];
      txn.update(teamRef, { memberIds, updatedAt: now });
      txn.update(userRef, { teamId, updatedAt: now });
      return { ...teamData, memberIds, updatedAt: now };
    });

    res.status(200).json({ team });
  } catch (error) {
    if (sendError(res, error)) return;
    console.error('Team join error:', error);
    res.status(500).json({ error: error.message });
  }
});

// POST /api/teams/leave — leave my team; the owner may leave only as the
// last member, which deletes the team.
router.post('/leave', async (req, res) => {
  try {
    const callerId = req.user.id;
    const userRef = db.collection('users').doc(callerId);

    const result = await db.runTransaction(async (txn) => {
      const userDoc = await txn.get(userRef);
      if (!userDoc.exists) throw httpError(404, 'User not found');
      const teamId = userDoc.data().teamId;
      if (!teamId) throw httpError(400, 'Not in a team');

      const teamRef = db.collection('teams').doc(teamId);
      const teamDoc = await txn.get(teamRef);
      const now = new Date();

      if (!teamDoc.exists) {
        // Cache points at a team that no longer exists; heal the cache.
        txn.update(userRef, { teamId: null, updatedAt: now });
        return { left: teamId, teamDeleted: false };
      }

      const teamData = teamDoc.data();
      const isOwner = teamData.ownerId === callerId;
      const remaining = teamData.memberIds.filter((id) => id !== callerId);

      if (isOwner && remaining.length > 0) {
        throw httpError(400, 'Owner cannot leave while the team has other members (v1: no ownership transfer)');
      }

      if (remaining.length === 0) {
        txn.delete(teamRef);
      } else {
        txn.update(teamRef, { memberIds: remaining, updatedAt: now });
      }
      txn.update(userRef, { teamId: null, updatedAt: now });
      return { left: teamId, teamDeleted: remaining.length === 0 };
    });

    res.status(200).json({ message: 'Left the team', ...result });
  } catch (error) {
    if (sendError(res, error)) return;
    console.error('Team leave error:', error);
    res.status(500).json({ error: error.message });
  }
});

// GET /api/teams/me — my team (null when not in one).
router.get('/me', async (req, res) => {
  try {
    const callerId = req.user.id;
    const userDoc = await db.collection('users').doc(callerId).get();
    if (!userDoc.exists) return res.status(404).json({ error: 'User not found' });

    const teamId = userDoc.data().teamId;
    if (!teamId) return res.status(200).json({ team: null });

    const teamDoc = await db.collection('teams').doc(teamId).get();
    if (!teamDoc.exists) return res.status(200).json({ team: null }); // stale cache

    res.status(200).json({ team: teamDoc.data() });
  } catch (error) {
    console.error('Team me error:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
