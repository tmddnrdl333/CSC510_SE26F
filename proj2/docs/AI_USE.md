# AI Use Disclosure

This project used AI coding agents openly, as part of the course's
LLM-centered methodology. This file is the disclosure the repo rubric asks
for: what the AI did, where the evidence lives, and how humans checked it.

## What the AI assistants did

- **Claude Code, Codex (GPT), Gemini, Qwen** were used as analysts in
  Projects 1a/1b: reverse-engineering use cases, drafting tests, market
  survey, red-teaming the proposal. Full verbatim transcripts live in
  `proj1a-report/` and `proj1b-report/` (per-model folders).
- **Claude Code** was used during Project 2 as a pair programmer across the
  milestones: M0, M1, M2 (leaderboard plan, friendships, scoring, API, page, tests),
  parts of M3 (challenge engine), CI tuning, documentation, and PR review
  preparation. Most AI-written code was committed by a team member after
  review, one small piece at a time. Some commits were made by Claude Code
  directly and appear under the "claude" contributor on GitHub; these went
  through the same PR review before merging.

## How humans checked the AI's output

- Every AI-assisted PR went through the same pull-request review as human
  work; several were revised after review (e.g. PR #35 request-changes on
  missing authorization checks; PR #53's payout was hardened after an
  adversarial review pass found four should-fix issues, documented in the
  PR comments).
- Cross-model checking: Project 1b's market survey applied a two-model
  rule plus live-URL verification; the discarded hallucinations (e.g. a
  dead evidence URL) are recorded in `proj1b-report/p1-merged-rival-table.md`.
- The test suite is the standing check: AI-written code ships with tests,
  and 1a findings were converted into regression tests that later caught
  real mistakes (see issue #64, where a first fix was rejected by a 1a
  star-finding test).
- Running the real app caught what tests missed: issue #55, where the
  leaderboard read points from the wrong place, was found by a human
  checking the dashboard against the leaderboard, then fixed with a
  failing test first.

## Where to look

- `proj1a-report/keeper-prompts.md`, `proj1b-report/proj1b-starter-prompts.md` — the exact prompts
- `proj1a-report/model-outputs/`, `proj1b-report/<model folders>` — raw outputs
- `proj2/docs/plans/` — the agent plans written before each milestone's code
- Issues and PRs — the review trail (who asked for what, what was changed)
