Given your strict one-month timeline to build and test, examining the competitive landscape reveals a harsh truth: building a true 1:1 "friend graph" (searching, adding, accepting, and managing privacy for friends) takes quarters, not weeks.

To ship a social leaderboard in 4 weeks, you will need to bypass traditional friend networking. The closest competitors below offer distinct models—some use massive social graphs, while others use lightweight "Clubs" or single-player gamification that fits better into a tight sprint.

Here are the 10 closest competing products and features operating at the intersection of food, delivery, gamification, and social impact.

### Competitive Landscape

| Product | Who uses it | Main strength | Main weakness | Price | Evidence URL |
| --- | --- | --- | --- | --- | --- |
| **ShareTheMeal (Teams)** | Donors & charity supporters | Uses a "Teams" feature to create isolated leaderboards for tracking shared meal donations | Purely a donation app; lacks food-delivery utility for the actual user | Free (users fund donations) | [https://sharethemeal.org/](https://sharethemeal.org/) |
| **Snackpass** | College students & young adults | Extremely social food ordering; users see friends' orders, send gifts, and earn points | Focused heavily on pickup; lacks a CSR/donation angle entirely | Free (users pay for food) | [https://play.google.com/store/apps/details?id=com.snackpassapp](https://play.google.com/store/apps/details?id=com.snackpassapp) |
| **Uber (Ride League)** | Uber rideshare & delivery drivers | Weekly competitive leaderboards pitting drivers against each other for cash prizes | Driver-facing only; creates anxiety and incentivizes taking unprofitable trips | Free for drivers | [https://www.youtube.com/watch?v=7SkPjfIK4Dc](https://www.youtube.com/watch?v=7SkPjfIK4Dc) |
| **Sweatcoin (Clubs)** | Fitness enthusiasts | Converts activity to charity donations/rewards using share-link "Clubs" for friend leaderboards | Unrelated to food ordering; entirely focused on step tracking | Free (Premium tier available) | [https://sweatco.in/](https://sweatco.in/) |
| **Charity Miles (Teams)** | Runners, walkers, cyclists | Seamlessly ties fitness milestones to charitable impact with highly social team leaderboards | No integration with dining, food delivery, or restaurant loyalty | Free (sponsors fund donations) | [https://charitymiles.org/](https://charitymiles.org/) |
| **Too Good To Go** | Eco-conscious consumers & restaurants | Gamifies CSR with "Meals Saved" tracking and "Local Hero" badges | Lacks direct friend-vs-friend leaderboards or social feeds | Free app (users pay for food) | [https://www.toogoodtogo.com/en-nz/local-hero](https://www.toogoodtogo.com/en-nz/local-hero) |
| **Untappd** | Craft beer enthusiasts | Deep badge ecosystem for check-ins with local venue and friend activity leaderboards | Limited to alcohol and venues; not a delivery platform | Free (Business tiers available) | [https://untappd.com/](https://untappd.com/) |
| **Grab (Rewards Challenges)** | Food delivery & ride-hailing users (SE Asia) | Deep gamification with timed challenges to unlock points and vouchers | Single-player only; missing the social comparison element | Free to join | [https://www.grab.com/my/rewards/challenges/](https://www.grab.com/my/rewards/challenges/) |
| **DoorDash (Dasher Challenges)** | DoorDash delivery drivers | Clear goal-based gamification with extra payouts for hitting delivery milestones | Strictly driver-focused; lacks consumer-facing gamification | Free for drivers | [https://help.doordash.com/en-us/dashers/article/dasher-challenges](https://help.doordash.com/en-us/dashers/article/dasher-challenges) |
| **Starbucks Rewards** | Regular Starbucks customers | Best-in-class personalized gamification (streak challenges, badges) driving retention | Single-player; completely isolated from social comparison | Free (requires purchases) | [https://www.starbucks.com/rewards/](https://www.starbucks.com/rewards/) |

---

### Strategy for a One-Month Sprint

Because you cannot build a robust friend network in one month, look closely at how **Sweatcoin Clubs** and **ShareTheMeal Teams** operate. Instead of global friend searches, they rely on **invite links**.

You can build an MVP leaderboard where a user taps "Create a Pack," gets a unique URL, and texts it to their friends. Anyone who clicks the link joins that isolated, temporary leaderboard. This shifts the burden of the social network to iMessage/WhatsApp, allowing you to focus your engineering effort purely on ranking the points, badges, and donation impact.