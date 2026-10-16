// Points earned for a completed order (README "Gamification Features"):
//   10% of the bill, or 15% at a Local Legend restaurant, rounded down.
// Points redeem at 1 point = $0.01 (routes/points.js), so a $50 order earns 5 points.
//
// Math is done in integer cents so floating point never rounds a whole point
// away (0.29 * 100 === 28.999999999999996 in JS).

const BASE_RATE_PERCENT = 10;
const LOCAL_LEGEND_RATE_PERCENT = 15;

/**
 * @param {number} orderAmount  bill total in dollars
 * @param {{ isLocalLegend?: boolean }} [opts]
 * @returns {number} whole points, never negative
 */
function computeOrderPoints(orderAmount, { isLocalLegend = false } = {}) {
  const amount = Number(orderAmount);
  if (!Number.isFinite(amount) || amount <= 0) return 0;

  const cents = Math.round(amount * 100);
  const ratePercent = isLocalLegend ? LOCAL_LEGEND_RATE_PERCENT : BASE_RATE_PERCENT;
  return Math.floor((cents * ratePercent) / 10000);
}

module.exports = { computeOrderPoints, BASE_RATE_PERCENT, LOCAL_LEGEND_RATE_PERCENT };
