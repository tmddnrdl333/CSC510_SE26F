One non-negotiable applies to all three: no real-user leaderboard should launch until authentication is server-side, point redemption is atomic, and donation impact is derived only from authenticated, delivered orders. Otherwise the experiment measures exploitability, not product value.

## SAFE — Friends-only weekly leaderboard

**Elevator pitch:** Hungry Wolf adds an opt-in leaderboard where mutually connected friends compare verified loyalty points, badges, and meal impact for the current week. It is a small social layer over existing metrics, with private-by-default profiles and no global ranking.

**What four students can build and test in one month:**

- Mutual friend requests using username or invite code; no contact importing, recommendations, messaging, or public search.
- One leaderboard screen with three separate tabs—points, badges, and meal impact—rather than an opaque composite score.
- Weekly resets, pseudonymous display names, metric-level visibility controls, unfriend/block, opt-out, and “how ranking works.”
- Server-side authentication/authorization, atomic point updates, and donation impact calculated from immutable delivered-order records.
- Test with 15–25 seeded friend groups for 7–10 days, measuring invitation acceptance, repeat viewing, ranking comprehension, perceived pressure, and attempted manipulation.

**Biggest risk:** The feature may be trustworthy and usable but still irrelevant because food-delivery users do not naturally think of ordering as a social activity or want friends to infer their spending and ordering frequency.

**Kill signal:** “We abandon SAFE if fewer than 30% of invited testers opt in and connect with at least one friend, or if more than 20% say the ranking exposes more ordering information than they are comfortable sharing.”

## BOLD — Wolf Packs: cooperative social competition

**Elevator pitch:** Friends form small “Wolf Packs” that compete in short seasons to unlock a collective Meal-for-a-Meal milestone, with rankings based on verified contribution rather than raw spending alone. The bet is that shared charitable progress gives people a socially acceptable reason to invite friends and return to a delivery app.

**What four students can build and test in one month:**

- Invite-only packs of three to six people with a captain, pack name, and one two-week season.
- A pack leaderboard using a published score formula that balances verified points, distinct badges, and delivered-order-derived meal impact.
- A team progress meter, weekly recap, limited celebratory notifications, and a personal contribution breakdown.
- Daily scoring caps and diminishing returns so one high spender cannot dominate by repeatedly ordering.
- No chat, public discovery, custom images, prizes, cross-pack messaging, or permanent seasons.
- Test 6–10 pre-recruited packs—roughly 24–50 participants—comparing engagement with a control group that sees only personal progress.
- Measure successful pack formation, invited-user activation, repeat visits, contribution concentration, perceived fairness, and whether participants understand the scoring formula.

**Biggest risk:** The charitable framing may merely disguise a purchase-frequency contest: stronger users could dominate, low-spending friends could disengage, and public recognition could crowd out the meaning of Meal-for-a-Meal.

**Kill signal:** “We abandon BOLD if fewer than half of recruited packs reach three active members, or if the top member supplies more than 60% of a typical pack’s score and lower-ranked members participate less than the personal-progress control group.”

## WILD — Hungry Wolf City League

**Elevator pitch:** Hungry Wolf becomes a public competitive food network, placing customers into campus or neighborhood leagues with live rankings, seasonal promotion and relegation, shareable titles, and citywide donation-impact battles. Ordering food becomes a spectator competition in which users and local communities fight to become the most loyal and most charitable Wolves.

**What four students can build and test in one month:**

- A high-fidelity prototype backed by synthetic accounts and scripted order events—not a production release involving real purchases.
- One campus or neighborhood league, public profiles, a combined score, top-three podium, rank movement, seasonal tiers, and shareable winner cards.
- Simulated fraud cases—including concurrent point redemption, forged deliveries, duplicate accounts, refunds, and donation inflation—to observe how credibility collapses.
- Moderation and appeal mockups showing flagged scores, provisional ranks, corrected standings, and visible audit explanations.
- Scenario testing with 20–30 participants plus interviews covering excitement, privacy, shame, fairness, spending pressure, and willingness to be publicly ranked.
- A red-team exercise in which testers attempt to manipulate the league and infer other users’ ordering behavior.

**Biggest risk:** Public geographic competition could reward unhealthy over-ordering, expose approximate location and economic differences, encourage fake accounts and collusion, produce harassment or shame, and make every existing integrity defect publicly consequential.

**Kill signal:** “We abandon WILD if more than 15% of testers report feeling pressure to order more than they otherwise would, if more than 10% can infer sensitive behavior about another user, or if red-team testers can alter a rank without a verified delivered order.”

The three futures make different bets: SAFE tests whether comparison has any basic social demand; BOLD tests whether small-group charitable identity creates that demand; WILD tests the limits of public competition and should remain a prototype unless its unusually high safety and integrity burden is disproved.