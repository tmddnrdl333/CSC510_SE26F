With **4 graduate students working 10 hours per week over 4 weeks**, your total team budget is **160 person-hours**. While your team boasts strong full-stack and backend expertise (Seung Wook, Liwen, Mahek), time—not technical capability—is your primary constraint.

Here is the classification and analysis for each milestone:

---

### Milestone 1: Aggregation API

* **Classification:** **REALISTIC**
* **Justification:** Querying existing Firestore document fields (points, badge count, orders count) and calculating a scalar score on a single backend endpoint requires roughly 15–20 engineering hours for a team with strong Java/Python/Firestore experience.

---

### Milestone 2: Friend Connections System

* **Classification:** **STRETCH**
* **Justification:** Implementing a full two-way social graph in Firestore (user search, pending requests, accept/decline state machine, friend list endpoints) involves significant edge-case management and UI integration that will consume 35–40 hours.

---

### Milestone 3: React Leaderboard UI & Privacy Control

* **Classification:** **STRETCH**
* **Justification:** Building the dual-tab React interface (global vs. friends), user row highlighting, and dynamic privacy filtering requires ~30 hours of frontend coordination and state management across the React client.

---

### Milestone 4: Retrofit Auth Layer & Patch Security Holes

* **Classification:** **FANTASY**
* **Justification:** Retrofitting a global session/JWT auth layer onto an unauthenticated legacy app while simultaneously fixing distributed concurrency race conditions (`points.js:82-127`) and unauthenticated endpoints within 160 total team-hours will lead to severe scope creep and broken builds.
* **Largest Realistic Slice:** Implement lightweight token verification strictly on the new leaderboard/friend endpoints, and patch `donations.js` and `points.js` using atomic Firestore transactions (`FieldValue.increment()`) to prevent race conditions without refactoring the application's entire authentication architecture.

---

### Milestone 5: End-to-End Integration Testing

* **Classification:** **REALISTIC**
* **Justification:** Scripting an automated E2E integration test using 3 seeded Firestore user profiles to verify ranking isolation and rejected forging attempts fits neatly into Mahek and Kevin's testing/Python skills and takes ~10–15 hours.

---