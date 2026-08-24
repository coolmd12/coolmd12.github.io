import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  query,
  setDoc,
  updateDoc,
  where,
} from 'firebase/firestore';
import { db, isFirebaseConfigured } from '../lib/firebase';
import { validateUsername } from '../lib/username';
import {
  isParentOnly,
  type UserProfile,
} from '../types';
import { needsParentDateOfBirth, parseParentDateOfBirth } from '../lib/dateOfBirth';
import { MAX_PARENT_LINKS, type LinkedStudentSummary, type ParentLink } from '../types/parent';

function requireDb() {
  if (!isFirebaseConfigured || !db) {
    throw new Error('Firebase is not configured.');
  }
  return db;
}

async function readUserProfile(uid: string): Promise<UserProfile | null> {
  const database = requireDb();
  const snap = await getDoc(doc(database, 'users', uid));
  if (!snap.exists()) return null;
  return snap.data() as UserProfile;
}

const FAMILY_CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

export function generateFamilyCode(length = 8): string {
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);
  let out = '';
  for (let i = 0; i < length; i += 1) {
    out += FAMILY_CODE_ALPHABET[bytes[i]! % FAMILY_CODE_ALPHABET.length];
  }
  return out;
}

export function normalizeFamilyCode(raw: string): string {
  return raw.trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
}

export function parentLinkId(parentUid: string, studentUid: string): string {
  return `${parentUid}_${studentUid}`;
}

async function readOwnFamilyCode(uid: string): Promise<{ code: string; rotatedAt?: number } | null> {
  const database = requireDb();
  const snap = await getDoc(doc(database, 'familyCodes', uid));
  if (!snap.exists()) return null;
  const data = snap.data() as { code?: string; rotatedAt?: number };
  if (!data.code) return null;
  return { code: data.code, rotatedAt: data.rotatedAt };
}

/** Ensure a student/teacher profile has a family code (idempotent). Returns code for self UI. */
export async function ensureFamilyCode(profile: UserProfile): Promise<UserProfile> {
  if (isParentOnly(profile)) return profile;

  const existing = await readOwnFamilyCode(profile.uid);
  if (existing) {
    return {
      ...profile,
      familyCode: existing.code,
      familyCodeRotatedAt: existing.rotatedAt,
    };
  }

  const database = requireDb();
  const code = generateFamilyCode();
  const rotatedAt = Date.now();
  try {
    await setDoc(doc(database, 'familyCodes', profile.uid), {
      uid: profile.uid,
      code,
      rotatedAt,
    });
    return { ...profile, familyCode: code, familyCodeRotatedAt: rotatedAt };
  } catch (err) {
    console.warn('Could not ensure family code', err);
    return profile;
  }
}

export async function rotateFamilyCode(uid: string): Promise<string> {
  const database = requireDb();
  const code = generateFamilyCode();
  const rotatedAt = Date.now();
  await setDoc(doc(database, 'familyCodes', uid), {
    uid,
    code,
    rotatedAt,
  });
  return code;
}

export async function lookupUidByUsername(rawUsername: string): Promise<string | null> {
  const database = requireDb();
  const check = validateUsername(rawUsername);
  if (check.ok === false) throw new Error(check.error);
  const snap = await getDoc(doc(database, 'usernames', check.username));
  if (!snap.exists()) return null;
  const uid = snap.data()?.uid;
  return typeof uid === 'string' ? uid : null;
}

export async function listParentLinksForParent(parentUid: string): Promise<ParentLink[]> {
  const database = requireDb();
  const q = query(collection(database, 'parentLinks'), where('parentUid', '==', parentUid));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ ...d.data(), linkId: d.id }) as ParentLink);
}

export async function listParentLinksForStudent(studentUid: string): Promise<ParentLink[]> {
  const database = requireDb();
  const q = query(collection(database, 'parentLinks'), where('studentUid', '==', studentUid));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ ...d.data(), linkId: d.id }) as ParentLink);
}

export async function listLinkedStudents(parentUid: string): Promise<LinkedStudentSummary[]> {
  const links = await listParentLinksForParent(parentUid);
  const summaries: LinkedStudentSummary[] = [];
  for (const link of links) {
    const student = await readUserProfile(link.studentUid);
    summaries.push({
      link,
      displayName: student?.displayName || link.studentDisplayName || link.studentUsername,
      username: student?.username || link.studentUsername,
    });
  }
  return summaries.sort((a, b) => a.displayName.localeCompare(b.displayName));
}

export async function linkStudentAsParent(input: {
  parent: UserProfile;
  studentUsername: string;
  familyCode: string;
}): Promise<ParentLink> {
  const database = requireDb();
  const { parent } = input;

  if (!isParentOnly(parent)) {
    throw new Error('Only parent accounts can link to students.');
  }
  if (needsParentDateOfBirth(parent)) {
    throw new Error('Add your date of birth on your profile before linking a student.');
  }

  const usernameCheck = validateUsername(input.studentUsername);
  if (usernameCheck.ok === false) throw new Error(usernameCheck.error);
  const code = normalizeFamilyCode(input.familyCode);
  if (code.length < 6) throw new Error('Enter the student’s full family code.');

  const existing = await listParentLinksForParent(parent.uid);
  if (existing.length >= MAX_PARENT_LINKS) {
    throw new Error(`You can link up to ${MAX_PARENT_LINKS} students.`);
  }

  const studentUid = await lookupUidByUsername(usernameCheck.username);
  if (!studentUid) throw new Error('No account found with that username.');
  if (studentUid === parent.uid) throw new Error('You cannot link to your own account.');

  const already = existing.find((l) => l.studentUid === studentUid);
  if (already) throw new Error('That student is already linked to your account.');

  const student = await readUserProfile(studentUid);
  if (!student) throw new Error('Student profile not found.');
  if (isParentOnly(student)) {
    throw new Error('That account is a parent account, not a student.');
  }

  const linkId = parentLinkId(parent.uid, studentUid);
  const link: ParentLink = {
    linkId,
    parentUid: parent.uid,
    studentUid,
    studentUsername: student.username || usernameCheck.username,
    studentDisplayName: student.displayName,
    createdAt: Date.now(),
    createdByParentUid: parent.uid,
    familyCode: code,
  };

  try {
    await setDoc(doc(database, 'parentLinks', linkId), link);
  } catch (err) {
    const codeName =
      err && typeof err === 'object' && 'code' in err ? String((err as { code: string }).code) : '';
    if (codeName === 'permission-denied') {
      throw new Error(
        'Could not link. Check the username and family code, and confirm the student has opened Profile at least once.',
      );
    }
    throw err instanceof Error ? err : new Error('Could not link student.');
  }
  return link;
}

export async function unlinkParentLink(linkId: string): Promise<void> {
  const database = requireDb();
  await deleteDoc(doc(database, 'parentLinks', linkId));
}

export async function saveParentDateOfBirth(uid: string, rawDob: string): Promise<string> {
  const database = requireDb();
  const parsed = parseParentDateOfBirth(rawDob);
  if (parsed.ok === false) throw new Error(parsed.error);
  await updateDoc(doc(database, 'users', uid), {
    dateOfBirth: parsed.dateOfBirth,
  });
  return parsed.dateOfBirth;
}
