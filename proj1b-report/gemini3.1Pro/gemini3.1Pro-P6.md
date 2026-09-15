Here are three distinct directions for your social leaderboard extension, scaled for a four-week sprint by four graduate students.

### SAFE: The "Invite-Link Pack" Leaderboard

* **Elevator Pitch:** Instead of building a massive, searchable social network, users tap "Create a Pack" to generate a unique URL they text to their existing group chats. Anyone who clicks the link joins a private, temporary leaderboard ranking only that specific friend group by points, badges, and donations.
* **What 4 grads can build in 1 month:** Week 1: Patch the `donations.js` unauthenticated inflation bug, the `points.js` concurrency race, and implement basic session tokens (mandatory before exposing user data). Weeks 2-4: Build the URL generation, the join-via-link routing logic, and a single read-only React/Flutter screen that queries and ranks the group's existing point/badge/order data.
* **The biggest risk:** The underlying identity layer. If you fail to successfully patch the plaintext password and sessionless architecture in week one, a tech-savvy user can hijack a friend's account or manipulate the client-side state to dominate the local leaderboard, turning the feature into a joke.
* **The kill signal:** We abandon this version if we see a high rate of link generation but a near-zero click-to-join rate (meaning users are willing to share, but friends refuse to authenticate into a food app just to look at a ranking).

---

### BOLD: The "City-Wide Co-Op" Leaderboard

* **Elevator Pitch:** We pivot from individual comparison (which can cause shame or anxiety) to team-based competition, where friend "Packs" pool their points and donations to compete on a public, city-wide leaderboard. Top-ranking Packs unlock massive multiplier bonuses for their chosen charity or earn group discounts.
* **What 4 grads can build in 1 month:** Implement the invite-link squad creation, a backend aggregation service that safely sums a group's metrics, a geographic filtering query to build the city-wide ranking, and a public-facing UI. This requires strictly server-side validation to ensure client-manipulated inputs cannot dictate the final score.
* **The biggest risk:** Attaching high-stakes financial rewards (group discounts) to a system with known double-spend concurrency flaws guarantees aggressive exploitation. If the architecture isn't bulletproofed, script kiddies will farm points to dominate the regional board, draining your promotional budget and angering legitimate users.
* **The kill signal:** We abandon this version if we see rapid, statistically impossible spikes in group points or donation metrics that indicate our API is being abused by automated scripts.

---

### WILD: The Zero-Sum "Sabotage" Leaderboard

* **Elevator Pitch:** We treat food delivery like a hardcore competitive mobile game where users can actively spend their loyalty points to "steal" rank, freeze a friend's point accumulation for 24 hours, or buy a temporary multiplier for their own donation impact. It creates highly aggressive, viral engagement within friend groups by gamifying the rankings themselves.
* **What 4 grads can build in 1 month:** Patch the points double-spend bug (critical for transactional integrity between two users), build the target-selection UI (choosing a friend to sabotage), write the database logic for point deduction/transfers, and create the push notifications to alert a user they've been "attacked."
* **The biggest risk:** Extreme user backlash. Penalizing a user's actual food-purchasing loyalty points for a game mechanic can cause severe frustration, and the resulting toxic social dynamic could drive users to delete the app entirely. Furthermore, any failure to fix the plaintext password vulnerability means users could literally log in as their friends to sabotage them from the inside.
* **The kill signal:** We abandon this version if customer support tickets spike with legitimate anger over "stolen" points, or if we see users who were "sabotaged" immediately churn and stop ordering from the platform.