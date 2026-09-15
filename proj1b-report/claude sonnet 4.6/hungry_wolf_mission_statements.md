# Hungry Wolf — Candidate Mission Statements
**Date:** September 2026  
**For:** Project 2 social leaderboard extension  
**Form:** WHY (the challenge) → WHAT (what we build) → SO WHAT (the benefit)  
**Rules:** Five sentences each · No banned words · One concrete detail per statement that no rival can copy-paste

---

> [!NOTE]
> Banned words avoided throughout: leverage, empower, seamless, revolutionize, cutting-edge, innovative, solution.

---

## Candidate A — Integrity-First Framing

Food-delivery apps hand out points and badges as if the game ends the moment the order arrives, leaving customers with a score no one else can see and no reason to care about tomorrow. Hungry Wolf changes that by adding a social leaderboard that ranks customers on three axes — loyalty points, achievement badges, and a Meal-for-a-Meal donation score that counts one donated meal for every ten orders delivered through the platform — and lets users compare those ranks privately against accepted friends. Because rankings are only meaningful when the numbers are honest, the leaderboard is built on fixed, server-enforced point transactions and authenticated donation counts rather than on the inflatable, unauthenticated counters that existed before. Restaurants gain visibility into which customers are active community contributors, and delivery partners see their work reflected not just in their own earnings but in a public tally of meals funded by the volume they move. For customers who already order regularly, Hungry Wolf turns a solitary habit into a shared measure of something worth showing.

> **Concrete detail a rival cannot copy-paste:** "one donated meal for every ten orders delivered through the platform" — specific to Hungry Wolf's Meal-for-a-Meal mechanic and delivery volume.  
> **Best for:** Audiences who care about technical trustworthiness and integrity (e.g., evaluators, technical reviewers).

---

## Candidate B — Community-Deficit Framing

Every major delivery platform tracks what you spend and rewards you for it, but none of them let you find out whether your roommate outranked you last month or whether your friend group collectively funded more donated meals than another. Hungry Wolf is a gamified food-delivery platform for customers, restaurants, and delivery partners that adds one thing rivals have not shipped: a friend-connected leaderboard ranking users simultaneously by loyalty points, earned achievement badges, and a donation-impact score derived directly from delivered-order volume at a rate of one meal per ten deliveries. The social layer is built on real server-side identity — JWT sessions and hashed credentials replacing a client-only model — so that a user's rank belongs to them and cannot be claimed or spoofed by someone else. Customers who care most about the donation counter can filter the leaderboard to show donation impact only; customers who are chasing badges can do the same; the score is transparent because the weights are public. The result is gamification that has somewhere to go: a number you built over real orders, visible to the people whose opinion of it actually matters to you.

> **Concrete detail a rival cannot copy-paste:** "JWT sessions and hashed credentials replacing a client-only model" — names the specific architectural gap closed as part of this feature, not found in any rival's marketing.  
> **Best for:** Pitch decks, reports, or presentations where a clear rival-gap claim is needed up front.

---

## Candidate C — Gig-Economy and Donation Angle

Food delivery is already a three-sided market — customers, restaurants, and the gig workers who connect them — but the loyalty and reward features that ship on delivery apps treat only one side, leaving partners invisible and the social dimension of ordering entirely unexplored. Hungry Wolf proposes that ordering food together should feel like something, so it is building a social leaderboard that ranks customers by loyalty points, badge achievements, and a Meal-for-a-Meal donation counter that increments once per every ten delivered orders, a mechanic tied directly to the volume that delivery partners create. Friend connections let users opt in to a friends-only view of those rankings, so the comparison is chosen rather than forced, and a global fallback shows the top donors platform-wide for users whose friend graph is still empty. The leaderboard is the first feature in the platform's React 19 front end to require real server-side identity, which means building it also closes the authentication and point-integrity gaps that existed underneath everything else. For gig workers, every delivery now has a second outcome: their pickup moves someone's donation counter, and that counter is the number their customers are competing over.

> **Concrete detail a rival cannot copy-paste:** "The leaderboard is the first feature in the platform's React 19 front end to require real server-side identity" — names the specific tech stack and the integrity-first build sequence unique to this project.  
> **Best for:** Audiences who care about the full three-sided market — customers, restaurants, and delivery partners — or the social-good angle.

---

## Quick Orientation

| | Candidate A | Candidate B | Candidate C |
|---|---|---|---|
| Opens with | The solitary-badge problem | The rival gap | The three-sided market gap |
| Unique concrete detail | 1 meal per 10 deliveries (mechanic) | JWT + client-only gap (architecture) | React 19 + identity-first build sequence (stack + process) |
| Tone | Trustworthy, measured | Direct, pitch-ready | Inclusive, mission-driven |
| Best audience | Technical reviewers | Evaluators / pitch deck | Broader stakeholder report |
| Pick this if... | You want credibility as the lead | You want the rival comparison up front | You want delivery partners in the story |
