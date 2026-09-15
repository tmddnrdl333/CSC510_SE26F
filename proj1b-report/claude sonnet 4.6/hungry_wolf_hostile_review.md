# Hungry Wolf Social Leaderboard — Hostile Review
**Perspective:** Devil's advocate · Maximum honest force · No strawmen  
**Date:** September 2026

---

> Each attack ends with **"What evidence defeats this."** Collect that evidence — or concede the point and change the plan.

---

## Attack 1 — Nobody Wants It
### The need is imagined.

**The core problem with a food-ordering leaderboard is not technical — it is behavioral. The thing being ranked is not aspirational.**

When Nike Run Club shows your friends how far you ran this week, the visibility signals health and discipline. When a food-delivery leaderboard shows your friends how many times you ordered this week, it signals that you ate alone at 11 pm, that you spent money you probably shouldn't have, and that you did not cook. These are not things people want made public. The social comparison dynamic that makes fitness and language-learning leaderboards sticky works *against* a food-delivery context because the underlying behavior carries social stigma, not social prestige.

The evidence from adjacent domains is not encouraging. Facebook's 2007 Beacon feature broadcast users' online purchases to their friends without consent and had to be shut down after a class-action lawsuit. Venmo has a public social feed and one of the first things new users do is turn it private. The FTC's 2022 dark-patterns report specifically flags "social visibility of consumption behavior" as a design pattern that suppresses engagement rather than driving it, because users who feel watched order less, not more.

**The friend-graph problem is even more basic.** Delivery apps are used by individuals with no functional need for a social layer. Venmo forces you to connect because money flows between people. Uber requires a driver and a rider. Hungry Wolf does not: you open it alone, you order alone, you eat. There is no mechanics-of-the-product reason to add a friend, so the friend graph will be empty for the majority of users who do not receive a specific prompt with a specific reward. An empty friend graph means the friends-only leaderboard screen is permanently blank. A blank screen is not a feature — it is an embarrassment that causes users to delete the app.

**The donation counter compounds the problem.** A Meal-for-a-Meal counter ranked publicly invites a specific uncomfortable thought: "My friend donated 47 meals — does that mean they ordered 470 times? How much money did they spend? Are they okay?" Donation visibility can generate social anxiety about *others'* consumption, not just one's own.

**Finally, leaderboards are a novelty that decays.** Duolingo's own research shows that engagement spikes when a user first joins a leaderboard league and collapses to baseline within three weeks unless the user is near the top of their cohort. In a transactional app users open to accomplish a task and close immediately, there is no natural moment to linger on a leaderboard screen. The feature will be explored once and abandoned.

### What evidence defeats this attack:

- **A concept-test survey of at least 30 current food-delivery app users** in which participants are shown a mockup of the leaderboard and asked, unprompted, whether they would add friends and whether they would check it weekly — with a threshold of ≥40% saying yes to both.
- **Evidence from your own P1 user research** (if a survey was conducted) that users spontaneously requested social comparison or expressed frustration that gamification was solitary.
- **Evidence of a food-ordering context that is already social** — e.g., users who share restaurant recommendations on social media, group orders, or office lunch coordination — that would reframe ordering as aspirational rather than private. If ordering is already a social act for a segment of your users, a leaderboard could serve that segment specifically.

---

## Attack 2 — They Cannot Build It
### The month is too short and the auth debt is too large.

**The inherited codebase does not have a security layer. It has four documented holes that must be closed before the leaderboard can ship credibly — and closing them is not a weekend task on an unfamiliar codebase.**

Count what must be built from zero before a single leaderboard row can be trusted:

1. **Password hashing** (auth.js:31 stores plaintext): migrating to bcrypt requires touching the signup flow, the login flow, and every existing user record — including deciding what to do with passwords that are already stored in plaintext and cannot be recovered as hashes.
2. **Server-side session/JWT layer**: every endpoint that needs to know who the caller is must be retrofitted with middleware. "Every endpoint" in an existing Express app means reading all the existing routes, understanding which ones are currently open and which assume implicit identity, and modifying them without breaking the features that already work. This is archaeology, not greenfield development.
3. **Donation endpoint auth gate** (donations.js:59): one line of middleware once the JWT layer exists — but it depends entirely on #2 being done first.
4. **Points race condition** (points.js:82–127): Firestore transactions require understanding the existing points-write logic deeply enough to know exactly which operations need to be wrapped atomically. If the logic is non-trivial (multi-document writes, conditional increments), this is not a two-hour fix.

The milestone classification exercise already scored M4 as STRETCH — but STRETCH at 30–40 person-hours in a 120–130 hour realistic budget. That is 25–33% of the entire project budget, for work that produces no user-visible feature. If M4 runs to 40 hours, every other milestone must land at its minimum estimate with zero slack. One unexpected discovery in the Firestore schema — one field named differently than assumed, one auth flow that has three branches instead of one — and the schedule breaks.

**The team's skills skew toward the wrong domain.** Three of four team members (Mahek, Kevin, Liwen) list ML/AI (PyTorch, LLMs, RAG pipelines) as their primary experience. Web security retrofits — bcrypt migrations, JWT middleware design, Firestore transaction isolation — are not ML problems. They are backend engineering problems that require reading unfamiliar code in a language you may not know as well as Python. Seung Wook has the closest skill set (Spring Boot, Supabase), but Spring Boot is Java and the codebase is JavaScript/Express. The mental translation cost of switching languages while debugging someone else's authentication logic is real and is not captured in the hour estimates.

**The test milestone (M5) depends on M4 being correct.** "Verify forged-rank attempts are rejected" is only a meaningful test if the auth layer actually rejects them. If M4 is incomplete or has a residual bug, M5's passing tests prove nothing — they prove the tests are wrong, not that the system is secure. A four-student team under time pressure is at high risk of writing tests that confirm the implementation rather than challenge it.

**The leaderboard itself requires building on top of all of that.** M1 (aggregation API), M2 (friend graph), M3 (React screen), and M5 (E2E tests) total an additional 57–90 person-hours after the auth fix. That is the rest of the budget, building a social feature on a freshly-retrofitted auth layer that has never been tested in production.

### What evidence defeats this attack:

- **A working auth retrofit in two weeks.** If Seung Wook (or the team collectively) ships a JWT-based session layer with bcrypt passwords, the donation gate, and the points-transaction fix before Week 3 begins, the schedule fear evaporates. The only way to prove this is to try it — which means the team should timebox M4 to Weeks 1–2 explicitly and treat any slip as a decision point.
- **An honest estimate of the existing codebase's complexity.** If someone reads auth.js, donations.js, and points.js end-to-end and reports that the flows are simple (single code paths, no branching, no existing tests to break), the effort estimate for M4 drops to 15–20 hours and the plan becomes REALISTIC. If the report comes back the other way, concede this attack and descope M4b (the race condition fix) to a documented known limitation.
- **Prior evidence that the team has retrofitted auth into an existing codebase** under time pressure — not greenfield auth, but migration auth on someone else's code. If any team member has done this before, the estimate is more trustworthy.

---

## Attack 3 — Someone Does It Better
### The competitive moat is weaker than it looks.

**The market survey correctly finds no food-delivery rival with a friend-connected social leaderboard. That finding is real — but it does not mean the product is differentiated. It may mean the product is differentiated in a direction nobody wants, or differentiated in a direction a better-resourced rival will copy in one sprint.**

**The products that do social-gamified leaderboards are not delivery apps — and they are vastly better at it.** Duolingo runs weekly XP leaderboard leagues with promotion and relegation between tiers, friend challenges, streak freezes, and a notification cadence tuned by years of A/B testing on hundreds of millions of users. Nike Run Club runs friend leaderboards with monthly challenges, achievement badges, and social sharing built into the core product loop. These teams have dedicated behavioral-science staff whose only job is to make the leaderboard feel rewarding rather than punishing. A four-student team has four students.

**The gap between what Hungry Wolf can ship and what Duolingo ships is not a feature gap — it is an expertise gap.** The leaderboard psychology literature (Hamari et al., Festinger, Przybylski et al.) is unambiguous: a poorly-designed leaderboard demotivates the bottom 80% of users and retains only the top 20%. Getting the design right requires knowing the ranking window (weekly resets, not lifetime), the cohort size (10–15 people per league, not 10,000), the rank-near-top nudging ("You're 3 points from 4th place"), and the promotion/demotion tension that keeps mid-tier users engaged. Hungry Wolf's current plan shows a single sorted list. That is the naïve implementation, and the research is clear that it backfires.

**The one genuine differentiator — the donation-impact column — is only a differentiator if the counter is credible.** It is currently inflatable by any unauthenticated caller (donations.js:59). A leaderboard that ranks users by a number anyone can forge is not a differentiator — it is a trust liability. The moment one user discovers they can inflate their donation score and tells their friends, the leaderboard collapses. No fitness or language-learning app competing in this space has this problem because they built their integrity layer before their social layer, not simultaneously.

**The market survey also understates DoorDash and Uber Eats's future optionality.** Neither has shipped a friend leaderboard today. Both have the loyalty data, the friend-graph infrastructure (they already handle two-sided social matching for drivers and riders), the engineering bandwidth, and the distribution to ship one if they see evidence that users want it. If Hungry Wolf's leaderboard generates press coverage showing user demand, the correct prediction is that DoorDash adds a friend-leaderboard variant in six months — not that they cannot. Hungry Wolf's moat is not patent-protected and requires no proprietary technology.

### What evidence defeats this attack:

- **Evidence that the donation-impact mechanic creates a category of competitive motivation that fitness and language apps cannot replicate** — specifically, that users rank "contributing to a social good through a daily habit" above "personal achievement metrics." This is a testable hypothesis: show users both a Duolingo-style XP leaderboard and a Hungry Wolf-style donation-impact leaderboard and ask which they would check more often and which they would share with friends.
- **A leaderboard design that incorporates the rank-psychology research** (weekly resets, small cohorts of ~10 friends, near-rank nudges) rather than a flat sorted list. If the team demonstrates awareness of Hamari et al. and designs against the known failure modes, the "someone does it better" attack weakens because the naive implementations are the ones that fail.
- **A first-mover argument with a specific lock-in mechanism.** If the social graph (friend connections) persists even after Uber Eats adds a leaderboard, users who have already connected friends on Hungry Wolf have a switching cost. The attack assumes no lock-in; evidence of even a small friend graph that users would not want to rebuild elsewhere would defeat it.

---

## Summary

| Attack | Core claim | Evidence required to defeat it |
|---|---|---|
| **1. Nobody wants it** | Food ordering is private and occasionally embarrassing; the social comparison dynamic works against, not for, the product; friend graphs won't form without functional incentive | Concept-test survey ≥30 users, ≥40% would add friends and check weekly; or P1 survey data showing spontaneous demand |
| **2. Can't build it** | Four auth bugs + social layer in 160 hrs on an unfamiliar JS codebase with an ML-skewed team is too much; M4 alone could consume a third of the budget | Working auth retrofit by end of Week 2; or codebase-complexity assessment showing M4 is actually ≤20 hrs |
| **3. Someone does it better** | Duolingo and Nike Run Club own the gamified social leaderboard loop with behavioral-science expertise; DoorDash/Uber Eats can copy the feature in one sprint if it shows traction; the donation counter is the only differentiator and it is currently forgeable | User preference study showing donation-impact leaderboard beats achievement-only leaderboard; leaderboard design demonstrably informed by rank-psychology research; friend-graph lock-in argument |

> [!CAUTION]
> If the team cannot produce the evidence for Attack 1 (user demand) before building begins, the correct decision is to descope the social layer and ship only the auth fixes and aggregation API as a foundation for a later version. A leaderboard nobody checks is worse than no leaderboard — it is evidence against the entire gamification strategy.
