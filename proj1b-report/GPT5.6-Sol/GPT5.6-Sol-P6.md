The three futures should test different product hypotheses: SAFE tests whether voice can reliably execute known cart actions, BOLD tests whether personalization improves discovery, and WILD tests whether a conversational agent can replace most of the menu experience.

## SAFE — Voice checkout, narrowly bounded

**Elevator pitch:** Turn the existing voice navigator into a hands-free cart controller that can add, remove, and change item quantities, then place an order after reading back every material detail. It does not personalize or improvise: it executes a small, explicit command set against the existing menu and cart model.

**What four students can build and test in one month:**

- Extend `server/routes/voice.js` with structured intents for search, add, remove, quantity, modifiers, address selection, tip, and checkout.
- Resolve spoken dishes only against the selected restaurant’s current menu; ambiguous matches trigger a clarification instead of a guess.
- Add an order review dialogue that reads back restaurant, items, quantities, fees, tip, discount, address, and total before requiring an explicit “place order.”
- Use sandbox payment or a clearly labeled test-order flow; never collect card numbers through speech.
- Test approximately 150 scripted and adversarial conversations covering accents, background noise, unavailable items, duplicate commands, interruptions, corrections, and accidental confirmation.
- Conduct task-based usability testing with 10–15 participants, including several who use assistive technology.

**Biggest risk:** Speech recognition may appear impressive in demonstrations but still make enough item, modifier, or quantity mistakes that users cannot trust it with a transaction.

**Kill signal:** “We abandon this version if we see any order submitted without explicit confirmation, or fewer than 95% of test sessions end with the intended cart after clarification and correction.”

---

## BOLD — A genuinely personalized menu

**Elevator pitch:** Give every customer a ranked menu that elevates dishes matching their history, dietary restrictions, price range, and stated preferences while preserving access to the full original menu. The product bet is that better ordering comes from reducing discovery effort, not from adding another chatbot.

**What four students can build and test in one month:**

- Build a hybrid ranker using available order history plus explicit preference inputs such as cuisine, price range, vegetarian status, allergies, and disliked ingredients.
- Implement a cold-start questionnaire so new or low-history customers receive useful results without fabricated behavioral assumptions.
- Treat allergies and firm dietary restrictions as deterministic filters, never as probabilistic recommendations.
- Add a “Recommended for you” section alongside the unchanged full menu, with short explanations such as “Similar to previous orders” or “Matches your vegetarian preference.”
- Provide controls to edit preferences, dismiss recommendations, reset personalization, and temporarily browse without personalization.
- Evaluate historical orders offline with top-*k* ranking metrics, then run a controlled prototype study comparing personalized and static menus on selection time, recommendation acceptance, perceived relevance, and trust.
- Explicitly test sparse histories, contradictory preferences, shared accounts, changing diets, and restaurants with limited menu metadata.

**Biggest risk:** Current order histories and menu metadata may be too sparse or inconsistent to outperform simple cuisine and popularity rules, especially for new users.

**Kill signal:** “We abandon this version if personalization produces no meaningful improvement over a popularity-plus-preferences baseline, or if any hard dietary restriction is violated in testing.”

---

## WILD — Replace the menu with a voice-first dining agent

**Elevator pitch:** Instead of browsing a menu, the customer tells Hungry Wolf what they want—“something spicy and vegetarian under $20”—and the assistant selects dishes, negotiates alternatives, builds the cart, and places the confirmed order. The traditional menu becomes a fallback rather than the primary interface.

**What four students can build and test in one month:**

- Limit the prototype to three to five restaurants with manually cleaned menus, modifier rules, dietary tags, prices, and availability.
- Combine personalized ranking with a multi-turn voice agent that asks constraints, proposes a small set of dishes, explains its choices, modifies the cart, and initiates checkout.
- Constrain every agent action through typed server tools: menu search, item lookup, cart mutation, total calculation, and order submission.
- Make the server authoritative for menu availability, prices, discounts, delivery fees, tips, donation increments, and partner pay.
- Require a deterministic final read-back and confirmation outside the generative model’s control.
- Run 100 end-to-end scenarios involving vague requests, allergies, substitutions, hallucinated dishes, prompt injection, changed prices, speech errors, and mid-conversation corrections.
- Compare it with normal menu browsing on completion rate, time, correction count, confidence, and willingness to use it for a real purchase.

**Biggest risk:** Combining imperfect personalization, probabilistic dialogue, speech recognition, and consequential ordering creates compound errors that may exceed what a one-month prototype can make trustworthy.

**Kill signal:** “We abandon this version if more than 5% of sessions contain a wrong or nonexistent item, an unsafe dietary recommendation, or a cart state the user cannot understand and correct before checkout.”

SAFE is the defensible Project 2 commitment, BOLD is the strongest isolated product experiment, and WILD is valuable primarily as a constrained research prototype—not as a one-month production promise.