<!-- CI/CD and quality badges (live — each click opens the real result) -->
[![Build Status](https://github.com/tmddnrdl333/CSC510_SE26F/actions/workflows/ci.yml/badge.svg)](https://github.com/tmddnrdl333/CSC510_SE26F/actions/workflows/ci.yml)
[![Tests](https://img.shields.io/badge/tests-329%20passing%20%2B%204%20documented%20reds-brightgreen.svg)](https://github.com/tmddnrdl333/CSC510_SE26F/actions/workflows/ci.yml)
[![codecov](https://codecov.io/github/tmddnrdl333/CSC510_SE26F/graph/badge.svg)](https://codecov.io/github/tmddnrdl333/CSC510_SE26F)
[![ESLint](https://img.shields.io/badge/lint-ESLint-blue.svg)](.eslintrc.json)
[![Prettier](https://img.shields.io/badge/code_style-prettier-ff69b4.svg)](.prettierrc)
[![TypeScript](https://img.shields.io/badge/types-tsc%20--noEmit-3178c6.svg)](client/tsconfig.json)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](docs/LICENSE.md)
[![Contributions welcome](https://img.shields.io/badge/contributions-welcome-brightgreen.svg)](docs/CONTRIBUTING.md)
[![DOI](https://zenodo.org/badge/1349823474.svg)](https://zenodo.org/badge/latestdoi/1349823474)

<!-- TODO(teaser): 12-30s teaser video goes RIGHT HERE, above the title. -->

# Hungry Wolf 🐺
**Not Just Food, A Quest Worth Savoring**

A gamified food-delivery platform that connects customers, restaurants, and delivery partners while supporting local eateries and contributing to a Meal-for-a-Meal donation program.

**Docs & guides:** [API docs (generated)](docs/api/index.html) · [Install](docs/INSTALL.md) · [Contributing / adding a challenge type](docs/CONTRIBUTING.md) · [Milestones](docs/MILESTONES.md) · [DB design](docs/DB_DESIGN_M2_M3.md) · [AI use disclosure](docs/AI_USE.md) · [Third-party licenses](docs/THIRD_PARTY_LIBRARIES.md)

<!-- TODO(walkthrough): link the 2-5 min feature walk-through video here. -->

## 🎯 Project Overview

Hungry Wolf is a full-stack web application built with modern technologies to create an engaging food delivery experience. The platform gamifies the ordering process with points, rewards, and social impact features.

## 🏗️ Architecture

```
hungry-wolf/
├── frontend/          # React frontend
├── backend/          # Node.js backend
└── docs/           # Documentation
```

## 🚀 Quick Start

1. **Install dependencies:**
   ```bash
   npm run install-all
   ```

2. **Start development servers:**
   ```bash
   npm run dev
   ```

3. **Access the application:**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:5001

4. **Test & Coverage**
   ```bash
   npm run test
   ```


## 📋 Milestones

Live progress, one issue per step: [GitHub milestones](https://github.com/tmddnrdl333/CSC510_SE26F/milestones).

| Milestone | Status |
|---|---|
| M0: Repeat-order-rate eval | ✅ Merged ([#11](https://github.com/tmddnrdl333/CSC510_SE26F/pull/11)) |
| M1: Trust layer | 🔍 In review ([#51](https://github.com/tmddnrdl333/CSC510_SE26F/pull/51)) |
| M2: Social leaderboard | 🚧 In progress ([#35](https://github.com/tmddnrdl333/CSC510_SE26F/pull/35)) |
| M3: Challenges engine + friend team challenges | 🚧 In progress |

### M0: Repeat-order-rate eval ✅
Hypothesis: the weekly repeat-order rate rises by at least 20% with the leaderboard, compared with a no-leaderboard baseline.
- [x] `scripts/m0-eval.js`: computes the weekly repeat-order rate per group and prints the lift and PASS/FAIL (`npm run eval:m0`)
- [x] Seeded synthetic order generator, so reruns give the same number. Seed 42: **+24.9% lift → PASS**. The lift is simulated, not hard-coded, so the eval can fail.
- [x] Runs in CI on every push, and on a pilot dataset (`npm run eval:m0:pilot`)
- [x] Issue template for recording a persevere / re-plan / descope decision if it fails

### M1: Trust layer 🔍
The leaderboard and challenges rank points, deliveries and donations, so those numbers must not be forgeable.
- [x] Passwords hashed with bcrypt; login returns a JWT; `requireAuth` / `requireRole` middleware ([how to protect a route](docs/CONTRIBUTING.md))
- [x] Only the assigned delivery partner can pick up, deliver or release an order (403 for anyone else). Each delivery pays out once.
- [x] Claiming an order, redeeming points and completing a delivery run in Firestore transactions (no double-claim, no double-spend)
- [x] Points: 10% of the bill, 15% at Local Legend restaurants
- [x] Order status follows the kitchen workflow; only the restaurant that owns an order can move it
- [x] Donation counter and account edits require login
- [x] 85 new tests (150 → 235 total); tests that recorded these bugs now check the fixes

### M2: Social leaderboard 🚧
- [x] Friendships: send / accept / reject / list routes and a `getFriends` helper (in review)
- [ ] Combined score of points, badges and donations
- [ ] `GET /api/leaderboard`, global and `?scope=friends`
- [ ] Leaderboard page with a Global/Friends toggle

### M3: Challenges engine + friend team challenges 🚧
Friends form a team and take on weekly challenges together, e.g. "15 team orders this week = 5 extra donated meals".
- [x] Challenge definitions and a pure evaluator: a new challenge type is a new definition, not new code
- [x] Transaction support in the test Firestore double (for exactly-once rewards)
- [ ] Teams: create / join / leave / list
- [ ] Exactly-once reward payout, progress API, team progress page
- [ ] CONTRIBUTING tutorial: how to add a challenge type

## 🛠️ Tech Stack

- **Frontend:** React 18, React Router, React Query
- **Backend:** Node.js, Express.js
- **Database:** Firebase Firestore
- **Authentication:** Firebase Auth
- **Styling:** CSS Modules, Responsive Design
- **State Management:** React Query + Context API

## 👥 User Roles

### Customer
- Browse restaurants and menus
- Add items to cart and place orders
- Track order status
- Rate restaurants
- Earn and redeem points

### Restaurant
- Manage menu items
- Accept/reject orders
- Update order status
- View customer ratings

### Delivery Partner
- View assigned orders
- Update delivery status
- Track earnings

## 🎮 Gamification Features

- **Points System:** Earn points for orders (10% of bill)
- **Local Legends:** Extra points (15%) for supporting local restaurants (Local Legends)
- **Social Impact:** Meal-for-a-Meal donation program

## 🔧 Development

### Project Structure
- Modular architecture for easy extension
- Clear separation of concerns
- Comprehensive documentation
- Type-safe development

### For Future Teams
This project is designed to be easily extensible. Key areas for future development:
- Payment integration
- Real-time tracking and notifications
- Advanced analytics
- Mobile app development

## 📚 Documentation

See the `docs/` directory for detailed documentation:
- API documentation
- Installation guidelines
- Code of conduct

## 🤝 Contributing

This project follows software sustainability principles:
- Clear code documentation
- Modular architecture
- Comprehensive testing
- Easy setup and deployment

## 📄 License

MIT License - see LICENSE file for details

### 🔗 Live Demo
You can see the working demo using the link below:  
[View Live Demo for Project 2](https://drive.google.com/file/d/1R85vYgjbKL3zBZsimE7ruI46UfgAdN8x/view?usp=drive_link)

[View Live demo for Project 3](https://youtu.be/l6SIhW_ra_A)

---

This repository uses continuous integration (GitHub Actions), linting (ESLint), automated testing (Jest), and coverage tracking (Codecov). All badges above are live and auto-updated on each commit.
