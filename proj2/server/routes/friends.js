// server/routes/friends.js
// Contract: proj2/docs/plans/m2-leaderboard.md §5.
// Caller identity comes from req.user.id, set upstream by M1's requireAuth
// middleware (server/middleware/auth.js)
// server/index.js -- never from the request body/query. See the plan doc
// for why.
const express = require('express');
const Friendship = require('../models/Friendship');
const User = require('../models/User');

const router = express.Router();

/**
 * POST /api/friends/request
 * Sends a friend request from the caller (`req.user.id`) to `toUserId`.
 *
 * @body {string} toUserId
 * @returns {201} `{ friendship }` - newly created, `pending`.
 * @returns {200} `{ friendship }` - idempotent: a `pending` request between
 *   this pair already existed (either direction).
 * @returns {400} Missing `toUserId`; `toUserId === req.user.id` (self-request);
 *   or the pair is already `accepted`.
 * @returns {404} `toUserId` does not resolve to a real user.
 * @returns {401} No/invalid `req.user.id` (auth stub).
 */
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

/**
 * POST /api/friends/accept
 * Accepts a pending friend request. Only the non-requester (the recipient)
 * may accept, and only if the caller is actually a party to the friendship.
 *
 * @body {string} [requestId] - The friendship doc id directly.
 * @body {string} [otherUserId] - Resolved to the same id via `Friendship.computeId`.
 *   Exactly one of `requestId`/`otherUserId` must be given.
 * @returns {200} `{ friendship }` - now `accepted`.
 * @returns {400} Neither `requestId` nor `otherUserId` given; or already `accepted`.
 * @returns {403} Caller is not a party to this friendship, or is the requester.
 * @returns {404} No friendship doc at that id.
 * @returns {401} No/invalid `req.user.id` (auth stub).
 */
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
    if (callerId !== friendship.userA && callerId !== friendship.userB) {
      return res.status(403).json({ error: 'Not a party to this friendship' });
    }
    if (friendship.status === 'accepted') {
      return res.status(400).json({ error: 'Already accepted' });
    }
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

/**
 * POST /api/friends/reject
 * Deletes a pending friend request. Only the recipient may reject (not the
 * requester, who would cancel it a different way if that's ever added).
 *
 * @body {string} requestId - The friendship doc id.
 * @returns {200} `{ message }` - deleted.
 * @returns {400} Missing `requestId`, or the friendship isn't `pending`.
 * @returns {403} Caller is not a party to this friendship, or is the requester.
 * @returns {404} No friendship doc at that id (idempotent: treated as
 *   already-handled, not an error).
 * @returns {401} No/invalid `req.user.id` (auth stub).
 */
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
    if (callerId !== friendship.userA && callerId !== friendship.userB) {
      return res.status(403).json({ error: 'Not a party to this friendship' });
    }
    if (friendship.status !== 'pending') {
      return res.status(400).json({ error: 'Only a pending request can be rejected' });
    }
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

/**
 * GET /api/friends/list
 * Lists the caller's accepted friendships, hydrated with each friend's
 * display name (one extra `users` read per friend).
 *
 * @returns {200} `{ friends: [{ userId, name, friendshipId, acceptedAt }] }`
 *   - empty array if the caller has no accepted friendships.
 * @returns {401} No/invalid `req.user.id` (auth stub).
 */
router.get('/list', async (req, res) => {
  try {
    const callerId = req.user.id;

    const friendships = await Friendship.listForUser(callerId);
    const accepted = friendships.filter((f) => f.status === 'accepted');

    const friends = await Promise.all(accepted.map(async (f) => {
      const otherId = f.userA === callerId ? f.userB : f.userA;
      const otherUser = await User.findById(otherId);
      return {
        userId: otherId,
        name: otherUser ? otherUser.profile?.name : null,
        friendshipId: f.id,
        acceptedAt: f.acceptedAt,
      };
    }));

    res.status(200).json({ friends });
  } catch (error) {
    console.error('Friend list error:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
