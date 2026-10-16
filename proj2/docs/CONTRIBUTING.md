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

## Reporting Issues

* Use GitHub Issues to report bugs or suggest features
* Include steps to reproduce and expected vs actual behavior
* Label your issue appropriately (`bug`, `enhancement`, etc.)

Thank you for helping us make this project better!
