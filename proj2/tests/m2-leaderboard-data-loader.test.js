// M2: leaderboardDataLoader unit tests (issue #31).
// Source under test: server/services/leaderboardDataLoader.js

jest.mock('../server/config/firebase', () => require('./helpers/fakeFirestore').createFirestoreMock());

const { db } = require('../server/config/firebase');
const { loadUserScoreData, loadUserScoreDataForIds } = require('../server/services/leaderboardDataLoader');

function seedUser(id, overrides = {}) {
  const now = new Date();
  db.__seed('users', id, {
    id,
    email: `${id}@example.com`,
    password: 'pw',
    role: 'customer',
    profile: { name: id },
    createdAt: now,
    updatedAt: now,
    ...overrides,
  });
}

function seedDeliveredOrder(id, customerId) {
  db.__seed('orders', id, {
    id,
    customerId,
    restaurantId: 'restaurant-1',
    items: [{ menuItemId: 'item-1', quantity: 1, price: 10 }],
    totalAmount: 10,
    status: 'delivered',
  });
}

beforeEach(() => db.__reset());

describe('loadUserScoreData', () => {
  test('user with a points doc, a badges snapshot, and delivered orders -- all three values populated', async () => {
    seedUser('alice', {
      badges: {
        unique_restaurants: { currentTier: 'silver' }, // rank 2
        total_orders: { currentTier: 'bronze' }, // rank 1
        streak_days: { currentTier: null }, // not earned -> 0
      },
    });
    db.__seed('points', 'points-alice', { id: 'points-alice', userId: 'alice', totalPoints: 42 });
    seedDeliveredOrder('order-1', 'alice');
    seedDeliveredOrder('order-2', 'alice');

    const data = await loadUserScoreData('alice');

    expect(data).toEqual({
      userId: 'alice',
      totalPoints: 42,
      badgeTiers: 3, // silver(2) + bronze(1) + null(0)
      deliveredOrderCount: 2,
    });
  });

  test('user with no points doc -> totalPoints 0', async () => {
    seedUser('alice'); // no points doc seeded

    const data = await loadUserScoreData('alice');

    expect(data.totalPoints).toBe(0);
  });

  test('user with no badges snapshot -> badgeTiers 0', async () => {
    seedUser('alice'); // no `badges` field on the user doc

    const data = await loadUserScoreData('alice');

    expect(data.badgeTiers).toBe(0);
  });

  test('user with no orders -> deliveredOrderCount 0', async () => {
    seedUser('alice'); // no orders seeded

    const data = await loadUserScoreData('alice');

    expect(data.deliveredOrderCount).toBe(0);
  });

  test('a user id that does not resolve to any user doc -> everything defaults to 0, not an error', async () => {
    const data = await loadUserScoreData('nobody');

    expect(data).toEqual({
      userId: 'nobody',
      totalPoints: 0,
      badgeTiers: 0,
      deliveredOrderCount: 0,
    });
  });
});

describe('loadUserScoreDataForIds', () => {
  test('loads several users concurrently, each independently', async () => {
    seedUser('alice');
    db.__seed('points', 'points-alice', { id: 'points-alice', userId: 'alice', totalPoints: 10 });
    seedUser('bob');
    db.__seed('points', 'points-bob', { id: 'points-bob', userId: 'bob', totalPoints: 20 });

    const results = await loadUserScoreDataForIds(['alice', 'bob']);

    expect(results.map((r) => r.userId)).toEqual(['alice', 'bob']);
    expect(results.map((r) => r.totalPoints)).toEqual([10, 20]);
  });

  test('empty id list returns an empty array', async () => {
    const results = await loadUserScoreDataForIds([]);
    expect(results).toEqual([]);
  });
});
