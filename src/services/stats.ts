import { doc, getDoc, onSnapshot, runTransaction } from 'firebase/firestore';
import { db, isFirebaseConfigured } from '../lib/firebase';

function requireDb() {
  if (!isFirebaseConfigured || !db) {
    throw new Error('Firebase is not configured.');
  }
  return db;
}

/** Hard-locked to the founder account — no env overrides. */
export const FOUNDER_EMAIL = 'dhyanvim@gmail.com';

export function isFounderEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  return email.trim().toLowerCase() === FOUNDER_EMAIL;
}

export async function bumpRegisteredUserCount(): Promise<void> {
  const database = requireDb();
  const ref = doc(database, 'stats', 'app');
  await runTransaction(database, async (tx) => {
    const snap = await tx.get(ref);
    if (!snap.exists()) {
      tx.set(ref, { userCount: 1, updatedAt: Date.now() });
      return;
    }
    const current = Number(snap.data()?.userCount) || 0;
    tx.update(ref, { userCount: current + 1, updatedAt: Date.now() });
  });
}

/** Best-effort decrement when a user deletes their account (keeps founder count closer to Auth). */
export async function decrementRegisteredUserCount(): Promise<void> {
  const database = requireDb();
  const ref = doc(database, 'stats', 'app');
  try {
    await runTransaction(database, async (tx) => {
      const snap = await tx.get(ref);
      if (!snap.exists()) return;
      const current = Number(snap.data()?.userCount) || 0;
      const next = Math.max(0, current - 1);
      if (next === current) return;
      tx.update(ref, { userCount: next, updatedAt: Date.now() });
    });
  } catch (err) {
    console.warn('Could not decrement user count', err);
  }
}

export async function fetchRegisteredUserCount(): Promise<number> {
  const database = requireDb();
  const snap = await getDoc(doc(database, 'stats', 'app'));
  if (!snap.exists()) return 0;
  return Number(snap.data()?.userCount) || 0;
}

export function subscribeRegisteredUserCount(
  onCount: (count: number) => void,
  onError?: (err: Error) => void,
): () => void {
  const database = requireDb();
  return onSnapshot(
    doc(database, 'stats', 'app'),
    (snap) => {
      if (!snap.exists()) {
        onCount(0);
        return;
      }
      onCount(Number(snap.data()?.userCount) || 0);
    },
    (err) => onError?.(err),
  );
}
