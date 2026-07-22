import {
  collection,
  doc,
  documentId,
  getDoc,
  getDocs,
  increment,
  query,
  serverTimestamp,
  where,
  writeBatch,
} from 'firebase/firestore';
import { db, isFirebaseConfigured } from '../lib/firebase';
import { generateInviteCode } from '../lib/utils';
import { addClassroomToUser } from './auth';
import type { Classroom, ClassroomMember, UserProfile } from '../types';

function requireDb() {
  if (!isFirebaseConfigured || !db) {
    throw new Error(
      'Firebase is not configured. Add your keys to .env.local (see .env.example).',
    );
  }
  return db;
}

export async function createClassroom(input: {
  name: string;
  description?: string;
  teacher: UserProfile;
  meetLink?: string;
  zoomLink?: string;
}): Promise<Classroom> {
  const database = requireDb();
  if (input.teacher.role !== 'teacher') {
    throw new Error('Only teachers can create classrooms.');
  }

  const classroomRef = doc(collection(database, 'classrooms'));
  let inviteCode = generateInviteCode();
  // Rare collision retry
  for (let i = 0; i < 3; i += 1) {
    const existing = await getDoc(doc(database, 'inviteCodes', inviteCode));
    if (!existing.exists()) break;
    inviteCode = generateInviteCode();
  }

  const classroom: Classroom = {
    id: classroomRef.id,
    name: input.name.trim(),
    description: input.description?.trim() || undefined,
    teacherId: input.teacher.uid,
    teacherName: input.teacher.displayName,
    inviteCode,
    createdAt: Date.now(),
    memberCount: 1,
    defaultMeetLink: input.meetLink?.trim() || undefined,
    defaultZoomLink: input.zoomLink?.trim() || undefined,
  };

  const batch = writeBatch(database);
  batch.set(classroomRef, {
    ...classroom,
    createdAtServer: serverTimestamp(),
  });
  batch.set(doc(database, 'inviteCodes', inviteCode), {
    classroomId: classroomRef.id,
    teacherId: input.teacher.uid,
    createdAt: Date.now(),
  });
  batch.set(doc(database, 'classrooms', classroomRef.id, 'members', input.teacher.uid), {
    uid: input.teacher.uid,
    displayName: input.teacher.displayName,
    role: 'teacher',
    joinedAt: Date.now(),
  } satisfies ClassroomMember);

  await batch.commit();
  await addClassroomToUser(input.teacher.uid, classroomRef.id);
  return classroom;
}

export async function joinClassroomByCode(
  code: string,
  user: UserProfile,
): Promise<Classroom> {
  const database = requireDb();
  const normalized = code.trim().toUpperCase();
  const inviteSnap = await getDoc(doc(database, 'inviteCodes', normalized));
  if (!inviteSnap.exists()) {
    throw new Error('Invalid invite code. Ask your teacher for a new one.');
  }

  const { classroomId } = inviteSnap.data() as { classroomId: string };
  const classroomRef = doc(database, 'classrooms', classroomId);
  const memberRef = doc(database, 'classrooms', classroomId, 'members', user.uid);
  const memberSnap = await getDoc(memberRef);

  if (!memberSnap.exists()) {
    const batch = writeBatch(database);
    batch.set(memberRef, {
      uid: user.uid,
      displayName: user.displayName,
      role: user.role,
      joinedAt: Date.now(),
    } satisfies ClassroomMember);
    batch.update(classroomRef, { memberCount: increment(1) });
    await batch.commit();
    await addClassroomToUser(user.uid, classroomId);
  }

  const classroomSnap = await getDoc(classroomRef);
  if (!classroomSnap.exists()) {
    throw new Error('This classroom no longer exists.');
  }

  return { id: classroomSnap.id, ...(classroomSnap.data() as Omit<Classroom, 'id'>) };
}

export async function listUserClassrooms(classroomIds: string[]): Promise<Classroom[]> {
  const database = requireDb();
  if (!classroomIds.length) return [];

  const results: Classroom[] = [];
  // Firestore 'in' supports up to 30; chunk if needed
  for (let i = 0; i < classroomIds.length; i += 30) {
    const chunk = classroomIds.slice(i, i + 30);
    const q = query(collection(database, 'classrooms'), where(documentId(), 'in', chunk));
    const snap = await getDocs(q);
    snap.forEach((d) => {
      results.push({ id: d.id, ...(d.data() as Omit<Classroom, 'id'>) });
    });
  }
  return results.sort((a, b) => b.createdAt - a.createdAt);
}

export async function getClassroom(classroomId: string): Promise<Classroom | null> {
  const database = requireDb();
  const snap = await getDoc(doc(database, 'classrooms', classroomId));
  if (!snap.exists()) return null;
  return { id: snap.id, ...(snap.data() as Omit<Classroom, 'id'>) };
}

export async function listClassroomMembers(
  classroomId: string,
): Promise<ClassroomMember[]> {
  const database = requireDb();
  const snap = await getDocs(collection(database, 'classrooms', classroomId, 'members'));
  return snap.docs
    .map((d) => d.data() as ClassroomMember)
    .sort((a, b) => a.joinedAt - b.joinedAt);
}
