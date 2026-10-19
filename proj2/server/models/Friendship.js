// server/models/Friendship.js
// Schema/contract: proj2/docs/plans/m2-leaderboard.md §4 (and the design doc
// it follows, docs/DB_DESIGN_M2_M3.md §2.1).
const { db } = require('../config/firebase');

class Friendship {
  /**
   * @param {object} data - Raw Firestore doc data (plus `id`).
   * @param {string} data.id
   * @param {string} data.userA - Lexicographically smaller `users.id`.
   * @param {string} data.userB - Lexicographically larger `users.id`.
   * @param {string} data.requesterId - Who sent the request (`userA` or `userB`).
   * @param {'pending'|'accepted'} data.status
   * @param {string[]} [data.members] - `[userA, userB]`; reserved for a
   *   future `array-contains` query, unused today.
   * @param {Date} [data.createdAt]
   * @param {Date} [data.updatedAt]
   * @param {Date|null} [data.acceptedAt] - Set when `accept()` runs.
   */
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

  /**
   * Deterministic pair id: sort the two user ids lexicographically and join
   * with "_". Makes a duplicate or reverse-direction request collide with
   * the existing doc by construction, and turns an existence check into a
   * single `.doc(id).get()` instead of a query.
   *
   * @param {string} idA
   * @param {string} idB
   * @returns {string} `${smaller}_${larger}`
   */
  static computeId(idA, idB) {
    const [userA, userB] = [idA, idB].sort();
    return `${userA}_${userB}`;
  }

  /**
   * Looks up a friendship doc by its (deterministic) id.
   *
   * @param {string} id
   * @returns {Promise<Friendship|null>} `null` if no doc exists at that id.
   */
  static async findById(id) {
    const doc = await db.collection('friendships').doc(id).get();
    if (!doc.exists) return null;
    return new Friendship({ id: doc.id, ...doc.data() });
  }

  /**
   * Looks up the doc for a pair of users, regardless of which one is `idA`
   * vs `idB` or who originally sent the request. Convenience wrapper around
   * `computeId` + `findById`.
   *
   * @param {string} idA
   * @param {string} idB
   * @returns {Promise<Friendship|null>}
   */
  static async findByPair(idA, idB) {
    return Friendship.findById(Friendship.computeId(idA, idB));
  }

  /**
   * Creates a new `pending` friendship doc for a pair of users. Does NOT
   * check for an existing doc first -- self-request, already-friends, and
   * idempotent-duplicate-pending are route-level validation concerns
   * (see server/routes/friends.js `POST /request`), not this method's.
   *
   * @param {object} params
   * @param {string} params.userA - Either user id; sorted internally.
   * @param {string} params.userB - Either user id; sorted internally.
   * @param {string} params.requesterId - Who sent the request.
   * @returns {Promise<Friendship>} The newly created, `pending` friendship.
   */
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

  /**
   * Flips this friendship's status to `accepted` and sets `acceptedAt`, both
   * in Firestore and on this instance. Caller is responsible for checking
   * that the status is currently `pending` and that the caller isn't the
   * original requester (see server/routes/friends.js `POST /accept`).
   *
   * @returns {Promise<Friendship>} `this`, mutated in place.
   */
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

  /**
   * Deletes this friendship doc (used for rejecting a pending request).
   *
   * @returns {Promise<Friendship>} `this`, now detached from any stored doc.
   */
  async delete() {
    await db.collection('friendships').doc(this.id).delete();
    return this;
  }

  /**
   * Lists every friendship (any status) involving a user, merging two
   * equality queries (`userA == userId` and `userB == userId`) in code --
   * NOT `array-contains` on `members`. `tests/helpers/fakeFirestore.js`
   * only implements `==, !=, in, <, <=, >, >=`, so `array-contains` would
   * fail against the test harness even though real Firestore supports it.
   *
   * @param {string} userId
   * @returns {Promise<Friendship[]>}
   */
  static async listForUser(userId) {
    const [asUserA, asUserB] = await Promise.all([
      db.collection('friendships').where('userA', '==', userId).get(),
      db.collection('friendships').where('userB', '==', userId).get(),
    ]);
    const docs = [...asUserA.docs, ...asUserB.docs];
    return docs.map((doc) => new Friendship({ id: doc.id, ...doc.data() }));
  }

  /**
   * Returns the accepted friend ids for a user -- the *other* party in each
   * `accepted` friendship doc (pending ones are excluded). Built on by the
   * leaderboard's `?scope=friends` (server/routes/leaderboard.js) and, per
   * the shared contract in docs/MILESTONES.md, M3's team-join check.
   *
   * @param {string} userId
   * @returns {Promise<string[]>} Accepted friends' `users.id` values.
   */
  static async getFriends(userId) {
    const friendships = await Friendship.listForUser(userId);
    return friendships
      .filter((f) => f.status === 'accepted')
      .map((f) => (f.userA === userId ? f.userB : f.userA));
  }

  /** @returns {object} Plain-object representation for JSON responses. */
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
