# Hungry Wolf — Support Material Reading List
**Role:** Market Analyst  
**Date:** September 2026  
**Context:** Social leaderboard extension design; known code findings: plaintext passwords (auth.js:31), no server-side session (client-side identity), donation counter inflatable by unauthenticated callers (donations.js:59), loyalty-point double-spend via concurrency race (points.js:82–127), delivery-partner pay taken from client input with no cap.

---

## Rating Key

| Rating | Meaning |
|---|---|
| **MUST-READ** | Will directly change a design or architecture decision; cite in report |
| **SHOULD-READ** | High relevance; read before finalizing the leaderboard feature |
| **SKIM** | Useful background; read the summary and return to sections as needed |

---

## 1. Laws & Regulations — Privacy and Data Protection

### 1.1 California Consumer Privacy Act (CCPA) — Full Text and AG Regulations
**Source:** California Attorney General — https://oag.ca.gov/privacy/ccpa  
**Touches:** A public leaderboard makes a user's ordering frequency, badge activity, and friend graph visible to others — all personal data under CCPA. The plaintext-password finding (auth.js:31) compounds breach risk dramatically.  
**Rating: MUST-READ**

---

### 1.2 FTC Act Section 5 — Unfair or Deceptive Acts or Practices
**Source:** Federal Trade Commission — https://www.ftc.gov/legal-library/browse/statutes/federal-trade-commission-act  
**Touches:** The inflatable Meal-for-a-Meal counter (donations.js:59) makes a public charitable-giving claim; if the counter is inaccurate, displaying it to users and friends on a leaderboard is potentially deceptive under Section 5. Also relevant to gamification dark patterns.  
**Rating: MUST-READ**

---

### 1.3 FTC "Start with Security" — A Guide for Business
**Source:** Federal Trade Commission — https://www.ftc.gov/business-guidance/resources/start-security-guide-business  
**Touches:** Directly names plaintext password storage and missing server-side authentication as failures the FTC has taken enforcement action on. Our auth.js:31 and no-session findings map exactly onto prior FTC cases cited in this guide.  
**Rating: MUST-READ**

---

### 1.4 Children's Online Privacy Protection Rule (COPPA)
**Source:** Federal Trade Commission — https://www.ftc.gov/legal-library/browse/rules/childrens-online-privacy-protection-rule-coppa  
**Touches:** A social friend graph and public leaderboard are high-risk if any users are under 13; UC1 (sign-up) must verify age or block under-13 users from social features. Friend lists are explicitly "personal information" under COPPA.  
**Rating: MUST-READ**

---

### 1.5 NIST Privacy Framework (Version 1.0)
**Source:** National Institute of Standards and Technology — https://www.nist.gov/privacy-framework/privacy-framework  
**Touches:** Provides a structured approach to data minimization and consent mapping for the friend-graph and leaderboard. Relevant to UC1 (sign-up consent), UC3 (profile data), and UC19/UC20 (public activity visibility).  
**Rating: SHOULD-READ**

---

### 1.6 FTC Report: "Mobile Security Updates: Understanding the Issues" (2018)
**Source:** Federal Trade Commission — https://www.ftc.gov/reports/mobile-security-updates  
**Touches:** Frames the duty of app operators to keep authentication and session infrastructure current — directly implicates the no-session finding and the client-side identity model before we layer social features on top.  
**Rating: SHOULD-READ**

---

## 2. Laws & Regulations — Consumer Protection and Gamification

### 2.1 FTC Report: "Bringing Dark Patterns to Light" (September 2022)
**Source:** Federal Trade Commission — https://www.ftc.gov/reports/dark-patterns  
**Touches:** A leaderboard that ranks users publicly and incentivizes repeat ordering to climb ranks is exactly the "engagement loop" the FTC flags as a potential dark pattern. UC9 (earn points), UC10 (redeem), and the leaderboard design all need review against this taxonomy.  
**Rating: MUST-READ**

---

### 2.2 FTC Endorsement Guides (16 CFR Part 255) — Updated 2023
**Source:** Federal Trade Commission — https://www.ftc.gov/legal-library/browse/rules/ftcs-endorsement-guides-what-people-are-asking  
**Touches:** If leaderboard rankings or badge achievements are shared publicly or used in marketing ("See who's at the top!"), the FTC's updated guides on social proof and endorsement apply — particularly if top-ranked users receive rewards that are not disclosed.  
**Rating: SHOULD-READ**

---

### 2.3 California Department of Consumer Affairs — Automatic Renewal Law (ARL, Bus. & Prof. Code §17600)
**Source:** California Legislative Information — https://leginfo.legislature.ca.gov/faces/codes_displaySection.xhtml?sectionNum=17600.&lawCode=BPC  
**Touches:** If the loyalty or leaderboard program involves any subscription tier or auto-renewing benefit (future monetization path), California's ARL imposes strict disclosure and cancellation requirements that affect UC10 (point redemption flows).  
**Rating: SKIM**

---

## 3. Laws & Regulations — Charitable Donation Claims

### 3.1 FTC Guidance: "Charitable Solicitations — Be a Savvy Donor"
**Source:** Federal Trade Commission — https://www.ftc.gov/tips-advice/business-center/guidance/charitable-solicitations  
**Touches:** Our Meal-for-a-Meal counter (UC20) makes a public claim that ordering generates a donated meal. The code finding at donations.js:59 means this counter can be inflated by any unauthenticated caller — displaying an inflated number is a false charitable claim under FTC guidance.  
**Rating: MUST-READ**

---

### 3.2 State Charitable Solicitation Registration Laws — NAAG Summary
**Source:** National Association of Attorneys General — https://www.naag.org/issues/charitable-solicitation/  
**Touches:** Most US states require registration before publicly soliciting charitable contributions. A "Meal-for-a-Meal" counter displayed to users in those states may constitute solicitation, requiring registration. Affects UC20 and the leaderboard's donation-impact column.  
**Rating: MUST-READ**

---

### 3.3 IRS Publication 526: Charitable Contributions
**Source:** Internal Revenue Service — https://www.irs.gov/pub/irs-pdf/p526.pdf  
**Touches:** If Hungry Wolf represents to users that their orders generate a tax-deductible donation, IRS rules on substantiation and written acknowledgment apply. Even a counter label ("You've donated X meals!") can imply deductibility; affects UC20 copy and marketing.  
**Rating: SHOULD-READ**

---

## 4. Laws & Regulations — Gig-Worker Labor Law

### 4.1 DOL Final Rule: "Employee or Independent Contractor Classification Under the FLSA" (January 2024)
**Source:** U.S. Department of Labor — https://www.dol.gov/agencies/whd/flsa/2024-independent-contractor  
**Touches:** The finding that delivery-partner pay is taken directly from client input with no server-side cap (UC15/UC16/UC18) is a significant liability if workers are misclassified. The 2024 rule's six-factor economic reality test is the current legal standard for classification.  
**Rating: MUST-READ**

---

### 4.2 California Assembly Bill 5 (AB5) — Worker Classification Law
**Source:** California Legislative Information — https://leginfo.legislature.ca.gov/faces/billNavClient.xhtml?bill_id=201920200AB5  
**Touches:** California's ABC test for independent contractors is stricter than the federal standard. If any delivery partners operate in California, the no-cap pay finding and gig-worker model need legal review before shipping. Touches UC15, UC16, UC18.  
**Rating: SHOULD-READ**

---

### 4.3 NLRB General Counsel Memo: "Misclassification of Employees as Independent Contractors" (GC 22-05, 2022)
**Source:** National Labor Relations Board — https://www.nlrb.gov/guidance/memos/general-counsel-memos  
**Touches:** Frames platform-driven algorithmic control (including gamification rewards for delivery partners) as a factor in determining whether workers should be treated as employees. A leaderboard that ranks partners by delivery volume could be construed as directing work. Touches UC15, UC16, UC18.  
**Rating: SHOULD-READ**

---

## 5. Standards — Security

### 5.1 OWASP Top Ten (2021)
**Source:** Open Web Application Security Project — https://owasp.org/www-project-top-ten/  
**Touches:** The auth.js:31 plaintext-password finding maps to A02 (Cryptographic Failures); the no-session/client-side identity finding maps to A07 (Identification and Authentication Failures); the unauthenticated donation inflation maps to A01 (Broken Access Control). All three are in the Top Ten. Mandatory reading before building any social feature.  
**Rating: MUST-READ**

---

### 5.2 OWASP Authentication Cheat Sheet
**Source:** OWASP Cheat Sheet Series — https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html  
**Touches:** Step-by-step remediation for the auth.js:31 plaintext-password finding and the missing server-side session. A social leaderboard that ties real identity to a public ranking cannot ship on a broken auth layer. Directly touches UC1, UC2, and all social UCs.  
**Rating: MUST-READ**

---

### 5.3 OWASP Session Management Cheat Sheet
**Source:** OWASP Cheat Sheet Series — https://cheatsheetseries.owasp.org/cheatsheets/Session_Management_Cheat_Sheet.html  
**Touches:** The no-session/client-side identity finding means friend connections, leaderboard positions, and badge ownership can be spoofed. This cheat sheet defines the minimum viable server-side session model required before social features can be trusted.  
**Rating: MUST-READ**

---

### 5.4 OWASP Race Conditions — Attack Description
**Source:** OWASP — https://owasp.org/www-community/attacks/Race_condition  
**Touches:** Directly documents the attack class exploited by the points.js:82–127 double-spend vulnerability. Describes mitigation patterns (atomic transactions, database-level locks, idempotency tokens) that must be applied before the leaderboard ranks points balances.  
**Rating: MUST-READ**

---

### 5.5 NIST Special Publication 800-63B: Digital Identity Guidelines — Authentication and Lifecycle Management
**Source:** NIST — https://pages.nist.gov/800-63-3/sp800-63b.html  
**Touches:** The authoritative US government standard on password hashing requirements (bcrypt, scrypt, Argon2), session token entropy, and authenticator assurance levels. The auth.js:31 finding violates NIST 800-63B §5.1.1 explicitly. Must cite this in the report.  
**Rating: MUST-READ**

---

### 5.6 OWASP API Security Top 10 (2023)
**Source:** OWASP — https://owasp.org/www-project-api-security/  
**Touches:** The unauthenticated donation counter endpoint (donations.js:59) and the uncapped pay input are both API-layer vulnerabilities. API2 (Broken Authentication) and API3 (Broken Object Property Level Authorization) apply directly. Social features will add new API surface area.  
**Rating: MUST-READ**

---

## 6. Standards — Accessibility

### 6.1 Web Content Accessibility Guidelines (WCAG) 2.1 — W3C Recommendation
**Source:** World Wide Web Consortium — https://www.w3.org/TR/WCAG21/  
**Touches:** A leaderboard UI (rank tables, badge icons, score numbers) must meet WCAG 2.1 AA at minimum: color contrast for rank positions, keyboard navigability, screen-reader labels for badge images. Touches the entire leaderboard UI layer.  
**Rating: MUST-READ**

---

### 6.2 U.S. Department of Justice — Web Accessibility Guidance Under the ADA (March 2022)
**Source:** ADA.gov — https://www.ada.gov/resources/web-guidance/  
**Touches:** Confirms that the ADA requires web and mobile app accessibility for covered entities; plaintiffs have successfully sued food-delivery platforms on ADA grounds. The leaderboard screen, friend-add flow, and notification UI all need ADA review. Touches UC17 map and all new social UCs.  
**Rating: MUST-READ**

---

### 6.3 Section 508 Standards — Revised 2017
**Source:** U.S. Access Board — https://www.access-board.gov/ict/  
**Touches:** Relevant if Hungry Wolf is used by any government-affiliated customers or if federal food-assistance programs (SNAP) are ever integrated. Sets the technical standard for accessible tables (leaderboard) and interactive controls (friend add, filter by time period).  
**Rating: SKIM**

---

## 7. Licenses — Dependencies and APIs

### 7.1 npm License Checker — Dependency Audit Tool
**Source:** npm / Node.js — https://www.npmjs.com/package/license-checker  
**Touches:** Before shipping, run `license-checker --production` to audit every dependency for GPL/AGPL licenses that would require open-sourcing the leaderboard feature. Any new social or map dependency (Socket.io, Mapbox, etc.) needs license review.  
**Rating: MUST-READ**

---

### 7.2 Google Maps Platform Terms of Service
**Source:** Google — https://cloud.google.com/maps-platform/terms  
**Touches:** UC17 (delivery map) and any map-based friend-location feature are bound by Google Maps ToS, which prohibits caching location data beyond the permitted window and restricts use in non-navigation contexts. Also affects pricing at scale.  
**Rating: SHOULD-READ**

---

### 7.3 Mapbox Terms of Service (if used instead of Google)
**Source:** Mapbox — https://www.mapbox.com/legal/tos  
**Touches:** Same as above for UC17; Mapbox has different data-storage and attribution requirements. One of these two ToS documents must be read depending on which map SDK is in the stack.  
**Rating: SHOULD-READ**

---

### 7.4 Open Source Initiative — Common Licenses Reference (MIT, Apache 2.0, GPL v3)
**Source:** Open Source Initiative — https://opensource.org/licenses  
**Touches:** Clarifies what attribution, patent rights, and share-alike obligations attach to the open-source libraries the leaderboard backend will use (Express, Socket.io, etc.). Needed before any production deployment.  
**Rating: SKIM**

---

## 8. Domain Knowledge — Gamification and Leaderboards

### 8.1 Hamari, Koivisto & Sarsa — "Does Gamification Work? A Literature Review of Empirical Studies on Gamification" (CHI 2014)
**Source:** ACM Digital Library — https://dl.acm.org/doi/10.1109/HICSS.2014.377  
**Touches:** The most-cited empirical review of gamification outcomes. Finds that leaderboards motivate users who are already near the top but demotivate users near the bottom — directly relevant to how we design the friend-leaderboard for UC19/UC20 and whether we show absolute rank or relative rank only.  
**Rating: MUST-READ**

---

### 8.2 Deci, E.L. & Ryan, R.M. — Self-Determination Theory (SDT) — Overview and Measures
**Source:** Self-Determination Theory — https://selfdeterminationtheory.org/theory/  
**Touches:** SDT is the theoretical foundation for understanding when external rewards (points, leaderboard rank) undermine intrinsic motivation. Relevant to designing UC9/UC10 (points earn/redeem) and the leaderboard so they feel rewarding rather than coercive.  
**Rating: SHOULD-READ**

---

### 8.3 Werbach, K. & Hunter, D. — "For the Win: How Game Thinking Can Revolutionize Your Business" (Wharton Press, 2012)
**Source:** Wharton Digital Press / Amazon — ISBN 978-1613630235  
**Touches:** Practical framework for designing points, badges, and leaderboards (PBL) without creating brittle engagement loops. Chapter 5 on leaderboard design specifically addresses the rank-visibility tradeoffs we face for UC19, UC20, and the social ranking screen.  
**Rating: SHOULD-READ**

---

### 8.4 Chou, Y.-K. — "Actionable Gamification: Beyond Points, Badges, and Leaderboards" (Octalysis Media, 2015)
**Source:** Octalysis Group / Amazon — https://www.octalysisgroup.com/books  
**Touches:** Introduces the Octalysis framework for classifying motivational levers. Specifically critiques "white-hat" (intrinsic) vs. "black-hat" (fear, scarcity, social pressure) gamification — the donation leaderboard sits at the intersection of both. Relevant to UC19, UC20, and the social layer.  
**Rating: SHOULD-READ**

---

### 8.5 Nielsen Norman Group — "Competitive Leaderboards in UX" (Article)
**Source:** Nielsen Norman Group — https://www.nngroup.com/articles/  
**Touches:** Practical UX guidance on when leaderboards increase engagement vs. when they cause churn among non-competitive users. Directly shapes the UI design of the friend-leaderboard screen. Search nngroup.com for "leaderboard."  
**Rating: SHOULD-READ**

---

## 9. Domain Knowledge — Gig Economy and Delivery Partners

### 9.1 Gig Economy Data Hub — "What Do We Know About Gig Work?" (2023)
**Source:** Gig Economy Data Hub (Cornell ILR / Aspen Institute) — https://www.gigeconomydata.org  
**Touches:** Aggregates current research on gig worker income, hours, and wellbeing. Relevant to UC15/UC16/UC18 design; a leaderboard that ranks delivery partners by volume without protecting minimum earnings could worsen the issues documented here.  
**Rating: SHOULD-READ**

---

### 9.2 Pew Research Center — "The State of Gig Work in 2021"
**Source:** Pew Research Center — https://www.pewresearch.org/internet/2021/12/08/the-state-of-gig-work-in-2021/  
**Touches:** Consumer and worker attitudes toward gig platforms; relevant to positioning Hungry Wolf's partner-facing features (UC15, UC16, UC18) and whether gamifying delivery-partner activity (e.g. a partner leaderboard) would be perceived positively or coercively.  
**Rating: SKIM**

---

## 10. Human Factors — Leaderboard Psychology and Rank Manipulation

### 10.1 Festinger, L. — "A Theory of Social Comparison Processes" (Human Relations, 1954)
**Source:** SAGE Journals — https://doi.org/10.1177/001872675400700202  
**Touches:** The foundational paper establishing that people compare themselves to similar others; explains why a friend-leaderboard (UC-social) will drive more behavioral change than a global leaderboard, and why users near the bottom of a small friend group may disengage entirely.  
**Rating: MUST-READ** *(read the abstract and discussion; the methodology is dated but the theory is universally cited)*

---

### 10.2 Przybylski, A.K., Murayama, K., DeHaan, C.R. & Gladwell, V. — "Motivational, Emotional, and Behavioral Correlates of Fear of Missing Out" (Computers in Human Behavior, 2013)
**Source:** ScienceDirect — https://doi.org/10.1016/j.chb.2013.02.014  
**Touches:** Fear of missing out (FOMO) is a documented driver of over-engagement in social comparison systems. A leaderboard tied to ordering frequency (UC9 points) could trigger FOMO-driven over-ordering — a human harm and a potential dark-pattern liability under the FTC report above.  
**Rating: SHOULD-READ**

---

### 10.3 Andrade, E.B., Kaltcheva, V. & Weitz, B. — "Self-Disclosure on the Web: The Impact of Privacy Policy, Reward, and Company Reputation" (Journal of Interactive Marketing, 2002)
**Source:** Wiley / available via university library — DOI 10.1002/dir.10035  
**Touches:** Shows that users share personal data (ordering habits, friend connections) when they perceive a reward, but withdraw if they perceive manipulation. Directly relevant to the friend-graph consent flow at UC1/UC3 and whether users will trust a leaderboard built on broken auth.  
**Rating: SHOULD-READ**

---

### 10.4 Metric Gaming and Goodhart's Law — Wikipedia Overview and Cited Sources
**Source:** Wikipedia — https://en.wikipedia.org/wiki/Goodhart%27s_law  
**Touches:** "When a measure becomes a target, it ceases to be a good measure." Given the points double-spend vulnerability (points.js:82–127) and inflatable donation counter (donations.js:59), a public leaderboard built on these metrics will immediately be gamed. This is the operational risk.  
**Rating: MUST-READ** *(use as a framing citation; follow references to the original Goodhart 1975 paper for academic citation)*

---

### 10.5 FTC Workshop Report — "Inside the Game: Unlocking the Consumer Issues Surrounding Loot Boxes" (2020)
**Source:** Federal Trade Commission — https://www.ftc.gov/reports/inside-game-unlocking-consumer-issues-surrounding-loot-boxes  
**Touches:** Though focused on gaming, the FTC's analysis of spend-triggering mechanics and social pressure in competitive ranking systems applies directly to a food-delivery leaderboard. The "over-ordering to climb ranks" risk maps to the same psychological mechanisms analyzed here.  
**Rating: SHOULD-READ**

---

## Summary Table

| # | Source | Category | Rating |
|---|---|---|---|
| 1.1 | CCPA — California AG | Privacy Law | MUST-READ |
| 1.2 | FTC Act Section 5 | Consumer Protection | MUST-READ |
| 1.3 | FTC "Start with Security" | Security / FTC Enforcement | MUST-READ |
| 1.4 | COPPA Rule | Children's Privacy | MUST-READ |
| 1.5 | NIST Privacy Framework | Privacy Framework | SHOULD-READ |
| 1.6 | FTC Mobile Security Report | Auth Duty of Care | SHOULD-READ |
| 2.1 | FTC "Bringing Dark Patterns to Light" | Gamification Regulation | MUST-READ |
| 2.2 | FTC Endorsement Guides (2023) | Social Proof / Marketing | SHOULD-READ |
| 2.3 | California ARL | Subscription Law | SKIM |
| 3.1 | FTC Charitable Solicitations | Donation Claims | MUST-READ |
| 3.2 | NAAG State Charity Registration | Donation Claims | MUST-READ |
| 3.3 | IRS Publication 526 | Tax / Donation Claims | SHOULD-READ |
| 4.1 | DOL Final Rule 2024 (FLSA) | Gig Labor Law | MUST-READ |
| 4.2 | California AB5 | Gig Labor Law (CA) | SHOULD-READ |
| 4.3 | NLRB GC Memo GC 22-05 | Gig Labor / Algorithmic Control | SHOULD-READ |
| 5.1 | OWASP Top Ten (2021) | Security Standard | MUST-READ |
| 5.2 | OWASP Authentication Cheat Sheet | Security Standard | MUST-READ |
| 5.3 | OWASP Session Management Cheat Sheet | Security Standard | MUST-READ |
| 5.4 | OWASP Race Conditions | Security Standard | MUST-READ |
| 5.5 | NIST SP 800-63B | Password / Auth Standard | MUST-READ |
| 5.6 | OWASP API Security Top 10 (2023) | Security Standard | MUST-READ |
| 6.1 | WCAG 2.1 — W3C | Accessibility Standard | MUST-READ |
| 6.2 | DOJ ADA Web Guidance (2022) | Accessibility / Legal | MUST-READ |
| 6.3 | Section 508 Standards | Accessibility (Gov) | SKIM |
| 7.1 | npm License Checker | Dependency Licensing | MUST-READ |
| 7.2 | Google Maps Platform ToS | API License | SHOULD-READ |
| 7.3 | Mapbox ToS | API License | SHOULD-READ |
| 7.4 | OSI Common Licenses Reference | Open Source Licensing | SKIM |
| 8.1 | Hamari et al. — "Does Gamification Work?" (2014) | Gamification Research | MUST-READ |
| 8.2 | Deci & Ryan — Self-Determination Theory | Motivation Research | SHOULD-READ |
| 8.3 | Werbach & Hunter — "For the Win" | Gamification Design | SHOULD-READ |
| 8.4 | Chou — Actionable Gamification | Gamification Design | SHOULD-READ |
| 8.5 | Nielsen Norman Group — Leaderboard UX | UX Guidance | SHOULD-READ |
| 9.1 | Gig Economy Data Hub (2023) | Gig Worker Research | SHOULD-READ |
| 9.2 | Pew Research — State of Gig Work (2021) | Gig Worker Attitudes | SKIM |
| 10.1 | Festinger — Social Comparison Theory (1954) | Human Factors | MUST-READ |
| 10.2 | Przybylski et al. — FOMO Study (2013) | Human Factors | SHOULD-READ |
| 10.3 | Andrade et al. — Self-Disclosure on Web (2002) | Human Factors | SHOULD-READ |
| 10.4 | Goodhart's Law — Wikipedia + Sources | Metric Gaming | MUST-READ |
| 10.5 | FTC Loot Box Workshop Report (2020) | Gamification Regulation | SHOULD-READ |

**MUST-READ count: 19 | SHOULD-READ count: 16 | SKIM count: 4**
