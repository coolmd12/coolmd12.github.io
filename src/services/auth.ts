import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
  type User,
} from 'firebase/auth';
import {
  arrayUnion,
  doc,
  getDoc,
  serverTimestamp,
  setDoc,
  updateDoc,
} from 'firebase/firestore';
import { auth, db, isFirebaseConfigured } from '../lib/firebase';
import type { UserProfile, UserRole } from '../types';

function requireAuthDb() {
  if (!isFirebaseConfigured || !auth || !db) {
    throw new Error(
      'Firebase is not configured. Add your keys to .env.local (see .env.example).',
    );
  }
  return { auth, db };
}

export async function registerUser(input: {
  email: string;
  password: string;
  displayName: string;
  role: UserRole;
  school?: string;
}): Promise<UserProfile> {
  const { auth: a, db: database } = requireAuthDb();
  const cred = await createUserWithEmailAndPassword(a, input.email, input.password);
  await updateProfile(cred.user, { displayName: input.displayName });

  const profile: UserProfile = {
    uid: cred.user.uid,
    email: input.email.trim().toLowerCase(),
    displayName: input.displayName.trim(),
    role: input.role,
    school: input.school?.trim() || undefined,
    createdAt: Date.now(),
    classroomIds: [],
  };

  await setDoc(doc(database, 'users', cred.user.uid), {
    ...profile,
    createdAtServer: serverTimestamp(),
  });

  return profile;
}

export async function loginUser(email: string, password: string) {
  const { auth: a } = requireAuthDb();
  return signInWithEmailAndPassword(a, email, password);
}

export async function logoutUser() {
  const { auth: a } = requireAuthDb();
  return signOut(a);
}

export async function fetchUserProfile(uid: string): Promise<UserProfile | null> {
  const { db: database } = requireAuthDb();
  const snap = await getDoc(doc(database, 'users', uid));
  if (!snap.exists()) return null;
  return snap.data() as UserProfile;
}

export async function ensureUserProfile(user: User): Promise<UserProfile> {
  const existing = await fetchUserProfile(user.uid);
  if (existing) return existing;

  const { db: database } = requireAuthDb();
  const profile: UserProfile = {
    uid: user.uid,
    email: (user.email || '').toLowerCase(),
    displayName: user.displayName || 'Delegate',
    role: 'student',
    createdAt: Date.now(),
    classroomIds: [],
  };
  await setDoc(doc(database, 'users', user.uid), {
    ...profile,
    createdAtServer: serverTimestamp(),
  });
  return profile;
}

export async function addClassroomToUser(uid: string, classroomId: string) {
  const { db: database } = requireAuthDb();
  await updateDoc(doc(database, 'users', uid), {
    classroomIds: arrayUnion(classroomId),
  });
}
