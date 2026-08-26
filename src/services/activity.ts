import {
  collection,
  collectionGroup,
  doc,
  documentId,
  getDoc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  setDoc,
  where,
} from 'firebase/firestore';
import { db, isFirebaseConfigured } from '../lib/firebase';
import type { ActivityEvent, ActivityKind, ActivityUsageStats } from '../types/activity';
import type { Classroom, UserProfile } from '../types';
import type { MonthlyActivitySummary } from '../types/parent';
import { isRoomClosed } from './committeeRoomLogic';
import { fetchCommitteeRoomsForUser, type MyCommitteeRoom } from './rooms';
import { listUserClassrooms } from './classrooms';

function requireDb() {
  if (!isFirebaseConfigured || !db) {
    throw new Error('Firebase is not configured.');
  }
  return db;
}

function sanitizeId(raw: string): string {
  return raw.replace(/[^\w.-]+/g, '_').slice(0, 120);
}

export function activityDedupeKey(kind: ActivityKind, subjectId: string): string {
  return sanitizeId(`${kind}_${subjectId}`);
}

/** Best-effort append; never throws to callers of classroom/room flows. */
export async function logActivity(
  uid: string,
  input: {
    kind: ActivityKind;
    title: string;
    detail?: string;
    at?: number;
    href?: string;
    subjectId: string;
  },
): Promise<void> {
  try {
    if (!isFirebaseConfigured || !db) return;
    const dedupeKey = activityDedupeKey(input.kind, input.subjectId);
    const ref = doc(db, 'users', uid, 'activity', dedupeKey);
    const event: Omit<ActivityEvent, 'eventId'> = {
      kind: input.kind,
      title: input.title,
      at: input.at ?? Date.now(),
      dedupeKey,
      ...(input.detail ? { detail: input.detail } : {}),
      ...(input.href ? { href: input.href } : {}),
    };
    await setDoc(ref, event, { merge: true });
  } catch (err) {
    console.warn('Activity log failed', err);
  }
}

export function streamActivityLog(
  uid: string,
  callback: (events: ActivityEvent[]) => void,
): () => void {
  if (!db) {
    callback([]);
    return () => {};
  }
  const q = query(collection(db, 'users', uid, 'activity'), orderBy('at', 'desc'));
  return onSnapshot(
    q,
    (snap) => {
      const events = snap.docs.map(
        (d) => ({ ...d.data(), eventId: d.id }) as ActivityEvent,
      );
      callback(events);
    },
    () => callback([]),
  );
}

export async function listActivityLog(uid: string): Promise<ActivityEvent[]> {
  const database = requireDb();
  const q = query(collection(database, 'users', uid, 'activity'), orderBy('at', 'desc'));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ ...d.data(), eventId: d.id }) as ActivityEvent);
}

/** Build timeline events from profile + rooms + classrooms already on the client. */
export function backfillActivityEvents(input: {
  profile: UserProfile;
  rooms: MyCommitteeRoom[];
  classrooms: Classroom[];
}): ActivityEvent[] {
  const events: ActivityEvent[] = [];
  const { profile, rooms, classrooms } = input;

  if (profile.createdAt) {
    const dedupeKey = activityDedupeKey('account_created', profile.uid);
    events.push({
      eventId: dedupeKey,
      kind: 'account_created',
      title: 'Joined GoMUN',
      at: profile.createdAt,
      dedupeKey,
    });
  }

  for (const room of rooms) {
    if (room.relation === 'hosted' || room.relation === 'both') {
      const dedupeKey = activityDedupeKey('room_created', room.roomId);
      events.push({
        eventId: dedupeKey,
        kind: 'room_created',
        title: 'Hosted a committee room',
        detail: room.name,
        at: room.createdAt,
        href: `/room/${room.roomId}`,
        dedupeKey,
      });
    }
    if (room.relation === 'joined' || room.relation === 'both') {
      const dedupeKey = activityDedupeKey('room_joined', room.roomId);
      events.push({
        eventId: dedupeKey,
        kind: 'room_joined',
        title: 'Joined a committee room',
        detail: room.name,
        at: room.createdAt,
        href: `/room/${room.roomId}`,
        dedupeKey,
      });
    }
    if (isRoomClosed(room) && room.closedAt) {
      const dedupeKey = activityDedupeKey('room_closed', room.roomId);
      events.push({
        eventId: dedupeKey,
        kind: 'room_closed',
        title: 'Closed a committee room',
        detail: room.name,
        at: room.closedAt,
        href: `/room/${room.roomId}`,
        dedupeKey,
      });
    }
  }

  for (const classroom of classrooms) {
    const isHost = classroom.teacherId === profile.uid;
    const kind: ActivityKind = isHost ? 'classroom_created' : 'classroom_joined';
    const dedupeKey = activityDedupeKey(kind, classroom.id);
    events.push({
      eventId: dedupeKey,
      kind,
      title: isHost ? 'Created a classroom' : 'Joined a classroom',
      detail: classroom.name,
      at: classroom.createdAt,
      href: `/classroom/${classroom.id}`,
      dedupeKey,
    });
  }

  return events;
}

/** Persist derived timeline events so linked parents can read full history from Firestore. */
export async function syncActivityBackfillToFirestore(input: {
  profile: UserProfile;
  rooms: MyCommitteeRoom[];
  classrooms: Classroom[];
}): Promise<void> {
  if (!isFirebaseConfigured || !db) return;
  const events = backfillActivityEvents(input);
  await Promise.all(
    events.map(async (event) => {
      try {
        const dedupeKey = event.dedupeKey || event.eventId;
        await setDoc(
          doc(db!, 'users', input.profile.uid, 'activity', dedupeKey),
          {
            kind: event.kind,
            title: event.title,
            at: event.at,
            dedupeKey,
            ...(event.detail ? { detail: event.detail } : {}),
            ...(event.href ? { href: event.href } : {}),
          },
          { merge: true },
        );
      } catch (err) {
        console.warn('Activity backfill sync failed', err);
      }
    }),
  );
}

/** Classrooms a linked parent can reconstruct from membership docs (no classroom doc read). */
async function listClassroomsFromMembership(studentUid: string): Promise<Classroom[]> {
  const database = requireDb();
  const snap = await getDocs(
    query(collectionGroup(database, 'members'), where(documentId(), '==', studentUid)),
  );
  const byId = new Map<string, Classroom>();
  for (const memberDoc of snap.docs) {
    const classroomId = memberDoc.ref.parent.parent?.id;
    if (!classroomId) continue;
    const data = memberDoc.data() as {
      classroomName?: string;
      classroomCreatedAt?: number;
      joinedAt?: number;
    };
    if (!data.classroomName) continue;
    byId.set(classroomId, {
      id: classroomId,
      name: data.classroomName,
      teacherId: '',
      teacherName: '',
      inviteCode: '',
      createdAt: data.classroomCreatedAt ?? data.joinedAt ?? Date.now(),
      memberCount: 0,
    });
  }
  return [...byId.values()];
}

/** Classrooms hosted by the student (readable when parent is linked). */
async function listClassroomsHostedByStudent(studentUid: string): Promise<Classroom[]> {
  const database = requireDb();
  const snap = await getDocs(
    query(collection(database, 'classrooms'), where('teacherId', '==', studentUid)),
  );
  return snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Classroom, 'id'>) }));
}

async function fetchStudentProfile(uid: string): Promise<UserProfile | null> {
  const database = requireDb();
  const snap = await getDoc(doc(database, 'users', uid));
  if (!snap.exists()) return null;
  return snap.data() as UserProfile;
}

/** Merge Firestore log with room/classroom history (same shape as the student dashboard). */
export async function loadStudentActivityView(studentUid: string): Promise<ActivityEvent[]> {
  const profile = await fetchStudentProfile(studentUid);
  if (!profile) return [];

  const [live, rooms] = await Promise.all([
    listActivityLog(studentUid),
    fetchCommitteeRoomsForUser(studentUid),
  ]);

  let classrooms: Classroom[] = [];
  try {
    classrooms = await listUserClassrooms(profile.classroomIds || []);
  } catch {
    // Parent accounts may lack direct classroom doc reads — fall back below.
  }
  if (!classrooms.length) {
    const [fromMembership, hosted] = await Promise.all([
      listClassroomsFromMembership(studentUid),
      listClassroomsHostedByStudent(studentUid),
    ]);
    const byId = new Map<string, Classroom>();
    for (const room of [...fromMembership, ...hosted]) {
      byId.set(room.id, room);
    }
    classrooms = [...byId.values()];
  }

  const backfill = backfillActivityEvents({ profile, rooms, classrooms });
  return mergeActivityEvents(live, backfill);
}

export function mergeActivityEvents(
  live: ActivityEvent[],
  backfill: ActivityEvent[],
): ActivityEvent[] {
  const byKey = new Map<string, ActivityEvent>();
  for (const event of [...backfill, ...live]) {
    const key = event.dedupeKey || event.eventId;
    const prev = byKey.get(key);
    if (!prev || event.at >= prev.at) {
      byKey.set(key, { ...event, dedupeKey: key, eventId: event.eventId || key });
    }
  }
  return [...byKey.values()].sort((a, b) => a.at - b.at);
}

export function computeActivityUsage(
  events: ActivityEvent[],
  rooms: MyCommitteeRoom[],
  classrooms: Classroom[],
): ActivityUsageStats {
  const roomsHosted = rooms.filter((r) => r.relation === 'hosted' || r.relation === 'both').length;
  const roomsJoined = rooms.filter((r) => r.relation === 'joined' || r.relation === 'both').length;
  return {
    roomsHosted,
    roomsJoined,
    classrooms: classrooms.length,
    totalEvents: events.length,
  };
}

/** Usage chips when the parent only has the student's activity log (no room list). */
export function computeActivityUsageFromEvents(events: ActivityEvent[]): ActivityUsageStats {
  return {
    roomsHosted: events.filter((e) => e.kind === 'room_created').length,
    roomsJoined: events.filter((e) => e.kind === 'room_joined').length,
    classrooms: events.filter(
      (e) => e.kind === 'classroom_created' || e.kind === 'classroom_joined',
    ).length,
    totalEvents: events.length,
  };
}

export function buildMonthlyActivitySummary(
  events: ActivityEvent[],
  year: number,
  month: number,
): MonthlyActivitySummary {
  const monthEvents = events.filter((e) => {
    const d = new Date(e.at);
    return d.getFullYear() === year && d.getMonth() + 1 === month;
  });

  const roomsHosted = monthEvents.filter((e) => e.kind === 'room_created').length;
  const roomsJoined = monthEvents.filter((e) => e.kind === 'room_joined').length;
  const roomsClosed = monthEvents.filter((e) => e.kind === 'room_closed').length;
  const classroomsCreated = monthEvents.filter((e) => e.kind === 'classroom_created').length;
  const classroomsJoined = monthEvents.filter((e) => e.kind === 'classroom_joined').length;

  const label = new Date(year, month - 1, 1).toLocaleDateString(undefined, {
    month: 'long',
    year: 'numeric',
  });

  const bullets: string[] = [];
  if (monthEvents.length === 0) {
    bullets.push('No recorded activity this month.');
  } else {
    bullets.push(`${monthEvents.length} activity moment${monthEvents.length === 1 ? '' : 's'} logged.`);
    if (roomsHosted) bullets.push(`Hosted ${roomsHosted} committee room${roomsHosted === 1 ? '' : 's'}.`);
    if (roomsJoined) bullets.push(`Joined ${roomsJoined} committee room${roomsJoined === 1 ? '' : 's'}.`);
    if (roomsClosed) bullets.push(`Closed ${roomsClosed} room${roomsClosed === 1 ? '' : 's'}.`);
    if (classroomsCreated) {
      bullets.push(`Created ${classroomsCreated} classroom${classroomsCreated === 1 ? '' : 's'}.`);
    }
    if (classroomsJoined) {
      bullets.push(`Joined ${classroomsJoined} classroom${classroomsJoined === 1 ? '' : 's'}.`);
    }
    const named = monthEvents
      .filter((e) => e.detail?.trim())
      .slice(0, 5)
      .map((e) => `${e.title}${e.detail ? ` — ${e.detail}` : ''}`);
    for (const line of named) bullets.push(line);
  }

  return {
    year,
    month,
    label,
    totalEvents: monthEvents.length,
    roomsHosted,
    roomsJoined,
    roomsClosed,
    classroomsCreated,
    classroomsJoined,
    bullets,
  };
}
