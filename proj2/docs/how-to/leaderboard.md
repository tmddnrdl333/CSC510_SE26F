# How to use the leaderboard

A quick guide to the M2 social leaderboard: what it shows, how friends work,
and how to see it with real data locally. For the full design and API
reference, see [`docs/plans/m2-leaderboard.md`](../plans/m2-leaderboard.md).

## What the leaderboard shows

`GET /api/leaderboard` ranks customers by a combined score built from three
things:

- **Points** — your lifetime earned points balance.
- **Badges** — how many badge tiers you've unlocked (bronze/silver/gold/diamond
  across 18 badges, 0–72 possible).
- **Donated meals** — one meal donated per 10 delivered orders (the
  Meal-for-a-Meal program), derived from your real delivered-order count.

Two views:

- **Global** — every customer, ranked, capped at `?limit=` (default 20).
- **Friends** (`?scope=friends`) — just you and your accepted friends.

## The score formula, and why it's weighted

```
score = totalPoints + 2 × badgeTiers + 5 × donatedMeals
```

Without weights, points alone would dominate the board — a handful of real
orders earns far more raw points than badges or donations contribute, so
the board would read as little more than a spend ranking. The `2×` and `5×`
multipliers bring badge progress and donation impact up to a comparable
scale, so they actually move your rank. These specific numbers are a
starting proposal (not the output of a formal analysis) and are expected to
be retuned again as real usage data comes in — see
[`docs/plans/m2-leaderboard.md` §6](../plans/m2-leaderboard.md#6-proposed-combined-score-formula)
for the full reasoning and history.

## Sending and accepting a friend request

All of this is via `req.user.id` (currently the temporary `x-test-user-id`
header, until real auth lands — see `server/middleware/authStub.js`).

1. **Send a request** — `POST /api/friends/request` with `{ toUserId }`.
   Sending to someone you're already friends with, or to yourself, is
   rejected; re-sending an already-pending request is a no-op, not an error.
2. **Accept it** — the other person calls `POST /api/friends/accept` with
   `{ requestId }` (the friendship id returned from the request call). Only
   the recipient can accept — not the person who sent it.
3. **Reject it** (optional) — the recipient can instead call
   `POST /api/friends/reject` with `{ requestId }` to decline; this deletes
   the request so a new one can be sent later.
4. **List your friends** — `GET /api/friends/list` returns your accepted
   friendships, each with the friend's display name.

## Viewing the friends leaderboard

Once you have at least one accepted friend, call
`GET /api/leaderboard?scope=friends` (or, in the client, open **Leaderboard**
in the nav and click the **Friends** tab). This always includes you, even if
you're ranked last — it's never friends-excluding-yourself. If you have no
accepted friends yet, you'll see a single-entry board (just you) with a
prompt to add friends, not an error.

## Running the demo seed script

To see the leaderboard with real, non-trivial data on a local Firestore
emulator:

```bash
cd proj2
docker compose up -d        # Firestore emulator on :8080
npm run dev                 # server :5001 + client :3000 (separate terminal -- it runs forever)
node scripts/seed-leaderboard-demo.js
```

The script creates three demo customers (varying points and delivered
orders, with badges computed for real from those orders — not hand-written,
since the app recomputes them on dashboard load anyway), plus an accepted
friendship between two of them. It prints each seeded user's name, id, and
login email at the end; the password for all three is `pw`. Re-running it
adds a fresh set of three customers rather than reusing the previous ones —
restart the emulator container (`docker compose down && docker compose up -d`)
for a clean slate, since its data is in-memory only.

## Known limits

- **The global board is computed live, not cached.** Every request to
  `GET /api/leaderboard` (global scope) scans every customer and recomputes
  their score from scratch — there's no periodically refreshed snapshot yet.
  This is fine at the scale this course project runs at, but won't scale
  past it. The cached top-K snapshot design invariant 8 calls for is
  deferred to Project 3 — see
  [`docs/plans/m2-leaderboard.md` §8](../plans/m2-leaderboard.md#8-open-questions-for-the-m2-github-issue-not-resolved-by-this-plan).
- **The Local Legend flag is self-editable by restaurants.** A restaurant's
  `isLocalLegend` status (which feeds the 15%-vs-10% points bonus on an
  order, and therefore a customer's leaderboard score) can currently be set
  by the restaurant itself through its own profile-update endpoint, with no
  verification. A restaurant can declare itself a Local Legend and inflate
  every customer's points earned there. Deferred — see issue #36.
