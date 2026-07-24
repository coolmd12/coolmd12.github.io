import {
  createUserWithEmailAndPassword,
  fetchSignInMethodsForEmail,
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
import { validateDisplayName, validateUsername } from '../lib/username';
import { checkSignupToken, consumeSignupToken } from './emailVerification';
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

export const EMAIL_ALREADY_IN_USE_MESSAGE =
  'An account with this email already exists. Log in instead, or use a different email.';

async function authSaysEmailRegistered(email: string): Promise<boolean> {
  const { auth: a } = requireAuthDb();
  const methods = await fetchSignInMethodsForEmail(a, email);
  if (methods.length > 0) return true;

  const apiKey = import.meta.env.VITE_FIREBASE_API_KEY as string | undefined;
  if (!apiKey?.trim()) {
    throw new Error('Firebase is not configured. Add your keys to .env.local (see .env.example).');
  }

  const continueUri =
    typeof window !== 'undefined' && window.location?.origin
      ? window.location.origin
      : 'https://coolmd12.github.io';

  const res = await fetch(
    `https://identitytoolkit.googleapis.com/v1/accounts:createAuthUri?key=${encodeURIComponent(apiKey)}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier: email, continueUri }),
    },
  );

  if (!res.ok) {
    throw new Error('Could not verify whether this email is available. Try again.');
  }

  const data = (await res.json()) as { registered?: boolean };
  return Boolean(data.registered);
}

/** Keep emails/{email} in sync so signup step 1 can block taken addresses. */
export async function ensureEmailClaim(uid: string, rawEmail: string): Promise<void> {
  const { db: database } = requireAuthDb();
  const email = rawEmail.trim().toLowerCase();
  if (!uid || !email) return;

  const emailRef = doc(database, 'emails', email);
  const existing = await getDoc(emailRef);
  if (existing.exists()) return;

  try {
    await setDoc(emailRef, { uid, createdAt: Date.now() });
  } catch (err) {
    console.warn('Could not write emails claim', err);
  }
}

/**
 * Gate for signup step 1 (and re-checks before later steps advance).
 * Taken emails must never proceed to code / details / Create account.
 */
export async function assertEmailAvailableForSignup(rawEmail: string): Promise<string> {
  const { db: database } = requireAuthDb();
  const email = rawEmail.trim().toLowerCase();
  if (!email) {
    throw new Error('Enter your email address.');
  }

  const emailClaim = await getDoc(doc(database, 'emails', email));
  if (emailClaim.exists()) {
    throw new Error(EMAIL_ALREADY_IN_USE_MESSAGE);
  }

  let registered: boolean;
  try {
    registered = await authSaysEmailRegistered(email);
  } catch (err) {
    if (err instanceof Error && err.message === EMAIL_ALREADY_IN_USE_MESSAGE) {
      throw err;
    }
    throw new Error(
      err instanceof Error
        ? err.message
        : 'Could not verify whether this email is available. Try again.',
    );
  }

  if (registered) {
    throw new Error(EMAIL_ALREADY_IN_USE_MESSAGE);
  }

  return email;
}

function authErrorMessage(err: unknown): string {
  const code =
    err && typeof err === 'object' && 'code' in err ? String((err as { code: string }).code) : '';
  if (code === 'auth/email-already-in-use') {
    return EMAIL_ALREADY_IN_USE_MESSAGE;
  }
  if (code === 'auth/weak-password') {
    return 'Password is too weak. Use at least 6 characters.';
  }
  if (code === 'auth/invalid-email') {
    return 'That email address looks invalid.';
  }
  if (code === 'permission-denied') {
    return 'Firestore blocked the profile write. Publish the latest firebase/firestore.rules, then try again with a fresh verification code.';
  }
  return err instanceof Error ? err.message : 'Could not create account.';
}

export async function registerUser(input: {
  email: string;
  password: string;
  username: string;
  displayName: string;
  role: UserRole;
  signupToken: string;
}): Promise<UserProfile> {
  const { auth: a, db: database } = requireAuthDb();
  // Final gate before Auth create — step 1 already checked; this catches races only.
  const email = await assertEmailAvailableForSignup(input.email);
  const signupToken = input.signupToken.trim();

  const usernameCheck = validateUsername(input.username);
  if (!usernameCheck.ok) throw new Error(usernameCheck.error);
  const displayCheck = validateDisplayName(input.displayName);
  if (!displayCheck.ok) throw new Error(displayCheck.error);

  if (!signupToken) {
    throw new Error('Verify your email before creating an account.');
  }

  // Validate without consuming so retries still work if profile write fails.
  await checkSignupToken(email, signupToken);

  const usernameRef = doc(database, 'usernames', usernameCheck.username);
  const emailRef = doc(database, 'emails', email);
  const existingName = await getDoc(usernameRef);
  if (existingName.exists()) {
    throw new Error('That username is already taken.');
  }

  let cred;
  try {
    cred = await createUserWithEmailAndPassword(a, email, input.password);
  } catch (err) {
    throw new Error(authErrorMessage(err));
  }

  const emailVerifiedAt = Date.now();
  const profile: UserProfile = {
    uid: cred.user.uid,
    email,
    username: usernameCheck.username,
    displayName: displayCheck.displayName,
    role: input.role,
    emailVerifiedAt,
    profileSetupComplete: false,
    createdAt: Date.now(),
    classroomIds: [],
  };

  try {
    await runTransaction(database, async (tx) => {
      const taken = await tx.get(usernameRef);
      if (taken.exists()) {
        throw new Error('That username is already taken.');
      }
      const emailTaken = await tx.get(emailRef);
      if (emailTaken.exists()) {
        throw new Error(EMAIL_ALREADY_IN_USE_MESSAGE);
      }
      tx.set(usernameRef, {
        uid: cred.user.uid,
        createdAt: Date.now(),
      });
      tx.set(emailRef, {
        uid: cred.user.uid,
        createdAt: Date.now(),
      });
      tx.set(doc(database, 'users', cred.user.uid), {
        ...profile,
        createdAtServer: serverTimestamp(),
      });
    });
  } catch (err) {
    try {
      await cred.user.delete();
    } catch (cleanupErr) {
      console.warn('Could not roll back Auth user after failed profile write', cleanupErr);
    }
    const code =
      err && typeof err === 'object' && 'code' in err ? String((err as { code: string }).code) : '';
    if (code === 'permission-denied') {
      throw new Error(authErrorMessage(err));
    }
    throw err instanceof Error ? err : new Error('Could not create profile.');
  }

  try {
    const consumed = await consumeSignupToken(email, signupToken);
    if (consumed.emailVerifiedAt) {
      await updateDoc(doc(database, 'users', cred.user.uid), {
        emailVerifiedAt: consumed.emailVerifiedAt,
      });
      profile.emailVerifiedAt = consumed.emailVerifiedAt;
    }
  } catch (consumeErr) {
    // Account is already created; don't fail signup if one-time consume races.
    console.warn('Could not consume signup token after register', consumeErr);
  }

  await updateProfile(cred.user, { displayName: displayCheck.displayName });
  return profile;
}

/** One-time username claim for legacy accounts created before Phase 1.7. */
export async function claimUsername(rawUsername: string): Promise<UserProfile> {
  const { auth: a, db: database } = requireAuthDb();
  const user = a.currentUser;
  if (!user) throw new Error('You must be signed in to choose a username.');

  const usernameCheck = validateUsername(rawUsername);
  if (!usernameCheck.ok) throw new Error(usernameCheck.error);

  const existing = await fetchUserProfile(user.uid);
  if (!existing) throw new Error('Profile not found.');
  if (existing.username) throw new Error('Username is already set and cannot be changed.');

  const usernameRef = doc(database, 'usernames', usernameCheck.username);
  const userRef = doc(database, 'users', user.uid);

  await runTransaction(database, async (tx) => {
    const taken = await tx.get(usernameRef);
    if (taken.exists()) throw new Error('That username is already taken.');
    const snap = await tx.get(userRef);
    if (!snap.exists()) throw new Error('Profile not found.');
    const data = snap.data() as UserProfile;
    if (data.username) throw new Error('Username is already set and cannot be changed.');
    tx.set(usernameRef, { uid: user.uid, createdAt: Date.now() });
    tx.update(userRef, { username: usernameCheck.username });
  });

  const next = await fetchUserProfile(user.uid);
  if (!next) throw new Error('Profile not found.');
  return next;
}

export async function loginUser(email: string, password: string) {
  const { auth: a } = requireAuthDb();
  const cred = await signInWithEmailAndPassword(a, email, password);
  const normalized = (cred.user.email || email).trim().toLowerCase();
  await ensureEmailClaim(cred.user.uid, normalized);
  return cred;
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
    if (existing) {
      if (user.email) await ensureEmailClaim(user.uid, user.email);
      return existing;
    }
    await sleep(100 * (attempt + 1));
  }

  const { db: database } = requireAuthDb();
  const refDoc = doc(database, 'users', user.uid);
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
  const profile = await runTransaction(database, async (tx) => {
    const snap = await tx.get(refDoc);
    if (snap.exists()) return snap.data() as UserProfile;
    tx.set(refDoc, {
      ...fallback,
      createdAtServer: serverTimestamp(),
    });
    return fallback;
  });

  if (user.email) await ensureEmailClaim(user.uid, user.email);
  return profile;
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

  let displayName =
    input.displayName !== undefined ? input.displayName.trim() : existing.displayName;
  if (!displayName) throw new Error('Display name is required.');
  if (input.displayName !== undefined) {
    const check = validateDisplayName(input.displayName);
    if (!check.ok) throw new Error(check.error);
    displayName = check.displayName;
  }

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

  const contentType = resolveImageContentType(file);
  if (!contentType) {
    throw new Error('Use a JPG, PNG, or WebP image (HEIC from iPhone is not supported yet).');
  }
  if (file.size > 2 * 1024 * 1024) {
    throw new Error('Image must be under 2 MB.');
  }

  const ext = contentType === 'image/png' ? 'png' : contentType === 'image/webp' ? 'webp' : 'jpg';
  const objectRef = ref(bucket, `avatars/${user.uid}/avatar.${ext}`);
  try {
    await uploadBytes(objectRef, file, { contentType });
    return await getDownloadURL(objectRef);
  } catch (err) {
    throw new Error(storageErrorMessage(err));
  }
}

function resolveImageContentType(file: File): 'image/jpeg' | 'image/png' | 'image/webp' | null {
  const type = (file.type || '').toLowerCase();
  if (type === 'image/jpeg' || type === 'image/jpg') return 'image/jpeg';
  if (type === 'image/png') return 'image/png';
  if (type === 'image/webp') return 'image/webp';

  // Windows sometimes leaves file.type empty — fall back to extension.
  const name = file.name.toLowerCase();
  if (name.endsWith('.jpg') || name.endsWith('.jpeg')) return 'image/jpeg';
  if (name.endsWith('.png')) return 'image/png';
  if (name.endsWith('.webp')) return 'image/webp';
  return null;
}

function storageErrorMessage(err: unknown): string {
  const code =
    err && typeof err === 'object' && 'code' in err ? String((err as { code: string }).code) : '';
  if (code === 'storage/unauthorized') {
    return 'Photo upload blocked by Storage rules. Publish firebase/storage.rules in Firebase Console.';
  }
  if (code === 'storage/retry-limit-exceeded' || code === 'storage/unknown') {
    return 'Could not reach Firebase Storage. Enable Storage in Firebase Console (Build → Storage → Get started), then try again.';
  }
  if (code === 'storage/canceled') {
    return 'Upload canceled.';
  }
  if (code === 'storage/quota-exceeded') {
    return 'Storage quota exceeded. Try a smaller image.';
  }
  return err instanceof Error
    ? err.message
    : 'Could not upload photo. Enable Firebase Storage and publish storage rules.';
}
