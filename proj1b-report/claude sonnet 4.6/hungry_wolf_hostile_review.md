# Hostile Review: Hungry Wolf Leaderboard Proposal

---

## Attack 1 — Nobody Wants It

### The Case Against

**The core demand signal is missing.** Your market survey proves the *gap* exists; it does not prove the gap exists because customers *want* it filled. A gap can persist because the market tested and rejected it, not because nobody tried. Chipotle ran a real leaderboard with real users and let it die. DoorDash and Uber Eats have the data, the engineers, and the incentive — and neither ships friend ranking. The most parsimonious explanation is not that they missed it; it is that their A/B tests killed it.

**Food ordering is an instrumental, often shameful act.** Nobody wants their friends to know they ordered Taco Bell at 11 p.m. three times this week. Fitness leaderboards (Nike Run Club) work because exercise is *aspirational* — you want to be seen doing it. Food ordering contains calorie counts, late-night binges, dietary failures, and budget information. Making that visible to a friend list is not a feature; for many users it is a reason to *stop using the app* or to *never add friends in the first place*. The privacy-chill risk is not a side note; it is an existential adoption problem for the friend graph. No friends added → no social layer → leaderboard is empty → nobody checks it after week one.

**Loyalty points are a poor competitive currency between friends.** You accrue points by spending money. A leaderboard of points is therefore a leaderboard of disposable income. Among friend groups that include people at different income levels — which is most friend groups — this creates awkwardness, not fun. Beli's restaurant-rating model avoids this by making the currency *taste judgment*, which is income-neutral. Your currency is literally dollars spent.

**"Verified donation impact" is a tiny number that moves slowly.** One donated meal per ten orders. A power user who places two orders per week accrues one donation every five weeks. That is not a number that creates competitive urgency or a reason to open the app. The badge count is gameable (just order more); the delivered-order count is the same as points. The differentiation in the score is illusory at the behavioral level.

### Evidence That Would Defeat This Attack

- **Stated-preference survey** (n ≥ 50 current food-delivery users) showing that ≥ 40 % report they *would* share ordering activity with friends if a leaderboard existed, and that ≥ 30 % say it would meaningfully influence their ordering frequency.
- **Behavioral analog:** find a food/beverage app (not fitness, not language-learning) where a social leaderboard demonstrably *increased* retention or order frequency — ideally with a published case study or press release. Snackpass's social gifting feature and its effect on retention would be a starting point.
- **Privacy tolerance evidence:** user interviews (n ≥ 10) demonstrating that the specific user segment targeted (college students, young urban professionals, etc.) is comfortable with friends seeing ordering frequency, OR show that the friends-only default + opt-in global toggle meaningfully addresses the chill.
- **Competitive currency analysis:** explain why ordering frequency (not dollars spent, not dietary content) is a *socially acceptable* comparative axis for your target cohort.

---

## Attack 2 — They Cannot Build It

### The Case Against

**You are building on a structurally broken foundation and adding a social attack surface on top of it.** Your own milestone list confirms the inherited codebase has: plaintext passwords, no session/token layer, an unauthenticated endpoint that anyone can hit to increment the donation counter (`donations.js:59`), and a double-spend race condition in points redemption (`points.js:82-127`). Milestone 1 is entirely remediation — you haven't written a single line of new product yet.

**The remediation is harder than it looks.** "Minimal JWT session layer" is a phrase that hides a month of work in a legacy codebase. You must audit every existing route for auth gaps, retrofit middleware without breaking existing functionality, handle token refresh/expiry, and hash all existing plaintext passwords (including a migration path for stored passwords — do you re-hash on next login and leave old accounts broken? Force a reset email? There is no good fast answer). Then you must wrap points redemption in a Firestore transaction *correctly* — Firestore transactions have retry semantics, failure modes, and interaction with cloud function cold starts that are non-trivial. Your own plan calls this "best-effort" and says it may ship as a known limitation. Shipping a broken double-spend bug into a leaderboard feature that ranks points is not a known limitation; it is a product-integrity failure. A leaderboard built on unfair scores is worse than no leaderboard.

**The social layer surface area is large.** Friend requests require: a data model (who sent, who accepted, pending state), endpoints (send, accept, reject, list), privacy enforcement at the API layer for every leaderboard query, and — critically — protection against enumeration attacks. If I can send a friend request to any user ID and get a "pending" vs. "not found" response, I can enumerate your entire user base. If your leaderboard API leaks scores for non-friends through timing differences or error codes, you have a privacy bug. These are not hypothetical; they are standard problems. Four students with \~10 hrs/week each is 160 person-hours for the month — minus the time already consumed by Milestone 1 remediation.

**The E2E and abuse test plan is ambitious for the time available.** "Forged-rank attempts rejected" and "two concurrency tests" require test infrastructure that doesn't exist yet. Concurrency tests in particular are notoriously flaky and environment-dependent. If those tests are green in CI but your Firestore transaction fix didn't ship (per "best-effort"), the tests are testing a false baseline.

**The demo-ability problem.** A leaderboard with three seeded users and no organic friend graph is not a compelling demo. It proves the code runs; it does not prove the product works socially. Evaluators will know the numbers are synthetic.

### Evidence That Would Defeat This Attack

- **Scope-locked milestone commitment:** publicly cut Milestone 5 (abuse tests + concurrency tests) to a stretch goal, and show a detailed hour budget per milestone that sums to ≤ 160 person-hours and leaves a 20 % buffer. If the budget works, the plan is credible.
- **Firestore transaction proof-of-concept:** show the double-spend fix *already working* in a branch (a passing test that fires two simultaneous redemptions and shows exactly one succeeds) before committing to the social layer. This proves the foundation is solid.
- **JWT layer audit:** a written inventory of every existing route in the codebase, which ones currently have no auth, and which ones the new middleware covers — demonstrating the team understands the full surface area, not just the two files named in the milestone.
- **Prior velocity evidence:** show a previous sprint where this team shipped comparable complexity (auth + data model + API + tests) on this codebase in a comparable time window.

---

## Attack 3 — Someone Does It Better

### The Case Against

**Duolingo's league system is the hardest direct competitor to dismiss.** It is the most-studied, most-copied social leaderboard in consumer software. It is persistent, friend-facing (friends league), and — critically — it demonstrably *works*: Duolingo has published that leaderboards drove a measurable increase in DAU and streak retention. Your proposal gestures at the Nike Run Club UX but avoids naming Duolingo, presumably because Duolingo's league model is the closest structural analogue to what you are building and it operates in a *non-food* domain. The correct hostile question: if Duolingo already proved the friend-leaderboard loop and people can access it for free on their phone right now, why would a food-delivery app's leaderboard capture the same psychological reward? The novelty premium of a new leaderboard is thin when the mechanic is already familiar.

**Beli is a more direct competitor than you acknowledge.** Beli is explicitly a friend leaderboard over dining — not delivery, but the social object (restaurants, food, taste) is closer to your domain than Nike Running. Your survey entry says "not verified orders," which is true, but Beli's answer to that critique is that *users don't care about verification* — they care about social expression. If Beli has retention data showing friend-restaurant-ranking drives repeat opens without order verification, that undermines your "verified score = competitive moat" argument at the behavioral level.

**Gameball and similar loyalty SaaS platforms represent a build-vs-buy threat.** You note "4–6 week integration, no friend graph." But the 4–6 week number is an enterprise integration estimate. A startup or a future competitor with resources could integrate Gameball's leaderboard SDK and build a friend graph layer in the time it takes your team to fix the auth layer. Your moat is not the leaderboard mechanic — any SaaS can replicate it. Your moat would have to be the network effect of the friend graph itself, which requires real users, not three seeded accounts.

**The "donation score" differentiator is ethically fragile.** ShareTheMeal already owns the verified-donation-impact space with a dedicated app, a UN World Food Programme partnership, and real donation transparency. Your donation mechanic — one meal per ten orders, calculated from delivery data — is meaningful but not independently verifiable by the user. If a user asks "how do I know my tenth order actually triggered a donation?" the answer requires trusting your backend counter, which your own codebase currently exposes as an unauthenticated increment endpoint. ShareTheMeal's moat is third-party verification. Yours is internal bookkeeping, and the codebase's current state undermines that trust story.

### Evidence That Would Defeat This Attack

- **On Duolingo:** articulate a *specific* behavioral difference between language-learning streaks and food-ordering cadence that predicts the leaderboard mechanic will transfer. (Hint: frequency and shame-asymmetry are the key variables — language learning is daily and universally aspirational; food ordering is 2–3x/week and ambivalence-laden.) If you can show your target cohort orders with comparable frequency and comparable pride, the transfer argument holds.
- **On Beli:** run a user interview asking Beli users whether order verification would make their leaderboard *more* or *less* fun to use. If they say "more," your verified score is a genuine differentiator. If they say "verification doesn't matter, I just want to see what my friends are eating," your moat evaporates.
- **On Gameball/SaaS:** argue that the friend graph, once built, is the durable asset — and show a user-acquisition strategy that would give you a friend-graph head start before a well-funded competitor can replicate. This is a go-to-market argument, not a technical one.
- **On ShareTheMeal:** either (a) obtain a third-party verification partnership for your donation mechanic before launch (a restaurant partner, a charity, a public audit), or (b) reframe the donation score as a *loyalty mechanic* rather than a charitable claim — "you helped fund X meals" rather than "you donated" — which lowers the verification bar.

---

## Summary Table

| Attack | Knockout condition | Evidence needed |
|---|---|---|
| Nobody wants it | Show demand is real and privacy chill is manageable | Survey (n ≥ 50), behavioral analog in food/bev, privacy-tolerance interviews |
| Can't build it | Show budget is realistic and foundation is already solid | Hour budget, passing concurrency test in a branch, route audit |
| Someone does it better | Show your mechanic transfers and your moat is durable | Duolingo transfer argument, Beli interview data, donation verification partner |

> [!NOTE]
> None of these attacks is a strawman — each targets the load-bearing assumption of a different part of your proposal. The strongest single finding would be a food or beverage app (not fitness, not language) where a persistent friend leaderboard demonstrably improved retention. That one data point would blunt all three attacks simultaneously.
