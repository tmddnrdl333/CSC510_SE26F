# Hungry Wolf — Competitive Market Analysis
**Role:** Market Analyst  
**Date:** September 2026  
**Scope:** US market · One-month build-and-test constraint

---

## Product Summary

**Hungry Wolf** is a gamified food-delivery platform connecting customers, restaurants, and delivery partners, with loyalty points, achievement badges, and a "Meal-for-a-Meal" donation counter. The proposed next version adds a **social leaderboard** that ranks users by points, badges, and donation impact so they can see how they stack up against friends.

---

## The Ten Closest Competing Products

| # | Product | Who Uses It | Main Strength | Main Weakness | Price | Evidence URL |
|---|---|---|---|---|---|---|
| 1 | **Starbucks Rewards + Star Streaks** | Starbucks loyalty members (US) | Deepest gamification in US food/beverage loyalty — stars, levels, streak bonuses, bonus-point challenges; enormous installed base | No public leaderboard or friend-ranking screen; all progress is purely individual | Free (loyalty program) | https://www.starbucks.com/rewards |
| 2 | **DoorDash DashPass + Challenges** | DoorDash customers (US) | Time-limited order challenges that award badges; dominant US delivery market share | No social or friend layer at all; challenges are solo and expire | Free (DashPass $9.99/mo) | https://www.doordash.com/dashpass |
| 3 | **Uber Eats Promotions / Stamp Cards** | Uber Eats customers (US) | Per-restaurant stamp-card mechanic; massive US reach and restaurant catalogue | No leaderboard, no friend graph; purely transactional rewards | Free | https://www.uber.com/us/en/eats |
| 4 | **Grubhub+ / Grubhub Perks** | Grubhub customers (US) | Order-based perks and credits tied to subscription; established US delivery competitor | No gamification depth, no leaderboard, no social layer | Free tier + $9.99/mo Grubhub+ | https://www.grubhub.com/plus |
| 5 | **Chipotle Rewards** | Chipotle customers (US) | Points + "Extras" bonus challenges; large US fast-casual loyalty base with surprise reward events | No social features, no friend comparison; single-brand only | Free | https://www.chipotle.com/rewards |
| 6 | **McDonald's MyMcDonald's Rewards** | McDonald's loyalty customers (US) | Points + bonus-point events; enormous US fast-food installed base | No social features, no friend comparison; single-brand only | Free | https://www.mcdonalds.com/us/en-us/mymcdonalds-rewards.html |
| 7 | **Nike Run Club (leaderboard model)** | Fitness / running app users (US) | Friend leaderboards ranked by weekly activity with badges and challenges — the **closest UX analog** to what Hungry Wolf proposes; proven engagement loop | Fitness-only domain; no food, delivery, or donation mechanic | Free | https://www.nike.com/nrc-app |
| 8 | **Fitbit / Google Fit Challenges** | Wearable + wellness users (US) | Weekly friend step-leaderboards with trophies; proven social-ranking psychology in a consumer app | Health-only domain; requires wearable hardware; no food/loyalty connection | Free (device required) | https://www.fitbit.com |
| 9 | **Punchh (white-label loyalty SaaS)** | US restaurant chains — Papa John's, Denny's, El Pollo Loco, etc. | Full-stack loyalty + gamification SDK: challenges, tiered badges, points ledger — deployable fast by a developer team | Enterprise pricing; no built-in social friend graph or public leaderboard out of the box | Unknown — enterprise SaaS contract | https://punchh.com |
| 10 | **Thanx (white-label loyalty SaaS)** | US mid-market restaurant brands | Automated loyalty + social referral loops; customer-facing VIP tier visibility; faster to integrate than building from scratch | No public friend leaderboard; referral mechanics ≠ competitive ranking | Unknown — enterprise SaaS contract | https://www.thanx.com |

---

## Key Findings

### 1. No direct competitor ships the full combo
None of the ten products above combine **all three** of:
- Points-based ranking
- Badge/achievement leaderboard
- Donation-impact score (Meal-for-a-Meal)

with a **friend social graph** in the food-delivery domain. The gap is real and US-specific.

### 2. Closest UX blueprints are from fitness, not food
**Nike Run Club** and **Fitbit Challenges** are the strongest design references for the friend-leaderboard interaction pattern. Borrow their UX, not their domain logic.

### 3. Food loyalty is deep but not social
Starbucks, Chipotle, and McDonald's have the most mature gamification in food/beverage, but all are siloed to individual progress. None expose a public or friend-facing ranking screen.

### 4. White-label options exist but won't close the gap
Punchh and Thanx can accelerate the points/badge backend if needed, but the **social layer and donation-impact mechanic** would still be entirely custom work.

---

## One-Month Build Risk: Cold-Start Problem

> [!WARNING]
> The biggest day-one risk is not competition — it's an **empty leaderboard**. If users have no friends connected yet, the screen is useless and they churn immediately.

**Mitigations to scope into the one-month plan:**

- **Public leaderboard mode** — show a city-wide or platform-wide top-10 as a fallback when a user has zero friends.
- **"Follow top donors"** — let users follow the highest Meal-for-a-Meal contributors as a social seed.
- **Opt-in friend suggestions** — suggest connections based on shared restaurants or order history (no PII required).
- **Invite link with bonus points** — incentivize friend graph growth from day one.

---

## Summary Verdict

| Dimension | Assessment |
|---|---|
| Market gap | ✅ Real — no US competitor has this exact feature set |
| UX precedent | ✅ Strong — Nike Run Club proves the friend-leaderboard loop works |
| Build feasibility in one month | ⚠️ Tight — scope ruthlessly; ship friend-leaderboard + donation rank first, badges second |
| Competitive moat | ⚠️ Moderate — large platforms (DoorDash, Uber Eats) could copy this in a future sprint |
| Cold-start risk | ❌ High — must be mitigated at launch with a public/fallback leaderboard |
