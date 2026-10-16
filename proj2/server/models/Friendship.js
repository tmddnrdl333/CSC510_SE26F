// server/models/Friendship.js
// Schema/contract: proj2/docs/plans/m2-leaderboard.md §4 (and the design doc
// it follows, docs/DB_DESIGN_M2_M3.md §2.1).
const { db } = require('../config/firebase');

class Friendship {
  constructor(data) {
    this.id = data.id;
    this.userA = data.userA;
    this.userB = data.userB;
    this.requesterId = data.requesterId;
    this.status = data.status; // 'pending' | 'accepted'
    this.members = data.members || [data.userA, data.userB];
    this.createdAt = data.createdAt || new Date();
    this.updatedAt = data.updatedAt || new Date();
    this.acceptedAt = data.acceptedAt || null;
  }

  // Deterministic pair id: sort lexicographically, join with "_".
  // Makes a duplicate or reverse-direction request collide with the existing
  // doc by construction, and turns an existence check into a single get().
  static computeId(idA, idB) {
    const [userA, userB] = [idA, idB].sort();
    return `${userA}_${userB}`;
  }

  static async findById(id) {
    const doc = await db.collection('friendships').doc(id).get();
    if (!doc.exists) return null;
    return new Friendship({ id: doc.id, ...doc.data() });
  }

  // Looks up the doc for this pair regardless of request direction.
  static async findByPair(idA, idB) {
    return Friendship.findById(Friendship.computeId(idA, idB));
  }

  // Creates a new pending friendship doc for this pair. Caller is
  // responsible for checking an existing doc first (self-request,
  // already-friends, idempotent-duplicate-pending are route-level
  // validation concerns, not this method's).
  static async create({ userA: idA, userB: idB, requesterId }) {
    const [userA, userB] = [idA, idB].sort();
    const id = Friendship.computeId(userA, userB);
    const now = new Date();
    const doc = {
      id,
      userA,
      userB,
      requesterId,
      status: 'pending',
      members: [userA, userB],
      createdAt: now,
      updatedAt: now,
      acceptedAt: null,
    };
    await db.collection('friendships').doc(id).set(doc);
    return new Friendship(doc);
  }

  async accept() {
    const now = new Date();
    await db.collection('friendships').doc(this.id).update({
      status: 'accepted',
      acceptedAt: now,
      updatedAt: now,
    });
    this.status = 'accepted';
    this.acceptedAt = now;
    this.updatedAt = now;
    return this;
  }

  async delete() {
    await db.collection('friendships').doc(this.id).delete();
    return this;
  }

  // Two equality queries merged in code -- NOT array-contains on `members`.
  // tests/helpers/fakeFirestore.js only implements ==, !=, in, <, <=, >, >=.
  static async listForUser(userId) {
    const [asUserA, asUserB] = await Promise.all([
      db.collection('friendships').where('userA', '==', userId).get(),
      db.collection('friendships').where('userB', '==', userId).get(),
    ]);
    const docs = [...asUserA.docs, ...asUserB.docs];
    return docs.map((doc) => new Friendship({ id: doc.id, ...doc.data() }));
  }

  // Returns the accepted friend ids for userId (the *other* party in each
  // accepted doc). Built on by the leaderboard's ?scope=friends and, per
  // docs/MILESTONES.md's shared contracts, M3's team-join check.
  static async getFriends(userId) {
    const friendships = await Friendship.listForUser(userId);
    return friendships
      .filter((f) => f.status === 'accepted')
      .map((f) => (f.userA === userId ? f.userB : f.userA));
  }

  toJSON() {
    return {
      id: this.id,
      userA: this.userA,
      userB: this.userB,
      requesterId: this.requesterId,
      status: this.status,
      members: this.members,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      acceptedAt: this.acceptedAt,
    };
  }
}

module.exports = Friendship;
