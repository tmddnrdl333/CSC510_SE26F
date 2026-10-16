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
| Routes | `server/routes/*.js` | One file per domain, each exports an Express `Router`, mounted in `server/index.js:34-43` under `/api/<domain>`. No route currently uses auth middleware (see §6). |
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
| State | `client/src/contexts/{AuthContext,CartContext}.tsx` | `useAuth()` is how every page gets the logged-in user's id today (client-asserted, not JWT-verified — see §6). |

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

This plan does not deviate from that design. Specifically it adopts, unchanged:

- The `friendships` collection shape and deterministic-id scheme (§4 below).
- Score formula = invariant 3 verbatim (§5 below).
- The file map in design doc §5 ("Friendships (M2)" / "Leaderboard API (M2)" blocks) as the concrete list of files this milestone will add.
- Invariant 8 (serve the global board from a cached top-K snapshot, not a live O(N) scan) and invariant 9 (treat a missing/stale badge snapshot as 0 tiers, not a recompute-on-request) as binding constraints on the leaderboard service, not just suggestions.
- Invariant 5 (no new auth scheme — friend/leaderboard routes take the caller id the same client-asserted way the rest of the repo does, until the trust-layer milestone lands) and invariant 6 (derived scores are only as trustworthy as the unguarded order-status transitions feeding them — M1 is a prerequisite for calling this "verified").

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

Following the existing route style (plain Express handlers, client-asserted caller id in the body/query — see §6 — JSON error bodies, `try/catch` → `500` on unexpected errors, matching every other router in `server/routes/`):

| Method & path | Body/query | Behavior | Failure cases |
|---|---|---|---|
| `POST /api/friends/request` | `{ fromUserId, toUserId }` | Computes the deterministic id, creates the doc with `status: 'pending'`, `requesterId: fromUserId` if it doesn't exist yet. | `fromUserId === toUserId` → 400. Missing either id → 400. Doc already exists with `status: 'accepted'` → 400 ("already friends"), idempotent-success (not an error) if it already exists `pending` from the same requester. `toUserId` doesn't resolve to a real user → 404. |
| `POST /api/friends/accept` | `{ userId, requestId }` (or `{ userId, otherUserId }` — resolve to the same deterministic id) | Loads the doc by deterministic id, verifies `status === 'pending'` and `userId !== requesterId` (only the non-requester may accept), sets `status: 'accepted'`, `acceptedAt`. | Doc not found → 404. Already accepted → 400. Caller *is* the requester trying to accept their own request → 403. |
| `GET /api/friends/list?userId=` | query | Runs the two-query merge, returns accepted friendships (hydrated with the friend's `profile.name` for display — one extra `users` read per friend, acceptable at course scale per design doc invariant 8's "course-scale seed data" framing). | Missing `userId` → 400. |
| `POST /api/friends/reject` *(reasonable to fold into this task per "send/accept/list" scope, since rejection = delete)* | `{ userId, requestId }` | Deletes the pending doc if the caller is the recipient. | Doc not found → 404 (treat as already-handled, not an error, to stay idempotent). Caller is the requester → 403. |

Scope note: `docs/MILESTONES.md:50` specifies "send, accept, list" for M2; reject/cancel is implied by the schema ("Rejection = delete the document", design doc §2.1) and is small enough to include alongside accept rather than leaving the feature half-usable, but is flagged here for confirmation before implementation starts.

### `GET /api/leaderboard` (new `server/routes/leaderboard.js`, mounted at `/api/leaderboard`)

| Param | Behavior |
|---|---|
| *(none)* | Global board: top-K users by combined score (§6), served from a periodically refreshed snapshot per design doc invariant 8 — **not** a live per-request scan over all `users`. Exact refresh mechanism (cron-style job vs. refresh-on-write) is an open implementation question, not resolved by this plan; candidates are noted in §8. |
| `?scope=friends` | `?userId=` required. Computes `getFriends(userId)` (§4), then scores that set plus the caller themself in real time — bounded by friend count, no caching needed (design doc invariant 8 explicitly allows this path to be naive). |
| `?limit=` | Optional, caps rows returned (both scopes); default TBD, suggest 20. |

Response shape (proposed, not yet fixed): `{ scope, entries: [{ userId, name, score, points, badgeTierCount, donatedMeals, rank }] }`.

Failure cases: `scope=friends` with no `userId` → 400. `userId` that doesn't resolve to a real user → 404. Empty friend list → 200 with a 1-entry board (just the caller), not an error.

### Client

New `client/src/components/customer/Leaderboard.tsx`, mounted as a sub-route of `CustomerDashboard.tsx` (pattern: `<Route path="/leaderboard" element={<Leaderboard />} />`, same as the existing `/restaurants`, `/orders`, etc. siblings). Reuses `CustomerBadges.tsx`'s `useQuery` + typed-interface pattern and its tier-emoji map for any badge-count display. A Global/Friends toggle drives which query param set is sent (`?scope=friends&userId=...` vs. none).

---

## 6. Proposed combined score formula

Per design doc invariant 3, which this plan adopts as the starting formula:

```
score(user) = points.totalPoints
            + (number of badge tiers earned, from users.badges snapshot)
            + floor(user's delivered-order count / 10)   // donation impact
```

Rationale for each term, and why it's computed this way rather than some alternative:

- **`points.totalPoints`**, not `availablePoints` — total reflects lifetime earning/engagement; available would penalize a user for *redeeming* points, which is a bad leaderboard incentive (spend your points, drop your rank).
- **Badge tier count**, not raw badge progress values — tiers are already normalized (0–4 per badge, 18 badges → 0–72 range) and comparable across the very different metrics badges track (streaks vs. spend vs. review count). Read from the `users.badges` snapshot as-is; per design doc invariant 9, a missing/stale snapshot counts as 0 tiers rather than triggering a synchronous recompute on the leaderboard request path.
- **`floor(deliveredOrderCount / 10)`**, computed fresh from `orders` — explicitly *not* read from `settings/donations.counter`, because that counter is globally shared (not per-user) and, per Project 1a's finding, incrementable by anyone through an unauthenticated endpoint. Using the derived per-user count keeps the leaderboard un-forgeable by that route; see design doc invariant 1 ("derive, don't double-book") and invariant 6 (trust-layer caveat below).

**Known risk, flagged rather than resolved here**: this formula is dollar-dominated — both `totalPoints` (currently 1/dollar, moving to 10%/15% of order amount under M1) and several badges (`lifetime_spend`, `high_value_orders`) track spend directly, so the board skews toward whoever spends the most ("disposable-income leaderboard" — design doc §4 closing note). Normalization/weighting across the three terms is called out there as a product decision for the M0 eval to settle, not a schema question — this plan does not propose weights beyond the 1:1:1 term formula above, and treats that as explicitly provisional pending M0 data. `docs/MILESTONES.md:56` ("Score formula: to be decided by the team and recorded in the M2 issue") should be closed by recording this formula (or a revision) in the M2 GitHub issue before implementation.

**Trust-layer dependency (design doc invariant 6)**: the delivered-order term is only as trustworthy as order-status transitions, and today `PUT /api/orders/:id/status` accepts any transition from any caller with no guard (Project 1a finding, `server/routes/orders.js:184`). Per `docs/MILESTONES.md:8` ("Order: M1, then M2"), M1 lands first — this plan assumes the leaderboard is built after M1's guarded transitions merge, or explicitly ships with a documented caveat that scores are unverified until then.

---

## 7. Test plan

Following the repo's existing convention: one `tests/uc-*.test.js` file per feature slice, built on `tests/helpers/{buildApp,fakeFirestore}.js`, no real Firestore/Docker needed.

### `tests/uc-friends.test.js`

**Happy paths**
1. `POST /request` from a fresh pair creates a `pending` doc with the deterministic id and correct `requesterId`.
2. `POST /accept` by the non-requester on a `pending` doc flips it to `accepted` and sets `acceptedAt`.
3. `GET /list?userId=` for a user with 2 accepted + 1 pending friendship returns exactly the 2 accepted, each resolved to the other party's id (exercises the `userA`/`userB` merge in both directions — one friendship where the user is `userA`, one where they're `userB`).
4. `getFriends(userId)` unit-level: same merge, asserted directly against the model function, not just through the route.

**Failure / edge cases**
5. Re-requesting an existing `pending` friendship (either direction) is idempotent — no duplicate doc, no error.
6. Requesting a friendship that's already `accepted` → 400.
7. `fromUserId === toUserId` (self-friend-request) → 400.
8. Accepting a nonexistent request id → 404.
9. The requester attempting to accept their own request → 403.
10. Accepting an already-`accepted` doc → 400 (not idempotent-success, since accept is a one-way transition).
11. `GET /list` with no `userId` → 400.
12. A user with zero friendships → `GET /list` returns an empty array with 200, not an error.
13. Reject on a `pending` request by the recipient deletes the doc; a subsequent `GET /list` or re-request confirms it's gone and re-requestable.
14. Reject attempted by the requester (not the recipient) → 403.

### `tests/uc-leaderboard.test.js`

**Happy paths**
1. Global board with 3 seeded users of differing points/badges/delivered-counts returns them ranked descending by the combined score, with per-term values visible in the response for debugging/verification.
2. `?scope=friends` for a user with 2 accepted friends returns exactly those 3 (self + 2 friends), ranked, and excludes a 4th seeded user who is not a friend.
3. `?scope=friends` includes the caller even if they have the lowest score (board isn't friends-only-excluding-self).

**Failure / edge cases**
4. `?scope=friends` with no `userId` → 400.
5. `?scope=friends` for a user with zero accepted friends → 200, single-entry board (self only), not an error.
6. `?scope=friends&userId=` for a nonexistent user → 404.
7. A user with no `points` doc yet (never ordered) scores 0 on that term, not an error/crash — exercises `Points.getOrCreate` semantics feeding into the score.
8. A user with no `users.badges` snapshot yet (badges route never run for them) scores 0 badge tiers, per design doc invariant 9 — not a synchronous recompute, and not an error.
9. A user with 0 delivered orders scores 0 on the donation term (not `null`/`NaN` — guards `floor(0/10)`).
10. Score formula unit test (in `server/services/leaderboardService.js`'s own test, per design doc §5's "write and unit-test it before wiring any route") — pure function, fixed inputs → fixed score, independent of any Firestore double.
11. Global board respects `?limit=` and defaults sanely when omitted.

**Explicitly out of scope for this test file** (covered by other milestones' tests, noted so nobody expects double coverage here): point-redemption double-spend (M1), unguarded order-status transitions (M1), donation-counter tampering (M1, `routes/donations.js`).

---

## 8. Open questions for the M2 GitHub issue (not resolved by this plan)

- Final score weighting, beyond the provisional 1:1:1 formula in §6 — pending M0 eval data.
- Global-board refresh mechanism: scheduled recompute job vs. refresh-triggered-on-write (e.g., recompute a user's score contribution whenever their points/badges/delivered-count changes) vs. refresh-on-read-if-stale with a TTL. Any of these satisfy invariant 8; this plan doesn't pick one.
- Default/max `?limit=` for the global board.
- Whether `reject`/`cancel` ships in the same PR as `request`/`accept`/`list`, or is split out (see §5 scope note).
