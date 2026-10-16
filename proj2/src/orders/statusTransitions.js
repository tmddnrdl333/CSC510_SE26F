// Kitchen workflow a restaurant may drive through PUT /api/orders/:id/status.
//
// `out_for_delivery` and `delivered` are deliberately unreachable here: they
// are set only by the assigned delivery partner via /api/delivery/accept and
// /api/delivery/deliver, which is what pays the rider and awards points. If a
// restaurant could set `delivered` directly, delivered-order counts (donations,
// badges, M2 leaderboard, M3 challenges) could be forged (DB_DESIGN_M2_M3.md §6).

const RESTAURANT_TRANSITIONS = {
  pending: ['confirmed', 'preparing', 'cancelled'],
  confirmed: ['preparing', 'cancelled'],
  preparing: ['ready', 'cancelled'],
  ready: ['cancelled'],
  out_for_delivery: [],
  delivered: [],
  cancelled: [],
};

/** Statuses a restaurant may ever request, regardless of the current one. */
const RESTAURANT_SETTABLE_STATUSES = ['confirmed', 'preparing', 'ready', 'cancelled'];

/**
 * @param {string} from current order status
 * @param {string} to   requested status
 * @returns {boolean} whether a restaurant may move an order from `from` to `to`
 */
function canRestaurantTransition(from, to) {
  return (RESTAURANT_TRANSITIONS[from] || []).includes(to);
}

module.exports = { RESTAURANT_TRANSITIONS, RESTAURANT_SETTABLE_STATUSES, canRestaurantTransition };
