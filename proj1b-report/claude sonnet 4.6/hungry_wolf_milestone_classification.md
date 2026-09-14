# Hungry Wolf — Milestone Feasibility Classification
**Date:** September 2026  
**Team:** 4 graduate students · ~10 hrs/person/week · 4 weeks  
**Total budget:** ~160 person-hours

---

## Hours Sanity Check

| Person | Relevant strengths | Likely best fit |
|---|---|---|
| Seung Wook | Java/Spring Boot backend, Supabase, Vercel | M4 auth retrofit, M1 aggregation API |
| Mahek | TypeScript/Next.js, FastAPI, full-stack | M3 React leaderboard screen |
| Kevin | Python, Java, JavaScript, Flask | M2 friend graph, M5 testing |
| Liwen | 5 yr full-stack, SQL, Python/JS, LLM agents | M1/M2 backend, M5 E2E orchestration |

> [!NOTE]
> 160 hours sounds like a lot until you account for: reading the existing codebase (est. 10–15 hrs shared), merge conflicts, deployment friction, and the near-certainty that the undocumented Firestore schema will surprise you at least once. Realistic working budget is closer to **120–130 hrs of productive output**.

---

## Milestone Classifications

---

### M1 — Aggregation API
> *Compute each user's leaderboard score from existing Firestore data: loyalty points, badges, and delivered-order count.*

**Classification: ✅ REALISTIC**

All three data sources (points ledger, badge count, delivered-order count) are already in Firestore per the project description — this is a single Express endpoint that reads, weights, and returns a ranked list; Seung Wook and Liwen can pair on it in under 15 person-hours, and the team has exactly the backend skills required (Supabase/Firestore reads, REST endpoint construction).

**Estimated effort:** 12–15 person-hours  
**Owner suggestion:** Seung Wook (lead) + Liwen (review/test)

---

### M2 — Friend Connections
> *Send/accept a friend request stored in Firestore; endpoint to list a user's friends.*

**Classification: ✅ REALISTIC**

A directed friend-graph in Firestore (two documents per relationship: pending → accepted) is well-understood CRUD work with no algorithmic complexity — Kevin or Liwen can stand this up in a week alongside other tasks, and the schema is simple enough that it will not fight with M1's aggregation query.

**Estimated effort:** 15–20 person-hours  
**Owner suggestion:** Kevin (lead) + Liwen (schema design)

> [!NOTE]
> Scope discipline matters here: do not add "mutual friends," "suggested friends," or "block" in the first pass. `send → accept → list` only. Every extra state you add to the friend graph is a new bug surface.

---

### M3 — Leaderboard Screen (React)
> *Global and friends-only rankings, own-row highlight, privacy toggle (friends-only by default).*

**Classification: ⚠️ STRETCH**

The screen itself — a sorted table with a toggle and a highlighted row — is maybe 20 hours of React work, well within Mahek's TypeScript/Next.js skill set; the STRETCH comes from the unknown quality of the existing React 19 codebase: a project whose auth layer is client-side-only and whose donation counter is unauthenticated suggests limited prior engineering discipline, which means Mahek will spend non-trivial time reading and untangling existing component structure before writing a single new line.

**Estimated effort:** 25–35 person-hours (20 if the codebase is clean; 35 if it is not)  
**Owner suggestion:** Mahek (lead); Liwen on any API integration hooks

**De-risk:** Mahek reads the existing React codebase in Week 1, before committing to a component structure. If the codebase is heavily tangled, drop the privacy toggle to a static default ("friends-only always") and add the toggle in Week 4 only if time allows — the toggle is a nice-to-have, not a ranking correctness requirement.

---

### M4 — Auth Layer + Integrity Fixes
> *Introduce JWT sessions; fix unauthenticated donation counter (donations.js:59); fix points double-spend race (points.js:82–127).*

**Classification: ⚠️ STRETCH**

Each of the three sub-tasks is individually achievable — bcrypt + JWT middleware is textbook Express work, gating the donation endpoint behind auth is a one-line middleware call once the JWT layer exists, and Firestore transactions are well-documented — but **bundling all three into one milestone with a shared dependency chain is the highest-risk sequencing decision in the plan**: if the JWT middleware takes longer than expected (e.g., the existing login flow is more tangled than it looks), it blocks both the donation fix and the race condition fix, and suddenly the integrity the leaderboard depends on is not ready when M3 is.

**Estimated effort:** 30–40 person-hours  
**Owner suggestion:** Seung Wook (lead — this is the most backend-heavy milestone and his Spring Boot background maps directly to the auth patterns required)

**De-risk — the largest REALISTIC slice if M4 slips:**  
Split into M4a and M4b. **M4a** (must ship): JWT middleware + donation gate fix. These two are tightly coupled (the gate is one middleware call) and take ~15 hrs. **M4b** (best effort): Firestore transaction for the points race condition, documented as a known limitation if it does not ship. The leaderboard can launch with a note that point rankings are eventually consistent pending M4b; it cannot launch with an open unauthenticated donation endpoint because that makes the donation-impact column on the leaderboard immediately gameable.

---

### M5 — End-to-End Test
> *Seed three users (two friends, one not); place orders; verify global and friends-only rankings; verify forged-rank attempts are rejected.*

**Classification: ✅ REALISTIC**

The scenario is tightly scoped to exactly three users and three verification conditions — this is a well-defined integration test, not an open-ended QA effort; Kevin and Liwen both have Python and JavaScript testing experience, and seeding Firestore test data programmatically (Firebase Admin SDK) is straightforward once M1 and M2 endpoints exist.

**Estimated effort:** 15–20 person-hours  
**Owner suggestion:** Kevin (lead) + Liwen (forged-rank attack scenarios)

> [!IMPORTANT]
> M5 has a hard dependency on M4. Do not start writing the "forged-rank attempts are rejected" assertions until the auth middleware from M4 is merged — writing tests against a non-existent security layer produces tests that pass for the wrong reason. Schedule M5 to begin no earlier than Week 3.

---

## Sequencing Recommendation

```
Week 1:  M1 (aggregation API) + M4a start (JWT middleware)
Week 2:  M2 (friend graph) + M4a finish (donation gate) + M4b start (race fix)
Week 3:  M3 (leaderboard screen) + M4b finish + M5 setup/seeding
Week 4:  M5 full run + bug fixes + documentation
```

This puts the highest-risk work (auth retrofit) in Weeks 1–2 so it does not block the UI in Week 3, and reserves Week 4 as a real buffer rather than a planned sprint.

---

## Summary

| Milestone | Classification | Est. Hours | Kill condition |
|---|---|---|---|
| M1 — Aggregation API | ✅ REALISTIC | 12–15 | Firestore schema differs materially from description |
| M2 — Friend connections | ✅ REALISTIC | 15–20 | — |
| M3 — Leaderboard screen | ⚠️ STRETCH | 25–35 | Existing React codebase too tangled to extend safely |
| M4 — Auth + integrity fixes | ⚠️ STRETCH | 30–40 | JWT retrofit blocks both sub-fixes; split into M4a/M4b |
| M5 — E2E test | ✅ REALISTIC | 15–20 | Depends on M4 being merged first |
| **Total** | | **97–130 hrs** | Within 120–130 hr realistic budget — barely |

> [!WARNING]
> The plan is feasible but has zero slack. If M4 takes the high end of its estimate (40 hrs), the total hits 130 hrs and every other milestone must land at its low estimate. The single most important risk-reduction action is assigning Seung Wook to M4 exclusively in Week 1 so the auth layer is not the bottleneck in Week 3.
