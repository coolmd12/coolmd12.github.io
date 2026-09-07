import {
  collection,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  setDoc,
  runTransaction,
  type Firestore,
} from 'firebase/firestore';
import { auth, db, isFirebaseConfigured } from '../lib/firebase';
import type { UserRole } from '../types';

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

export type ProductCounterField =
  | 'students'
  | 'teachers'
  | 'parents'
  | 'multiRole'
  | 'classroomsCreated'
  | 'roomsCreated'
  | 'roomsJoined'
  | 'roomsClosed'
  | 'sessionsStarted'
  | 'motionsProposed'
  | 'votesCast'
  | 'chatMessages'
  | 'parentLinksCreated';

export interface ProductStats {
  students: number;
  teachers: number;
  parents: number;
  multiRole: number;
  classroomsCreated: number;
  roomsCreated: number;
  roomsJoined: number;
  roomsClosed: number;
  sessionsStarted: number;
  motionsProposed: number;
  votesCast: number;
  chatMessages: number;
  parentLinksCreated: number;
  updatedAt: number;
  backfilledAt: number | null;
}

export const EMPTY_PRODUCT_STATS: Omit<ProductStats, 'updatedAt' | 'backfilledAt'> = {
  students: 0,
  teachers: 0,
  parents: 0,
  multiRole: 0,
  classroomsCreated: 0,
  roomsCreated: 0,
  roomsJoined: 0,
  roomsClosed: 0,
  sessionsStarted: 0,
  motionsProposed: 0,
  votesCast: 0,
  chatMessages: 0,
  parentLinksCreated: 0,
};

function parseProductStats(data: Record<string, unknown> | undefined): ProductStats {
  const num = (key: ProductCounterField) => {
    const n = Number(data?.[key]);
    return Number.isFinite(n) && n > 0 ? Math.floor(n) : 0;
  };
  const backfilledRaw = data?.backfilledAt;
  const backfilledAt =
    typeof backfilledRaw === 'number' && Number.isFinite(backfilledRaw) ? backfilledRaw : null;
  return {
    students: num('students'),
    teachers: num('teachers'),
    parents: num('parents'),
    multiRole: num('multiRole'),
    classroomsCreated: num('classroomsCreated'),
    roomsCreated: num('roomsCreated'),
    roomsJoined: num('roomsJoined'),
    roomsClosed: num('roomsClosed'),
    sessionsStarted: num('sessionsStarted'),
    motionsProposed: num('motionsProposed'),
    votesCast: num('votesCast'),
    chatMessages: num('chatMessages'),
    parentLinksCreated: num('parentLinksCreated'),
    updatedAt: Number(data?.updatedAt) || 0,
    backfilledAt,
  };
}

function emptyProductDoc(now = Date.now()): ProductStats {
  return { ...EMPTY_PRODUCT_STATS, updatedAt: now, backfilledAt: null };
}

/** Role-mix contributions for one user (individual buckets + multiRole if 2+). */
export function roleMixContribution(roles: UserRole[]): Partial<Record<ProductCounterField, number>> {
  const unique = Array.from(new Set(roles)).filter(
    (r): r is UserRole => r === 'student' || r === 'teacher' || r === 'parent',
  );
  const out: Partial<Record<ProductCounterField, number>> = {};
  if (unique.includes('student')) out.students = 1;
  if (unique.includes('teacher')) out.teachers = 1;
  if (unique.includes('parent')) out.parents = 1;
  if (unique.length > 1) out.multiRole = 1;
  return out;
}

function rolesFromProfileData(data: Record<string, unknown> | undefined): UserRole[] {
  const roles = data?.roles;
  if (Array.isArray(roles) && roles.length) {
    return roles.filter(
      (r): r is UserRole => r === 'student' || r === 'teacher' || r === 'parent',
    );
  }
  const role = data?.role;
  if (role === 'student' || role === 'teacher' || role === 'parent') return [role];
  return [];
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

async function bumpProductCounterOnce(
  database: Firestore,
  field: ProductCounterField,
  delta: 1 | -1,
): Promise<void> {
  const ref = doc(database, 'stats', 'product');
  await runTransaction(database, async (tx) => {
    const snap = await tx.get(ref);
    const now = Date.now();
    if (!snap.exists()) {
      if (delta < 0) return;
      const created = emptyProductDoc(now);
      created[field] = 1;
      tx.set(ref, created);
      return;
    }
    const current = Number(snap.data()?.[field]) || 0;
    const next = Math.max(0, current + delta);
    if (next === current) return;
    tx.update(ref, { [field]: next, updatedAt: now });
  });
}

/** Best-effort ±1 on a single product counter (rules allow one field per write). */
export async function bumpProductCounter(
  field: ProductCounterField,
  delta: 1 | -1 = 1,
): Promise<void> {
  try {
    const database = requireDb();
    await bumpProductCounterOnce(database, field, delta);
  } catch (err) {
    console.warn(`Could not bump product counter ${field}`, err);
  }
}

/** Best-effort sequential bumps (one transaction per field — required by rules). */
export async function bumpProductCounters(
  deltas: Partial<Record<ProductCounterField, number>>,
): Promise<void> {
  try {
    const database = requireDb();
    for (const [field, raw] of Object.entries(deltas) as [ProductCounterField, number][]) {
      const n = Math.trunc(raw);
      if (!n) continue;
      const step: 1 | -1 = n > 0 ? 1 : -1;
      for (let i = 0; i < Math.abs(n); i += 1) {
        await bumpProductCounterOnce(database, field, step);
      }
    }
  } catch (err) {
    console.warn('Could not bump product counters', err);
  }
}

/**
 * Adjust role-mix counters when a profile’s roles change.
 * Pass `prevRoles = []` on create; `nextRoles = []` on delete.
 */
export async function adjustRoleMixCounters(
  prevRoles: UserRole[],
  nextRoles: UserRole[],
): Promise<void> {
  const prev = roleMixContribution(prevRoles);
  const next = roleMixContribution(nextRoles);
  const fields: ProductCounterField[] = ['students', 'teachers', 'parents', 'multiRole'];
  const deltas: Partial<Record<ProductCounterField, number>> = {};
  for (const field of fields) {
    const d = (next[field] || 0) - (prev[field] || 0);
    if (d) deltas[field] = d;
  }
  if (!Object.keys(deltas).length) return;
  await bumpProductCounters(deltas);
}

export function subscribeProductStats(
  onStats: (stats: ProductStats) => void,
  onError?: (err: Error) => void,
): () => void {
  const database = requireDb();
  return onSnapshot(
    doc(database, 'stats', 'product'),
    (snap) => {
      if (!snap.exists()) {
        onStats(emptyProductDoc(0));
        return;
      }
      onStats(parseProductStats(snap.data() as Record<string, unknown>));
    },
    (err) => onError?.(err),
  );
}

export interface ProductStatsBackfillResult {
  stats: ProductStats;
  warnings: string[];
}

/** Founder-only: scan existing data and write absolute totals to stats/product. */
export async function backfillProductStats(): Promise<ProductStatsBackfillResult> {
  const database = requireDb();
  const user = auth?.currentUser;
  if (!isFounderEmail(user?.email)) {
    throw new Error('Only the founder can run a stats backfill.');
  }

  const warnings: string[] = [];
  const totals = { ...EMPTY_PRODUCT_STATS };

  try {
    const usersSnap = await getDocs(collection(database, 'users'));
    for (const userDoc of usersSnap.docs) {
      const roles = rolesFromProfileData(userDoc.data() as Record<string, unknown>);
      // Skip incomplete stubs with no role yet.
      if (!roles.length) continue;
      const contrib = roleMixContribution(roles);
      for (const [field, n] of Object.entries(contrib) as [ProductCounterField, number][]) {
        totals[field] += n;
      }
    }
  } catch (err) {
    warnings.push(`Users/roles: ${err instanceof Error ? err.message : String(err)}`);
  }

  try {
    const classroomsSnap = await getDocs(collection(database, 'classrooms'));
    totals.classroomsCreated = classroomsSnap.size;
  } catch (err) {
    warnings.push(`Classrooms: ${err instanceof Error ? err.message : String(err)}`);
  }

  try {
    const parentLinksSnap = await getDocs(collection(database, 'parentLinks'));
    totals.parentLinksCreated = parentLinksSnap.size;
  } catch (err) {
    warnings.push(`Parent links: ${err instanceof Error ? err.message : String(err)}`);
  }

  try {
    const roomsSnap = await getDocs(collection(database, 'rooms'));
    totals.roomsCreated = roomsSnap.size;
    totals.sessionsStarted = roomsSnap.size; // historical resumes not recoverable
    let closed = 0;
    let joined = 0;
    let motions = 0;
    let votes = 0;
    let messages = 0;

    for (const roomDoc of roomsSnap.docs) {
      const roomId = roomDoc.id;
      const data = roomDoc.data();
      if (data.closedAt != null) closed += 1;

      try {
        const parts = await getDocs(collection(database, 'rooms', roomId, 'participants'));
        joined += parts.size;
      } catch (err) {
        warnings.push(
          `Room ${roomId} participants: ${err instanceof Error ? err.message : String(err)}`,
        );
      }

      try {
        const motionSnap = await getDocs(collection(database, 'rooms', roomId, 'motions'));
        motions += motionSnap.size;
        for (const motionDoc of motionSnap.docs) {
          const votesMap = motionDoc.data()?.votes;
          if (votesMap && typeof votesMap === 'object') {
            votes += Object.keys(votesMap as Record<string, unknown>).length;
          }
        }
      } catch (err) {
        warnings.push(`Room ${roomId} motions: ${err instanceof Error ? err.message : String(err)}`);
      }

      try {
        const msgSnap = await getDocs(collection(database, 'rooms', roomId, 'messages'));
        messages += msgSnap.size;
      } catch (err) {
        warnings.push(
          `Room ${roomId} messages: ${err instanceof Error ? err.message : String(err)}`,
        );
      }
    }

    totals.roomsClosed = closed;
    totals.roomsJoined = joined;
    totals.motionsProposed = motions;
    totals.votesCast = votes;
    totals.chatMessages = messages;
  } catch (err) {
    warnings.push(`Rooms: ${err instanceof Error ? err.message : String(err)}`);
  }

  const now = Date.now();
  const stats: ProductStats = {
    ...totals,
    updatedAt: now,
    backfilledAt: now,
  };

  await setDoc(doc(database, 'stats', 'product'), stats);
  return { stats, warnings };
}
