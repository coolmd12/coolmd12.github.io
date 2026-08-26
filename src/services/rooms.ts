import {
  arrayRemove,
  arrayUnion,
  collection,
  collectionGroup,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  query,
  runTransaction,
  setDoc,
  updateDoc,
  where,
} from 'firebase/firestore';
import { db, isFirebaseConfigured } from '../lib/firebase';
import type {
  Participant,
  Room,
  RoomTimer,
  SessionRole,
  SpeakerQueueEntry,
  SpeechTimeBank,
  SpeechTimeBankEntry,
} from '../types/committee';
import {
  buildParticipantDraft,
  buildSpeakerTimer,
  formatSeatLabel,
  isRoomClosed,
  mergeCommitteeRoomRelation,
  remainingTimerSeconds,
  type CommitteeRoomRelation,
} from './committeeRoomLogic';
import { logActivity } from './activity';
import { syncMessageLabelsForUser } from './messages';

export type MyCommitteeRoom = Room & { relation: CommitteeRoomRelation };

function requireDb() {
  if (!isFirebaseConfigured || !db) {
    throw new Error('Firebase is not configured.');
  }
  return db;
}

function appendUnusedTime(
  bank: SpeechTimeBank | undefined,
  entry: SpeechTimeBankEntry,
): SpeechTimeBank {
  const prev = bank ?? { totalUnusedSeconds: 0, entries: [] };
  if (entry.unusedSeconds <= 0) return prev;
  const entries = [...prev.entries, entry].slice(-40);
  return {
    totalUnusedSeconds: prev.totalUnusedSeconds + entry.unusedSeconds,
    entries,
  };
}

function bankPatchFromTimer(
  room: Omit<Room, 'roomId'>,
  label: string,
): { speechTimeBank?: SpeechTimeBank; activeTimer: null } {
  const timer = room.activeTimer;
  const unused = timer ? remainingTimerSeconds(timer) : 0;
  const patch: { speechTimeBank?: SpeechTimeBank; activeTimer: null } = { activeTimer: null };
  if (timer && unused > 0) {
    patch.speechTimeBank = appendUnusedTime(room.speechTimeBank, {
      userId: timer.associatedUserId ?? 'unknown',
      label,
      unusedSeconds: unused,
      at: Date.now(),
    });
  }
  return patch;
}

export async function getRoom(roomId: string): Promise<Room | null> {
  const database = requireDb();
  const roomSnap = await getDoc(doc(database, 'rooms', roomId));
  if (!roomSnap.exists()) return null;
  return { ...roomSnap.data(), roomId: roomSnap.id } as Room;
}

export function streamRoom(roomId: string, callback: (room: Room | null) => void) {
  if (!db) {
    callback(null);
    return () => {};
  }
  return onSnapshot(doc(db, 'rooms', roomId), (snapshot) => {
    if (snapshot.exists()) {
      callback({ ...snapshot.data(), roomId: snapshot.id } as Room);
    } else {
      callback(null);
    }
  });
}

export function streamParticipants(
  roomId: string,
  callback: (participants: Participant[]) => void,
) {
  if (!db) {
    callback([]);
    return () => {};
  }
  return onSnapshot(collection(db, 'rooms', roomId, 'participants'), (snapshot) => {
    const participants = snapshot.docs.map(
      (d) => ({ ...d.data(), userId: d.id }) as Participant,
    );
    callback(participants);
  });
}

/**
 * Live list of committee rooms this user hosted and/or joined (including closed/past).
 * Survives refresh. Callers can split live vs past with isRoomClosed().
 */
export function streamMyCommitteeRooms(
  userId: string,
  callback: (rooms: MyCommitteeRoom[]) => void,
): () => void {
  if (!db) {
    callback([]);
    return () => {};
  }

  let hosted: Room[] = [];
  let joinedIds: string[] = [];
  const joinedCache = new Map<string, Room>();
  let generation = 0;
  let cancelled = false;

  const emit = async () => {
    const myGen = ++generation;
    const relations = new Map<string, CommitteeRoomRelation>();
    const roomsById = new Map<string, Room>();

    for (const room of hosted) {
      roomsById.set(room.roomId, room);
      relations.set(room.roomId, mergeCommitteeRoomRelation(relations.get(room.roomId), 'hosted'));
    }

    for (const roomId of joinedIds) {
      relations.set(roomId, mergeCommitteeRoomRelation(relations.get(roomId), 'joined'));
      if (roomsById.has(roomId)) continue;
      let room = joinedCache.get(roomId);
      if (!room) {
        room = (await getRoom(roomId)) ?? undefined;
        if (room) joinedCache.set(roomId, room);
      }
      if (room) {
        roomsById.set(roomId, room);
      }
    }

    if (cancelled || myGen !== generation) return;

    const list: MyCommitteeRoom[] = [];
    for (const [roomId, relation] of relations) {
      const room = roomsById.get(roomId);
      if (!room) continue;
      list.push({ ...room, relation });
    }
    list.sort((a, b) => {
      const aClosed = isRoomClosed(a) ? 1 : 0;
      const bClosed = isRoomClosed(b) ? 1 : 0;
      if (aClosed !== bClosed) return aClosed - bClosed;
      const aAt = a.closedAt || a.createdAt;
      const bAt = b.closedAt || b.createdAt;
      return bAt - aAt;
    });
    callback(list);
  };

  const unsubHosted = onSnapshot(
    query(collection(db, 'rooms'), where('createdBy', '==', userId)),
    (snapshot) => {
      hosted = snapshot.docs.map((d) => ({ ...d.data(), roomId: d.id }) as Room);
      void emit();
    },
    () => {
      hosted = [];
      void emit();
    },
  );

  const unsubJoined = onSnapshot(
    query(collectionGroup(db, 'participants'), where('userId', '==', userId)),
    (snapshot) => {
      joinedIds = snapshot.docs
        .map((d) => d.ref.parent.parent?.id)
        .filter((id): id is string => Boolean(id));
      for (const id of [...joinedCache.keys()]) {
        if (!joinedIds.includes(id)) joinedCache.delete(id);
      }
      void emit();
    },
    () => {
      joinedIds = [];
      void emit();
    },
  );

  return () => {
    cancelled = true;
    unsubHosted();
    unsubJoined();
  };
}

/** One-shot room list for parent portal activity backfill. */
export async function fetchCommitteeRoomsForUser(userId: string): Promise<MyCommitteeRoom[]> {
  if (!db) return [];
  const database = requireDb();

  let hosted: Room[] = [];
  let joinedIds: string[] = [];

  try {
    const hostedSnap = await getDocs(
      query(collection(database, 'rooms'), where('createdBy', '==', userId)),
    );
    hosted = hostedSnap.docs.map((d) => ({ ...d.data(), roomId: d.id }) as Room);
  } catch (err) {
    console.warn('Hosted rooms fetch failed', err);
  }

  try {
    const joinedSnap = await getDocs(
      query(collectionGroup(database, 'participants'), where('userId', '==', userId)),
    );
    joinedIds = joinedSnap.docs
      .map((d) => d.ref.parent.parent?.id)
      .filter((id): id is string => Boolean(id));
  } catch (err) {
    console.warn('Joined rooms fetch failed', err);
  }

  const relations = new Map<string, CommitteeRoomRelation>();
  const roomsById = new Map<string, Room>();

  for (const room of hosted) {
    roomsById.set(room.roomId, room);
    relations.set(room.roomId, mergeCommitteeRoomRelation(relations.get(room.roomId), 'hosted'));
  }

  for (const roomId of joinedIds) {
    relations.set(roomId, mergeCommitteeRoomRelation(relations.get(roomId), 'joined'));
    if (!roomsById.has(roomId)) {
      try {
        const room = await getRoom(roomId);
        if (room) roomsById.set(roomId, room);
      } catch (err) {
        console.warn('Room doc fetch failed', roomId, err);
      }
    }
  }

  const list: MyCommitteeRoom[] = [];
  for (const [roomId, relation] of relations) {
    const room = roomsById.get(roomId);
    if (!room) continue;
    list.push({ ...room, relation });
  }

  return list.sort((a, b) => {
    const aAt = a.closedAt || a.createdAt;
    const bAt = b.closedAt || b.createdAt;
    return bAt - aAt;
  });
}

/** Host or chair closes a room — drops it from live lists; link shows closed. */
export async function closeRoom(roomId: string, byUserId: string): Promise<void> {
  const database = requireDb();
  const roomRef = doc(database, 'rooms', roomId);
  let roomName = 'Committee room';
  await runTransaction(database, async (tx) => {
    const snap = await tx.get(roomRef);
    if (!snap.exists()) throw new Error('Room not found.');
    const room = snap.data() as Omit<Room, 'roomId'>;
    roomName = room.name || roomName;
    if (room.createdBy !== byUserId && room.chairId !== byUserId) {
      throw new Error('Only the host or chair can close this room.');
    }
    if (isRoomClosed(room)) return;
    tx.update(roomRef, {
      closedAt: Date.now(),
      closedBy: byUserId,
      currentStatus: 'recess',
      activeCaucus: null,
      activeMotionId: null,
      ...bankPatchFromTimer(room, 'Room closed'),
    });
  });
  void logActivity(byUserId, {
    kind: 'room_closed',
    title: 'Closed a committee room',
    detail: roomName,
    subjectId: roomId,
  });
}

export async function createRoom(roomData: Omit<Room, 'roomId'>): Promise<Room | null> {
  const database = requireDb();
  const roomRef = doc(collection(database, 'rooms'));
  await setDoc(roomRef, roomData);
  const room = { ...roomData, roomId: roomRef.id };
  void logActivity(roomData.createdBy, {
    kind: 'room_created',
    title: 'Hosted a committee room',
    detail: roomData.name,
    subjectId: room.roomId,
    href: `/room/${room.roomId}`,
    at: roomData.createdAt,
  });
  return room;
}

export async function joinRoom(input: {
  roomId: string;
  userId: string;
  role: SessionRole;
  profileDisplayName: string;
  chairName?: string;
  country?: string;
}): Promise<Participant> {
  const database = requireDb();
  const roomRef = doc(database, 'rooms', input.roomId);
  const participantRef = doc(database, 'rooms', input.roomId, 'participants', input.userId);
  const participant = buildParticipantDraft(input);
  let roomName = 'Committee room';
  let wasNew = false;

  await runTransaction(database, async (tx) => {
    const roomSnap = await tx.get(roomRef);
    if (!roomSnap.exists()) {
      throw new Error('Room not found.');
    }
    const room = roomSnap.data() as Omit<Room, 'roomId'>;
    roomName = room.name || roomName;
    if (isRoomClosed(room)) {
      throw new Error('This room has been closed by the host.');
    }
    const existing = await tx.get(participantRef);

    if (input.role === 'chair') {
      const currentChair = room.chairId || '';
      if (currentChair && currentChair !== input.userId) {
        throw new Error('This room already has a chair. Join as a delegate instead.');
      }
      if (!currentChair) {
        tx.update(roomRef, { chairId: input.userId });
      }
    }

    if (existing.exists()) {
      tx.update(participantRef, {
        displayName: participant.displayName,
        role: participant.role,
        country: participant.country ?? null,
        raisedPlacard: false,
      });
    } else {
      wasNew = true;
      tx.set(participantRef, participant);
    }
  });

  if (wasNew) {
    void logActivity(input.userId, {
      kind: 'room_joined',
      title: 'Joined a committee room',
      detail: roomName,
      subjectId: input.roomId,
      href: `/room/${input.roomId}`,
    });
  }

  return participant;
}

/** Change role and/or seat name (country or chair name) while in the room. */
export async function updateSeat(input: {
  roomId: string;
  userId: string;
  role: SessionRole;
  profileDisplayName: string;
  chairName?: string;
  country?: string;
}): Promise<void> {
  const database = requireDb();
  const roomRef = doc(database, 'rooms', input.roomId);
  const participantRef = doc(database, 'rooms', input.roomId, 'participants', input.userId);
  const next = buildParticipantDraft({ ...input, userId: input.userId });

  await runTransaction(database, async (tx) => {
    const roomSnap = await tx.get(roomRef);
    const participantSnap = await tx.get(participantRef);
    if (!roomSnap.exists()) throw new Error('Room not found.');
    if (!participantSnap.exists()) throw new Error('You are not in this room.');

    const room = roomSnap.data() as Omit<Room, 'roomId'>;
    const prev = participantSnap.data() as Participant;
    let nextChairId = room.chairId || '';

    if (input.role === 'chair') {
      if (nextChairId && nextChairId !== input.userId) {
        throw new Error('This room already has a chair. Stay as a delegate or ask them to switch.');
      }
      if (!nextChairId) {
        // Vacant claim — must be chairId-only for security rules.
        tx.update(roomRef, { chairId: input.userId });
        nextChairId = input.userId;
      }
    } else if (prev.role === 'chair' && nextChairId === input.userId) {
      tx.update(roomRef, { chairId: '' });
      nextChairId = '';
    }

    tx.update(participantRef, {
      displayName: next.displayName,
      role: next.role,
      country: next.country ?? null,
    });
  });

  await syncMessageLabelsForUser(
    input.roomId,
    input.userId,
    formatSeatLabel(next.role, next.displayName),
  );
}

export async function setPlacard(roomId: string, userId: string, raised: boolean): Promise<void> {
  const database = requireDb();
  await updateDoc(doc(database, 'rooms', roomId, 'participants', userId), {
    raisedPlacard: raised,
  });
}

export async function recognizeSpeaker(roomId: string, userId: string): Promise<void> {
  const database = requireDb();
  const roomRef = doc(database, 'rooms', roomId);
  const participantRef = doc(database, 'rooms', roomId, 'participants', userId);

  await runTransaction(database, async (tx) => {
    const roomSnap = await tx.get(roomRef);
    const participantSnap = await tx.get(participantRef);
    if (!roomSnap.exists()) throw new Error('Room not found.');
    if (!participantSnap.exists()) throw new Error('Participant not found.');

    const room = roomSnap.data() as Omit<Room, 'roomId'>;
    const queue = (room.speakerQueue ?? []) as SpeakerQueueEntry[];

    if (queue.some((entry) => entry.userId === userId)) {
      tx.update(participantRef, { raisedPlacard: false });
      return;
    }

    tx.update(roomRef, { speakerQueue: arrayUnion({ userId }) });
    tx.update(participantRef, { raisedPlacard: false });
  });
}

export async function advanceSpeakerQueue(
  roomId: string,
  speakerLabel = 'Speaker',
): Promise<void> {
  const database = requireDb();
  const roomRef = doc(database, 'rooms', roomId);

  await runTransaction(database, async (tx) => {
    const roomSnap = await tx.get(roomRef);
    if (!roomSnap.exists()) throw new Error('Room not found.');
    const room = roomSnap.data() as Omit<Room, 'roomId'>;
    const queue = [...((room.speakerQueue ?? []) as SpeakerQueueEntry[])];
    if (queue.length === 0) return;
    const [, ...rest] = queue;
    tx.update(roomRef, {
      speakerQueue: rest,
      ...bankPatchFromTimer(room, speakerLabel),
    });
  });
}

export async function removeFromSpeakerQueue(
  roomId: string,
  entry: SpeakerQueueEntry,
): Promise<void> {
  const database = requireDb();
  await updateDoc(doc(database, 'rooms', roomId), {
    speakerQueue: arrayRemove(entry),
  });
}

export async function startSpeakerTimer(
  roomId: string,
  durationSeconds: number,
  associatedUserId?: string,
): Promise<void> {
  const database = requireDb();
  const seconds = Math.max(1, Math.floor(durationSeconds));
  const timer = buildSpeakerTimer({ durationSeconds: seconds, associatedUserId });
  await updateDoc(doc(database, 'rooms', roomId), { activeTimer: timer });
}

export async function pauseSpeakerTimer(roomId: string): Promise<void> {
  const database = requireDb();
  const roomRef = doc(database, 'rooms', roomId);
  await runTransaction(database, async (tx) => {
    const snap = await tx.get(roomRef);
    if (!snap.exists()) throw new Error('Room not found.');
    const room = snap.data() as Omit<Room, 'roomId'>;
    const timer = room.activeTimer as RoomTimer | null | undefined;
    if (!timer || timer.status !== 'running') return;
    const remaining = remainingTimerSeconds(timer);
    tx.update(roomRef, {
      activeTimer: {
        ...timer,
        remainingTime: remaining,
        status: remaining === 0 ? 'finished' : 'paused',
        startTime: Date.now(),
      },
    });
  });
}

export async function resumeSpeakerTimer(roomId: string): Promise<void> {
  const database = requireDb();
  const roomRef = doc(database, 'rooms', roomId);
  await runTransaction(database, async (tx) => {
    const snap = await tx.get(roomRef);
    if (!snap.exists()) throw new Error('Room not found.');
    const room = snap.data() as Omit<Room, 'roomId'>;
    const timer = room.activeTimer as RoomTimer | null | undefined;
    if (!timer || timer.status !== 'paused') return;
    tx.update(roomRef, {
      activeTimer: {
        ...timer,
        status: 'running',
        startTime: Date.now(),
      },
    });
  });
}

export async function clearSpeakerTimer(
  roomId: string,
  speakerLabel = 'Speaker',
): Promise<void> {
  const database = requireDb();
  const roomRef = doc(database, 'rooms', roomId);
  await runTransaction(database, async (tx) => {
    const snap = await tx.get(roomRef);
    if (!snap.exists()) throw new Error('Room not found.');
    const room = snap.data() as Omit<Room, 'roomId'>;
    tx.update(roomRef, bankPatchFromTimer(room, speakerLabel));
  });
}

/** Chair strikes the gavel — synced so every client can play one tap. */
export async function strikeGavel(roomId: string, byUserId: string): Promise<number> {
  const database = requireDb();
  const at = Date.now();
  await updateDoc(doc(database, 'rooms', roomId), {
    lastGavel: {
      taps: 1 as const,
      at,
      byUserId,
    },
  });
  return at;
}

/** Chair start / stop session (open debate vs recess). */
export async function setRoomSessionStatus(
  roomId: string,
  status: 'open' | 'recess',
): Promise<void> {
  const database = requireDb();
  const roomRef = doc(database, 'rooms', roomId);
  await runTransaction(database, async (tx) => {
    const snap = await tx.get(roomRef);
    if (!snap.exists()) throw new Error('Room not found.');
    const room = snap.data() as Omit<Room, 'roomId'>;
    if (status === 'recess') {
      tx.update(roomRef, {
        currentStatus: 'recess',
        activeCaucus: null,
        activeMotionId: null,
        ...bankPatchFromTimer(room, 'Session ended'),
      });
      return;
    }
    tx.update(roomRef, {
      currentStatus: 'open',
      activeCaucus: null,
    });
  });
}
