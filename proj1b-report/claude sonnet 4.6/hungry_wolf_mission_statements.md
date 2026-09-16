# Mission Statement Candidates

---

## Candidate A

Food delivery apps reward you with points and badges, but they keep you in the dark about how your friends are doing. We built a social leaderboard inside an existing delivery platform that ranks users across three dimensions — loyalty points, badges earned, and meals donated — and lets you filter to a friends-only view. Unlike Chipotle's Summer of Extras, which shut down on August 31 and never included friend connections, our rankings are permanent, personal, and tied to real identity. Under the hood, we closed the unauthenticated endpoint that let anyone inflate donation counts and patched the double-spend path in the points ledger, so every rank you see is honest. The result: the first delivery app where loyalty is a sport you play with people you know.

---

## Candidate B

Gig workers, restaurants, and customers all participate in delivery — yet the points and badges they earn go unwitnessed by anyone in their social circle. Our app adds a persistent social leaderboard that combines loyalty points, achievement badges, and Meal-for-a-Meal donation totals into a single ranked score visible to friends. We audited the stack before launch: the donation counter in `donations.js` now requires authenticated requests, and the double-spend window in `points.js` is closed, so the leaderboard reflects effort, not exploits. No rival we surveyed — not DoorDash, not Uber Eats, not Snackpass — ranks friends against each other across all three of those dimensions in a live, year-round feed. For the first time, doing good and ordering often is something your friends can actually see.

---

## Candidate C

Delivery apps have turned loyalty into a solo game: you collect, you badge, you donate, and nobody notices. We are fixing that by building a social leaderboard into a React 19 / Firestore delivery platform that ties loyalty points, earned badges, and verified Meal-for-a-Meal donations into one competitive, friend-filtered ranking. Verified is the key word — we patched the unauthenticated donation endpoint and the double-spend bug before shipping any public scores, because a leaderboard built on dirty data is just a vanity counter. Starbucks, DoorDash, and Uber Eats all stop at solo gamification; Snackpass adds friends but has no competitive ranking; Chipotle tried leaderboards but made them seasonal and friendless. We combine all three ranked dimensions with real friend connections, year-round, inside an app people already use to order food.
