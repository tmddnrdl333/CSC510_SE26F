# Project 2 Milestones

Four major milestones (spec: four or more, M0 required). Each was tracked
as a GitHub Milestone with issues; all four are merged to `main`.

## M0: Repeat-order-rate eval — DONE
Hypothesis: weekly repeat-order rate rises >= 20% with the leaderboard vs
the no-leaderboard baseline. `scripts/m0-eval.js` computes the rate per
group from order logs, prints lift and PASS/FAIL, runs in CI on every
push, and uses a seeded synthetic generator (method in the script header)
so reruns reproduce the same number. The eval can fail (low-lift /
zero-lift scenarios are tested); failures trigger a persevere / re-plan /
descope decision recorded via the issue template.

## M1: Trust layer — DONE
bcrypt password hashing + JWT sessions (`requireAuth` sets `req.user`),
delivery credit restricted to the assigned partner, donation counter
behind login, point redemption in a Firestore transaction (no
double-spend), points formula fixed to 10% (15% at Local Legends).

## M2: Social leaderboard — DONE
`friendships` collection (request/accept/list), `GET /api/leaderboard`
with `?scope=friends`, combined score (points + 2x badge tiers + 5x
donated meals), React leaderboard page with Global/Friends toggle.

## M3: Challenges engine + friend team challenges — DONE
Teams of accepted friends (max 10), weekly challenges defined as data
(`src/challenges/challengeDefinitions.js` — a new challenge type is a new
definition object, not code), progress derived live from delivered
orders, rewards granted exactly once via a deterministic-id transaction
(meals and badges), React team/challenges page with progress bars.
Tutorial: `docs/CONTRIBUTING.md` ("Adding a Challenge Type").

## Shared contracts
- Identity: `requireAuth` (server/middleware/auth.js) sets
  `req.user = { id, role, email }` or 401s; `requireRole([...])` 403s.
  Tests mint real JWTs via `tests/helpers/authToken.js`.
- Derive, don't double-book: progress/scores are computed from `orders`
  at read time; the only stored reward state is the `challengeProgress`
  ledger (see `docs/DB_DESIGN_M2_M3.md`).
