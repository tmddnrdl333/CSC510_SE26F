Here is the classification of your 20 use cases, based on the current landscape of major food delivery platforms.

### Use Case Analysis

| Use Case | Classification | Justification |
| --- | --- | --- |
| **UC1 Sign up with a role** | TABLE STAKES | Every multi-sided marketplace rival, including Uber Eats, requires role-based user accounts. |
| **UC2 Log in** | TABLE STAKES | This is an essential security and identity feature present in DoorDash and all competitors. |
| **UC3 Manage profile** | TABLE STAKES | Basic account management (address, phone) is standard across Grubhub, DoorDash, and Uber Eats. |
| **UC4 Browse nearby restaurants** | TABLE STAKES | Location-based discovery is the fundamental user experience of Uber Eats. |
| **UC5 Build a cart** | TABLE STAKES | A standard e-commerce shopping cart is used by DoorDash and every other rival. |
| **UC6 Place an order** | TABLE STAKES | This is the core transactional capability of Grubhub and all food delivery apps. |
| **UC7 Track my order status** | TABLE STAKES | DoorDash provides detailed order status tracking from kitchen acceptance to doorstep arrival. |
| **UC8 Rate a delivered order** | TABLE STAKES | Uber Eats relies on a standard rating system for courier and restaurant quality control. |
| **UC9 Earn loyalty points** | TABLE STAKES | Grubhub (via Grubhub Points) and standard restaurant apps already offer basic point-per-dollar loyalty systems. |
| **UC10 Redeem points for discount** | TABLE STAKES | Redeeming points at checkout is the standard reward loop used by Grubhub and adjacent platforms like Starbucks. |
| **UC11 Control app by voice** | DIFFERENTIATOR | None of the major rivals like DoorDash or Uber Eats offer native in-app voice navigation. |
| **UC12 Restaurant handles order** | TABLE STAKES | The DoorDash merchant tablet is built entirely around accepting and managing incoming orders. |
| **UC13 Restaurant reviews sales** | TABLE STAKES | Uber Eats provides comprehensive performance analytics through its Uber Eats Manager portal. |
| **UC14 Restaurant manages menu** | TABLE STAKES | DoorDash allows restaurants to easily update items, prices, and availability via their merchant portal. |
| **UC15 Driver claims a job** | TABLE STAKES | The Dasher app requires drivers to explicitly accept or decline incoming delivery offers. |
| **UC16 Driver picks up/delivers** | TABLE STAKES | This is the core logistics execution present in the Uber Driver and DoorDash Dasher apps. |
| **UC17 Scripted 20s map animation** | DIFFERENTIATOR | Uber Eats and DoorDash use actual live GPS feeds, so a scripted animation is a cost-saving workaround none of them use. |
| **UC18 Driver reviews earnings** | TABLE STAKES | Detailed earnings and payout breakdowns are a core feature of the Uber Driver app. |
| **UC19 Earn achievement badges** | DIFFERENTIATOR | Uber Eats and DoorDash do not gamify the consumer ordering experience with achievement badges. |
| **UC20 Donation impact counter** | DIFFERENTIATOR | While some apps allow checkout round-ups, a dedicated 1:1 meal donation impact counter is absent in major rivals like DoorDash. |

---

### Evaluation of the Proposed Feature: Social Leaderboard

**Classification:** DIFFERENTIATOR (with major caveats).

A leaderboard tracking food orders, points, and donations among friends is virtually absent in modern food delivery (Snackpass has a social feed and gifting, but not a strict competitive point/badge leaderboard). However, in adjacent location-based and gamified commerce, **Foursquare (Swarm)** famously attempted the "friend leaderboard for checking into local businesses" model and ultimately abandoned the consumer social-competition aspect due to long-term user fatigue, moving toward single-player utility.

**The 1-Month Constraint Problem:**
Building a true "friend connection" system (searching for users, sending requests, accepting requests, handling privacy/blocking, and database mapping) is a massive engineering undertaking. **You cannot reliably build, test, and ship a two-way social graph and a real-time leaderboard in four weeks.**

**The Stronger Differentiator for a 1-Month Sprint:**
Instead of a global leaderboard with traditional friend connections, build an **"Invite-Link Squad Leaderboard."**

* **Why it's better:** A user taps "Create a Squad," gets a unique URL, and texts it to their existing group chats. Anyone who clicks the link joins that isolated, temporary leaderboard. This completely eliminates the need to build user search, friend requests, and privacy settings—you offload the social graph to iMessage/WhatsApp. It perfectly fits your tight four-week constraint while still delivering the competitive social dynamic you want to test, and it gives Hungry Wolf a built-in viral acquisition loop (sharing links outside the app) that Uber Eats and DoorDash lack.