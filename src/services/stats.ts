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
  try {
    await runTransaction(database, async (tx) => {
      const snap = await tx.get(ref);
      const current = snap.exists() ? Number(snap.data()?.userCount) || 0 : 0;
      tx.set(
        ref,
        {
          userCount: current + 1,
          updatedAt: Date.now(),
        },
        { merge: true },
      );
    });
  } catch (err) {
    console.warn('Could not bump user count', err);
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
