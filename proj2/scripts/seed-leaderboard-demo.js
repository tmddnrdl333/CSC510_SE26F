#!/usr/bin/env node
// scripts/seed-leaderboard-demo.js
// Seeds three demo customers (varying points, badges, delivered orders) plus
// an accepted friendship between two of them, against the Firestore emulator,
// so the M2 leaderboard (issue #32) can be viewed with real data locally.
//
// Prerequisites: the Firestore emulator running (`docker compose up -d` from
// proj2/), and proj2/server/.env present (points FIRESTORE_EMULATOR_HOST at it
// by default -- see proj2/LOCAL_SETUP.md).
//
// Usage (from proj2/):
//   node scripts/seed-leaderboard-demo.js
//
// Idempotency note: this creates NEW user docs every run (User.create()
// auto-generates ids) -- rerunning adds three more demo customers rather
// than reusing the previous ones. Fine for local exploration; restart the
// emulator container (data is in-memory only) to start clean.

const fs = require('fs');
const path = require('path');

// Load server/.env ourselves (no `dotenv` package dependency here: this
// script's own directory has no node_modules, and Node's module resolution
// for a bare `require('dotenv')` doesn't reach into the sibling
// server/node_modules the way server/config/firebase.js's own requires do).
function loadServerEnv() {
  const envPath = path.resolve(__dirname, '../server/.env');
  if (!fs.existsSync(envPath)) return;
  const lines = fs.readFileSync(envPath, 'utf8').split('\n');
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    const value = trimmed.slice(eq + 1).trim();
    if (!(key in process.env)) {
      process.env[key] = value;
    }
  }
}
loadServerEnv();

const { db } = require('../server/config/firebase');
const User = require('../server/models/User');
const Friendship = require('../server/models/Friendship');

// Writes a points doc in BOTH addressing schemes this codebase uses for the
// same `points` collection, so this demo reads consistently everywhere:
//   - doc id === customerId, no `userId` field -- what routes/points.js's
//     GET / (the dashboard's source) and awardPointsForOrder (the real
//     order-completion path, routes/delivery.js) both read/write.
//   - a `userId` field on that same doc -- what models/Points.js's
//     findByUserId() (what leaderboardDataLoader.js reads) queries by.
// NOT a fix to either reader; this only shapes seeded data to satisfy both
// as they exist today. The two schemes are a real, separate app-level
// inconsistency -- worth its own issue, out of scope here.
async function seedPoints(customerId, totalPoints) {
  const now = new Date();
  await db.collection('points').doc(customerId).set({
    userId: customerId,
    userRole: 'customer',
    totalPoints,
    availablePoints: totalPoints,
    usedPoints: 0,
    transactions: [{ type: 'earned', points: totalPoints, description: 'seed data', orderId: null, createdAt: now }],
    createdAt: now,
    updatedAt: now,
  });
}

async function seedDeliveredOrders(customerId, count) {
  for (let i = 0; i < count; i += 1) {
    const ref = db.collection('orders').doc();
    await ref.set({
      id: ref.id,
      customerId,
      restaurantId: 'seed-restaurant',
      items: [{ menuItemId: 'item-1', quantity: 1, price: 15 }],
      totalAmount: 15,
      deliveryFee: 3,
      tipAmount: 2,
      status: 'delivered',
      deliveryAddress: { street: '1 Main St', city: 'Raleigh', state: 'NC', zipCode: '27606' },
      createdAt: new Date(),
      updatedAt: new Date(),
      deliveredAt: new Date(),
    });
  }
}

async function main() {
  const alice = await User.create({ email: `alice-${Date.now()}@example.com`, password: 'pw', role: 'customer', profile: { name: 'Alice' } });
  const bob   = await User.create({ email: `bob-${Date.now()}@example.com`,   password: 'pw', role: 'customer', profile: { name: 'Bob' } });
  const carol = await User.create({ email: `carol-${Date.now()}@example.com`, password: 'pw', role: 'customer', profile: { name: 'Carol' } });

  // Points: alice and bob get some, carol gets none (exercises the leaderboard's
  // "missing points doc -> 0" default path).
  await seedPoints(alice.id, 120);
  await seedPoints(bob.id, 40);

  // Badges snapshot, hand-written in the shape server/services/badgeService.js
  // writes (currentTier/progress/nextTierThreshold/lastUpdatedAt per badge id).
  await db.collection('users').doc(alice.id).set({
    badges: {
      unique_restaurants: { currentTier: 'gold', progress: 10, nextTierThreshold: 20, lastUpdatedAt: new Date().toISOString() },
      total_orders: { currentTier: 'bronze', progress: 5, nextTierThreshold: 10, lastUpdatedAt: new Date().toISOString() },
    },
  }, { merge: true });
  await db.collection('users').doc(bob.id).set({
    badges: {
      streak_days: { currentTier: 'silver', progress: 7, nextTierThreshold: 14, lastUpdatedAt: new Date().toISOString() },
    },
  }, { merge: true });
  // carol: no `badges` field at all -- exercises the "missing snapshot -> 0" path.

  // Delivered orders -> donatedMeals = floor(deliveredOrderCount / 10).
  await seedDeliveredOrders(alice.id, 23); // 2 donated meals
  await seedDeliveredOrders(bob.id, 11);   // 1 donated meal
  // carol: 0 delivered orders.

  // Accepted friendship: alice <-> bob. Carol stays unconnected, so
  // ?scope=friends for alice/bob excludes her.
  const friendship = await Friendship.create({ userA: alice.id, userB: bob.id, requesterId: alice.id });
  await friendship.accept();

  console.log('Seeded leaderboard demo data:');
  console.log({ alice: alice.id, bob: bob.id, carol: carol.id });
  process.exit(0);
}

main().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
