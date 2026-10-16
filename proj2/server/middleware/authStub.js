// TEMPORARY — M2/M3 identity stub. DO NOT use as real auth.
//
// Sets req.user.id from the x-test-user-id header, with no verification of
// any kind (no password, no token, no signature). This exists only so M2
// (friends/leaderboard) and M3 (teams/challenges) can read a caller id the
// same way every route will once real auth lands, without inventing a
// throwaway scheme of their own — per the shared contract in
// docs/MILESTONES.md ("Until M1 merges, M2 and M3 use a temporary stub that
// sets req.user.id").
//
// Replace this entire file with M1's JWT-verified middleware when it merges,
// and remove it from every router that mounts it today
// (server/routes/friends.js, server/routes/leaderboard.js).

const authStub = (req, res, next) => {
  const userId = req.header('x-test-user-id');

  if (!userId) {
    return res.status(401).json({ error: 'x-test-user-id header required (temporary auth stub).' });
  }

  req.user = { id: userId };
  next();
};

module.exports = { authStub };
