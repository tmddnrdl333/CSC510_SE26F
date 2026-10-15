/**
 * M3 issue #13 — runTransaction support in the fakeFirestore test helper.
 *
 * Proves the three behaviors the exactly-once payout (#15) — and M1's
 * redemption fix — will rely on: atomic all-or-nothing commits, transaction
 * isolation (no lost updates between concurrent transactions), and the real
 * Firestore reads-before-writes rule.
 */

const { createFirestoreMock } = require('./helpers/fakeFirestore');

describe('M3: fakeFirestore runTransaction (#13)', () => {
  let db;

  beforeEach(() => {
    ({ db } = createFirestoreMock());
  });

  test('commits buffered writes atomically and returns the callback result', async () => {
    db.__seed('settings', 'donations', { counter: 10 });

    const result = await db.runTransaction(async (txn) => {
      const ref = db.collection('settings').doc('donations');
      const snap = await txn.get(ref);
      const next = snap.data().counter + 5;
      txn.update(ref, { counter: next });
      txn.set(db.collection('donationHistory').doc('audit-1'), { amount: 5 });
      return next;
    });

    expect(result).toBe(15);
    const counter = await db.collection('settings').doc('donations').get();
    const audit = await db.collection('donationHistory').doc('audit-1').get();
    expect(counter.data().counter).toBe(15);
    expect(audit.exists).toBe(true);
  });

  test('a thrown callback applies nothing (rollback)', async () => {
    db.__seed('settings', 'donations', { counter: 10 });

    await expect(
      db.runTransaction(async (txn) => {
        txn.update(db.collection('settings').doc('donations'), { counter: 99 });
        txn.set(db.collection('donationHistory').doc('audit-x'), { amount: 99 });
        throw new Error('business rule says no');
      })
    ).rejects.toThrow('business rule says no');

    const counter = await db.collection('settings').doc('donations').get();
    const audit = await db.collection('donationHistory').doc('audit-x').get();
    expect(counter.data().counter).toBe(10); // untouched
    expect(audit.exists).toBe(false); // the other buffered write is gone too
  });

  test('update of a missing doc fails the whole commit (all-or-nothing)', async () => {
    await expect(
      db.runTransaction(async (txn) => {
        txn.set(db.collection('donationHistory').doc('audit-y'), { amount: 1 });
        txn.update(db.collection('settings').doc('nope'), { counter: 1 });
      })
    ).rejects.toMatchObject({ code: 5 });

    const audit = await db.collection('donationHistory').doc('audit-y').get();
    expect(audit.exists).toBe(false); // the valid write was discarded with the invalid one
  });

  test('enforces the real-Firestore reads-before-writes rule', async () => {
    db.__seed('settings', 'donations', { counter: 0 });
    await expect(
      db.runTransaction(async (txn) => {
        txn.update(db.collection('settings').doc('donations'), { counter: 1 });
        await txn.get(db.collection('settings').doc('donations')); // read after write
      })
    ).rejects.toThrow(/reads .* before all writes/);
  });

  test('concurrent transactions do not lose updates (read-check-write is safe inside txns)', async () => {
    db.__seed('points', 'p1', { balance: 0 });
    const ref = db.collection('points').doc('p1');

    const increment = () =>
      db.runTransaction(async (txn) => {
        const snap = await txn.get(ref);
        txn.update(ref, { balance: snap.data().balance + 1 });
      });

    await Promise.all([increment(), increment(), increment()]);

    const snap = await ref.get();
    // Plain get/update under the same interleaving loses updates (that is what
    // the UC10/UC15 race tests prove); transactions must not.
    expect(snap.data().balance).toBe(3);
  });

  test('exactly-once payout pattern: two concurrent payouts, one reward (rehearsal for #15)', async () => {
    db.__seed('challengeProgress', 'def_team_2026-W42', { status: 'active' });
    db.__seed('settings', 'donations', { counter: 100 });

    const payout = () =>
      db.runTransaction(async (txn) => {
        const progressRef = db.collection('challengeProgress').doc('def_team_2026-W42');
        const counterRef = db.collection('settings').doc('donations');
        const progress = await txn.get(progressRef);
        if (progress.data().status === 'rewarded') {
          return 'already-rewarded';
        }
        const counterSnap = await txn.get(counterRef);
        txn.update(progressRef, { status: 'rewarded' });
        txn.update(counterRef, { counter: counterSnap.data().counter + 5 });
        return 'rewarded';
      });

    const outcomes = await Promise.all([payout(), payout()]);

    expect(outcomes.sort()).toEqual(['already-rewarded', 'rewarded']);
    const counter = await db.collection('settings').doc('donations').get();
    expect(counter.data().counter).toBe(105); // +5 exactly once, not +10
  });

  test('plain (non-transactional) operations still interleave as before', async () => {
    // Guard: adding transactions must not serialize ordinary ops, or the
    // existing UC10/UC15 race-reproduction tests would quietly lose meaning.
    db.__seed('points', 'p2', { balance: 0 });
    const ref = db.collection('points').doc('p2');

    const racyIncrement = async () => {
      const snap = await ref.get();
      await ref.update({ balance: snap.data().balance + 1 });
    };

    await Promise.all([racyIncrement(), racyIncrement()]);
    const snap = await ref.get();
    expect(snap.data().balance).toBe(1); // lost update — the documented racy behavior
  });
});
