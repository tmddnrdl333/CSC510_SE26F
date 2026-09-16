# Project 1b Starter Prompts — Qwen Results

- Model: `qwen/qwen3.8-27b`
- Endpoint: `https://api.groq.com/openai/v1`
- Run: 2026-09-15 23:07 UTC
- Repository snapshot sent: **none** (the prompts contained the required product evidence)

## P1 — Map the competition (mandatory, D1)

### Prompt

```text
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

### Result

I cannot provide the requested table of ten closest competing products with evidence URLs.

The repository snapshot provided is empty (the "REPOSITORY FILE LIST" contains no files, and no file contents are present). As a result, there is no repository evidence to analyze. Furthermore, as an AI, I do not have access to real-time market data, live web browsing capabilities, or a verified database of current product features to confirm the existence of specific social leaderboards in food delivery apps, nor can I generate valid, current evidence URLs for external products. Providing a list of products and URLs without verifiable evidence would violate the constraint against inventing products or making unsupported claims.

Therefore, I cannot fulfill the request to list ten closest competing products with evidence URLs based on the provided (empty) repository snapshot and my lack of real-time external verification capabilities.

## P3 — Table stakes or differentiator?

### Prompt

```text
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

### Result

### Classification of Project 1a Use Cases

**UC1: Sign up with a role (customer/restaurant/delivery partner)**
**TABLE STAKES**: Uber Eats and DoorDash both require distinct account types or onboarding flows for customers, restaurants, and drivers.

**UC2: Log in**
**TABLE STAKES**: Every digital service, including Uber Eats and DoorDash, requires standard authentication.

**UC3: Manage profile (address, phone, etc.)**
**TABLE STAKES**: Uber Eats and DoorDash both allow users to edit their delivery addresses and contact information.

**UC4: Browse nearby restaurants, sorted by distance**
**TABLE STAKES**: Uber Eats and DoorDash both default to sorting or filtering restaurants by proximity to the user’s location.

**UC5: Build a cart**
**TABLE STAKES**: Uber Eats and DoorDash both utilize a standard cart mechanism for adding items before checkout.

**UC6: Place an order**
**TABLE STAKES**: Uber Eats and DoorDash both provide a checkout flow to finalize and pay for orders.

**UC7: Track my order status**
**TABLE STAKES**: Uber Eats and DoorDash both provide real-time status updates (preparing, out for delivery, delivered).

**UC8: Rate a delivered order (1-5 stars)**
**TABLE STAKES**: Uber Eats and DoorDash both require or strongly encourage post-delivery ratings for restaurants and drivers.

**UC9: Earn loyalty points on delivery (1 pt per $ spent)**
**DIFFERENTIATOR**: While Uber Eats has "Uber One" (subscription) and DoorDash has "DashPass" (subscription), neither offers a simple, transparent, per-dollar point accumulation system for non-subscribers that functions like a traditional cashback/loyalty program.

**UC10: Redeem points for a discount at checkout (1 pt = $0.01)**
**DIFFERENTIATOR**: Uber Eats and DoorDash do not allow users to redeem accumulated points for direct checkout discounts; their loyalty models are primarily subscription-based (free delivery/fees) rather than point-redemption based.

**UC11: Control the app by voice (navigation only)**
**DIFFERENTIATOR**: Neither Uber Eats nor DoorDash offers native voice command navigation for core app functions like opening the cart or checking the total price.

**UC12: Restaurant handles an incoming order (accept/cook/ready)**
**TABLE STAKES**: Uber Eats and DoorDash both provide restaurant dashboards for accepting orders and updating preparation status.

**UC13: Restaurant reviews sales performance/insights**
**TABLE STAKES**: Uber Eats and DoorDash both provide basic sales reports and performance metrics to restaurant partners.

**UC14: Restaurant manages its menu**
**TABLE STAKES**: Uber Eats and DoorDash both allow restaurants to add, remove, and edit menu items and prices.

**UC15: Delivery partner claims a delivery job**
**TABLE STAKES**: Uber Eats and DoorDash both allow drivers to accept or reject delivery requests.

**UC16: Delivery partner picks up and delivers an order**
**TABLE STAKES**: Uber Eats and DoorDash both track the pickup and delivery process for drivers.

**UC17: Customer watches their delivery on a map (currently a scripted 20-second animation, not a real position feed)**
**TABLE STAKES**: Uber Eats and DoorDash both provide real-time GPS tracking of the driver’s location on a map; our scripted animation is a functional gap, not a differentiator, as rivals have the superior real-time version.

**UC18: Delivery partner reviews their earnings**
**TABLE STAKES**: Uber Eats and DoorDash both provide detailed earnings breakdowns for drivers.

**UC19: Customer earns and views achievement badges**
**DIFFERENTIATOR**: Uber Eats and DoorDash do not offer a visible system of achievement badges for customers based on order history or engagement.

**UC20: Customer sees the "Meal-for-a-Meal" donation impact counter**
**DIFFERENTIATOR**: Neither Uber Eats nor DoorDash has a built-in, visible counter showing the user’s personal impact on a "meal for a meal" donation program.

---

### Evaluation of Proposed Social Leaderboard

**Classification:** **DIFFERENTIATOR**

**Justification:** No major food delivery rival (Uber Eats, DoorDash, Grubhub) currently implements a social leaderboard that ranks users by loyalty points, badges, and donation impact with friend connections. While adjacent gamified products like Duolingo (language learning) and Strava (fitness) use leaderboards and friend comparisons, they do not apply this specific social competitive mechanic to food delivery loyalty and charitable impact.

**Stronger Alternative Differentiator:**
A stronger differentiator for a one-month build-and-test cycle would be **"Social Order Sharing" (e.g., "Order for a Friend" or "Group Cart")**.

**Why:**
1.  **Feasibility:** Building a robust social graph, real-time leaderboard updates, and privacy controls for friend connections is complex and risky for a one-month timeline. In contrast, allowing a user to send a cart link to a friend to add items or split the bill is a simpler, high-impact feature.
2.  **User Value:** Food is inherently social. Allowing users to easily coordinate group orders (e.g., office lunches, family dinners) addresses a common pain point where users currently have to manually share screenshots or call each other.
3.  **Viral Potential:** Group orders naturally drive new user acquisition as friends join the platform to complete the shared cart, offering a clearer growth loop than a leaderboard, which requires a critical mass of active users to be engaging.

## P4 — The support material we have not read yet

### Prompt

```text
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

### Result

Based on the repository snapshot provided, the file list is empty. Therefore, I cannot verify the specific line numbers or code logic mentioned in your prompt (e.g., `auth.js:31`, `donations.js:59`). I will mark the code-specific evidence as **UNVERIFIED** but will proceed to analyze the design extension based on the *stated* findings and the requested external support material.

Below is a long list of support material that would significantly change or constrain the design of the social leaderboard, friend connections, and donation features, given the identified security and integrity flaws.

### 1. Laws and Regulations

*   **GDPR (General Data Protection Law) – Articles 5, 9, and 14**
    *   **Relevance:** The leaderboard exposes ordering activity (potentially sensitive data regarding health/diet) and friend graphs (personal data) to third parties. Given the plaintext passwords and lack of session management, the system currently fails the "integrity and confidentiality" principle (Art. 5(1)(f)), making any social feature a direct compliance violation.
    *   **Rating:** **MUST-READ**

*   **CCPA/CPRA (California Consumer Privacy Act / California Privacy Rights Act)**
    *   **Relevance:** If the app serves California residents, the public visibility of user data on leaderboards constitutes "sharing" or "selling" of personal information without explicit opt-in mechanisms, which are currently absent due to the lack of a proper identity/session layer.
    *   **Rating:** **MUST-READ**

*   **FTC Act Section 5 (Unfair or Deceptive Acts or Practices)**
    *   **Relevance:** The "Meal-for-a-Meal" donation counter is a public claim of charitable impact. Since the code allows any unauthenticated caller to inflate this counter (`donations.js:59`), the app is making a deceptive claim about its social impact, exposing the company to FTC enforcement for deceptive advertising.
    *   **Rating:** **MUST-READ**

*   **EU Consumer Rights Directive (2011/83/EU) & Digital Content Directive (2019/770)**
    *   **Relevance:** Gamification elements that lock users into loyalty loops or create pressure to spend (via leaderboard ranking) may be scrutinized under consumer protection laws regarding unfair commercial practices, especially if the "double-spend" bug (`points.js:82-127`) leads to users receiving points they didn’t earn, creating a dispute over the value of digital content.
    *   **Rating:** **SHOULD-READ**

*   **Gig Worker Classification Laws (e.g., California AB5, UK IR35, EU Platform Work Directive)**
    *   **Relevance:** The finding that delivery-partner pay is taken directly from client input with no cap suggests a lack of proper payroll integration. If the app treats partners as independent contractors, it must comply with local labor laws regarding minimum wage, overtime, and benefits. The lack of server-side validation for pay implies a high risk of misclassification and wage theft claims.
    *   **Rating:** **MUST-READ**

*   **Charitable Solicitation Regulations (e.g., US State Attorney General Charitable Trust Laws)**
    *   **Relevance:** If the "Meal-for-a-Meal" feature is tied to a registered 501(c)(3) or equivalent, the organization must accurately report donations. The ability to inflate the counter without authentication means the financial records are unreliable, potentially violating fiduciary duties and charitable solicitation laws.
    *   **Rating:** **MUST-READ**

### 2. Standards

*   **OWASP Top 10 (2021) – A01: Broken Access Control & A02: Cryptographic Failures**
    *   **Relevance:** The plaintext password storage (`auth.js:31`) and lack of session tokens are direct violations of OWASP standards. Building a social graph on top of this is akin to building a house on sand; any social feature will be immediately exploitable via account takeover or impersonation.
    *   **Rating:** **MUST-READ**

*   **WCAG 2.1 (Web Content Accessibility Guidelines) – Level AA**
    *   **Relevance:** Leaderboards and friend lists are complex UI elements. If the app is not accessible to users with disabilities (e.g., screen reader compatibility for dynamic rank changes), it may violate the ADA (Americans with Disabilities Act) in the US or the European Accessibility Act. The current lack of structured identity data may also hinder the implementation of accessible user profiles.
    *   **Rating:** **SHOULD-READ**

*   **NIST SP 800-63B (Digital Identity Guidelines)**
    *   **Relevance:** This standard provides guidance on authentication and session management. The current implementation (client-side identity only) fails to meet even the lowest assurance levels (IAL1/AAL1). This document would mandate a complete re-architecture of the identity layer before any social features can be safely deployed.
    *   **Rating:** **MUST-READ**

### 3. Licenses

*   **License Compatibility of Dependencies (e.g., MIT, Apache 2.0, GPL)**
    *   **Relevance:** If the app uses open-source libraries for social graph visualization or leaderboard logic, their licenses must be compatible with the proprietary nature of the app. For example, using a GPL-licensed library for the leaderboard UI could force the entire app to be open-sourced, which is likely not the business intent.
    *   **Rating:** **SHOULD-READ**

*   **Data API Licenses (e.g., Mapbox, Stripe, Twilio)**
    *   **Relevance:** If the app uses third-party APIs for location (delivery) or payments, their terms of service often prohibit storing sensitive data (like user identities or transaction details) in plaintext or without proper encryption. The current security posture may violate these ToS, leading to service termination.
    *   **Rating:** **SHOULD-READ**

### 4. Domain Knowledge

*   **Research on Competitive Gamification (e.g., "The Dark Side of Gamification" by Deterding et al.)**
    *   **Relevance:** Studies show that public leaderboards can demotivate low-performing users and encourage unethical behavior (gaming the metric). Given the existing bugs (double-spend, donation inflation), users will likely exploit these flaws to climb ranks, leading to a "race to the bottom" in trust and engagement.
    *   **Rating:** **MUST-READ**

*   **Gig Economy Worker Well-being Guidelines (e.g., ILO Guidelines on Decent Work in the Platform Economy)**
    *   **Relevance:** These guidelines emphasize the need for transparent algorithms and fair pay. The lack of server-side caps on delivery pay and the opacity of the loyalty system may violate principles of decent work, leading to worker dissatisfaction and potential unionization or legal action.
    *   **Rating:** **SHOULD-READ**

*   **Psychology of Social Comparison (Festinger’s Social Comparison Theory)**
    *   **Relevance:** Public rankings trigger social comparison, which can lead to anxiety, shame, or unhealthy competition. In a food delivery context, this could encourage over-ordering to climb ranks, potentially leading to negative health outcomes and user churn.
    *   **Rating:** **SHOULD-READ**

### 5. Human Factors

*   **Operational Guidelines for Handling Rank Manipulation Disputes**
    *   **Relevance:** Given the integrity bugs (double-spend, donation inflation), users will inevitably manipulate their ranks. Without a clear, auditable, and secure system for tracking points and donations, the company will be unable to fairly resolve disputes, leading to customer support overload and reputational damage.
    *   **Rating:** **MUST-READ**

*   **User Trust and Transparency in Algorithmic Systems**
    *   **Relevance:** Users need to understand how their rank is calculated. If the system is opaque and prone to manipulation, trust will erode. The lack of a secure identity layer means users cannot be sure that their rank reflects their own actions, further undermining trust.
    *   **Rating:** **SHOULD-READ**

*   **Ethical Design Principles for Engagement-Driven Features

## P6 — Three futures

### Prompt

```text
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

### Result

Here are three distinct versions of the social leaderboard extension, ranging from the conservative to the speculative.

### 1. SAFE: The "Verified Peer" Leaderboard
**Elevator Pitch:** A private, opt-in leaderboard where users can only see rankings for friends they have explicitly connected with, ensuring social relevance without exposing the entire user base. We restrict the "donation impact" metric to verified, completed orders only, closing the current security gap that allows unauthenticated inflation.

**What four graduate students could build AND test in one month:**
1.  **Security Patch:** Implement authentication and authorization checks on the points ledger and donation counter endpoints to prevent unauthenticated inflation and double-spending (a prerequisite for any credible ranking).
2.  **Friend Graph API:** Build a simple `add_friend`/`remove_friend` endpoint and a `get_friends` endpoint using a basic graph structure (e.g., Neo4j or a relational join table).
3.  **Leaderboard Service:** Create a backend service that aggregates points, badges, and *verified* donation counts for a user’s friend list, sorted by a composite score.
4.  **Frontend UI:** A single "Friends" tab in the app showing a ranked list of friends with their current scores and a "Compare" button that highlights the user’s position relative to their top friend.
5.  **Test:** A/B test the engagement lift (time-on-app, repeat orders) for users who opt-in to the friend leaderboard vs. a control group, measuring if the social pressure increases order frequency.

**Biggest Risk:**
Low adoption of the "add friend" feature. If users don’t proactively connect with their real-life friends, the leaderboard remains empty and useless, leading to a "cold start" problem where the feature feels dead.

**Kill Signal:**
"We abandon this version if, after two weeks of launch, fewer than 5% of active users have added at least one friend, or if the average number of friends per user is less than 2."

---

### 2. BOLD: The "Guild" System with Shared Goals
**Elevator Pitch:** Instead of individual rankings, users form small "Guilds" (3–5 people) that compete against other Guilds for weekly prizes based on collective points, badges, and donation impact. This shifts the social dynamic from individual comparison to collaborative achievement, leveraging the existing points infrastructure to drive group retention.

**What four graduate students could build AND test in one month:**
1.  **Guild Creation & Management:** Build endpoints to create a Guild, invite friends, and assign roles (e.g., "Captain").
2.  **Aggregate Scoring Engine:** Modify the existing points/badge service to calculate real-time Guild totals (sum of members’ points, max badge tier, sum of verified donations).
3.  **Weekly Reset & Prize Logic:** Implement a cron job that resets Guild scores weekly and awards virtual "trophies" or small discounts to the top Guilds.
4.  **Guild Dashboard UI:** A screen showing the Guild’s current rank, progress bar to the next tier, and member contributions.
5.  **Test:** Measure the retention rate of users in Guilds vs. non-Guild users over a 4-week period, and track the increase in "donation impact" (verified orders) among Guild members compared to the baseline.

**Biggest Risk:**
Social friction and free-riding. If one member in a Guild stops ordering, the whole group’s rank drops, potentially causing conflict or churn. Additionally, if the prize value is too low, users may not care about the Guild’s rank, rendering the collaboration meaningless.

**Kill Signal:**
"We abandon this version if, after one month, the average Guild size drops below 2.5 members, or if the churn rate of users in Guilds is higher than the control group."

---

### 3. WILD: The "Public Shame" Leaderboard
**Elevator Pitch:** A fully public, anonymous leaderboard where all users are ranked by donation impact, with the bottom 10% receiving a "Hungry Wolf" badge that is visible to their friends. This uses negative social pressure (shame) to drive order frequency, betting that the fear of being seen as "less generous" will outweigh the privacy concerns.

**What four graduate students could build AND test in one month:**
1.  **Anonymous Public Ranking:** Build a public API endpoint that returns the top 100 and bottom 100 users by donation impact, with usernames masked (e.g., "Wolf_123").
2.  **Shame Badge Logic:** Implement a rule that assigns a "Hungry Wolf" badge to users in the bottom 10% of donation impact, which is visible on their profile to friends.
3.  **Friend Notification System:** When a friend receives the "Hungry Wolf" badge, send a push notification to their friends: "Your friend [Name] is in the bottom 10% for donations. Help them out!"
4.  **Privacy Toggle:** A simple on/off switch for users to hide their donation impact from the public leaderboard (but not from friends).
5.  **Test:** Measure the change in order frequency for users who receive the "Hungry Wolf" badge vs. a control group, and track the number of users who disable the privacy toggle after receiving the badge.

**Biggest Risk:**
User backlash and churn. Public shaming is a high-risk strategy; users may feel embarrassed or angry, leading to negative reviews, social media complaints, and a drop in trust. Additionally, the "donation impact" metric is still vulnerable to manipulation if the security patch isn’t perfect, making the "shame" unfair and potentially toxic.

**Kill Signal:**
"We abandon this version if, within one week of launch, we receive more than 50 negative reviews or social media complaints specifically mentioning the "Hungry Wolf" badge, or if the churn rate of users who received the badge exceeds 20%."

## P8 — Mission statement, minus the buzzwords

### Prompt

```text
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

### Result

#### Candidate 1 — Trusted Social Competition

Food-delivery rewards are usually solitary, giving customers points and badges without a meaningful way to share their progress with friends. Hungry Wolf will add a friends-only leaderboard that compares customers across loyalty points, earned badges, and verified donation impact. Before publishing any rankings, we will introduce authenticated identities and prevent forged donation increments and concurrent point redemptions. Unlike existing loyalty programs, each Hungry Wolf donation score represents one Meal-for-a-Meal contribution for every ten completed deliveries. This turns isolated rewards into trustworthy social progress while recognizing the customers, restaurants, and delivery partners who produce that impact.

#### Candidate 2 — Community Impact

Customers regularly earn delivery-app rewards, but current programs do not show how their achievements and social contributions compare with those of their friends. Hungry Wolf will connect customers through private friend rankings based on loyalty points, achievement badges, and Meal-for-a-Meal contributions. Every ranking will be calculated from authenticated, server-verified activity so users cannot manufacture points or inflate donation totals. Our distinctive measure converts every ten completed Hungry Wolf deliveries into one donated meal and displays that impact alongside conventional rewards. Customers gain a reason to revisit their achievements, while restaurants and delivery partners can see how completed orders contribute to a larger community benefit.

#### Candidate 3 — Privacy and Choice

Public rankings can expose purchasing habits, while individual reward systems offer no social connection at all. Hungry Wolf will provide an opt-in leaderboard where customers choose accepted friends and compare points, badges, or donation impact without exposing their activity to everyone. A new session and token layer will establish real identity, and Firestore transactions will protect the values used to calculate each rank. No surveyed rival combines friends-only food-delivery rankings with Hungry Wolf's specific rule of one donated meal per ten completed deliveries. The result is social competition that customers can trust, control, and connect to measurable charitable impact.

## P9 — Milestone reality check

### Prompt

```text
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

### Result

We need to classify each milestone as REALISTIC, STRETCH, or FANTASY based on the team's skills and the time budget (4 people * 10 hours/week * 4 weeks = 160 total hours).

**Team Skills Summary:**
- Seung Wook: Backend (Java/Spring, Python), LLM APIs, Vercel/Supabase.
- Mahek: AI/ML, Full-stack (Python, C++, TS/Next.js), RAG/LLM, FastAPI/Flask, PyTorch, OpenCV.
- Kevin: Python, Java, PyTorch, JS, Flask.
- Liwen: LLM/Multi-agents, AI, Full-stack (Python, JS, PyTorch, TF, Java, SQL).

The team is strong in Python, JS/TS, and backend APIs. They have experience with cloud services (Supabase, Vercel) and LLMs, but the project seems to be a standard web app with Firestore, React, and Node/Python backend. The "LLM" skills are likely overkill for this specific task unless the leaderboard involves AI features (which it doesn't seem to, based on the description). The core tasks are CRUD, auth, and aggregation.

**Time Budget:** 160 hours total.

**Milestone Analysis:**

1.  **Build an aggregation API that computes each user's leaderboard score from data already in Firestore: loyalty points and badges are stored per user, and donation contribution is derived from the user's delivered-order count — no new data collection required.**
    *   **Analysis:** This is a standard backend task. Reading from Firestore, performing some aggregation (summing points, counting orders), and returning a score. The team has strong backend skills (Java, Python, Flask, FastAPI). This is a well-defined, low-complexity task.
    *   **Classification:** REALISTIC.
    *   **Why:** It is a straightforward CRUD/aggregation task that leverages the team's existing backend and database skills without requiring new infrastructure or complex logic.

2.  **Add friend connections: send/accept a friend request, stored in Firestore, with an endpoint to list a user's friends.**
    *   **Analysis:** This involves creating a new data model (friend requests/friendships), implementing state transitions (send -> accept -> friend), and providing API endpoints. This is standard social graph functionality. It requires careful handling of state (pending, accepted, rejected) and potentially some race conditions, but it's a common pattern.
    *   **Classification:** REALISTIC.
    *   **Why:** Implementing a basic friend request system with state management is a standard full-stack task that fits well within the team's capabilities and time budget.

3.  **Build the leaderboard screen in the React client: global ranking and a friends-only ranking, with the user's own row highlighted and a privacy control so each user chooses whether they appear on the global board (friends-only by default).**
    *   **Analysis:** This is a frontend task. It requires building a UI component that fetches data from the API (Milestone 1), filters it (global vs. friends), highlights the current user, and includes a toggle for privacy. React is a common skill (Liwen and Mahek have TS/Next.js/JS experience). The logic is simple: fetch, filter, render. The privacy control is just a boolean flag in the user profile that the API respects.
    *   **Classification:** REALISTIC.
    *   **Why:** The frontend logic is simple (fetch, filter, render) and the team has sufficient React/TypeScript experience to build a clean, functional UI within the timeframe.

4.  **Introduce a minimal session/token auth layer (none exists today) and use it to fix the integrity holes the leaderboard depends on: lock down the unauthenticated donation-counter increment (donations.js:59) and the points double-spend race (points.js:82-127) so ranks cannot be forged.**
    *   **Analysis:** This is the most complex and risky milestone. It involves:
        *   Implementing authentication from scratch (or integrating a library) in a system that currently has none. This includes user registration/login, token generation, middleware for protecting routes, and handling token expiration/refresh.
        *   Fixing specific race conditions and security holes in existing code (`donations.js` and `points.js`). This requires understanding the existing codebase, identifying the exact race conditions, and implementing atomic operations or transactions in Firestore to prevent double-spending and unauthorized increments.
        *   The phrase "none exists today" implies significant refactoring of existing endpoints to require auth.
        *   Race conditions in distributed systems (Firestore) are notoriously tricky. Ensuring atomicity for points and donations requires careful use of Firestore transactions or batched writes with validation.
    *   **Classification:** STRETCH.
    *   **Why:** Implementing a robust auth layer from scratch while simultaneously fixing subtle race conditions in existing financial/points logic is a high-risk, high-complexity task that could easily consume the entire 160-hour budget if the existing code is poorly structured or if the race conditions are harder to fix than anticipated.

5.  **End-to-end test: seed three users (two friends, one not), place orders, verify the global and friends-only rankings update correctly (the friends-only view provably excludes the non-friend) and forged-rank attempts are rejected.**
    *   **Analysis:** This is a testing task. It requires writing test scripts (likely using a test framework like Jest, Pytest, or a simple Node script) that interact with the API. It involves seeding data, making API calls, and asserting on the results. The team has experience with testing (implied by their professional backgrounds). The scope is limited to three users and specific scenarios.
    *   **Classification:** REALISTIC.
    *   **Why:** Writing a focused end-to-end test suite for a small number of users and specific scenarios is a manageable task that ensures the core functionality works as expected.

**FANTASY Milestones:**
None of the milestones are FANTASY. They are all achievable, though Milestone 4 is a STRETCH.

**Proposed Slice for STRETCH (Milestone 4):**
Since Milestone 4 is a STRETCH, we should propose the largest slice of it that would be REALISTIC.
*   **Slice:** Implement a minimal JWT-based auth layer (login/register endpoints, middleware to protect API routes) and apply it to the *new* leaderboard and friend endpoints. Defer fixing the existing `donations.js` and `points.js` race conditions to a future phase, or implement a simple "soft" lock (e.g., checking the current value before updating) rather than a fully atomic transaction, acknowledging that it may not be 100% secure against sophisticated attacks but will prevent casual forgery.
*   **Why:** This allows the team to secure the new features they are building (leaderboard, friends) without getting bogged down in the complexities of refactoring and securing the existing, potentially messy, points/donation logic. It provides a realistic path to a secure MVP for the new features.

**Final Classification:**

1.  **REALISTIC**: It is a straightforward CRUD/aggregation task that leverages the team's existing backend and database skills without requiring new infrastructure or complex logic.
2.  **REALISTIC**: Implementing a basic friend request system with state management is a standard full-stack task that fits well within the team's capabilities and time budget.
3.  **REALISTIC**: The frontend logic is simple (fetch, filter, render) and the team has sufficient React/TypeScript experience to build a clean, functional UI within the timeframe.
4.  **STRETCH**: Implementing a robust auth layer from scratch while simultaneously fixing subtle race conditions in existing financial/points logic is a high-risk, high-complexity task that could easily consume the entire 160-hour budget if the existing code is poorly structured or if the race conditions are harder to fix than anticipated.
5.  **REALISTIC**: Writing a focused end-to-end test suite for a small number of users and specific scenarios is a manageable task that ensures the core functionality works as expected.

**Largest Realistic Slice of STRETCH (Milestone 4):**
Implement a minimal JWT-based auth layer (login/register, middleware) and apply it

## P10 — Red team (mandatory, D5)

### Prompt

```text
You are hostile to our proposal. Below: our mission statement, milestones,
and market survey.

OUR MISSION STATEMENT (chosen from the P8 candidates):

Competition only matters when people can trust the score and understand
what it represents. Hungry Wolf is building a food-delivery community
where customers can connect with friends and compare verified progress.
The leaderboard ranks loyalty points, badges earned, and Meal-for-a-Meal
impact while keeping friend comparisons separate from optional public
rankings. Its donation score comes directly from completed deliveries --
one donated meal for every ten delivered orders -- not from self-reported
activity. This gives customers a trustworthy way to turn ordering,
achievement, and giving into a shared experience.

OUR MILESTONES (revised after the four-model P9 review):

1. Minimal JWT session layer first -- register/login issue tokens;
   middleware protects all new endpoints; gate the unauthenticated
   donation-counter increment (donations.js:59). Best-effort within this
   milestone: wrap points redemption in a Firestore transaction
   (points.js:82-127); if it slips, ship with it documented as a known
   limitation.
2. Aggregation API -- per-user score from the points ledger, badge count,
   and delivered-order count (never the mutable public donation counter).
3. Friend connections -- send/accept/list only; no suggestions, blocking,
   or contact import.
4. Leaderboard screen -- global + friends-only ranking, own row
   highlighted; privacy enforced by the API, not the client (friends-only
   by default; global opt-in toggle only if time allows).
5. E2E + abuse tests -- three seeded users (two friends, one not);
   friends-only view provably excludes the non-friend; forged-rank
   attempts rejected; two concurrency tests (simultaneous redemptions,
   repeated donation/rank writes).

OUR MARKET SURVEY (10 rivals confirmed across three models by the
two-model rule or a live evidence URL):

| Product                            | What it shows about our gap                                                |
| ---------------------------------- | -------------------------------------------------------------------------- |
| Starbucks Rewards                  | Deepest US food/beverage gamification -- entirely solo, no friend ranking  |
| DoorDash challenges                | Dominant US delivery app gamifies with solo, time-limited challenges       |
| Uber Eats loyalty                  | Transactional per-restaurant rewards; verified no customer leaderboard     |
| Chipotle Summer of Extras          | Real leaderboards, but seasonal (ended Aug 31, 2026), regional, friendless |
| Snackpass                          | Social food ordering (friends' orders, gifts) but no competitive ranking   |
| Beli                               | Friend leaderboards over restaurant logging, not verified orders           |
| ShareTheMeal Teams                 | Donation-team leaderboards in an app with no food ordering                 |
| Nike Run Club (repr. fitness apps) | The proven friend-leaderboard UX loop -- in fitness, not food              |
| Gameball (repr. loyalty SaaS)      | Leaderboard SDKs exist but 4-6 week integration, no friend graph           |
| Grab Rewards Challenges            | Non-US delivery gamification -- single-player only                         |

Gap: no delivery platform ships a persistent, friend-facing leaderboard,
let alone one ranking loyalty points, badges, and donation impact
together.

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

### Result

Here is the hostile analysis of the Hungry Wolf proposal, structured by the three requested fronts.

### Front 1: Nobody wants it — the need is imagined.

**The Attack:**
The core premise of Hungry Wolf is that users will voluntarily connect their social graph to a transactional service (food delivery) to engage in competitive ranking. This is a fundamental category error. Food delivery is a utility, not a hobby. Users open DoorDash or Uber Eats to solve a hunger problem, not to check their standing relative to their friends.

1.  **The "Novelty Decay" Problem:** Leaderboards in non-gaming contexts suffer from rapid engagement decay. In fitness apps (like Nike Run Club), the activity is tied to health and self-improvement, which has intrinsic long-term value. In food delivery, the "achievement" is merely the act of spending money. Once the initial novelty of seeing a friend’s name on a list wears off (typically within 2-4 weeks), the leaderboard becomes noise. There is no intrinsic reward for "ordering more food" other than the food itself, which the user already received.
2.  **The Privacy Chill:** Making ordering activity visible to friends creates a significant social friction. Users may hesitate to order certain items (e.g., late-night junk food, alcohol, or specific dietary choices) if they know their friends can see it. This "privacy chill" can actually *suppress* usage, as users may avoid the app to maintain social discretion. The proposal claims "privacy enforced by the API," but the mere existence of a friend-facing leaderboard changes the psychological contract of the app from private utility to public performance.
3.  **Low Social Graph Density in Delivery:** Unlike social networks or fitness apps, delivery apps have low social graph density. Users rarely "add friends" in delivery apps because there is no shared context for doing so. The proposal assumes users will manually send/accept friend requests (Milestone 3). In practice, friction in social graph building is the #1 killer of social features. If users don't add friends, the "friends-only" leaderboard is empty, and the "global" leaderboard is a race to the bottom based on who spends the most money, which alienates average users.

**Evidence that would defeat this attack:**
*   **Retention Data from Adjacent Social-Utility Apps:** Data showing that social features in utility apps (e.g., Strava’s segments, Duolingo’s leagues) have a measurable, sustained impact on long-term retention (beyond 30 days) specifically for the *utility* action (running/learning), not just the social interaction.
*   **User Intent Surveys:** Primary research (surveys or interviews) with 100+ potential users showing that >30% of users *actively* want to see their friends’ food ordering activity and would use a friend leaderboard if it existed.
*   **A/B Test Results from a Pilot:** If a small-scale pilot (even a mockup) shows that users who have friends connected to the app have a higher frequency of orders or higher retention than those who do not, controlling for privacy settings.

---

### Front 2: They cannot build it — the month is too short, the team too green.

**The Attack:**
The proposal attempts to solve two fundamentally different problems in one month: (1) fixing a broken security/integrity layer, and (2) building a new social/competitive feature. The inherited codebase is described as having "plaintext passwords, no session/token layer, an unauthenticated donation-counter endpoint, and a points double-spend race." This is not a "greenfield" project; it is a remediation project with a feature bolted on.

1.  **Security Debt is a Time Sink:** Implementing a "Minimal JWT session layer" (Milestone 1) is not a trivial task. It requires:
    *   Refactoring all existing endpoints to use middleware.
    *   Migrating or securing existing user data (plaintext passwords).
    *   Handling token refresh, expiration, and revocation.
    *   Fixing the unauthenticated donation counter (donations.js:59) and the points double-spend race (points.js:82-127).
    *   This alone could consume 2-3 weeks of a 4-person team’s time, leaving only 1-2 weeks for the social layer.
2.  **The "Best-Effort" Trap:** The proposal states that if the Firestore transaction for points redemption slips, it will be "documented as a known limitation." This is unacceptable for a product that claims to be "trustworthy" (Mission Statement). A leaderboard that can be gamed via double-spending points is not trustworthy. If the integrity layer is not fully fixed, the entire value proposition collapses.
3.  **Complexity of Aggregation and Privacy:** Milestone 2 (Aggregation API) and Milestone 4 (Leaderboard) require complex queries to combine points, badges, and delivery counts while enforcing privacy rules (friends-only vs. global). This is non-trivial in Firestore, especially with the need to highlight the user’s own row and enforce opt-in/opt-out logic.
4.  **Testing Overhead:** Milestone 5 requires E2E and abuse tests, including concurrency tests. Writing robust concurrency tests for Firestore transactions is difficult and time-consuming. Four students with ~10 hours/week each (40 hours/week total) have only ~160 hours of capacity. After accounting for security fixes, API development, and testing, there is no buffer for the inevitable bugs and integration issues.

**Evidence that would defeat this attack:**
*   **Proof of Concept for Security Fixes:** A working prototype of the JWT layer and the fixed points/donation endpoints, demonstrating that the integrity issues are resolved in <1 week.
*   **Detailed Technical Plan with Time Estimates:** A granular breakdown of the 160 hours, showing exactly how many hours are allocated to security, API, frontend, and testing, with a clear critical path.
*   **Team Experience Evidence:** Resumes or past projects demonstrating that the team has successfully shipped a secure, multi-user web application with a social graph in a similar timeframe.
*   **Simplified Scope:** A revised plan that explicitly drops the "global" leaderboard and the "badges" component, focusing only on the core friend-based points leaderboard, to reduce complexity.

---

### Front 3: Someone does it better — name who.

**The Attack:**
The market survey claims a gap, but it ignores the fact that the *components* of Hungry Wolf’s value proposition are already well-served by existing products, and the *combination* is not unique enough to justify a new app.

1.  **Starbucks Rewards + Social Media:** Starbucks has the deepest loyalty program in the US. Users already share their Starbucks rewards on social media (Instagram, Twitter) as a status symbol. The "friend leaderboard" is effectively replaced by social media sharing. Users don’t need a built-in leaderboard; they use their existing social graphs to showcase their loyalty.
2.  **Nike Run Club / Strava:** These apps have proven that friend leaderboards work *when the activity is tied to personal improvement*. However, they are not food delivery apps. The key difference is that running is a health activity, while food delivery is a consumption activity. The "better" product is not a food delivery app with a leaderboard, but a fitness app that tracks food intake (like MyFitnessPal) with social features. MyFitnessPal has social features and leaderboards, and it is more relevant to "food" than a delivery app.
3.  **Gameball / Loyalty SaaS:** The survey mentions Gameball as a "loyalty SaaS" with a 4-6 week integration. This is a red herring. Gameball is a B2B product, not a consumer app. The "better" product is not a SaaS, but the fact that major delivery apps (DoorDash, Uber Eats) have *chosen* not to implement friend leaderboards. This is a signal, not a gap. They have likely tested it and found it ineffective or harmful to the user experience.
4.  **The "Verified Progress" Claim:** The proposal claims that the donation score is "verified" because it comes from completed deliveries. However, this is not a unique selling point. Any delivery app can track completed deliveries. The "verification" is trivial. The real gap is not in verification, but in the *social* aspect, which is already served by social media.

**Evidence that would defeat this attack:**
*   **Competitive Analysis of Failed Features:** Evidence that major delivery apps (DoorDash, Uber Eats) have *not* implemented friend leaderboards because they are ineffective, or evidence that they have implemented similar features and they have failed. If they have failed, Hungry Wolf needs a clear reason why their approach is different.
*   **User Preference for Built-in vs. Social Media:** Data showing that users prefer a built-in, private friend leaderboard over sharing their activity on public social media.
*   **Differentiation in "Verified Impact":** Evidence that the "Meal-for-a-Meal" donation impact is a unique and compelling feature that is not available in any other app, and that users value this specific type of social proof.
*   **Pilot Data on Social Sharing:** Data showing that users who use Hungry Wolf’s friend leaderboard are less likely to share their activity on social media, indicating that the built-in feature is a superior substitute.

### Conclusion

The proposal is ambitious but risky. The need is questionable, the technical scope is too large for the team and timeframe, and the competitive landscape suggests that the "gap" may be a feature that users do not want. To proceed, the team must:
1.  Validate the need with primary user research.
2.  Reduce the scope to focus on the core friend-based leaderboard, dropping the global leaderboard and badges.
3.  Prioritize the security fixes and prove they can be completed in <1 week.
4.  Clearly articulate why their approach is different from and better than existing social media sharing and fitness app leaderboards.
