# Hungry Wolf — Three Futures for the Social Leaderboard
**Date:** September 2026  
**Constraint:** Four graduate students · One month to build AND test

---

> [!IMPORTANT]
> All three versions share one non-negotiable prerequisite: **fix plaintext passwords (auth.js:31), add server-side sessions, and guard the donation endpoint (donations.js:59) before any social feature ships.** A public leaderboard built on a broken identity layer is not a product — it is a liability. The only question is how much you build on top of that fixed foundation.

---

## Version 1 — SAFE
### "The Friend Mirror"

**Elevator pitch:**  
Add friend connections to the existing points, badge, and donation-impact data so users can see a ranked list of people they actually know. It is the leaderboard idea, executed cleanly and no further.

---

### What four grad students build and test in one month

**Week 1 — Foundation (non-negotiable):**
- Hash passwords with bcrypt, replace client-side identity with signed server-side JWT sessions (auth.js:31 + session gap)
- Fix the points double-spend with a database-level atomic transaction (points.js:82–127)
- Gate the donation counter behind authenticated requests only (donations.js:59)

**Week 2 — Friend graph:**
- Friend-request send / accept / decline flow (simple directed graph in the existing DB)
- Privacy control: opt-in to appear on friends' leaderboards (default on, toggle off)

**Week 3 — Leaderboard screen:**
- Single ranked list of accepted friends + self, three columns: loyalty points, badge count, meals donated
- "This week" / "All time" toggle
- Empty-state nudge when user has zero friends ("Invite a friend to see how you compare")

**Week 4 — Test:**
- Automated: unit tests for friend-graph edges, rank ordering, and the three fixed security bugs
- Manual: five-user playtesting session; survey asks only "did you add a friend and why / why not"

---

### Biggest risk

Users of a food-delivery app are transactional by nature — they open the app to order, not to socialize. Friend-add rates in transactional apps are historically low (Venmo is an outlier; it has money, which forces you to connect). If the friend graph stays empty, the leaderboard screen is permanently an embarrassment. The fixed bugs also only reduce the manipulation surface — they do not eliminate it; a determined user can still inflate ranking by placing and canceling small orders to farm points legitimately.

---

### Kill signal

> We abandon this version if fewer than **20 % of active users add at least one friend within two weeks of the feature launch**, measured on our test cohort. An empty leaderboard is not a feature.

---
---

## Version 2 — BOLD
### "Wolf Pack Challenges"

**Elevator pitch:**  
Instead of ranking individuals against each other, users form small named squads (2–5 people); squads compete collectively on a weekly challenge board — first pack to hit a combined milestone (points earned, badges unlocked, meals donated) wins a reward. The leaderboard is still there, but it ranks teams, not individuals, turning social comparison into social cooperation.

---

### What four grad students build and test in one month

**Week 1 — Same foundation as SAFE** (auth, session, race condition, donation gate — identical prereqs).

**Week 2 — Squad model:**
- Pack creation: name, invite code, cap of 5 members (hard-coded for MVP)
- Pack ledger: aggregate the three existing per-user metrics (points, badge count, meal count) into a pack total in real time
- One pack per user (enforced at DB level; no juggling between squads)

**Week 3 — Challenge engine:**
- Admin-configurable weekly challenge template: "First pack to collectively earn X points / Y meals donated this week wins Z bonus points distributed equally"
- Challenge board screen: ranked list of all packs in the system (not just friends), showing progress bars toward the current week's goal
- Winner notification at week close (push notification or in-app banner)

**Week 4 — Test:**
- Recruit two real friend groups of 3–4 people each; run one live weekly challenge between them
- Measure: pack formation rate, messages sent about the challenge outside the app (qualitative), whether the challenge changed ordering behavior
- Automated tests: pack ledger consistency under concurrent orders from the same pack

---

### Biggest risk

The cold-start problem is worse here than in SAFE: you need at least two packs to have competition, and each pack needs 2–5 friends who all have the app. A four-student team with real friend groups can simulate this in testing, but in a real launch a new app may not have enough socially-connected users to sustain a visible leaderboard of packs. There is also a design risk: if the weekly challenge reward is points, you create a coordination incentive to place orders purely to win — over-ordering to climb ranks is a documented human-factors harm (see Przybylski et al. on FOMO-driven behavior). The challenge metric must be donation meals, not raw points, to make the harmful behavior pro-social rather than wasteful.

---

### Kill signal

> We abandon this version if, after running two consecutive weekly challenges on our test cohort, **fewer than half of formed packs have all members place at least one order during the challenge window**. A pack where only one person orders is not a social experience — it is a lonely leaderboard with a group name.

---
---

## Version 3 — WILD
### "Wolf Rank — Public Reputation as a Product"

**Elevator pitch:**  
A user's combined score (points + badges + donation impact) becomes a persistent, publicly visible "Wolf Rank" identity — a number and tier name (Cub, Hunter, Alpha) displayed on their profile, shareable as a link, and eventually unlocking real-world privileges from participating restaurants (priority seating alerts, exclusive menu items, early access to drops). The leaderboard is not a screen inside the app — it is the app's social identity layer.

---

### What four grad students build and test in one month

**Week 1 — Same foundation as SAFE** (auth, session, race condition, donation gate).

**Week 2 — Rank identity layer:**
- Compute a single composite Wolf Score from the three existing metrics (weighted formula; document the weights publicly)
- Assign tier labels at fixed thresholds: Cub (0–499), Hunter (500–1999), Alpha (2000+)
- Public profile URL: `hungrywolf.app/u/{username}` — shows tier badge, score breakdown, meal-donation count; visible without login
- Share button generates an OG-card image (score, tier, meals donated) for social media paste

**Week 3 — Restaurant privilege stub:**
- One participating mock restaurant (can be a team member's account) offers a single "Wolf Exclusive" item visible only to Hunter-tier and above users
- Gate the menu item server-side by tier check — not client-side
- "You're X points away from Hunter — here's what unlocks" nudge in the ordering flow

**Week 4 — Test:**
- User interviews (5 minimum): show participants the public profile URL; ask whether they would share it and whether the exclusive item changed their ordering intent
- Threat-model session: explicitly try to inflate Wolf Score via the (now-fixed) donation and points bugs; document residual attack surface
- Do NOT recruit restaurant partners yet — the mock restaurant is sufficient to test the concept

---

### Biggest risk

This version has two distinct failure modes that pull in opposite directions. First, **public shame**: unlike SAFE and BOLD, Wolf Rank is visible to anyone with a link, including people the user has not invited. A Cub-tier user whose score is publicly low may feel stigmatized — research on social comparison theory (Festinger 1954) is unambiguous that bottom-rank visibility causes disengagement, not motivation. Second, **gaming becomes identity theft**: because the Wolf Score is public and tied to real rewards, the residual manipulation surface (even after fixing the known bugs) is now worth exploiting. A fake Alpha-tier account can claim restaurant exclusives fraudulently. The FTC's dark-pattern guidance also applies here: a tier system that requires ordering to maintain status is structurally coercive.

---

### Kill signal

> We abandon this version if, in user interviews, **more than two out of five participants say they would not share their public profile URL** — either because they find the rank embarrassing, because they distrust the score's integrity, or because they do not want strangers seeing their ordering history. If users will not share it, the public reputation layer has no propagation mechanism and the entire premise collapses.

---
---

## Side-by-Side Comparison

| Dimension | SAFE: Friend Mirror | BOLD: Wolf Pack Challenges | WILD: Wolf Rank Identity |
|---|---|---|---|
| Core social unit | Individual vs. friends | 2–5 person squad vs. squads | Individual vs. the world |
| Leaderboard scope | Friends only | All packs, system-wide | Public, unauthenticated |
| New backend work | Friend graph | Pack ledger + challenge engine | Composite score + public profile |
| New UI screens | Friend list, leaderboard | Pack dashboard, challenge board | Public profile, tier nudge |
| Biggest dependency | User willingness to add friends | Enough packs to create visible competition | Restaurant partner buy-in (stubbed in MVP) |
| Cold-start severity | High | Very high | Medium (public profile works with zero friends) |
| Regulatory exposure | Medium (friend graph = personal data) | Medium (same) | High (public profile + charitable-claim rank + coercive tier) |
| Kill signal | <20 % friend-add rate in 2 weeks | <50 % pack activity in 2 challenges | >2/5 users decline to share public profile |
| Upside if it works | Proven, defensible loyalty feature | Community and retention driver | Platform identity layer; press-worthy |
| If it fails | Low cost — auth fix has standalone value | Medium cost — pack DB schema is reusable | High cost — public reputation is hard to roll back |
