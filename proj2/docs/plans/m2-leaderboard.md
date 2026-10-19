# M2: Social Leaderboard — Implementation Plan

Status: **planning, no code written yet.** Companion to
[`docs/DB_DESIGN_M2_M3.md`](../DB_DESIGN_M2_M3.md) (schema, approved) and
[`docs/DB_DIAGRAM_M2_M3.png`](../DB_DIAGRAM_M2_M3.png) (rendered ERD) — this
doc is the M2-scoped build plan that follows that design: where the new code
goes, how it composes with what already exists, the score formula, and the
test plan. It does not restate the schema in full; see the design doc for
field-by-field detail and the invariants every implementation must respect.

Tracks issue #26 (M2 planning). Downstream work (friendships, leaderboard
route, React page) will be separate issues/tasks per the one-task-at-a-time
rule for this session.

---

## 1. Where things live today

### Server

| Layer | Path | Notes |
|---|---|---|
| Routes | `server/routes/*.js` | One file per domain, each exports an Express `Router`, mounted in `server/index.js:34-43` under `/api/<domain>`. No *existing* route uses auth middleware; M2's new routes are the first to read the caller from `req.user.id` via a temporary stub (see §5). |
| Models | `server/models/{User,Points,Restaurant}.js` | Thin wrappers around `db.collection(...)` calls — static finders (`findById`, `findByEmail`) plus instance mutators (`update`, `addPoints`). `Restaurant.js` is dead — the design doc flags it as a half-live parallel collection; don't build on it. |
| Services | `server/services/{badgeService,buildCustomerStats}.js` | `buildCustomerStats.js` scans a customer's `orders` and derives ~18 raw metrics (streaks, counts, totals). `badgeService.js` feeds those metrics through `src/badges/evaluateBadges.js` and snapshots the result onto the `users` doc (`badges`, `badgesStats`, `badgesLastComputedAt` fields, `server/services/badgeService.js:17-25`). This "derive on read + snapshot cache" pattern is the repo's established one and is the explicit template for the leaderboard cache (design doc §5, "Reusable existing code"). |
| Shared (server + client) | `src/badges/{badgeDefinitions,evaluateBadges}.js` | Badge rules live here so both sides can read the same definitions; `server/services/badgeService.js:3-4` imports them directly. |
| Config | `server/config/firebase.js` | Exports the real `db` handle (Firestore or emulator, selected by `FIRESTORE_EMULATOR_HOST` in `server/.env`). |

### Client

| Layer | Path | Notes |
|---|---|---|
| Pages | `client/src/pages/{CustomerDashboard,RestaurantDashboard,DeliveryDashboard}.tsx` | One dashboard per role; each renders a nested `<Routes>` for that role's sub-pages (`CustomerDashboard.tsx` → `/customer/*`). Top-level routing and role gating is in `client/src/App.tsx` (`<ProtectedRoute allowedRoles={['customer']}>` wrapping `/customer/*`). |
| Components | `client/src/components/customer/*.tsx` | `CustomerBadges.tsx` is the closest existing analog to what a leaderboard row needs: it fetches via `useQuery` (`@tanstack/react-query`), has a typed response interface, and renders tiered badge icons (🥉🥈🥇💎). `Cart.tsx`, `Orders.tsx`, `Profile.tsx`, `RestaurantList.tsx` are siblings mounted the same way. |
| API client | `client/src/services/api.ts` | Thin axios wrapper every component calls through (`api.get('/points?customerId=...')` style — see `CustomerDashboard.tsx:19-24`). |
| State | `client/src/contexts/{AuthContext,CartContext}.tsx` | `useAuth()` is how every page gets the logged-in user's id today (client-asserted, not JWT-verified). M2's server routes do not take this id from the client at all — see §5. |

### Tests

`proj2/tests/*.test.js`, run via `jest --coverage` from `proj2/` (`package.json` `"test"` script). Each file builds a minimal Express app from just the router(s) it needs (`tests/helpers/buildApp.js`) against an in-memory Firestore double (`tests/helpers/fakeFirestore.js`), so no Docker/emulator is needed to run them.

---

## 2. How points, badges, and donations are stored per user today

This is the starting state M2's leaderboard score reads from.

- **Points** — a *separate* `points` collection, one doc per user (`userId` field, not the doc id — looked up via `where('userId','==',...).limit(1)`, `server/models/Points.js:17-27`). Holds `totalPoints`, `availablePoints`, `usedPoints`, and a `transactions[]` log capped at 50 entries on the earn path. `Points.getOrCreate(userId, userRole)` lazily creates an empty record on first touch — no record exists until a user's first order completes.
- **Badges** — *not* a collection. They're computed from the user's `orders` by `buildCustomerStats.js`, evaluated against `src/badges/badgeDefinitions.js` (18 badges, 4 tiers each: bronze/silver/gold/diamond), and the *result* is snapshotted onto the `users` doc itself: `users.badges` (map keyed by badge id → `{currentTier, progress, nextTierThreshold, lastUpdatedAt}`), `users.badgesStats`, `users.badgesLastComputedAt` (`server/services/badgeService.js:6-26`). The snapshot is only refreshed when the badges route actually runs for that user (`getCustomerBadges`, same file, lines 44-69) — it is best-effort fresh, not live.
- **Donations** — **no per-user data at all.** There is exactly one global counter, `settings/donations` (`counter`, `lastUpdated`), incremented by an unauthenticated `POST /api/donations/update` (`server/routes/donations.js:43-74`). Per-user donation *impact* has to be derived: `floor(user's delivered-order count / 10)`, the same Meal-for-a-Meal rule the global stat uses (`donations.js:15`). The global counter is forgeable (Project 1a finding) and must not be read as truth for a leaderboard score — see §5.

Net effect for M2: a leaderboard score per user requires three independent reads/derivations (points doc, badge snapshot, delivered-order count) — there's no single existing source that already has "this user's total standing."

---

## 3. The M2/M3 DB diagram and how this plan follows it

A teammate already produced and committed the design this plan builds against:

- [`docs/DB_DESIGN_M2_M3.md`](../DB_DESIGN_M2_M3.md) — schema tables, a `mermaid` ERD, 9 numbered invariants, and a file-by-file implementation map (§5 of that doc). Status line: **"design approved, not yet implemented."**
- [`docs/DB_DIAGRAM_M2_M3.png`](../DB_DIAGRAM_M2_M3.png) — the same ERD rendered as an image (committed separately, `20106c1`).

This plan follows that design closely. It adopts, unchanged:

- The `friendships` collection shape and deterministic-id scheme (§4 below).
- The three terms of the score formula — points, badge tiers, donated meals (§6 below). This plan proposes *weighting* those three terms, which the design doc's invariant 3 does not specify; see §6 for the weighted formula and why.
- The file map in design doc §5 ("Friendships (M2)" / "Leaderboard API (M2)" blocks) as the concrete list of files this milestone will add.
- Invariant 8 (serve the global board from a cached top-K snapshot, not a live O(N) scan) and invariant 9 (treat a missing/stale badge snapshot as 0 tiers, not a recompute-on-request) as binding constraints on the leaderboard service, not just suggestions.
- Invariant 6 (derived scores are only as trustworthy as the unguarded order-status transitions feeding them — M1 is a prerequisite for calling this "verified").
- Invariant 5's broader point ("no new permanent auth scheme") still holds, but this plan makes it concrete using the shared contract `docs/MILESTONES.md:12-14` already defines: M2's routes read the caller from `req.user.id`, populated by a temporary stub middleware until M1's real JWT-verified auth merges — not a client-asserted id in the request body/query the way the rest of the repo (pre-M1) does it. See §5.

One thing has changed since the design doc was written and should be read as updated: **invariant 4 says the Firestore test double has no `runTransaction`.** That gap has since been closed — `tests/helpers/fakeFirestore.js:228-318` now implements `db.runTransaction()` with atomic commit, serialized isolation, and a reads-before-writes guard (landed in `3c1f9c0`, "add runTransaction support to fakeFirestore"). M2 itself doesn't need a transaction (friend accept is a single idempotent doc write; the leaderboard is read-only), but this matters directly for M1's point-redemption fix and M3's payout, both of which the design doc flags as needing it.

---

## 4. Friendships schema and `getFriends(userId)`

Per design doc §2.1, reproduced here as the contract M2's routes implement against:

- **Collection**: `friendships`, one document per pair.
- **Document id**: deterministic — sort the two `users.id` values lexicographically and join with `_` (`${userA}_${userB}`). This makes a duplicate or reverse-direction request collide with the existing doc by construction (idempotent), and existence checks are a single `.doc(id).get()` instead of a query.
- **Fields**: `id`, `userA` (lexicographically smaller id), `userB` (larger id), `requesterId` (who sent it — only the *other* side may accept), `status` (`'pending' | 'accepted'` only — no `'rejected'`; rejection is deleting the doc, and re-requesting is allowed), `members` (`[userA, userB]`, unused today, reserved for a future `array-contains` query), `createdAt`, `updatedAt`, `acceptedAt` (set on accept).
- **Listing a user's friendships**: two equality queries merged in code — `where('userA','==',uid)` plus `where('userB','==',uid)` — **not** `array-contains` on `members`. `tests/helpers/fakeFirestore.js:36-55` only implements `==, !=, in, <, <=, >, >=` and throws on anything else, so `array-contains` would fail against the test harness even though the field exists for a future real-Firestore query.

**`getFriends(userId)`**: a helper (location: `server/models/Friendship.js`, per the implementation map) that runs the two-query merge above, filters to `status === 'accepted'`, and returns the array of the *other* party's `users.id` for each (i.e., for each matching doc, `doc.userA === userId ? doc.userB : doc.userA`). This is the function both the leaderboard's `?scope=friends` and (per the M2 shared-contracts note in `docs/MILESTONES.md:15-18`) M3's team-join authorization check are built on — M3 currently uses a stub for it until M2 merges.

---

## 5. API surface

### Friend request routes (new `server/routes/friends.js`, mounted at `/api/friends`)

Following the existing route style (plain Express handlers, JSON error bodies, `try/catch` → `500` on unexpected errors, matching every other router in `server/routes/`) with one deliberate difference from the rest of the repo: **the caller is never taken from the request body or query.** Every M2 route reads `req.user.id`, populated by a temporary stub auth middleware (mounted ahead of `server/routes/friends.js` and `server/routes/leaderboard.js`) until M1's real JWT-verified auth merges — per the shared contract in `docs/MILESTONES.md:12-14`. In tests, the stub reads an `x-test-user-id` header (set via supertest's `.set('x-test-user-id', <id>)`) and assigns it to `req.user.id`. No caller id appears in any request body or query param below — only the *other* party's id, where one is needed.

| Method & path | Body/query | Behavior | Failure cases |
|---|---|---|---|
| `POST /api/friends/request` | `{ toUserId }` (caller = `req.user.id`) | Computes the deterministic id from `req.user.id` + `toUserId`, creates the doc with `status: 'pending'`, `requesterId: req.user.id` if it doesn't exist yet. | No/invalid `req.user.id` (stub unauthenticated) → 401. `req.user.id === toUserId` → 400. Missing `toUserId` → 400. Doc already exists with `status: 'accepted'` → 400 ("already friends"), idempotent-success (not an error) if it already exists `pending` from the same requester. `toUserId` doesn't resolve to a real user → 404. |
| `POST /api/friends/accept` | `{ requestId }` (or `{ otherUserId }` — resolve to the same deterministic id) (caller = `req.user.id`) | Loads the doc by deterministic id, verifies `status === 'pending'` and `req.user.id !== requesterId` (only the non-requester may accept), sets `status: 'accepted'`, `acceptedAt`. | No/invalid `req.user.id` → 401. Doc not found → 404. Already accepted → 400. Caller *is* the requester trying to accept their own request → 403. |
| `GET /api/friends/list` | none (caller = `req.user.id`) | Runs the two-query merge for `req.user.id`, returns accepted friendships (hydrated with the friend's `profile.name` for display — one extra `users` read per friend, acceptable at course scale per design doc invariant 8's "course-scale seed data" framing). | No/invalid `req.user.id` → 401. |
| `POST /api/friends/reject` | `{ requestId }` (caller = `req.user.id`) | Deletes the pending doc if `req.user.id` is the recipient (not the requester). | No/invalid `req.user.id` → 401. Doc not found → 404 (treat as already-handled, not an error, to stay idempotent). Caller is the requester → 403. |

Scope note: `docs/MILESTONES.md:50` specifies "send, accept, list" for M2; `reject` ships in the same PR as `request`/`accept`/`list` (confirmed) — the schema already implies it ("Rejection = delete the document", design doc §2.1), and shipping it alongside `accept` avoids leaving the feature half-usable (a pending request with no way to decline it).

### `GET /api/leaderboard` (new `server/routes/leaderboard.js`, mounted at `/api/leaderboard`)

| Param | Behavior |
|---|---|
| *(none)* | Global board: top-K users by combined score (§6), served from a periodically refreshed snapshot per design doc invariant 8 — **not** a live per-request scan over all `users`. Exact refresh mechanism (cron-style job vs. refresh-on-write) is still an open question — see §8. |
| `?scope=friends` | Caller = `req.user.id` (§5) — no `userId` param. Computes `getFriends(req.user.id)` (§4), then scores that set plus the caller themself in real time — bounded by friend count, no caching needed (design doc invariant 8 explicitly allows this path to be naive). |
| `?limit=` | Optional, caps rows returned (both scopes). **Default: 20.** |

Response shape (proposed, not yet fixed): `{ scope, entries: [{ userId, name, score, points, badgeTierCount, donatedMeals, rank }] }`.

Failure cases: no/invalid `req.user.id` (stub unauthenticated, e.g. missing `x-test-user-id` header in tests) → 401. Empty friend list on `?scope=friends` → 200 with a 1-entry board (just the caller), not an error.

### Client

New `client/src/components/customer/Leaderboard.tsx`, mounted as a sub-route of `CustomerDashboard.tsx` (pattern: `<Route path="/leaderboard" element={<Leaderboard />} />`, same as the existing `/restaurants`, `/orders`, etc. siblings). Reuses `CustomerBadges.tsx`'s `useQuery` + typed-interface pattern and its tier-emoji map for any badge-count display. A Global/Friends toggle drives which query param is sent: `?scope=friends` vs. none — no `userId` param, since the caller comes from `req.user.id` (§5 above). Until M1 merges, `client/src/services/api.ts` attaches an `x-test-user-id` header (sourced from `useAuth()`) to every request so the server's stub middleware can identify the caller; M1 will replace this header with the real JWT.

---

## 6. Proposed combined score formula

Design doc invariant 3 proposes the three terms below **unweighted** (a plain sum). This plan proposes weighting two of them instead — reasoning below. **Status: proposed, pending team agreement** — not a finalized decision; record whatever the team settles on in the M2 GitHub issue before implementation, per `docs/MILESTONES.md:56`.

**Update (issue #30, following #51):** M1 settled the points formula as `floor(10% of bill)` (`floor(15%)` at Local Legend restaurants), not the flat 1-point-per-dollar rate this section originally reasoned its weights from — about 10x smaller per order than this section assumed. The weights below are retuned accordingly: badge tiers drop from `10x` to `2x` (points no longer need as large a multiplier applied to badges to stay comparable in magnitude); donated meals stay at `5x` (that term is unaffected by the points change). See PR #51 for the points-formula change itself.

```
score(user) = totalPoints + BADGE_TIER_WEIGHT * badgeTiers + DONATED_MEAL_WEIGHT * donatedMeals
            = totalPoints + 2 * badgeTiers + 5 * donatedMeals
```

where `badgeTiers` = number of badge tiers earned (from the `users.badges` snapshot) and `donatedMeals` = `floor(user's delivered-order count / 10)`. The weights are named constants in the implementation (`server/services/leaderboardService.js`) specifically so they're easy to retune again.

**Why weights at all**: without them, points still drown out the other two terms even at the smaller post-M1 scale. A moderately active customer accumulates points in the tens (a handful of $20–30 orders at 10–15% each), while badge tiers cap at 72 (18 badges × 4 tiers) and donated meals are typically single digits at course-scale seed data (1 per 10 delivered orders). A plain 1:1:1 sum would still make badges and donation impact hard to see next to points. `2x` on badge tiers and `5x` on donated meals bring all three terms into comparable magnitude at this scale. The specific multipliers are a starting proposal to make the other two terms *visible*, not the output of a formal analysis — revisit once real usage data exists (e.g. via the M0 eval), and expect to retune again if the points formula changes further.

Rationale for each term's definition (independent of the weights above):

- **`points.totalPoints`**, not `availablePoints` — total reflects lifetime earning/engagement; available would penalize a user for *redeeming* points, which is a bad leaderboard incentive (spend your points, drop your rank).
- **Badge tier count**, not raw badge progress values — tiers are already normalized (0–4 per badge) and comparable across the very different metrics badges track (streaks vs. spend vs. review count). Read from the `users.badges` snapshot as-is; per design doc invariant 9, a missing/stale snapshot counts as 0 tiers rather than triggering a synchronous recompute on the leaderboard request path.
- **`floor(deliveredOrderCount / 10)`**, computed fresh from `orders` — explicitly *not* read from `settings/donations.counter`, because that counter is globally shared (not per-user) and, per Project 1a's finding, incrementable by anyone through an unauthenticated endpoint. Using the derived per-user count keeps the leaderboard un-forgeable by that route; see design doc invariant 1 ("derive, don't double-book") and invariant 6 (trust-layer caveat below).

**Known risk, only partly mitigated by the weights above**: `totalPoints` is itself spend-derived (`floor(10–15%)` of order amount under M1), so a heavy spender's points term alone can still outweigh a lighter spender's weighted badge/donation terms — the weights make badges and donations *visible*, not necessarily *dominant* ("disposable-income leaderboard" risk, design doc §4 closing note). Full normalization/weighting is still a product decision for the M0 eval to settle; the `1 / 2x / 5x` weighting here is a proposal to bring to the team, not a resolved answer.

**Trust-layer dependency (design doc invariant 6)**: the delivered-order term is only as trustworthy as order-status transitions, and today `PUT /api/orders/:id/status` accepts any transition from any caller with no guard (Project 1a finding, `server/routes/orders.js:184`). Per `docs/MILESTONES.md:8` ("Order: M1, then M2"), M1 lands first — this plan assumes the leaderboard is built after M1's guarded transitions merge, or explicitly ships with a documented caveat that scores are unverified until then.

---

## 7. Test plan

Following the repo's existing convention: one `tests/uc-*.test.js` file per feature slice, built on `tests/helpers/{buildApp,fakeFirestore}.js`, no real Firestore/Docker needed.

### `tests/uc-friends.test.js`

All route-level tests drive the caller identity via supertest's `.set('x-test-user-id', <id>)`, exercising the real stub middleware — never a body/query field.

**Happy paths**
1. `POST /request` (caller via `x-test-user-id`) targeting a fresh `toUserId` creates a `pending` doc with the deterministic id and `requesterId` equal to the caller's id.
2. `POST /accept`, called with `x-test-user-id` set to the non-requester, on a `pending` doc flips it to `accepted` and sets `acceptedAt`.
3. `GET /list`, called with `x-test-user-id` set to a user with 2 accepted + 1 pending friendship, returns exactly the 2 accepted, each resolved to the other party's id (exercises the `userA`/`userB` merge in both directions — one friendship where the user is `userA`, one where they're `userB`).
4. `getFriends(userId)` unit-level: same merge, asserted directly against the model function (not a route call, so no header involved).

**Failure / edge cases**
5. Re-requesting an existing `pending` friendship (either direction, same caller) is idempotent — no duplicate doc, no error.
6. Requesting a friendship that's already `accepted` → 400.
7. Caller (`x-test-user-id`) equal to `toUserId` (self-friend-request) → 400.
8. Accepting a nonexistent `requestId` → 404.
9. The requester's own id set as `x-test-user-id` attempting to accept their own request → 403.
10. Accepting an already-`accepted` doc → 400 (not idempotent-success, since accept is a one-way transition).
11. Any route in this file called with no `x-test-user-id` header (stub unauthenticated) → 401.
12. A user with zero friendships → `GET /list` returns an empty array with 200, not an error.
13. `POST /reject` by the recipient (`x-test-user-id` = recipient) deletes the `pending` doc; a subsequent `GET /list` or re-request confirms it's gone and re-requestable.
14. `POST /reject` attempted with `x-test-user-id` = the requester (not the recipient) → 403.

### `tests/uc-leaderboard.test.js`

**Happy paths**
1. Global board with 3 seeded users of differing points/badges/delivered-counts returns them ranked descending by the combined (weighted) score, with per-term raw values visible in the response for debugging/verification.
2. `?scope=friends`, called with `x-test-user-id` set to a user with 2 accepted friends, returns exactly those 3 (self + 2 friends), ranked, and excludes a 4th seeded user who is not a friend.
3. `?scope=friends` includes the caller even if they have the lowest score (board isn't friends-only-excluding-self).

**Failure / edge cases**
4. `?scope=friends` called with no `x-test-user-id` header (stub unauthenticated) → 401.
5. `?scope=friends` for a caller with zero accepted friends → 200, single-entry board (self only), not an error.
6. `?scope=friends` called with `x-test-user-id` set to an id that doesn't resolve to a real user → 404.
7. A user with no `points` doc yet (never ordered) scores 0 on that term, not an error/crash — exercises `Points.getOrCreate` semantics feeding into the score.
8. A user with no `users.badges` snapshot yet (badges route never run for them) scores 0 badge tiers, per design doc invariant 9 — not a synchronous recompute, and not an error.
9. A user with 0 delivered orders scores 0 on the donation term (not `null`/`NaN` — guards `floor(0/10)`).
10. Score formula unit test (in `server/services/leaderboardService.js`'s own test, per design doc §5's "write and unit-test it before wiring any route") — pure function, fixed inputs → fixed score, independent of any Firestore double.
11. Global board respects `?limit=` and defaults sanely when omitted.

**Explicitly out of scope for this test file** (covered by other milestones' tests, noted so nobody expects double coverage here): point-redemption double-spend (M1), unguarded order-status transitions (M1), donation-counter tampering (M1, `routes/donations.js`).

---

## 8. Open questions for the M2 GitHub issue (not resolved by this plan)

- Global-board refresh mechanism: scheduled recompute job vs. refresh-triggered-on-write (e.g., recompute a user's score contribution whenever their points/badges/delivered-count changes) vs. refresh-on-read-if-stale with a TTL. Any of these satisfy invariant 8; this is still pending a team decision — this plan doesn't pick one.
