# Project 1B — Adapted Starter Prompts (Hungry Wolf)

Run each **verbatim** on all three LLMs (+ optional local 4th) against the same
one-paragraph product description below. #1 and #10 are the two mandatory
prompts for D5 (market survey + red team); the other five are picked because
they hang directly off findings we already proved in Project 1a rather than
generic brainstorming.

**One-paragraph product description (paste into every prompt marked `<PRODUCT>`):**

> Hungry Wolf is a gamified food-delivery platform connecting customers,
> restaurants, and delivery partners, with loyalty points, achievement
> badges, and a public "Meal-for-a-Meal" donation counter. For Project 2 we
> propose a social leaderboard: users are ranked by loyalty points, badges
> earned, and donation impact, and can see how they stack up against
> friends. Points and badges are already tracked per user (the points
> ledger and badge evaluation service — Project 1a UC9/UC19), and each
> user's donation impact can be derived from their delivered-order count
> (the Meal-for-a-Meal mechanic: one meal per ten delivered orders,
> UC20); the extension adds the social layer on top: friend connections,
> rankings, and a leaderboard screen. This builds on
> infrastructure we already have rather than starting from zero.

---

## P1 — Map the competition (mandatory, D1)

```
You are a market analyst. Our product, in one paragraph:

Hungry Wolf is a gamified food-delivery platform connecting customers,
restaurants, and delivery partners, with loyalty points, achievement
badges, and a "Meal-for-a-Meal" donation counter. For our next version we
are proposing a social leaderboard that ranks users by points, badges, and
donation impact so they can see how they stack up against friends.

List the ten closest competing products or features — not just full apps,
but specifically anything offering social/competitive leaderboards tied to
food ordering, delivery, or loyalty programs (Uber Eats and DoorDash
should appear if they are genuinely among the ten closest; also look for
any loyalty-gamification features or social leaderboards already shipped
by any delivery, fitness, or rewards platform — do not force them in if a
closer match exists). Output a table: product | who uses it | main
strength | main weakness | price | evidence URL.

Hard constraint: we have one month to build AND test whatever we propose
next — keep that in mind when judging what "competing" even means at our
scale.

Rules: no invented products. If you are not sure a product exists, leave it
out. If you cannot support a claim, write "unknown" — do not fill the cell
with something plausible.
```

---

## P3 — Table stakes or differentiator?

```
You are a market analyst. Here are our 20 use cases from Project 1a, one
line of summary each:

UC1 Sign up with a role (customer/restaurant/delivery partner)
UC2 Log in
UC3 Manage profile (address, phone, etc.)
UC4 Browse nearby restaurants, sorted by distance
UC5 Build a cart
UC6 Place an order
UC7 Track my order status
UC8 Rate a delivered order (1-5 stars)
UC9 Earn loyalty points on delivery (1 pt per $ spent)
UC10 Redeem points for a discount at checkout (1 pt = $0.01)
UC11 Control the app by voice (navigation only — logout, open profile,
     go home, open cart, total price)
UC12 Restaurant handles an incoming order (accept/cook/ready)
UC13 Restaurant reviews sales performance/insights
UC14 Restaurant manages its menu
UC15 Delivery partner claims a delivery job
UC16 Delivery partner picks up and delivers an order
UC17 Customer watches their delivery on a map (currently a scripted
     20-second animation, not a real position feed)
UC18 Delivery partner reviews their earnings
UC19 Customer earns and views achievement badges
UC20 Customer sees the "Meal-for-a-Meal" donation impact counter

Classify each: TABLE STAKES (every rival has it; we must too) or
DIFFERENTIATOR (rare or absent in rivals like Uber Eats/DoorDash). One
sentence of justification each — name the rival that has it, or state that
none does.

Then evaluate the use case we are considering for our next version: a
social leaderboard that ranks users by loyalty points, badges, and
donation impact, with friend connections so users can compare themselves
against friends. Is it TABLE STAKES, a DIFFERENTIATOR, or already
attempted and abandoned by a rival — name the rival if one exists (in
food delivery or in adjacent gamified products like fitness or language
apps), or state that none does. If a different use case would be a
stronger differentiator for us than the leaderboard, name it and say why.
Remember we have one month to build AND test whatever we propose.
```

---

## P4 — The support material we have not read yet

```
We are designing an extension to Hungry Wolf, a gamified food-delivery app,
for the general consumer/gig-economy domain: a social leaderboard ranking
users by loyalty points, badges, and donation impact, with friend
connections. We know the code — we found that passwords are stored in
plaintext (auth.js:31), that there is no session or token so identity is
client-side only, that the donation counter can be inflated by any
unauthenticated caller with no bound (donations.js:59), that loyalty
points can be double-spent through a concurrency race (points.js:82-127),
and that delivery-partner pay is taken directly from client input with no
cap. We do not yet know the world around it.

What support material would change this design if we read it? Make a LONG
list. Consider at least:
- Laws and regulations: privacy/data protection for social features (a
  leaderboard makes a user's ordering activity visible to others; friend
  graphs are personal data; given the plaintext-password and no-session
  findings, is our identity layer even fit to build social features on?),
  consumer protection around gamification (e.g. regulator guidance on
  dark patterns and engagement-maximizing design), gig-worker labor law
  (for delivery partners), and any rules on charitable-donation claims
  (our "Meal-for-a-Meal" counter makes a public giving claim that the
  code lets anyone inflate).
- Standards: accessibility (WCAG/ADA) for the leaderboard UI, security
  (OWASP) given the auth findings above.
- Licenses: of our dependencies and of any data/APIs we use.
- Domain knowledge: published research or guidance on competitive
  gamification and leaderboards (when they motivate users, when they
  backfire or exclude), and any gig-economy delivery-partner guidance.
- Human factors: effects of public rankings on user behavior (shame,
  gaming the metric, unhealthy over-ordering to climb ranks), and how
  rank-manipulation disputes should be handled operationally given the
  integrity bugs we already found.

For each item: name a real, findable source; one sentence on which of our
use cases or findings it touches; and rate it MUST-READ / SHOULD-READ /
SKIM. We will read the must-reads and cite them in the report.
```

---

## P6 — Three futures

```
Our product, in one paragraph:

Hungry Wolf is a gamified food-delivery platform connecting customers,
restaurants, and delivery partners, with loyalty points, achievement
badges, and a public "Meal-for-a-Meal" donation counter. For Project 2 we
propose a social leaderboard: users are ranked by loyalty points, badges
earned, and donation impact, and can see how they stack up against
friends. Points and badges are already tracked per user (the points
ledger and badge evaluation service), and each user's donation impact can
be derived from their delivered-order count (one meal per ten delivered
orders); the extension adds the social layer on top: friend connections,
rankings, and a leaderboard screen. This builds on infrastructure we already have rather
than starting from zero.

We are specifically proposing this social leaderboard (rankings by
points, badges, and donation impact, plus friend connections) as our
extension.

Propose three versions: SAFE (obvious next step), BOLD (a real bet), and
WILD (probably wrong, but instructive) — using the leaderboard idea
(alone or extended) as the raw material, not a brand-new idea. For each:
- Elevator pitch, two sentences.
- What four graduate students could build AND test of it in one month.
- The biggest risk (e.g., will users of a delivery app actually add
  friends; can rankings stay credible when today's code lets any
  unauthenticated caller inflate the donation counter and double-spend
  points).
- The kill signal: "we abandon this version if we see ___."

Do not blend them into one compromise. Keep the three futures distinct.
```

---

## P8 — Mission statement, minus the buzzwords

```
A mission statement gives the WHY (the challenge), the WHAT (the thing we
build), and the SO WHAT (the benefit). Example of the form:

"Online content can be emotionally overwhelming. Our app helps make sense
of it. Sentiment Analyzer Pro lets users analyze the emotional tone of
text, images, news, speech, and YouTube comments. Whether you track brand
sentiment, filter negativity, or just stay informed, the app makes
emotional insight fast and accessible. With a Chrome extension and
improved UI, it is now easier than ever to understand how content feels,
not just what it says."

Facts about our product:
- Users: customers, restaurants, delivery partners (gig workers)
- Problem: delivery apps ship loyalty points and badges, but none we
  know of lets a customer see how they stack up against friends — the
  gamification is solitary. Confirmed by our three-model survey:
  Starbucks, DoorDash, and Uber Eats all gamify solo (no friend ranking
  anywhere); Chipotle's Summer of Extras shipped real leaderboards but
  seasonal, regional, and friendless (ended Aug 31, 2026); Snackpass is
  social but has no competitive ranking; and ShareTheMeal's donation-team
  leaderboards live in an app with no food ordering — nobody combines the
  three ranked dimensions with friends in a delivery app
- New feature we are building: a social leaderboard that ranks users by
  loyalty points, badges earned, and donation impact, with friend
  connections for friends-only rankings
- Existing features it builds on: loyalty points, achievement badges,
  "Meal-for-a-Meal" donation counter tied to delivery volume
- Known gaps we're building against: the donation counter can be inflated
  by any unauthenticated caller (donations.js:59) and points can be
  double-spent (points.js:82-127), so credible rankings require fixing
  integrity first; there is no session/token layer, so social features
  need real identity
- Stack: React 19 client, Express server, Firestore database

Write three candidate mission statements, five sentences each. Banned
words: leverage, empower, seamless, revolutionize, cutting-edge,
innovative, solution. Each candidate must contain one concrete detail a
rival could not copy-paste. We will pick one and edit it.
```

---

## P9 — Milestone reality check

```
The team: four graduate students, one month to build AND test, roughly ten
hours per person per week. Skills:

- Seung Wook: 3 yrs professional backend (Java/Spring Boot, some Python);
  extensive LLM-API integration; ran a personal site on Vercel + Supabase
- Mahek: 1+ yr AI/ML + full-stack experience (Python, C++,
  TypeScript/Next.js); built RAG/LLM applications and AI pipelines;
  experience with FastAPI/Flask, PyTorch, OpenCV, Git/Linux
- Kevin: Worked with Python, Java, PyTorch, JavaScript, and Flask for a
  couple of years
- Liwen: 2 yr LLM and multi-agents; 4 yr AI experience; 5 yr full-stack
  experience; worked on Python and JavaScript most recently, but also
  PyTorch, TensorFlow, Java, and SQL before

Our draft milestones:
1. Build an aggregation API that computes each user's leaderboard score
   from data already in Firestore: loyalty points and badges are stored
   per user, and donation contribution is derived from the user's
   delivered-order count — no new data collection required.
2. Add friend connections: send/accept a friend request, stored in
   Firestore, with an endpoint to list a user's friends.
3. Build the leaderboard screen in the React client: global ranking and a
   friends-only ranking, with the user's own row highlighted and a
   privacy control so each user chooses whether they appear on the
   global board (friends-only by default).
4. Introduce a minimal session/token auth layer (none exists today) and
   use it to fix the integrity holes the leaderboard depends on: lock
   down the unauthenticated donation-counter increment (donations.js:59)
   and the points double-spend race (points.js:82-127) so ranks cannot
   be forged.
5. End-to-end test: seed three users (two friends, one not), place
   orders, verify the global and friends-only rankings update correctly
   (the friends-only view provably excludes the non-friend) and
   forged-rank attempts are rejected.

Classify each: REALISTIC / STRETCH / FANTASY, with one sentence of why,
judged against the hours above — not against a startup with funding. For
every FANTASY, propose the largest slice of it that would be REALISTIC.
Remember: dull milestones lose marks, impossible ones lose more.
```

---

## P10 — Red team (mandatory, D5)

```
You are hostile to our proposal. Below: our mission statement, milestones,
and market survey.

<paste your chosen mission statement from P8, milestones from P9, and the
market survey table from P1>

Attack on three fronts:
1. Nobody wants it — the need is imagined. (Consider: do customers
   actually want to compete over food ordering, or is a leaderboard a
   novelty nobody checks after week one? Would people even add friends in
   a delivery app? Does making ordering activity visible to friends
   create a privacy chill that suppresses use instead of driving it?)
2. They cannot build it — the month is too short, the team too green.
   (Consider: a credible leaderboard needs real identity and anti-cheat,
   but the inherited codebase has plaintext passwords, no session/token
   layer, an unauthenticated donation-counter endpoint, and a points
   double-spend race — can four students with ~10 hrs/week each fix the
   integrity layer AND ship the social layer in one month?)
3. Someone does it better — name who. (Consider loyalty-gamification and
   social leaderboards already shipped anywhere: delivery platforms'
   rewards programs, and adjacent products that made leaderboards their
   core loop — fitness and language-learning apps among them.)

Make each attack as strong as you honestly can; no strawmen. Then, for each
attack, state what evidence would defeat it. We will go collect that
evidence — or concede the point and change the plan.
```
