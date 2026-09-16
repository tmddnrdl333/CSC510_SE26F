## Hostile verdict

I would not approve the proposal as currently framed. The exact feature combination may be unusual, but demand is unproven, the “trustworthy score” claim conflicts with the milestone escape hatches, and several rivals already execute the important parts better. I would approve only a gated prototype whose continuation depends on passing demand and integrity tests.

## 1. Attack: Nobody wants this particular competition

The market survey establishes whitespace, not demand. In fact, the absence of persistent friend rankings from large delivery platforms could mean they tested the idea and found that ordering food is private and utilitarian—not an achievement people want friends to judge.

The strongest objections are:

- The three dimensions may be one behavior counted three times. Points correlate with spending, badges likely correlate with order milestones, and donation impact is explicitly derived from delivered-order count. The result is primarily a ranking of purchasing frequency, disposable income, household size, and tenure.

- The points definition creates a lose-lose choice. Ranking current balances punishes users for redeeming rewards; ranking lifetime earnings entrenches long-time or high-spending users.

- “Verified donation impact” overclaims what is verified. Completed deliveries verify the score calculation, but they do not prove that Hungry Wolf funded or delivered the corresponding charitable meals.

- The friend graph has a cold-start problem. With no contact import, suggestions, or apparently specified invitation channel, most users will initially see an empty board. Adding discovery later creates the privacy and abuse work that the milestone deliberately excludes.

- Friends can infer order frequency—and potentially spending or lifestyle—from rank changes. Friends-only is less public, not private. The lack of removal and blocking also means an accepted relationship may become effectively permanent.

- A persistent board will probably become static: affluent, long-tenured users stay at the top and everyone else stops checking. Successful systems often use weekly cohorts, resets, caps, or comparable-user matching instead.

- The incentivized behavior is questionable. A leaderboard encourages more ordering, whereas WHO warns that delivery apps increase convenient access to unhealthy food; Hungry Wolf would be gamifying that behavior while describing it as social good. [WHO meal-delivery-app report](https://www.who.int/europe/publications/i/item/WHO-EURO-2021-4360-44123-62247)

- General gamification evidence is not a rescue. Experiments have found that points and leaderboards can increase output without increasing intrinsic motivation, while public rankings can negatively affect some participants. [Mekler et al.](https://edoc.unibas.ch/entities/publication/ccec8ccc-aa54-417d-b205-334b518d6eed/full), [Christy and Fox](https://www.sciencedirect.com/science/article/pii/S0360131514001195)

An honest concession: Chipotle disproves the absolute claim that nobody wants food-order competition. Chipotle reports that its 2025 program generated 6.4 million activations and more than $12 million in incremental sales. But it used opt-in participation, qualifying-purchase caps, monthly resets, tangible rewards, and a seasonal campaign—not a permanent friend graph. Its 2026 program is now over. [Chipotle’s company-reported results and 2026 design](https://ir.chipotle.com/2026-05-28-CHIPOTLES-SUMMER-OF-EXTRAS-RETURNS%2C-WITH-STREAK-BASED-REWARDS-AND-LOCAL-RANKINGS-TO-GAMIFY-THE-REWARDS-EXPERIENCE), [closed program page](https://www.chipotle.com/summer-of-extras)

### Evidence that would defeat this attack

Run the study with naturally occurring friend groups, not isolated classmates assigned fake friendships. A defensible one-month test would recruit roughly 24–32 target users across six to eight groups and preregister criteria such as:

- At least half of genuine friend invitations are accepted without rewards tied to acceptance.
- At least 70% of participants establish two accepted connections, giving them a minimally meaningful board.
- At least 40% voluntarily revisit during week two, without a researcher reminder.
- At least 80% correctly explain who can see each metric and how redemption, badges, and delivered orders affect rank.
- Fewer than 10% report an unwanted disclosure or disable visibility after discovering what rank reveals.
- A friends leaderboard produces materially more voluntary repeat visits than a personal-progress screen containing the same information.
- Interviews identify a recurring job—accountability, shared impact, or friendly rivalry—not merely “it looks fun.”
- Donation totals reconcile one-for-one with documented charitable fulfillment, not just qualifying-order calculations.

A one-month test cannot conclusively defeat the “novelty fades after a month” objection. It can only show that interest survives into weeks two and three.

## 2. Attack: They can demo it, but they cannot credibly ship it

The plan has about 160 gross person-hours. Coordination, code discovery, integration, testing, and report work will reduce productive implementation time substantially. More importantly, the proposed security work is not one milestone—it cuts through every source of leaderboard data.

The fatal problems are:

- A JWT is not, by itself, a secure identity layer. The team must handle password hashing or reset/migration, token issuance and validation, expiration, client storage, logout, secrets, authorization, and role boundaries. The FTC explicitly says not to store passwords in plaintext and warns that credentials suitable for a scoreboard may be inadequate for a social app. [FTC app-security guidance](https://www.ftc.gov/business-guidance/resources/app-developers-start-security)

- “Middleware protects all new endpoints” is insufficient. An attacker only needs one old unprotected path that can change an order to delivered, award points, create a badge, or alter a user ID. Protecting the read-side leaderboard while leaving its source events forgeable produces authenticated fiction.

- Gating `donations.js:59` does little for leaderboard integrity because the proposed rank ignores that counter. The critical control is authorization and idempotency around the delivered-order transition from which impact is derived.

- The points transaction cannot be “best effort” if spendable points affect rank. Firestore already provides retrying atomic transactions for concurrent updates; leaving the known race is a release failure, not a documented limitation. [Firestore transaction documentation](https://firebase.google.com/docs/firestore/manage-data/transactions)

- Friend endpoints introduce object-level authorization risk: accepting a request for another user, reading someone else’s friend board, or supplying a different user ID. OWASP identifies this as a common API vulnerability and says authorization must be checked wherever client-supplied IDs select records. [OWASP BOLA guidance](https://api-security.owasp.org/editions/2023/en/0xa1-broken-object-level-authorization/)

- Firestore rules are not automatically a safety net. Server SDKs bypass Firestore Security Rules, while direct browser access requires carefully aligned authentication and rules. The team must first determine which access paths exist. [Firestore security documentation](https://firebase.google.com/docs/firestore/security/overview)

- Three seeded users prove one happy path, not trustworthiness. They do not test forged tokens, expired tokens, role confusion, accepting someone else’s request, replayed delivery completion, unauthorized source-data writes, or leakage from friends-only queries.

- The global-board milestone contradicts its privacy contingency. If global opt-in “slips,” the global board must also be cut; it cannot silently become opt-out or display everybody.

Most damagingly, the mission begins with “trust the score,” while Milestone 1 permits knowingly shipping a score affected by a known race. Those positions cannot coexist.

### Evidence that would defeat this attack

Require these as release gates rather than aspirations:

- By the end of week one, every endpoint and direct Firestore path capable of changing points, badges, delivery status, friendships, or rank visibility is inventoried with its authorized roles.
- Passwords are strongly hashed; existing plaintext credentials are migrated safely or forcibly reset.
- Token handling includes expiration, signature validation, secure storage, logout behavior, and server-derived identity—never a user ID trusted from request data.
- All score-producing mutations are authenticated, authorized, and idempotent.
- Simultaneous redemption tests repeatedly preserve the balance invariant and prevent double spending.
- Replayed delivery transitions cannot award points, badges, or donation credit twice.
- Forged, expired, missing, and wrong-user tokens fail; users cannot accept requests or retrieve private rankings on another user’s behalf.
- By approximately day ten, the team demonstrates one integrated vertical slice: authenticate, complete an authorized order, derive one score, connect two users, and retrieve only their permitted ranking.
- At that checkpoint, the remaining accepted work fits the remaining capacity with contingency. If not, global rankings and the composite score are cut—not security tests.

Passing those gates would defeat the attack for a course prototype. It still would not establish production-grade security or scale.

## 3. Attack: Others already do the valuable parts better

No single verified rival appears to offer Hungry Wolf’s exact intersection. That is much weaker than saying Hungry Wolf has a meaningful competitive advantage.

| Rival | What it already does better |
|---|---|
| Chipotle Summer of Extras | Verified food purchases, points, badges, streaks, tangible rewards, purchase caps, and local/state/national rankings at enormous scale; its shareable statistics were explicitly intended to support competition among friends. |
| BetterPoints | Personal leaderboards built from friends and family, earned points, redemption, charitable donations, and explicit profile visibility controls—the closest existing combination of social ranking, rewards, and impact, although it rewards activity rather than food orders. [Leaderboards](https://betterpointsltd.zendesk.com/hc/en-gb/articles/18283109163921-What-are-leaderboards), [donations](https://www.betterpoints.uk/page/charitable-donations) |
| Beli | A food-centered social graph where users track and rank restaurants, view friends’ activity, and compare tastes; the social food identity is the product’s core rather than an extension. [Beli](https://beliapp.com/), [Beli privacy/data description](https://beliapp.com/app-privacy-policy) |
| Google Health/Fitbit | A current weekly friend leaderboard using steps and Cardio Load, backed by mature identity and privacy infrastructure. Interestingly, Google retained the friend leaderboard while removing badges—evidence that every gamification element need not survive. [Google Health feature documentation](https://support.google.com/googlehealth/answer/17068213) |
| Duolingo | Weekly resets, comparable-user matching, promotion and demotion, opt-out controls, and operational anti-cheat removal. Those mechanisms solve fairness, staleness, and manipulation problems Hungry Wolf has not scoped. [Duolingo leaderboard design](https://blog.duolingo.com/duolingo-leagues-leaderboards/) |

The closest direct commercial rival is Chipotle. The closest mechanical rival is BetterPoints. Beli owns the social-food use case, while Duolingo and Google Health execute the recurring friend-competition loop better.

Therefore, Hungry Wolf’s defensible gap is not “social food leaderboard.” It is narrowly:

> An in-app friend filter over verified delivery-derived rewards and reconciled charitable impact.

That may be a distinctive coursework feature, but it is easy for a larger delivery platform to copy. Combining three familiar mechanics does not itself create a moat—and, because the three measures largely share the same order-volume input, the combination may be less meaningful than each component separately.

The “confirmed across three models by the two-model rule” language should also be removed. Model agreement is not independent market evidence: models can share training sources, repeat the same outdated claim, or infer features from one another’s common web corpus.

### Evidence that would defeat this attack

- Audit every survey entry through current first-party documentation or a recorded live-account walkthrough; model consensus does not count.
- Add BetterPoints and the current Google Health friend leaderboard to the comparison.
- Conduct a blinded head-to-head concept test comparing:

  1. Personal progress only.
  2. A points-only friend leaderboard.
  3. A donation-team goal.
  4. Hungry Wolf’s combined points/badges/impact board.

- Show that target users choose and repeatedly use the combined version—not merely describe it as more feature-rich.
- Demonstrate that users spontaneously identify “verified order-based impact with friends” as the reason for returning.
- Show better score comprehension, privacy confidence, and repeat engagement than the Chipotle-style public/local board and the BetterPoints-style activity board.
- Obtain evidence that the donation dimension changes behavior or meaning independently of order frequency; otherwise it is decorative relabeling.

Even strong results would establish product differentiation, not durable defensibility. A four-week project cannot prove that Uber Eats, DoorDash, or Chipotle could not reproduce the feature.

## Bottom line

Attack 2 currently wins outright: a known exploitable points race cannot be optional in a product whose mission promises trustworthy rankings. Attacks 1 and 3 remain unproven but serious. If the evidence does not defeat them, keep the authentication and integrity work, then reduce the extension to an opt-in, weekly, friends-only challenge around one clearly explained and audited metric—without a global board or an unreconciled charitable-impact claim.