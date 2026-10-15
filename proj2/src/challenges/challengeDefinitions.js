// Challenge definitions — the declarative half of the M3 challenge engine.
// Mirrors src/badges/badgeDefinitions.js: adding a NEW challenge type means
// adding a definition object here. No evaluator change is needed as long as
// the definition uses an existing `metric` (see metricSelectors in
// evaluateChallenges.js); a genuinely new metric needs one selector function
// there — that is the honest extensibility boundary, same as badges.
//
// Shape:
//   id          unique slug; also the first segment of a challengeProgress
//               document id (`${id}_${teamId}_${weekKey}`)
//   scope       'team' (v1 only supports team challenges)
//   period      'weekly' (ISO week, UTC — see isoWeek.js)
//   metric      key into metricSelectors — what the evaluator measures over
//               the team's delivered orders for the week
//   target      numeric goal the metric must reach (>=) for the challenge
//               to be achieved
//   reward      what the payout grants exactly once per (challenge, team,
//               week) — { type: 'donatedMeals', amount } adds meals to the
//               Meal-for-a-Meal counter; { type: 'badge', badgeId } is wired
//               in issue #17 (stored separately from derived badges)

const challengeDefinitions = [
  {
    id: 'weekly-team-orders-15',
    label: 'Feast Together',
    description: 'Complete 15 team orders this week and we donate 5 extra meals.',
    icon: '🍕',
    scope: 'team',
    period: 'weekly',
    metric: 'teamDeliveredOrders',
    target: 15,
    reward: { type: 'donatedMeals', amount: 5 },
  },
  {
    id: 'weekly-team-spend-300',
    label: 'Big Appetite',
    description: 'Reach $300 of delivered team orders this week for 3 extra donated meals.',
    icon: '💰',
    scope: 'team',
    period: 'weekly',
    metric: 'teamDeliveredSpend',
    target: 300,
    reward: { type: 'donatedMeals', amount: 3 },
  },
  {
    id: 'weekly-whole-squad',
    label: 'Whole Squad Ate',
    description: 'Get at least 3 different team members to order this week.',
    icon: '🤝',
    scope: 'team',
    period: 'weekly',
    metric: 'uniqueActiveMembers',
    target: 3,
    reward: { type: 'badge', badgeId: 'team_player' },
  },
];

module.exports = { challengeDefinitions };
