# Hungry Wolf — Use Case Market Classification
**Role:** Market Analyst  
**Date:** September 2026  
**Scope:** US market · 20 existing UCs + proposed leaderboard UC

---

## Classification Key

| Label | Meaning |
|---|---|
| **TABLE STAKES** | Every serious rival has it; absence would disqualify the product |
| **DIFFERENTIATOR** | Rare or absent across major US rivals (Uber Eats, DoorDash, Grubhub, Chipotle Rewards) |

---

## Use Case Classifications

| UC | Summary | Classification | Justification |
|---|---|---|---|
| **UC1** | Sign up with a role (customer / restaurant / delivery partner) | TABLE STAKES | Every delivery platform — Uber Eats, DoorDash, Grubhub — supports multi-role registration at signup; absence would block onboarding entirely. |
| **UC2** | Log in | TABLE STAKES | Universal baseline; every app from Uber Eats to McDonald's requires authenticated login. |
| **UC3** | Manage profile (address, phone, etc.) | TABLE STAKES | Uber Eats, DoorDash, and every delivery rival allow full profile management; users expect it on day one. |
| **UC4** | Browse nearby restaurants sorted by distance | TABLE STAKES | DoorDash and Uber Eats both default to proximity-sorted restaurant lists; this is the core discovery loop of any delivery app. |
| **UC5** | Build a cart | TABLE STAKES | Every food-ordering product — Uber Eats, Grubhub, Chipotle.com — has a cart; absence makes ordering impossible. |
| **UC6** | Place an order | TABLE STAKES | Core transactional action present in every rival; without it the platform has no revenue. |
| **UC7** | Track my order status | TABLE STAKES | DoorDash and Uber Eats both show real-time order status (placed → preparing → picked up → delivered); users consider this a given. |
| **UC8** | Rate a delivered order (1–5 stars) | TABLE STAKES | Uber Eats and DoorDash both collect post-delivery star ratings; it is the standard quality-feedback loop across the industry. |
| **UC9** | Earn loyalty points on delivery (1 pt per \$ spent) | TABLE STAKES | DoorDash has DashPass credits, Uber Eats has Uber Cash/rewards, Grubhub+ has reward dollars — points-on-spend is now expected in delivery loyalty. |
| **UC10** | Redeem points for a discount at checkout (1 pt = \$0.01) | TABLE STAKES | DoorDash, Grubhub, and Chipotle Rewards all allow points redemption at checkout; redemption without earning is a broken loop. |
| **UC11** | Voice control (navigation only — logout, open profile, go home, open cart, total price) | **DIFFERENTIATOR** | No major US delivery rival (Uber Eats, DoorDash, Grubhub) ships in-app voice navigation; the closest is Alexa/Google Assistant reordering integrations, not in-app nav control. |
| **UC12** | Restaurant accepts, cooks, and marks orders ready | TABLE STAKES | Every platform with a restaurant-facing tablet app — DoorDash Merchant, Uber Eats Orders — has the same accept/cook/ready workflow. |
| **UC13** | Restaurant reviews sales performance and insights | TABLE STAKES | DoorDash Merchant and Uber Eats Restaurant Manager both provide sales dashboards and performance reports. |
| **UC14** | Restaurant manages its menu | TABLE STAKES | Menu management is a baseline requirement; DoorDash and Uber Eats both provide self-serve menu editors. |
| **UC15** | Delivery partner claims a delivery job | TABLE STAKES | DoorDash (Dasher) and Uber Eats (driver app) both allow partners to accept or decline individual delivery jobs. |
| **UC16** | Delivery partner picks up and delivers an order | TABLE STAKES | Core delivery workflow present in every rival; the platform cannot function without it. |
| **UC17** | Customer watches delivery on a map (scripted 20-second animation, not real GPS) | TABLE STAKES (partially) | Live map tracking is table stakes — Uber Eats and DoorDash both do it with real GPS; our **scripted animation** is a placeholder, not a differentiator, and falls short of the rival standard. |
| **UC18** | Delivery partner reviews their earnings | TABLE STAKES | DoorDash and Uber Eats both provide earnings dashboards with per-delivery breakdowns for drivers. |
| **UC19** | Customer earns and views achievement badges | **DIFFERENTIATOR** | No major US delivery rival (Uber Eats, DoorDash, Grubhub) ships a badge/achievement system; this is borrowed from fitness apps (Nike Run Club, Fitbit) and is absent in food delivery. |
| **UC20** | Customer sees the "Meal-for-a-Meal" donation impact counter | **DIFFERENTIATOR** | No US delivery rival ties delivered orders to a charitable donation counter visible to the customer; this is unique positioning combining CSR with gamification. |

---

## Proposed Next UC — Social Leaderboard

**Description:** Ranks users by loyalty points, badges, and donation impact; includes friend connections so users can compare themselves against friends.

### Classification: DIFFERENTIATOR

**Justification:**  
No major US food-delivery rival (Uber Eats, DoorDash, Grubhub, Chipotle Rewards, McDonald's MyMcDonald's) ships a friend-connected social leaderboard. The closest precedents are:

- **Nike Run Club** (fitness) — friend leaderboards ranked by weekly activity with badges; proven engagement loop but entirely outside food delivery.
- **Duolingo** (language learning) — weekly XP leaderboard with friend leagues; highly effective at retention but again outside the food domain.
- **Starbucks Rewards** — individual gamification with no social or comparison layer at all.

No rival has **attempted and abandoned** this in food delivery; the space is simply unexplored. The combination of points + badges + donation-impact ranking on a single leaderboard is novel.

---

## Is the Leaderboard the *Strongest* Differentiator Available?

> [!IMPORTANT]
> Given the **one-month build-and-test constraint**, the leaderboard is a **strong but risky** differentiator. Here is the honest assessment:

### Why the leaderboard is a good choice
- It is a **social layer on top of infrastructure you already have** (UC9 points ledger, UC19 badges, UC20 donation counter) — you are not building from scratch.
- The UX pattern is proven in adjacent domains (Nike Run Club, Duolingo); no design research required.
- It directly amplifies UC20 (Meal-for-a-Meal) and UC19 (badges), your two existing differentiators.

### The one credible alternative: **Real GPS delivery tracking (UC17 upgrade)**

| | Social Leaderboard | UC17 Real GPS Upgrade |
|---|---|---|
| Current state | Does not exist | Exists as a scripted animation |
| Rival bar | Not attempted in food delivery | Uber Eats and DoorDash both do it |
| If we ship it | Differentiator | Moves UC17 from below-table-stakes to table stakes |
| One-month feasibility | Medium (cold-start problem, backend + UI) | Medium-hard (real device GPS, WebSocket feed, map SDK) |
| Risk if we don't ship | Low — users don't miss what they've never seen | **High** — users who compare us to Uber Eats notice immediately |

**Recommendation:** Fix UC17 first if your priority is closing the gap with rivals on a painful deficiency. **Choose the leaderboard** if your priority is creating something rivals don't have and deepening loyalty among your most engaged users. For a one-month sprint, doing both is too risky — pick one.

---

## Summary Scorecard

| Category | Count | UCs |
|---|---|---|
| TABLE STAKES | 17 | UC1–UC10, UC12–UC16, UC17*, UC18 |
| DIFFERENTIATOR (existing) | 3 | UC11 (voice), UC19 (badges), UC20 (donation counter) |
| Proposed leaderboard | DIFFERENTIATOR | No food-delivery rival has attempted it |

> *UC17 is classified TABLE Stakes because real-time GPS tracking is the industry standard; our scripted animation does not meet that standard and should be flagged as a known gap.
