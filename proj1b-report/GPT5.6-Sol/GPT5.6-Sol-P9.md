The team has about 160 nominal person-hours; after coordination, integration, and reporting, plan around 120–135 productive hours. No milestone is inherently fantasy at prototype scale, but the combined plan is a STRETCH unless scope is tightly fenced.

| # | Classification | Estimated effort | Why |
|---|---|---:|---|
| 1. Score aggregation API | **REALISTIC** | 15–25 hours | The inputs already exist in Firestore, so a documented deterministic formula, aggregation endpoint, and unit tests are achievable without a new data pipeline. |
| 2. Friend connections | **REALISTIC** | 20–30 hours | Send, accept, reject, list, and remove operations are manageable if requests use existing Hungry Wolf accounts and exclude contact import, recommendations, chat, and blocking. |
| 3. Global and friends leaderboard UI | **STRETCH** | 30–40 hours | Two rankings, opt-in global visibility, highlighted self-row, loading/error/empty states, and backend-enforced privacy form a meaningful vertical slice but require careful API–React integration. |
| 4. Authentication and integrity fixes | **STRETCH** | 40–55 hours | Adding server-verifiable identity to an app with none, updating client requests, protecting endpoints, and making point redemption atomic is cross-cutting security work that cannot be safely reduced to merely generating a token. |
| 5. End-to-end and abuse testing | **REALISTIC** | 18–25 hours | The three-user scenario is bounded and testable, while the non-friend exclusion and forged-rank cases make it more substantial than a basic happy-path demo. |

Estimated total: **123–175 hours**. That leaves almost no margin at the upper end, so production-scale pagination, friend suggestions, contact syncing, notifications, composite-score customization, sophisticated anti-cheat, and visual polish should be explicitly out of scope.

A few boundaries make these classifications hold:

- Milestone 1 must calculate donation impact from authenticated delivered-order records, never from the mutable public donation counter.
- Milestone 2 should store canonical friendship state so two conflicting records cannot say different things about the same relationship.
- Milestone 3’s privacy setting must be enforced by the aggregation API; hiding a row only in React would fail the privacy requirement.
- Milestone 4 should use established authentication middleware and Firestore transactions rather than a custom cryptographic or locking scheme.
- Milestone 5 should add two concurrency tests: simultaneous point redemptions and repeated donation/ranking requests.

The work should also be reordered to **4 → 1 → 2 → 3 → 5**. Building aggregation and friendships before server-side identity would cause the team to design their APIs around an identity model they already know is invalid.

A sensible ownership split would be:

- **Seung Wook:** authentication middleware, endpoint authorization, and Firestore transaction fixes.
- **Mahek:** score aggregation, rank calculation, and adversarial/concurrency tests.
- **Kevin:** friend-request API, Firestore rules/data model, and integration tests.
- **Liwen:** React leaderboard, privacy controls, and end-to-end test orchestration.

The most ambitious grading-friendly claim that remains credible is: **“We built and adversarially tested a privacy-aware social leaderboard whose ranks can only be changed by authenticated, server-verified events.”** That is considerably stronger than simply showing three sorted users on a screen.