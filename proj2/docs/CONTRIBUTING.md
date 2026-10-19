# Contributing to This Project

Thank you for your interest in contributing! This document outlines coding standards
and tips to help you extend the system safely.

## Getting Started

1. Fork the repository
2. Clone your fork:
3. Install dependencies: refer `INSTALL.md`

## Branching Model

* Use feature branches: `feature/xyz-description`
* Always branch off `main`
* Open a Pull Request to merge back into `main`
* Have at least one team member review before merging

## Coding Standards

* **Frontend:** TypeScript + React, use `Prettier` for formatting
* **Backend:** Node.js + Firebase, use ESLint rules provided
* Write clear and meaningful commit messages
* Keep functions small and modular
* Document new components and endpoints clearly

## How to Extend the System Safely

* Check for existing routes/components before adding duplicates
* Always write tests for new functionality
* Update `/docs/API.md` and relevant documentation for new features
* Do not directly commit to `main`; always use PR workflow
* Use meaningful variable names and follow consistent formatting
* Keep UI/UX consistent with existing design patterns

## Protecting a Route (M1 trust layer)

Anything that changes points, money, order status or donation numbers must know
*who* is calling. Use the middleware in `server/middleware/auth.js`; never trust
an id sent in the request body.

```js
const { requireAuth, requireRole, rejectIfBodyIdMismatch } = require('../middleware/auth');

router.post('/teams/:id/join', requireAuth, requireRole(['customer']), async (req, res) => {
  if (rejectIfBodyIdMismatch(req, res, 'customerId')) return; // only if old clients send it
  const userId = req.user.id; // from the verified JWT
  // ...
});
```

- `requireAuth` → 401 without a valid `Authorization: Bearer <jwt>`; sets `req.user = { id, role, email }`.
- `requireRole([...])` → 403 for other roles.
- If a check-then-write could race (balances, claiming, "award once"), do it inside
  `db.runTransaction()` and throw `HttpError` from `server/utils/httpError.js` to abort
  with a status code.
- In tests, get a header with `bearer(id, role)` from `tests/helpers/authToken.js`:

```js
const { bearer } = require('./helpers/authToken');
await request(app).post('/api/teams/t1/join').set(bearer('cust-1', 'customer'));
```

Write a 401 test and a 403 test for every protected route.

## Adding a Challenge Type (M3 Challenge Engine)

A new challenge type is a **definition object, not code**. The engine
(`src/challenges/evaluateChallenges.js`) is generic; every challenge is a
declarative entry in `src/challenges/challengeDefinitions.js`:

```js
{
  id: 'weekly-team-orders-3',          // unique slug; becomes part of the
                                       // challengeProgress doc id
  label: 'Warm-up Week',
  description: 'Three team orders this week.',
  icon: '🥉',
  scope: 'team',                       // v1 supports team challenges
  period: 'weekly',                    // ISO week, UTC
  metric: 'teamDeliveredOrders',       // see "metrics" below
  target: 3,                           // goal the metric must reach (>=)
  reward: { type: 'donatedMeals', amount: 1 },
}
```

Add the object to the array — done. The list API (`GET /api/challenges`),
the claim route, progress bars, and the exactly-once payout all pick it up
with **zero engine changes**. This is proven by a test you can copy:
`proj2/tests/m3-challenge-evaluator.test.js`, test
*"a NEW challenge type works by adding a definition object — no evaluator
change"* — it injects a brand-new definition and watches it evaluate.

**Available metrics** (the honest extensibility boundary): a definition may
use any metric in `metricSelectors` (`src/challenges/evaluateChallenges.js`):

* `teamDeliveredOrders` — count of the team's delivered orders in the week
* `teamDeliveredSpend` — sum of their `totalAmount`
* `uniqueActiveMembers` — distinct members who ordered

A genuinely **new metric** needs one selector function added to
`metricSelectors` — that is the only code a new measurement ever requires
(same pattern as `src/badges/`).

**Reward types**: `{ type: 'donatedMeals', amount: n }` adds n meals to the
global Meal-for-a-Meal counter, exactly once per (challenge, team, week),
inside a Firestore transaction with a deterministic audit row
(`server/services/challengeService.js`). A definition with a malformed
amount is rejected (`INVALID_REWARD`) before it can touch the counter.

**Checklist for a new challenge type:**

1. Add the definition object (reuse an existing metric if possible)
2. Run `npx jest tests/m3-challenge-evaluator.test.js tests/m3-challenge-payout.test.js tests/m3-challenge-api.test.js`
3. If you added a metric: one selector + a unit test for it
4. No route, service, or UI changes should be necessary — if they are,
   stop and ask why

## Reporting Issues

* Use GitHub Issues to report bugs or suggest features
* Include steps to reproduce and expected vs actual behavior
* Label your issue appropriately (`bug`, `enhancement`, etc.)

Thank you for helping us make this project better!
