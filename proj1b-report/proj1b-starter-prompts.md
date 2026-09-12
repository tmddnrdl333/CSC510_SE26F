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
> propose two extensions: (1) an AI dining assistant that sits alongside the
> menu and personalizes what each customer sees — surfacing dishes based on
> past orders, dietary restrictions, and stated preferences, instead of the
> same static list every customer gets today; and (2) a rebuilt voice
> assistant that can actually place and modify orders by voice, closing the
> exact gap Project 1a exposed — today's voice feature can only log out,
> open a screen, or read a total, and cannot order food at all
> (server/routes/voice.js:6-12). Both extensions build on infrastructure we
> already have (the existing voice pipeline, the existing menu/cart data
> model) rather than starting from zero.

---

## P1 — Map the competition (mandatory, D1)

```
You are a market analyst. Our product, in one paragraph:

Hungry Wolf is a gamified food-delivery platform connecting customers,
restaurants, and delivery partners, with loyalty points, achievement
badges, and a "Meal-for-a-Meal" donation counter. For our next version we
are proposing (1) an AI assistant that personalizes the menu shown to each
customer, and (2) a voice assistant that can actually place and modify
orders by voice (today's voice feature can only navigate the app).

List the ten closest competing products or features — not just full apps,
but specifically anything offering AI-personalized menus/recommendations
or voice-based food ordering (Uber Eats and DoorDash should appear if they
are genuinely among the ten closest; also look for any conversational-AI
ordering bots, Alexa/Google Assistant food-ordering skills, or AI menu
personalization features already shipped by any delivery platform — do not
force them in if a closer match exists). Output a table: product | who
uses it | main strength | main weakness | price | evidence URL.

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

Then evaluate these two use cases we are considering for our next version:
(a) an AI assistant that personalizes the menu shown to each customer, and
(b) a voice assistant that can place and modify orders (not just navigate).
For each: is it TABLE STAKES, a DIFFERENTIATOR, or already attempted and
abandoned by a rival — name the rival if one exists, or state that none
does. Remember we have one month to build AND test whatever we propose.
```

---

## P4 — The support material we have not read yet

```
We are designing an extension to Hungry Wolf, a gamified food-delivery app,
for the general consumer/gig-economy domain. We know the code — we found
that passwords are stored in plaintext (auth.js:31), that orders are
created with no payment step at all, that the donation counter can be
inflated by any unauthenticated caller with no bound (donations.js:59),
and that delivery-partner pay (deliveryFee + tipAmount) is taken directly
from client input with no cap. We do not yet know the world around it.

What support material would change this design if we read it? Make a LONG
list. Consider at least:
- Laws and regulations: privacy/data protection (given the plaintext
  password finding), payment/PCI rules (given there is no payment step
  today), gig-worker labor law (for delivery partners), consumer
  protection (for the unbounded donation-counter and pay-cap findings).
- Standards: accessibility (WCAG/ADA) for the voice interface, security
  (OWASP) given the auth findings above.
- Licenses: of our dependencies, of any data/APIs we use (e.g. the voice
  model, maps/geocoding).
- Domain knowledge: any published gig-economy delivery-partner guidance.
- Human factors: advice on managing a gig workforce our product would
  employ (delivery partners), including how earnings/payout disputes like
  the "delivery theft" bug we found should be handled operationally.

For each item: name a real, findable source; one sentence on which of our
use cases or findings it touches; and rate it MUST-READ / SHOULD-READ /
SKIM. We will read the must-reads and cite them in the report.
```

---

## P6 — Three futures

```
Our product, in one paragraph:

<PRODUCT — paste the one-paragraph description above>

We are specifically considering two extensions: (1) an AI assistant that
personalizes the menu per customer, and (2) rebuilding voice control so it
can place and modify orders, not just navigate.

Propose three versions: SAFE (obvious next step), BOLD (a real bet), and
WILD (probably wrong, but instructive) — using these two extensions (alone
or combined) as the raw material, not a brand-new idea. For each:
- Elevator pitch, two sentences.
- What four graduate students could build AND test of it in one month.
- The biggest risk (e.g., can menu personalization work well with our
  current order-history data; can voice ordering be made reliable enough
  to trust with a real transaction).
- The kill signal: "we abandon this version if we see ___."

Do not blend them into one compromise. Keep the three futures distinct.
```

---

## P8 — Mission statement, minus the buzzwords

```
A mission statement gives the WHY (the challenge), the WHAT (the thing we
build), and the SO WHAT (the benefit). Example of the form:

<paste the Sentiment Analyzer example from poster.md here>

Facts about our product:
- Users: customers, restaurants, delivery partners (gig workers)
- Problem: neither Uber Eats nor DoorDash personalizes what a customer
  actually sees on the menu, and neither lets a customer complete an order
  hands-free by voice — [add whatever your P1 survey confirmed here]
- New features we are building: (1) an AI assistant that personalizes the
  menu shown to each customer based on order history/preferences, (2) a
  voice assistant upgraded from navigation-only to actually placing and
  modifying orders
- Existing features: loyalty points, achievement badges, "Meal-for-a-Meal"
  donation counter tied to delivery volume
- Known gaps we're building against: no payment step exists today, voice
  can currently only navigate (cannot place an order), no proof-of-delivery
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
hours per person per week. Skills: <list them honestly>.

Our draft milestones:
1. Rebuild the voice pipeline so it can parse an order-placement intent
   (item + quantity) from speech, not just the existing 5 navigation
   commands.
2. Wire that parsed intent into the existing cart/order endpoints so a
   voice order actually creates a real order.
3. Build a "preference profile" per customer from existing order history
   (Firestore) — no new data collection required.
4. Add an AI assistant that re-ranks/highlights menu items per customer
   using that preference profile.
5. Add a conversational fallback: voice assistant can ask a clarifying
   question ("small or large?") instead of failing outright.
6. End-to-end test: place a full order by voice alone, from menu
   personalization through checkout.

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
   actually want an AI to re-curate their menu, or do they just want to
   find what they always order faster? Is voice ordering solving a real
   problem or a novelty nobody uses after week one?)
2. They cannot build it — the month is too short, the team too green.
   (Consider: reliable speech-to-intent-to-order pipelines and useful menu
   personalization are both nontrivial ML/UX problems — can four students
   with ~10 hrs/week each actually ship and test both in a month on top of
   an inherited codebase that still has no payment step and plaintext
   passwords?)
3. Someone does it better — name who. (Consider Alexa/Google Assistant
   food-ordering skills, any AI-recommendation features Uber Eats or
   DoorDash have already shipped, and any startup doing conversational
   food ordering.)

Make each attack as strong as you honestly can; no strawmen. Then, for each
attack, state what evidence would defeat it. We will go collect that
evidence — or concede the point and change the plan.
```
