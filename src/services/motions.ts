import {
  collection,
  doc,
  onSnapshot,
  orderBy,
  query,
  runTransaction,
  setDoc,
  updateDoc,
} from 'firebase/firestore';
import { db, isFirebaseConfigured } from '../lib/firebase';
import type { Motion, MotionType, ProceduralVote, Room, RoomStatus } from '../types/committee';
import { tallyVotes } from './committeeRoomLogic';

function requireDb() {
  if (!isFirebaseConfigured || !db) {
    throw new Error('Firebase is not configured.');
  }
  return db;
}

export function streamMotions(roomId: string, callback: (motions: Motion[]) => void) {
  if (!db) {
    callback([]);
    return () => {};
  }
  const q = query(collection(db, 'rooms', roomId, 'motions'), orderBy('createdAt', 'desc'));
  return onSnapshot(q, (snapshot) => {
    const motions = snapshot.docs.map(
      (d) => ({ ...d.data(), motionId: d.id }) as Motion,
    );
    callback(motions);
  });
}

export async function proposeMotion(input: {
  roomId: string;
  proposerId: string;
  proposerLabel: string;
  type: MotionType;
  topic?: string;
  totalDuration?: number;
  speakerTime?: number;
}): Promise<Motion> {
  const database = requireDb();
  const motionRef = doc(collection(database, 'rooms', input.roomId, 'motions'));
  const motion: Motion = {
    motionId: motionRef.id,
    proposerId: input.proposerId,
    proposerLabel: input.proposerLabel,
    type: input.type,
    status: 'proposed',
    votes: {},
    createdAt: Date.now(),
    ...(input.topic?.trim() ? { topic: input.topic.trim() } : {}),
    ...(input.totalDuration != null ? { totalDuration: input.totalDuration } : {}),
    ...(input.speakerTime != null ? { speakerTime: input.speakerTime } : {}),
  };
  const { motionId: _id, ...payload } = motion;
  await setDoc(motionRef, payload);
  return motion;
}

export async function openMotionVote(roomId: string, motionId: string): Promise<void> {
  const database = requireDb();
  const roomRef = doc(database, 'rooms', roomId);
  const motionRef = doc(database, 'rooms', roomId, 'motions', motionId);

  await runTransaction(database, async (tx) => {
    const roomSnap = await tx.get(roomRef);
    const motionSnap = await tx.get(motionRef);
    if (!roomSnap.exists()) throw new Error('Room not found.');
    if (!motionSnap.exists()) throw new Error('Motion not found.');
    const motion = motionSnap.data() as Omit<Motion, 'motionId'>;
    if (motion.status !== 'proposed') {
      throw new Error('Only proposed motions can be opened for voting.');
    }
    tx.update(roomRef, { activeMotionId: motionId, currentStatus: 'voting' });
    tx.update(motionRef, { status: 'voting', votes: {} });
  });
}

export async function castMotionVote(
  roomId: string,
  motionId: string,
  userId: string,
  vote: ProceduralVote,
): Promise<void> {
  const database = requireDb();
  const motionRef = doc(database, 'rooms', roomId, 'motions', motionId);
  await runTransaction(database, async (tx) => {
    const snap = await tx.get(motionRef);
    if (!snap.exists()) throw new Error('Motion not found.');
    const motion = snap.data() as Omit<Motion, 'motionId'>;
    if (motion.status !== 'voting') {
      throw new Error('Voting is not open on this motion.');
    }
    tx.update(motionRef, { [`votes.${userId}`]: vote });
  });
}

export async function closeMotionVote(roomId: string, motionId: string): Promise<Motion> {
  const database = requireDb();
  const roomRef = doc(database, 'rooms', roomId);
  const motionRef = doc(database, 'rooms', roomId, 'motions', motionId);

  return runTransaction(database, async (tx) => {
    const roomSnap = await tx.get(roomRef);
    const motionSnap = await tx.get(motionRef);
    if (!roomSnap.exists()) throw new Error('Room not found.');
    if (!motionSnap.exists()) throw new Error('Motion not found.');
    const room = roomSnap.data() as Omit<Room, 'roomId'>;
    const motion = { ...motionSnap.data(), motionId } as Motion;
    if (motion.status !== 'voting') {
      throw new Error('This motion is not open for voting.');
    }

    const { yes, no } = tallyVotes(motion.votes);
    const passed = yes > no;
    const status = passed ? 'passed' : 'failed';

    let nextRoomStatus: RoomStatus = 'open';
    if (passed && motion.type === 'moderated_caucus') nextRoomStatus = 'caucus_moderated';
    if (passed && motion.type === 'unmoderated_caucus') nextRoomStatus = 'caucus_unmoderated';
    if (passed && motion.type === 'adjourn') nextRoomStatus = 'recess';

    tx.update(motionRef, { status, closedAt: Date.now() });
    tx.update(roomRef, {
      activeMotionId: null,
      currentStatus: nextRoomStatus,
      ...(passed && (motion.type === 'moderated_caucus' || motion.type === 'unmoderated_caucus')
        ? {
            activeCaucus: {
              type: motion.type === 'moderated_caucus' ? 'moderated' : 'unmoderated',
              duration: motion.totalDuration ?? 0,
              startTime: Date.now(),
              ...(motion.topic ? { topic: motion.topic } : {}),
            },
          }
        : { activeCaucus: null }),
    });

    // Keep room.chairId / other fields; only status changes above.
    void room;

    return { ...motion, status, closedAt: Date.now() };
  });
}

export async function withdrawMotion(roomId: string, motionId: string): Promise<void> {
  const database = requireDb();
  await updateDoc(doc(database, 'rooms', roomId, 'motions', motionId), {
    status: 'withdrawn',
  });
}
