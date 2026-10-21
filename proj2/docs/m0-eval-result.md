# M0 Repeat-Order-Rate Evaluation — Result Record

**Issue**: [#82 — [M0 Decision] Repeat-order rate eval: PERSEVERE](https://github.com/tmddnrdl333/CSC510_SE26F/issues/82)
**Evaluator**: Mahek (Ummmahek)
**Date**: 2026-10-20

> [!NOTE]
> The **primary eval result** uses the seeded synthetic simulation (Mulberry32, seed 42). The file `data/pilot-orders-sample.json` is an **illustrative sample** created to validate the script's data-ingestion format — it is **not** real user data and its +460% lift figure carries no evidential weight.

---

## Hypothesis

> Weekly repeat-order rate rises at least **20% (+20.0% relative lift)** with the social leaderboard compared to the no-leaderboard baseline.
> *(Project 1b Proposal Report, Section 2.1 & 3.1)*

---

## Evaluation Results

| Metric | Value |
|--------|-------|
| Data Source | Seeded Synthetic Simulation (Mulberry32, seed 42) — 1,173 orders |
| Observation Period | 8 weeks (2026-W36 to 2026-W43) |
| Baseline Repeat Rate | **34.10%** (133 / 390 active customer-weeks) |
| Leaderboard Repeat Rate | **42.60%** (164 / 385 active customer-weeks) |
| Relative Lift | **+24.91%** (Target: ≥ +20.0%) |
| Statistical Significance | z = 2.432, p = 0.0150 |
| **Verdict** | ✅ **PASS** |

### Weekly Breakdown

| Week | Control Active | Control Repeat (Rate) | Lead Active | Lead Repeat (Rate) | Week Lift |
|------|---------------|----------------------|-------------|-------------------|-----------|
| 2026-W36 | 50 | 17 (34.0%) | 48 | 16 (33.3%) | -2.0% |
| 2026-W37 | 51 | 12 (23.5%) | 48 | 24 (50.0%) | +112.5% |
| 2026-W38 | 50 | 18 (36.0%) | 47 | 18 (38.3%) | +6.4% |
| 2026-W39 | 39 | 14 (35.9%) | 47 | 23 (48.9%) | +36.3% |
| 2026-W40 | 43 | 21 (48.8%) | 45 | 17 (37.8%) | -22.6% |
| 2026-W41 | 49 | 14 (28.6%) | 52 | 20 (38.5%) | +34.6% |
| 2026-W42 | 51 | 20 (39.2%) | 50 | 24 (48.0%) | +22.4% |
| 2026-W43 | 57 | 17 (29.8%) | 48 | 22 (45.8%) | +53.7% |

---

## Decision: PERSEVERE ✅

The +24.91% relative lift exceeds the 20% threshold with statistical significance (p = 0.0150, z = 2.432). Gamification mechanics demonstrate behavioral lift. **Proceeding to Milestone 1 (Trust layer), Milestone 2 (Social leaderboard UI), and Milestone 3 (Challenges engine)** as planned.

> No descope or re-plan needed.
