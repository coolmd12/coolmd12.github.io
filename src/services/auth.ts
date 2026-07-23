import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
  type User,
} from 'firebase/auth';
import {
  arrayUnion,
  deleteField,
  doc,
  getDoc,
  runTransaction,
  serverTimestamp,
  setDoc,
  updateDoc,
} from 'firebase/firestore';
import { getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import { auth, db, isFirebaseConfigured, storage } from '../lib/firebase';
import type { UserProfile, UserRole } from '../types';

function requireAuthDb() {
  if (!isFirebaseConfigured || !auth || !db) {
    throw new Error(
      'Firebase is not configured. Add your keys to .env.local (see .env.example).',
    );
  }
  return { auth, db };
}

function requireStorage() {
  if (!storage) {
    throw new Error(
      'Firebase Storage is not configured. Set VITE_FIREBASE_STORAGE_BUCKET and enable Storage in the Firebase Console.',
    );
  }
  return storage;
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function registerUser(input: {
  email: string;
  password: string;
  role: UserRole;
}): Promise<UserProfile> {
  const { auth: a, db: database } = requireAuthDb();
  const email = input.email.trim().toLowerCase();
  const cred = await createUserWithEmailAndPassword(a, email, input.password);

  const localPart = email.split('@')[0] || 'Delegate';
  const displayName = localPart
    .replace(/[._-]+/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase())
    .trim()
    .slice(0, 80) || 'Delegate';

  const profile: UserProfile = {
    uid: cred.user.uid,
    email,
    displayName,
    role: input.role,
    profileSetupComplete: false,
    createdAt: Date.now(),
    classroomIds: [],
  };

  // Write Firestore profile before other awaits so auth-state handlers see the real role.
  await setDoc(doc(database, 'users', cred.user.uid), {
    ...profile,
    createdAtServer: serverTimestamp(),
  });
  await updateProfile(cred.user, { displayName });

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
  // Registration writes the profile right after createUser; auth-state can fire
  // first. Retry briefly so we don't create a default student that races signup.
  for (let attempt = 0; attempt < 8; attempt += 1) {
    const existing = await fetchUserProfile(user.uid);
    if (existing) return existing;
    await sleep(100 * (attempt + 1));
  }

  const { db: database } = requireAuthDb();
  const ref = doc(database, 'users', user.uid);
  const fallback: UserProfile = {
    uid: user.uid,
    email: (user.email || '').toLowerCase(),
    displayName: user.displayName || 'Delegate',
    role: 'student',
    profileSetupComplete: true,
    createdAt: Date.now(),
    classroomIds: [],
  };

  // Create-only: never overwrite a profile signup just finished writing.
  return runTransaction(database, async (tx) => {
    const snap = await tx.get(ref);
    if (snap.exists()) return snap.data() as UserProfile;
    tx.set(ref, {
      ...fallback,
      createdAtServer: serverTimestamp(),
    });
    return fallback;
  });
}

export async function addClassroomToUser(uid: string, classroomId: string) {
  const { db: database } = requireAuthDb();
  await updateDoc(doc(database, 'users', uid), {
    classroomIds: arrayUnion(classroomId),
  });
}

async function syncMemberDisplay(
  database: NonNullable<typeof db>,
  profile: UserProfile,
  fields: { displayName?: string; photoURL?: string | null },
) {
  if (!profile.classroomIds.length) return;
  if (fields.displayName === undefined && fields.photoURL === undefined) return;

  await Promise.all(
    profile.classroomIds.map(async (classroomId) => {
      const memberRef = doc(database, 'classrooms', classroomId, 'members', profile.uid);
      const patch: Record<string, unknown> = {};
      if (fields.displayName !== undefined) patch.displayName = fields.displayName;
      if (fields.photoURL !== undefined) {
        patch.photoURL = fields.photoURL === null ? deleteField() : fields.photoURL;
      }
      try {
        await updateDoc(memberRef, patch);
      } catch (err) {
        console.warn(`Could not sync member profile in ${classroomId}`, err);
      }
    }),
  );
}

export async function updateUserProfile(input: {
  displayName?: string;
  school?: string;
  photoURL?: string | null;
  profileSetupComplete?: boolean;
}): Promise<UserProfile> {
  const { auth: a, db: database } = requireAuthDb();
  const user = a.currentUser;
  if (!user) throw new Error('You must be signed in to update your profile.');

  const existing = await fetchUserProfile(user.uid);
  if (!existing) throw new Error('Profile not found.');

  const displayName =
    input.displayName !== undefined ? input.displayName.trim() : existing.displayName;
  if (!displayName) throw new Error('Display name is required.');

  const nextSchool =
    input.school !== undefined ? input.school.trim() || undefined : existing.school;
  const nextPhoto =
    input.photoURL === undefined ? existing.photoURL : input.photoURL || undefined;

  const authPatch: { displayName: string; photoURL?: string | null } = { displayName };
  if (input.photoURL !== undefined) {
    authPatch.photoURL = input.photoURL;
  }
  if (input.displayName !== undefined || input.photoURL !== undefined) {
    await updateProfile(user, authPatch);
  }

  const firestorePatch: Record<string, unknown> = {};
  if (input.displayName !== undefined) firestorePatch.displayName = displayName;
  if (input.school !== undefined) {
    firestorePatch.school = nextSchool || deleteField();
  }
  if (input.photoURL !== undefined) {
    firestorePatch.photoURL = nextPhoto || deleteField();
  }
  if (input.profileSetupComplete !== undefined) {
    firestorePatch.profileSetupComplete = input.profileSetupComplete;
  }

  if (Object.keys(firestorePatch).length) {
    await updateDoc(doc(database, 'users', user.uid), firestorePatch);
  }

  await syncMemberDisplay(database, existing, {
    displayName: displayName !== existing.displayName ? displayName : undefined,
    photoURL:
      input.photoURL === undefined
        ? undefined
        : input.photoURL === null
          ? null
          : input.photoURL,
  });

  return {
    ...existing,
    displayName,
    school: nextSchool,
    photoURL: nextPhoto,
    profileSetupComplete:
      input.profileSetupComplete !== undefined
        ? input.profileSetupComplete
        : existing.profileSetupComplete,
  };
}

/** Mark post-signup customization finished (Save or Skip). */
export async function finishProfileSetup(input?: {
  displayName?: string;
  school?: string;
  photoURL?: string | null;
}): Promise<UserProfile> {
  if (!input) {
    return updateUserProfile({ profileSetupComplete: true });
  }
  return updateUserProfile({
    ...input,
    profileSetupComplete: true,
  });
}

export async function uploadProfilePhoto(file: File): Promise<string> {
  const { auth: a } = requireAuthDb();
  const bucket = requireStorage();
  const user = a.currentUser;
  if (!user) throw new Error('You must be signed in to upload a photo.');

  const allowed = ['image/jpeg', 'image/png', 'image/webp'];
  if (!allowed.includes(file.type)) {
    throw new Error('Use a JPG, PNG, or WebP image.');
  }
  if (file.size > 2 * 1024 * 1024) {
    throw new Error('Image must be under 2 MB.');
  }

  const ext = file.type === 'image/png' ? 'png' : file.type === 'image/webp' ? 'webp' : 'jpg';
  const objectRef = ref(bucket, `avatars/${user.uid}/avatar.${ext}`);
  await uploadBytes(objectRef, file, { contentType: file.type });
  return getDownloadURL(objectRef);
}
