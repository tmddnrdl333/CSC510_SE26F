// Pure challenge evaluator — the engine half of the M3 challenge engine.
// Mirrors src/badges/evaluateBadges.js: definitions are data, this module is
// the only code. It computes a team's progress for one ISO week from a list
// of orders. No DB access, no auth, no side effects — the service layer
// (issues #15/#16) feeds it orders and persists nothing but reward payouts.

const { getUtcIsoWeek } = require('./isoWeek');
const { challengeDefinitions } = require('./challengeDefinitions');

// Timestamps in this repo arrive as Date, ISO string, or Firestore-style
// objects exposing toDate() — same normalization as buildCustomerStats.
const normalizeTimestamp = (value) => {
  if (!value) return null;
  if (value instanceof Date) return value;
  if (typeof value.toDate === 'function') return value.toDate();
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

// One selector per metric. Adding a NEW metric = adding one entry here;
// adding a new challenge that reuses an existing metric = definitions only.
const metricSelectors = {
  teamDeliveredOrders: (orders) => orders.length,
  teamDeliveredSpend: (orders) =>
    orders.reduce((sum, order) => sum + (Number(order.totalAmount) || 0), 0),
  uniqueActiveMembers: (orders) =>
    new Set(orders.map((order) => order.customerId)).size,
};

/**
 * Filters raw orders down to the ones that count for a team-week:
 * delivered, placed by a team member, inside the ISO week (UTC).
 */
const filterTeamWeekOrders = (orders = [], { memberIds = [], weekKey }) => {
  const members = new Set(memberIds);
  return orders.filter((order) => {
    if (!order || order.status !== 'delivered') return false;
    if (!members.has(order.customerId)) return false;
    const ts = normalizeTimestamp(order.timestamp || order.createdAt);
    if (!ts) return false;
    return getUtcIsoWeek(ts) === weekKey;
  });
};

const evaluateChallenge = (definition, scopedOrders) => {
  const selector = metricSelectors[definition.metric];
  if (!selector) {
    throw new Error(
      `evaluateChallenges: unknown metric "${definition.metric}" in definition ` +
      `"${definition.id}" — add a selector to metricSelectors or use an existing metric`
    );
  }

  const progress = selector(scopedOrders);
  const target = Number(definition.target);
  const achieved = progress >= target;

  return {
    definitionId: definition.id,
    label: definition.label,
    description: definition.description,
    icon: definition.icon,
    metric: definition.metric,
    progress,
    target,
    percent: target > 0 ? Math.min(100, Math.round((progress / target) * 100)) : 0,
    achieved,
    reward: definition.reward,
  };
};

/**
 * Evaluates every definition for one team and one ISO week.
 *
 * @param {Object} params
 * @param {Array}  params.orders     raw orders (any status, any customer) —
 *                                   filtering happens here
 * @param {Array}  params.memberIds  the team's member user ids
 * @param {string} params.weekKey    ISO week key, e.g. '2026-W42'
 * @param {Array}  [params.definitions] defaults to challengeDefinitions
 * @returns {Array} one evaluation result per definition
 */
const evaluateChallenges = ({ orders = [], memberIds = [], weekKey, definitions = challengeDefinitions }) => {
  if (!weekKey) {
    throw new Error('evaluateChallenges: weekKey is required (e.g. "2026-W42")');
  }
  const scopedOrders = filterTeamWeekOrders(orders, { memberIds, weekKey });
  return definitions.map((definition) => evaluateChallenge(definition, scopedOrders));
};

/**
 * Deterministic challengeProgress document id — one per (challenge, team,
 * week), so concurrent payout attempts collide on the same document and the
 * payout transaction (issue #15) can guarantee exactly-once rewards.
 */
const buildChallengeProgressId = (definitionId, teamId, weekKey) =>
  `${definitionId}_${teamId}_${weekKey}`;

module.exports = {
  evaluateChallenges,
  filterTeamWeekOrders,
  buildChallengeProgressId,
  metricSelectors,
};
