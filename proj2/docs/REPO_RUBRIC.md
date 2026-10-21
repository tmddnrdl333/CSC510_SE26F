# Repo Rubric — Self-Assessment (Project 2)

Scored per proj2.md: 0 none / 1 a little / 2 somewhat / 3 a lot, each with
evidence. Rows marked **(pending)** list exactly what raises the score
before submission.

## Teamwork, visible in GitHub

| Item | Evidence | Score |
|---|---|---|
| Many commits | [250 commits](https://github.com/tmddnrdl333/CSC510_SE26F/commits/main) — 157 by this team on top of the inherited 93 | 2 |
| Commits from different people | [Contributors](https://github.com/tmddnrdl333/CSC510_SE26F/graphs/contributors): all four members active | 3 |
| Workload spread over the team | [Insights](https://github.com/tmddnrdl333/CSC510_SE26F/graphs/contributors): 75 / 52 / 17 / 13 team commits — uneven but everyone substantial | 2 |
| Members work across many parts | Each member shipped server+client+tests: [M1 #51](https://github.com/tmddnrdl333/CSC510_SE26F/pull/51), [M2 #56](https://github.com/tmddnrdl333/CSC510_SE26F/pull/56), [M3 #61](https://github.com/tmddnrdl333/CSC510_SE26F/pull/61), [M0 #11](https://github.com/tmddnrdl333/CSC510_SE26F/pull/11) | 3 |
| Short release cycles | [25+ merged PRs](https://github.com/tmddnrdl333/CSC510_SE26F/pulls?q=is%3Apr+is%3Amerged), typically merged same day | 3 |
| Same tools, configs updated by many | [ci.yml history](https://github.com/tmddnrdl333/CSC510_SE26F/commits/main/.github/workflows/ci.yml) (Mahek, Seung Wook), jest/eslint/prettier configs in repo | 2 |
| Whole team can run the system | [INSTALL](https://github.com/tmddnrdl333/CSC510_SE26F/blob/main/proj2/docs/INSTALL.md) + [LOCAL_SETUP](https://github.com/tmddnrdl333/CSC510_SE26F/blob/main/proj2/LOCAL_SETUP.md); **(pending)** confirm all four at demo rehearsal | 2 |

## Issues and discussion

| Item | Evidence | Score |
|---|---|---|
| Many issue reports | [45+ issues](https://github.com/tmddnrdl333/CSC510_SE26F/issues?q=is%3Aissue) across M0–M3 + baseline | 3 |
| Issues get closed | [Closed issues](https://github.com/tmddnrdl333/CSC510_SE26F/issues?q=is%3Aissue+is%3Aclosed); open ones are deliberate (4 documented failing tests + packaging) | 3 |
| Discussed before closed | Decision threads: [#36](https://github.com/tmddnrdl333/CSC510_SE26F/issues/36) (3 team decisions), [#62](https://github.com/tmddnrdl333/CSC510_SE26F/issues/62), [#64](https://github.com/tmddnrdl333/CSC510_SE26F/issues/64), [#66](https://github.com/tmddnrdl333/CSC510_SE26F/issues/66); some M1 batch issues closed via PR without comments | 2 |
| Failing-case issues | [#62](https://github.com/tmddnrdl333/CSC510_SE26F/issues/62) (live crash→fix), [#64](https://github.com/tmddnrdl333/CSC510_SE26F/issues/64) (fix rejected by our own 1a test), [#23](https://github.com/tmddnrdl333/CSC510_SE26F/issues/23), [#55](https://github.com/tmddnrdl333/CSC510_SE26F/issues/55), [#69–72](https://github.com/tmddnrdl333/CSC510_SE26F/issues/69) (remaining failing tests) | 3 |
| Chat channel active, poster QR | Discord is the team channel; **(pending)** screenshots + QR on the poster | 2 |

## Tests

| Item | Evidence | Score |
|---|---|---|
| Tests exist, expected + failure cases | [329 tests](https://github.com/tmddnrdl333/CSC510_SE26F/tree/main/proj2/tests) (325 pass + 4 documented 1a reds, [#69–72](https://github.com/tmddnrdl333/CSC510_SE26F/issues/69)); failure/abuse cases throughout (concurrency, 401/403, replay) | 3 |
| Serious share of the code base | 5,960 test LOC vs 4,782 server+src LOC (55%) | 3 |
| Tests run on every commit (CI) | [GitHub Actions](https://github.com/tmddnrdl333/CSC510_SE26F/actions/workflows/ci.yml) — jest + M0 eval on every push/PR | 3 |
| Coverage measured, badge shows it | 78% (server+src, [jest.config.js](https://github.com/tmddnrdl333/CSC510_SE26F/blob/main/proj2/jest.config.js)) uploaded to [Codecov](https://codecov.io/github/tmddnrdl333/CSC510_SE26F); README badge renders the live number | 3 |

## Docs

| Item | Evidence | Score |
|---|---|---|
| Generated docs, not ugly | [JSDoc → docs/api](https://github.com/tmddnrdl333/CSC510_SE26F/tree/main/proj2/docs/api) (`npm run docs`) | 2 |
| WHAT: per-function descriptions | JSDoc across M1/M2/M3 services, models, middleware | 2 |
| HOW: mini-tutorials | [how-to/leaderboard.md](https://github.com/tmddnrdl333/CSC510_SE26F/blob/main/proj2/docs/how-to/leaderboard.md), [CONTRIBUTING: adding a challenge type](https://github.com/tmddnrdl333/CSC510_SE26F/blob/main/proj2/docs/CONTRIBUTING.md), [INSTALL](https://github.com/tmddnrdl333/CSC510_SE26F/blob/main/proj2/docs/INSTALL.md) | 2 |
| WHY: the story | [README](https://github.com/tmddnrdl333/CSC510_SE26F/blob/main/proj2/README.md) + [MILESTONES.md](https://github.com/tmddnrdl333/CSC510_SE26F/blob/main/proj2/docs/MILESTONES.md) | 2 |
| Teaser video at README top | [Teaser](https://github.com/tmddnrdl333/CSC510_SE26F#readme) embedded under the badges, under 30 s, shows leaderboard, team challenges, M0 result and CI | 3 |
| Walk-through video linked | [Feature walk-through](https://go.ncsu.edu/rh4swnv) linked at the top of the README and by QR on the poster; shows M0, M1, M2 and M3 working | 3 |

## Standard files and bling

| Item | Evidence | Score |
|---|---|---|
| README badges, all working | [README](https://github.com/tmddnrdl333/CSC510_SE26F/blob/main/proj2/README.md): build/tests/codecov/ESLint/Prettier/tsc/license/DOI — all live and pointing at THIS repo; lint/format/type badges click through to the CI run | 3 |
| .gitignore | [.gitignore](https://github.com/tmddnrdl333/CSC510_SE26F/blob/main/.gitignore) covers .env, node_modules, keys | 3 |
| INSTALL.md | [docs/INSTALL.md](https://github.com/tmddnrdl333/CSC510_SE26F/blob/main/proj2/docs/INSTALL.md) | 3 |
| LICENSE.md | [docs/LICENSE.md](https://github.com/tmddnrdl333/CSC510_SE26F/blob/main/proj2/docs/LICENSE.md) (MIT) | 3 |
| CODE-OF-CONDUCT.md | [docs/CODE-OF-CONDUCT.md](https://github.com/tmddnrdl333/CSC510_SE26F/blob/main/proj2/docs/CODE-OF-CONDUCT.md) | 3 |
| CONTRIBUTING.md | [docs/CONTRIBUTING.md](https://github.com/tmddnrdl333/CSC510_SE26F/blob/main/proj2/docs/CONTRIBUTING.md) — standards + extend-safely tutorial | 3 |
| Style/formatter/syntax configs + badges | [.eslintrc.json](https://github.com/tmddnrdl333/CSC510_SE26F/blob/main/proj2/.eslintrc.json), [.prettierrc](https://github.com/tmddnrdl333/CSC510_SE26F/blob/main/proj2/.prettierrc), [tsconfig.json](https://github.com/tmddnrdl333/CSC510_SE26F/blob/main/proj2/client/tsconfig.json) + badges; ESLint, `prettier --check` and `tsc --noEmit` all enforced in [CI](https://github.com/tmddnrdl333/CSC510_SE26F/blob/main/.github/workflows/ci.yml) | 3 |
| DOI badge (Zenodo) | [DOI badge](https://zenodo.org/badge/latestdoi/1349823474) in the README, minted from [release v1.0.0](https://github.com/tmddnrdl333/CSC510_SE26F/releases/tag/v1.0.0) | 3 |
| THIRD_PARTY_LIBRARIES.md | [docs/THIRD_PARTY_LIBRARIES.md](https://github.com/tmddnrdl333/CSC510_SE26F/blob/main/proj2/docs/THIRD_PARTY_LIBRARIES.md) — 42 direct deps with licenses | 3 |
| AI use visible and disclosed | [docs/AI_USE.md](https://github.com/tmddnrdl333/CSC510_SE26F/blob/main/proj2/docs/AI_USE.md) + verbatim prompts/transcripts in proj1a-report/, proj1b-report/ + human review trail in PRs ([#35](https://github.com/tmddnrdl333/CSC510_SE26F/pull/35), [#53](https://github.com/tmddnrdl333/CSC510_SE26F/pull/53)) | 3 |

## Sum

**86 / 96** today. Remaining: poster QR + chat screenshots (+1), demo rehearsal (+1).
