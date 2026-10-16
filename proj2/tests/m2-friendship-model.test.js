// M2: Friendship model unit tests (issue #28).
// Source under test: server/models/Friendship.js
// Schema/contract: proj2/docs/plans/m2-leaderboard.md §4

jest.mock('../server/config/firebase', () => require('./helpers/fakeFirestore').createFirestoreMock());

const { db } = require('../server/config/firebase');
const Friendship = require('../server/models/Friendship');

beforeEach(() => db.__reset());

describe('Friendship.computeId', () => {
  test('is order-independent (same pair, either argument order, same id)', () => {
    expect(Friendship.computeId('zQ7mP2', 'aB3xK9')).toBe(Friendship.computeId('aB3xK9', 'zQ7mP2'));
  });

  test('is the two ids sorted lexicographically and joined with "_"', () => {
    expect(Friendship.computeId('zQ7mP2', 'aB3xK9')).toBe('aB3xK9_zQ7mP2');
  });
});

describe('Friendship.create / findById / findByPair', () => {
  test('creates a pending doc at the deterministic id with the given requesterId', async () => {
    const friendship = await Friendship.create({ userA: 'bob', userB: 'alice', requesterId: 'bob' });

    expect(friendship.id).toBe(Friendship.computeId('alice', 'bob'));
    expect(friendship.userA).toBe('alice'); // sorted, regardless of create() argument order
    expect(friendship.userB).toBe('bob');
    expect(friendship.requesterId).toBe('bob');
    expect(friendship.status).toBe('pending');
    expect(friendship.members).toEqual(['alice', 'bob']);
    expect(friendship.acceptedAt).toBeNull();
  });

  test('findById retrieves the created doc', async () => {
    const created = await Friendship.create({ userA: 'bob', userB: 'alice', requesterId: 'bob' });

    const found = await Friendship.findById(created.id);

    expect(found).not.toBeNull();
    expect(found.id).toBe(created.id);
    expect(found.status).toBe('pending');
  });

  test('findById returns null for a nonexistent id', async () => {
    const found = await Friendship.findById('nope_nope');
    expect(found).toBeNull();
  });

  test('findByPair resolves regardless of argument order', async () => {
    await Friendship.create({ userA: 'bob', userB: 'alice', requesterId: 'bob' });

    const viaAliceBob = await Friendship.findByPair('alice', 'bob');
    const viaBobAlice = await Friendship.findByPair('bob', 'alice');

    expect(viaAliceBob).not.toBeNull();
    expect(viaAliceBob.id).toBe(viaBobAlice.id);
  });
});

describe('Friendship#accept', () => {
  test('flips status to accepted and sets acceptedAt', async () => {
    const friendship = await Friendship.create({ userA: 'bob', userB: 'alice', requesterId: 'bob' });

    await friendship.accept();

    expect(friendship.status).toBe('accepted');
    expect(friendship.acceptedAt).not.toBeNull();

    const reloaded = await Friendship.findById(friendship.id);
    expect(reloaded.status).toBe('accepted');
    expect(reloaded.acceptedAt).not.toBeNull();
  });
});

describe('Friendship#delete', () => {
  test('removes the doc', async () => {
    const friendship = await Friendship.create({ userA: 'bob', userB: 'alice', requesterId: 'bob' });

    await friendship.delete();

    const reloaded = await Friendship.findById(friendship.id);
    expect(reloaded).toBeNull();
  });
});

describe('Friendship.listForUser', () => {
  test('merges friendships where the user is userA and where the user is userB', async () => {
    // alice is userA here (alice < bob)...
    await Friendship.create({ userA: 'alice', userB: 'bob', requesterId: 'alice' });
    // ...and userB here (alice < zoe, so alice stays userA -- use a name that sorts before alice)
    await Friendship.create({ userA: '__ahmed', userB: 'alice', requesterId: '__ahmed' });

    const list = await Friendship.listForUser('alice');

    expect(list).toHaveLength(2);
    const otherParties = list.map((f) => (f.userA === 'alice' ? f.userB : f.userA)).sort();
    expect(otherParties).toEqual(['__ahmed', 'bob']);
  });

  test('returns an empty array for a user with no friendships', async () => {
    const list = await Friendship.listForUser('nobody');
    expect(list).toEqual([]);
  });
});

describe('Friendship.getFriends', () => {
  test('returns only accepted friends, resolved to the other party\'s id, both directions', async () => {
    const accepted1 = await Friendship.create({ userA: 'alice', userB: 'bob', requesterId: 'alice' });
    await accepted1.accept();

    const accepted2 = await Friendship.create({ userA: '__ahmed', userB: 'alice', requesterId: '__ahmed' });
    await accepted2.accept();

    // still pending -- must be excluded
    await Friendship.create({ userA: 'alice', userB: 'zoe', requesterId: 'zoe' });

    const friends = await Friendship.getFriends('alice');

    expect(friends.sort()).toEqual(['__ahmed', 'bob']);
  });

  test('returns an empty array when the user has no accepted friendships', async () => {
    await Friendship.create({ userA: 'alice', userB: 'zoe', requesterId: 'zoe' }); // pending only

    const friends = await Friendship.getFriends('alice');

    expect(friends).toEqual([]);
  });
});
