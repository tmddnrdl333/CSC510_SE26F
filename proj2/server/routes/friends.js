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

module.exports = router;
