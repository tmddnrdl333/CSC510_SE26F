# M1: Trust Layer — Implementation Plan

Owner: Liwen. GitHub milestone: **M1: Trust layer**.

The leaderboard (M2) and team challenges (M3) rank and reward numbers that
come out of login, delivery completion, points and the donation counter. Our
Project 1a tests showed every one of those numbers can be forged today. M1
makes them trustworthy before anything ranks them.

---

## 1. Corrections to the milestone text from the 1b report

| Milestone text says | What the code and tests actually show | What M1 does instead |
|---|---|---|
| "Done when the failing uc16 and UC9 tests pass" | UC9 is **green** today: it asserts the *old* 1-point-per-dollar formula (`awardPointsForOrder('cust-1', 42.75)` → 42). Changing the formula makes it fail. | UC9 is rewritten to assert the README formula. The red 1a tests M1 owns are **UC1, UC10, UC12, UC16** (see §4). |
| "Points formula: 10%, or 15% at Local Legend restaurants" | Units were unspecified. Points redeem at 1 point = $0.01. | Follow our 1a results table (`proj1a-report/results-table.md:103`): `points = floor(bill × 0.10)`, `floor(bill × 0.15)` at a Local Legend. A $50 order earns 5 points (7 at a Local Legend). |
| (not listed) | `docs/DB_DESIGN_M2_M3.md` §6 names "authenticated, guarded status transitions" (`PUT /api/orders/:id/status`) as a **prerequisite** for M2/M3, and UC12 is red for exactly this. | Added to M1. |
| (not listed) | `/deliver` crashes with a 500 on almost every normal delivery (`User.updateDeliveryStatus` doesn't exist), and can be called twice to pay the rider twice and award points twice. | Added to M1: the "only the assigned partner" fix cannot be shown working while the success path 500s. |

## 2. Shared contract (M2 and M3 depend on this)

```js
const { requireAuth, requireRole } = require('../middleware/auth');

router.get('/mine', requireAuth, handler);                         // req.user.id is set, or 401
router.post('/x', requireAuth, requireRole(['delivery']), handler); // or 403
```

- The client sends `Authorization: Bearer <jwt>`. `POST /api/auth/login` and
  `POST /api/auth/register` return `{ user, token }`.
- `requireAuth` verifies the token and sets `req.user = { id, role, email }`.
  A missing, malformed, expired or forged token gets **401**.
- `requireRole(roles)` returns **403** when `req.user.role` is not in `roles`.
- Identity comes from the token, never the body. If a body still carries a
  `riderId`/`customerId` (older clients do), it must match `req.user.id` or
  the request gets 403.
- Tests mint tokens with `tests/helpers/authToken.js` (`bearer('rider-A', 'delivery')`).
- Secret: `JWT_SECRET` in `server/.env`. Outside `NODE_ENV=production` a
  dev-only fallback is used so tests and local runs need no setup; in
  production the server refuses to sign or verify without it.

This replaces M2's temporary `authStub` (issue #27 → #33).

## 3. Steps (one GitHub issue each)

| # | Issue | Files | Done when |
|---|---|---|---|
| 1 | Hash passwords with bcrypt | `routes/auth.js`, `models/User.js`, every `user.password !== password` check | UC1 doc-expectation green; plaintext legacy accounts still log in and are re-hashed |
| 2 | JWT login + `requireAuth`/`requireRole` middleware | `middleware/auth.js`, `routes/auth.js`, `env.example`, `tests/helpers/authToken.js` | token issued on login/register; 401/403 tests |
| 3 | Client sends the real token | `client/src/contexts/AuthContext.tsx`, `client/src/services/api.ts`, `DeliveryHome.tsx`, `routes/auth.js` (`GET /auth/me`) | no `"dummy-token"`; delivery routes get the header; rider dashboard stops posting `password: 'dummy'` |
| 4 | Only the assigned partner can pick up / deliver / reject (UC16) | `routes/delivery.js` | UC16 doc-expectation green; 403 for anyone else |
| 5 | `/deliver` 500s on every normal delivery (`updateDeliveryStatus` missing) | `models/User.js` | UC16 "UNRELATED BUG" flips to 200 |
| 6 | `/deliver` can be replayed: double pay + double points | `routes/delivery.js` | second call → 409, earnings/points credited once |
| 7 | Two riders both "win" the same job (UC15 race) | `routes/delivery.js` | exactly one 200, one 409 |
| 8 | Donation counter requires login (UC20, `donations.js:59`) | `routes/donations.js` | unauthenticated → 401 |
| 9 | Point redemption in a Firestore transaction (UC10) | `routes/points.js` | UC10 doc-expectation green |
| 10 | Points formula 10% / 15% Local Legend (UC9) | `src/points/computePoints.js`, `routes/points.js`, `routes/delivery.js` | UC9 rewritten and green |
| 11 | Guard order status transitions (UC12) | `src/orders/statusTransitions.js`, `routes/orders.js` | UC12 green; only the order's restaurant can move it, only along the kitchen workflow |
| 12 | Reject negative order totals (UC6) | `routes/orders.js` | UC6 green |
| 13 | `PUT /users/:id` lets anyone rewrite any user's role/password/earnings | `routes/users.js` | 401/403; only `profile`/`location` accepted |
| 14 | Docs: auth in API.md, how to protect a route in CONTRIBUTING.md | `docs/` | — |

Order: 1 → 2 → (3, 4–13 in any order) → 14. Steps 3–13 all depend on 2.
Steps 3 and 13 were found while doing the work, not in the 1b milestone text.

## 4. Test bookkeeping

Each 1a "STAR FINDING" test asserts the *bug*. When a fix lands, the matching
STAR test is rewritten to assert the fixed behaviour (same test name prefix,
`FIXED (#issue):`), and the `[DOC EXPECTATION]` test that was red goes green
unchanged except for the auth header it now has to send.

| Red today | Fixed by |
|---|---|
| UC1 `[DOC EXPECTATION] stored password must be hashed` | step 1 |
| UC10 `[DOC EXPECTATION] concurrent redemptions must not exceed balance` | step 9 |
| UC12 `requires a valid kitchen workflow before delivered` | step 11 |
| UC16 `[DOC EXPECTATION] only the assigned delivery partner …` | step 4 |
| UC6 `blocks a negative total` | step 12 |

Out of M1 scope (owned elsewhere): UC3, UC7, UC11, UC14 and `example.test.js`.

## 5. Known limits after M1

- Read endpoints (`GET /points`, `GET /orders/customer`, …) still take ids from the query string. They leak data but don't mint numbers, so they are left for Project 3.
- A logged-in user can still call `POST /donations/update`. The milestone asks for login only; restricting it further (or removing the endpoint, since the client never calls it) is a team decision.
- Tokens are stateless (no logout revocation); they expire after 7 days.
- `profile.isLocalLegend` (which sets the 15% rate) lives on the restaurant's own profile, and the profile edit routes still let a restaurant change it. It should become an admin-set field.
- `POST /orders` still takes `customerId` from the body. That can't mint points by itself (only a real delivery awards them), but it should move to `req.user.id`.
