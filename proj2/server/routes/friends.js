// server/routes/friends.js
// Contract: proj2/docs/plans/m2-leaderboard.md §5.
// Caller identity comes from req.user.id, set upstream by the temporary
// auth stub (server/middleware/authStub.js) mounted ahead of this router in
// server/index.js -- never from the request body/query. See the plan doc
// for why.
const express = require('express');
const Friendship = require('../models/Friendship');
const User = require('../models/User');

const router = express.Router();

// POST /api/friends/request  { toUserId }
router.post('/request', async (req, res) => {
  try {
    const callerId = req.user.id;
    const { toUserId } = req.body;

    if (!toUserId) {
      return res.status(400).json({ error: 'toUserId required' });
    }
    if (toUserId === callerId) {
      return res.status(400).json({ error: 'Cannot send a friend request to yourself' });
    }

    const toUser = await User.findById(toUserId);
    if (!toUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    const existing = await Friendship.findByPair(callerId, toUserId);
    if (existing) {
      if (existing.status === 'accepted') {
        return res.status(400).json({ error: 'Already friends' });
      }
      // status === 'pending': idempotent regardless of which side it came
      // from. Known simplification: a pending request already sent *by*
      // toUserId is not auto-accepted here -- this just returns the
      // existing pending doc unchanged.
      return res.status(200).json({ friendship: existing.toJSON() });
    }

    const friendship = await Friendship.create({
      userA: callerId,
      userB: toUserId,
      requesterId: callerId,
    });

    res.status(201).json({ friendship: friendship.toJSON() });
  } catch (error) {
    console.error('Friend request error:', error);
    res.status(500).json({ error: error.message });
  }
});

// POST /api/friends/accept  { requestId } or { otherUserId }
router.post('/accept', async (req, res) => {
  try {
    const callerId = req.user.id;
    const { requestId, otherUserId } = req.body;

    const id = requestId || (otherUserId ? Friendship.computeId(callerId, otherUserId) : null);
    if (!id) {
      return res.status(400).json({ error: 'requestId or otherUserId required' });
    }

    const friendship = await Friendship.findById(id);
    if (!friendship) {
      return res.status(404).json({ error: 'Friend request not found' });
    }
    if (friendship.status === 'accepted') {
      return res.status(400).json({ error: 'Already accepted' });
    }
    // Only the non-requester may accept. (Pre-trust-layer caveat, same as
    // the rest of this repo: callerId is whatever the x-test-user-id/future
    // JWT asserts, not independently verified against the friendship's
    // userA/userB -- see docs/plans/m2-leaderboard.md §3, invariant 5 note.)
    if (friendship.requesterId === callerId) {
      return res.status(403).json({ error: 'The requester cannot accept their own request' });
    }

    await friendship.accept();

    res.status(200).json({ friendship: friendship.toJSON() });
  } catch (error) {
    console.error('Friend accept error:', error);
    res.status(500).json({ error: error.message });
  }
});

// POST /api/friends/reject  { requestId }
router.post('/reject', async (req, res) => {
  try {
    const callerId = req.user.id;
    const { requestId } = req.body;

    if (!requestId) {
      return res.status(400).json({ error: 'requestId required' });
    }

    const friendship = await Friendship.findById(requestId);
    if (!friendship) {
      // Idempotent: already gone counts as already-handled, not an error.
      return res.status(404).json({ error: 'Friend request not found' });
    }
    // Only the recipient may reject -- same pre-trust-layer caveat as accept
    // (see docs/plans/m2-leaderboard.md §3, invariant 5 note).
    if (friendship.requesterId === callerId) {
      return res.status(403).json({ error: 'The requester cannot reject their own request' });
    }

    await friendship.delete();

    res.status(200).json({ message: 'Friend request rejected' });
  } catch (error) {
    console.error('Friend reject error:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
