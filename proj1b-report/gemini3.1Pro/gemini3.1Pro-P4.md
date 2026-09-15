Here is a comprehensive list of support materials that directly address the massive legal, technical, and psychological risks posed by combining your code findings with a competitive social leaderboard.

### Laws and Regulations

* **Source:** GDPR (General Data Protection Regulation) Article 25 (Data protection by design) and Article 32 (Security of processing).
* **Impact:** Touches the proposed friend connections and leaderboard because broadcasting a user's food-ordering history over an identity layer that lacks secure sessions and stores passwords in plaintext (auth.js:31) explicitly violates the legal mandate to secure personal data.
* **Rating:** MUST-READ


* **Source:** FTC Act Section 5 (Deceptive or Unfair Acts or Practices).
* **Impact:** Touches UC20 (Meal-for-a-Meal donation counter) because publicly displaying a donation metric that any unauthenticated caller can arbitrarily inflate (donations.js:59) constitutes a deceptive marketing claim regarding the company's charitable contributions.
* **Rating:** MUST-READ


* **Source:** California AB 488 (Supervision of Trustees and Fundraisers for Charitable Purposes Act).
* **Impact:** Touches UC20 and the donation impact leaderboard because as a platform tracking charitable contributions, Hungry Wolf is subject to strict transparency and fund-disbursement regulations that an easily manipulated, unauthenticated donation counter completely violates.
* **Rating:** MUST-READ


* **Source:** EU Platform Work Directive (Directive 2024/2831).
* **Impact:** Touches UC15 (Delivery partner claims job) and UC18 (Delivery partner reviews earnings) because the finding that driver pay is taken directly from unvalidated client input violates stringent new gig-economy regulations demanding algorithmic transparency, fairness, and security in worker compensation.
* **Rating:** SHOULD-READ


* **Source:** FTC Staff Report "Bringing Dark Patterns to Light" (2022).
* **Impact:** Touches UC19 (Earn achievement badges) and the leaderboard by warning against engagement-maximizing "dark patterns" that manipulate consumer behavior, an important guardrail when designing competitive e-commerce gamification.
* **Rating:** SKIM



### Standards

* **Source:** OWASP Application Security Verification Standard (ASVS) v4.0 (specifically V2: Authentication and V3: Session Management).
* **Impact:** Directly addresses the findings on plaintext passwords (auth.js:31) and the lack of server-side sessions, detailing the mandatory architectural prerequisites for fixing the identity layer before you can safely introduce a social friend graph.
* **Rating:** MUST-READ


* **Source:** OWASP Top 10 (2021) - A01:2021 (Broken Access Control) and A04:2021 (Insecure Design).
* **Impact:** Addresses the concurrency race condition allowing double-spent loyalty points (points.js:82-127) and the unauthenticated donation inflation (donations.js:59), providing the standard remediation blueprints for these critical business logic flaws.
* **Rating:** MUST-READ


* **Source:** W3C Web Content Accessibility Guidelines (WCAG) 2.2 AA.
* **Impact:** Touches UC11 (Control app by voice) and the proposed leaderboard UI, ensuring that complex data tables (social rankings) and voice-only interactions remain accessible and legally compliant under ADA Title III.
* **Rating:** SHOULD-READ



### Licenses

* **Source:** GNU Affero General Public License (AGPL) v3.
* **Impact:** Touches the entire backend required for UC1-UC20; if you attempt a fast fix for the concurrency bug in `points.js` or the leaderboard logic by pulling in an AGPL-licensed open-source library, you could be legally forced to open-source Hungry Wolf's entire proprietary server codebase.
* **Rating:** MUST-READ


* **Source:** OpenStreetMap Open Database License (ODbL) v1.0.
* **Impact:** Touches UC17 (Customer watches delivery map) because if the new social capabilities eventually replace the 20-second scripted map animation with real location data, you must comply with the strict "share-alike" and attribution requirements of underlying map data providers.
* **Rating:** SKIM



### Domain Knowledge

* **Source:** Hanus, M. D., & Fox, J. (2015). *"Assessing the effects of gamification in the classroom: A longitudinal study on intrinsic motivation, social comparison, satisfaction, effort, and academic performance"* (Computers & Education).
* **Impact:** Touches UC19 (Earn badges) and the proposed social leaderboard by empirically demonstrating how mandatory social comparison and competitive rank can actually decrease intrinsic motivation and lead to severe user fatigue over time.
* **Rating:** MUST-READ


* **Source:** Fairwork Foundation *"Fairwork Principles"* (Oxford Internet Institute).
* **Impact:** Touches UC18 (Driver reviews earnings) and the finding that driver pay is client-manipulated, offering an ethical framework for how gig compensation algorithms must be securely and fairly designed.
* **Rating:** SHOULD-READ



### Human Factors & Behavioral Economics

* **Source:** National Eating Disorders Association (NEDA) guidelines on *"Media, Body Image, and Eating Disorders"*.
* **Impact:** Touches the core concept of a food-ordering leaderboard, highlighting the severe ethical and psychological risk of inadvertently incentivizing binge eating or unhealthy over-ordering simply so a user can climb a public ranking among friends.
* **Rating:** MUST-READ


* **Source:** *Goodhart’s Law* (Concept: "When a measure becomes a target, it ceases to be a good measure").
* **Impact:** Touches the proposed leaderboard, UC9 (Earn points), and the loyalty double-spend bug (points.js:82-127), explaining the behavioral certainty that users will actively search for and exploit your vulnerable code to farm points the exact moment you attach social prestige to those metrics.
* **Rating:** MUST-READ


* **Source:** Festinger, L. (1954). *"A Theory of Social Comparison Processes"*.
* **Impact:** Touches the friend connection and leaderboard design by explaining the fundamental psychological mechanisms (and the potential for toxic social comparison, shame, and anxiety) triggered when users are forced to broadcast their private consumption habits to peers.
* **Rating:** SKIM