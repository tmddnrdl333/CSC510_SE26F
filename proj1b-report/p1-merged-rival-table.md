# P1 merged — confirmed rival table (two-model rule applied)

Method (per proj1b.md): a competing product counts only if **two of our LLMs
named it**, or **one gave a live URL**. Sources: `GPT5.6-Sol/GPT5.6-Sol-P1.md`,
`gemini3.1Pro/gemini3.1Pro-P1.md`,
`claude sonnet 4.6/hungry_wolf_competitive_analysis.md`. (Qwen refused P1 —
no web access via the Groq API; recorded as a D5 data point, contributes no
rows.) All URLs re-checked with HTTP requests on 2026-09-15.

## Confirmed rivals (10)

| Product | Named by | Passed via | What it proves about our gap |
|---|---|---|---|
| Starbucks Rewards (+ Star Streaks) | Gemini, Claude | 2 models | Deepest food/beverage gamification in the US — and entirely solo; no friend ranking anywhere |
| DoorDash challenges (DashPass consumer challenges; Dasher challenges driver-side) | GPT, Claude (+ Gemini driver-side) | 3 models | The dominant US delivery app gamifies with solo, time-limited challenges — no social layer |
| Uber Eats loyalty (Merchant Rewards / stamp cards) | GPT, Claude | 2 models | Purely transactional per-restaurant rewards; GPT explicitly verified there is **no** customer leaderboard |
| Chipotle Rewards — "Summer of Extras" | GPT, Claude | 2 models | The one big food player that shipped real leaderboards — but seasonal (ended 2026-08-31), local/state/national rather than friends, single-brand |
| Snackpass | Gemini | live URL (200) | Social food ordering exists (friends' orders visible, gifts, points) — but no competitive ranking, no donation angle, pickup-focused |
| Beli | GPT | live URL (200) | Friend leaderboards over food *logging* — ranks restaurants visited, not verified orders/spend/donations |
| ShareTheMeal (Teams) | Gemini | live URL (200) | Team-based donation leaderboards exist — in a donation-only app with no food ordering |
| Nike Run Club (repr. of fitness leaderboards: Fitbit, Sweatcoin, Charity Miles) | Claude (category also by Gemini) | live URL (200) | The proven friend-leaderboard UX loop — in fitness, not food |
| Gameball (repr. of white-label gamification SaaS: Punchh, Thanx) | GPT | live URL (200) | Points/badges/leaderboard SDKs exist for delivery apps — but 4–6 week integration estimate exceeds our month, and no friend graph out of the box |
| Grab Rewards Challenges | Gemini | live URL (200) | Non-US delivery gamification benchmark — single-player only, no social comparison |

## Excluded, and why (D5 material)

| Candidate | Source | Reason cut |
|---|---|---|
| Forge Rewards | GPT | Single model **and its evidence URL is dead** (App Store link → 404). Exactly what the two-model rule exists to catch |
| Hang, Plavocado, Bargly, Bar Rank, BetterPoints | GPT | Single model; URLs live but in-venue/non-delivery niches — weaker matches than the ten kept |
| Untappd, Too Good To Go, Sweatcoin, Charity Miles, Fitbit | Gemini/Claude | Single model; category represented by a stronger pick already in the table |
| Grubhub+, McDonald's Rewards | Claude | Single model; no gamification depth or leaderboard — adds no new evidence |
| Punchh, Thanx | Claude | Single model; enterprise SaaS category represented by Gameball (Punchh URL also bot-blocked, 403) |
| Uber "Ride League" | Gemini | Driver-facing (and evidence URL is a YouTube video); not a consumer rival |

## Confirmed gap statement (survey-backed)

**No delivery platform ships a persistent, friend-facing leaderboard — let
alone one that ranks loyalty points, badges, and donation impact together.**
The nearest misses, each missing a different piece: Chipotle ran real
leaderboards but seasonal, regional, and friendless; Snackpass is social but
has no ranking; Beli ranks friends but over restaurant logging, not orders;
ShareTheMeal has donation-team leaderboards but no food ordering; Starbucks,
DoorDash, and Uber Eats keep all gamification strictly single-player.

## Text to paste into P8

Replace `[add whatever your P1 survey confirmed here]` in P8 with:

> confirmed by our three-model survey: Starbucks, DoorDash, and Uber Eats
> all gamify solo (no friend ranking anywhere); Chipotle's Summer of Extras
> shipped real leaderboards but seasonal, regional, and friendless (ended
> Aug 31, 2026); Snackpass is social but has no competitive ranking; and
> ShareTheMeal's donation-team leaderboards live in an app with no food
> ordering — nobody combines the three ranked dimensions with friends in a
> delivery app
