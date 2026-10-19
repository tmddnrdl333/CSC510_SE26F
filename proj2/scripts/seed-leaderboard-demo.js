#!/usr/bin/env node
// scripts/seed-leaderboard-demo.js
// Seeds three demo customers (varying points and delivered orders, badges
// computed for real from those orders) plus an accepted friendship between
// two of them, against the Firestore emulator, so the M2 leaderboard
// (issue #32) can be viewed with real data locally.
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
const { updateCustomerBadges } = require('../server/services/badgeService');

// Writes a points doc the way the real app does: doc id === customerId, no
// `userId` field. Matches awardPointsForOrder (server/routes/points.js, the
// real order-completion path, confirmed against M1's branch) and GET
// /api/points (the dashboard). See issue #55 -- a loader that read points
// any other way couldn't see real, production-earned points at all.
async function seedPoints(customerId, totalPoints) {
  const now = new Date();
  await db.collection('points').doc(customerId).set({
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

  // Delivered orders -> donatedMeals = floor(deliveredOrderCount / 10).
  await seedDeliveredOrders(alice.id, 23); // 2 donated meals
  await seedDeliveredOrders(bob.id, 11);   // 1 donated meal
  // carol: 0 delivered orders.

  // Badges computed for real from the seeded orders (the same path
  // CustomerBadges.tsx's auto-refresh triggers), not hand-written -- a
  // hand-written `badges` snapshot would just get overwritten the moment
  // any page with CustomerBadges.tsx mounts anyway.
  await updateCustomerBadges(alice.id);
  await updateCustomerBadges(bob.id);
  await updateCustomerBadges(carol.id); // 0 orders -> all tiers null, correctly

  // Accepted friendship: alice <-> bob. Carol stays unconnected, so
  // ?scope=friends for alice/bob excludes her.
  const friendship = await Friendship.create({ userA: alice.id, userB: bob.id, requesterId: alice.id });
  await friendship.accept();

  console.log('Seeded leaderboard demo data:');
  console.log([
    { name: 'Alice', id: alice.id, email: alice.email },
    { name: 'Bob', id: bob.id, email: bob.email },
    { name: 'Carol', id: carol.id, email: carol.email },
  ]);
  console.log('Password for all three: pw');
  process.exit(0);
}

main().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
