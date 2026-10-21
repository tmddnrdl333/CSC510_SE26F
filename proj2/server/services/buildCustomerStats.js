const { db } = require('../config/firebase');

const HIGH_VALUE_ORDER_THRESHOLD = 40;
const BIG_FEAST_ITEM_COUNT_THRESHOLD = 5;
const LONG_REVIEW_LENGTH_THRESHOLD = 100;
const LATE_NIGHT_START_HOUR = 22;
const LATE_NIGHT_END_HOUR = 2;
const FRIDAY_DAY_INDEX = 5;
const DAY_IN_MS = 24 * 60 * 60 * 1000;

const normalizeTimestamp = (value) => {
  if (!value) return null;
  if (value instanceof Date) return value;
  if (value && typeof value.toDate === 'function') {
    return value.toDate();
  }
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const startOfDay = (date) => {
  if (!date) return null;
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
};

const isLateNight = (date) => {
  if (!date) return false;
  const hour = date.getHours();
  if (LATE_NIGHT_START_HOUR <= LATE_NIGHT_END_HOUR) {
    return hour >= LATE_NIGHT_START_HOUR && hour < LATE_NIGHT_END_HOUR;
  }
  return hour >= LATE_NIGHT_START_HOUR || hour < LATE_NIGHT_END_HOUR;
};

const sumItemQuantity = (items = []) =>
  items.reduce((total, item) => total + (item.quantity || 1), 0);

const extractMenuItemIds = (items = []) => {
  const ids = [];
  items.forEach((item) => {
    if (item.menuItemId) {
      ids.push(item.menuItemId);
    } else if (item.id) {
      ids.push(item.id);
    } else if (item.name) {
      ids.push(`name:${item.name}`);
    }
  });
  return ids;
};

const computeMaxStreak = (orders) => {
  const dayKeys = new Set();
  orders.forEach((order) => {
    const date = normalizeTimestamp(order.createdAt) || normalizeTimestamp(order.deliveredAt);
    const sod = startOfDay(date);
    if (sod) {
      dayKeys.add(sod.getTime());
    }
  });

  const sortedDays = Array.from(dayKeys).sort((a, b) => a - b);
  let maxStreak = 0;
  let currentStreak = 0;
  let previousDay = null;

  sortedDays.forEach((day) => {
    if (previousDay === null || day - previousDay === DAY_IN_MS) {
      currentStreak += 1;
    } else {
      currentStreak = 1;
    }
    previousDay = day;
    if (currentStreak > maxStreak) {
      maxStreak = currentStreak;
    }
  });

  return maxStreak;
};

const countFridayOrders = (orders) =>
  orders.reduce((count, order) => {
    const date = normalizeTimestamp(order.createdAt) || normalizeTimestamp(order.deliveredAt);
    if (!date) return count;
    return date.getDay() === FRIDAY_DAY_INDEX ? count + 1 : count;
  }, 0);

const countLateNightOrders = (orders) =>
  orders.reduce((count, order) => {
    const date = normalizeTimestamp(order.createdAt) || normalizeTimestamp(order.deliveredAt);
    return isLateNight(date) ? count + 1 : count;
  }, 0);

const groupOrdersByRestaurant = (orders) => {
  const counts = {};
  orders.forEach((order) => {
    if (!order.restaurantId) return;
    counts[order.restaurantId] = (counts[order.restaurantId] || 0) + 1;
  });
  return counts;
};

const detectPointsOrders = (transactions = []) =>
  transactions.filter((tx) => {
    if (!tx) return false;
    const normalizedType = (tx.type || '').toLowerCase();
    const description = (tx.description || '').toLowerCase();
    return (
      normalizedType === 'redeemed' ||
      description.includes('redeem') ||
      description.includes('discount') ||
      description.includes('coupon') ||
      description.includes('points applied')
    );
  }).length;

const extractReviewsFromOrders = (orders = []) =>
  orders.reduce((reviews, order) => {
    if (!order || !order.ratings || !order.ratings.customer) {
      return reviews;
    }

    const customerRating = order.ratings.customer;
    if (typeof customerRating.rating === 'undefined' || customerRating.rating === null) {
      return reviews;
    }

    reviews.push({
      rating: Number(customerRating.rating),
      text: customerRating.review || '',
      restaurantId: order.restaurantId || customerRating.restaurantId || null,
      orderId: order.id,
      source: 'order_rating',
      createdAt: customerRating.ratedAt || order.updatedAt || order.createdAt || null,
    });

    return reviews;
  }, []);

async function fetchCustomerOrders(customerId) {
  const snapshot = await db
    .collection('orders')
    .where('customerId', '==', customerId)
    .orderBy('createdAt', 'asc')
    .get();

  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
}

async function fetchCustomerReviews(customerId) {
  try {
    const snapshot = await db.collection('reviews').where('customerId', '==', customerId).get();
    return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.warn('Reviews collection unavailable, returning empty set:', error.message);
    return [];
  }
}

async function fetchPointsTransactions(customerId) {
  const doc = await db.collection('points').doc(customerId).get();
  if (!doc.exists) return [];
  const data = doc.data();
  return Array.isArray(data.transactions) ? data.transactions : [];
}

async function buildCustomerStats(customerId) {
  if (!customerId) {
    throw new Error('Customer ID is required to build stats');
  }

  const [orders, storedReviews, pointsTransactions] = await Promise.all([
    fetchCustomerOrders(customerId),
    fetchCustomerReviews(customerId),
    fetchPointsTransactions(customerId),
  ]);

  const inlineReviews = extractReviewsFromOrders(orders);
  const combinedReviews = [...storedReviews, ...inlineReviews];

  const totalOrdersCount = orders.length;
  const uniqueRestaurants = new Set();
  const menuItemIds = new Set();
  let lifetimeSpend = 0;
  let highValueOrdersCount = 0;
  let bigFeastOrdersCount = 0;
  let totalTipAmount = 0;
  let tipOrdersCount = 0;

  orders.forEach((order) => {
    if (order.restaurantId) {
      uniqueRestaurants.add(order.restaurantId);
    }

    const totalAmount = Number(order.totalAmount) || 0;
    lifetimeSpend += totalAmount;
    if (totalAmount >= HIGH_VALUE_ORDER_THRESHOLD) {
      highValueOrdersCount += 1;
    }

    const tipAmount = Number(order.tipAmount) || 0;
    totalTipAmount += tipAmount;
    if (tipAmount > 0) {
      tipOrdersCount += 1;
    }

    const itemQuantity = sumItemQuantity(order.items);
    if (itemQuantity >= BIG_FEAST_ITEM_COUNT_THRESHOLD) {
      bigFeastOrdersCount += 1;
    }

    extractMenuItemIds(order.items).forEach((id) => menuItemIds.add(id));
  });

  const fridayOrdersCount = countFridayOrders(orders);
  const lateNightOrdersCount = countLateNightOrders(orders);
  const restaurantCounts = groupOrdersByRestaurant(orders);
  const sameRestaurantMaxOrders = Object.values(restaurantCounts).reduce(
    (max, count) => Math.max(max, count),
    0
  );

  const maxStreakDays = computeMaxStreak(orders);
  const pointsOrdersCount = detectPointsOrders(pointsTransactions);

  const totalReviewsCount = combinedReviews.length;
  let oneStarReviewsCount = 0;
  let fiveStarReviewsCount = 0;
  let longReviewsCount = 0;
  const reviewedRestaurants = new Set();

  combinedReviews.forEach((review) => {
    const rating = Number(review.rating) || 0;
    if (rating === 1) oneStarReviewsCount += 1;
    if (rating === 5) fiveStarReviewsCount += 1;
    if ((review.text || '').trim().length >= LONG_REVIEW_LENGTH_THRESHOLD) {
      longReviewsCount += 1;
    }
    if (review.restaurantId) {
      reviewedRestaurants.add(review.restaurantId);
    }
  });

  const stats = {
    uniqueRestaurantsCount: uniqueRestaurants.size,
    totalOrdersCount,
    maxStreakDays,
    lifetimeSpend: Number(lifetimeSpend.toFixed(2)),
    highValueOrdersCount,
    totalReviewsCount,
    oneStarReviewsCount,
    fiveStarReviewsCount,
    sameRestaurantMaxOrders,
    fridayOrdersCount,
    lateNightOrdersCount,
    pointsOrdersCount,
    bigFeastOrdersCount,
    uniqueMenuItemsCount: menuItemIds.size,
    longReviewsCount,
    reviewedRestaurantsCount: reviewedRestaurants.size,
    totalTipAmount: Number(totalTipAmount.toFixed(2)),
    tipOrdersCount,
  };

  console.log('[buildCustomerStats] stats computed', {
    customerId,
    totalOrdersCount,
    totalReviewsCount,
    storedReviewsCount: storedReviews.length,
    inlineReviewsCount: inlineReviews.length,
    oneStarReviewsCount,
    fiveStarReviewsCount,
    totalTipAmount,
    tipOrdersCount,
  });

  return stats;
}

module.exports = {
  buildCustomerStats,
};
