export type UserRole = 'student' | 'teacher' | 'parent';

export type PracticeMode = 'live' | 'ai' | 'hybrid';

export interface UserProfile {
  uid: string;
  email: string;
  /** Discord-style unique handle. Missing on legacy accounts until claimed. */
  username?: string;
  displayName: string;
  /** Primary role (legacy + display). Prefer `roles` for capabilities. */
  role: UserRole;
  /** Account capabilities (Phase 1.6+). Missing on legacy → treat as `[role]`. */
  roles?: UserRole[];
  school?: string;
  photoURL?: string;
  /** Set when signup email code was consumed (Phase 1.7). */
  emailVerifiedAt?: number;
  /** False for new accounts until they finish or skip the post-signup customize step. Missing = already set up (legacy). */
  profileSetupComplete?: boolean;
  /** Student/teacher: secret parents enter with @username to link (Parent Portal V1). */
  familyCode?: string;
  familyCodeRotatedAt?: number;
  /** Parent portal: ISO date YYYY-MM-DD (used to confirm adult age; no ID upload). */
  dateOfBirth?: string;
  createdAt: number;
  classroomIds: string[];
}

/** Capability list: prefer `roles`, fall back to legacy single `role`. */
export function profileRoles(profile: UserProfile | null | undefined): UserRole[] {
  if (!profile) return [];
  if (profile.roles?.length) {
    const unique = Array.from(new Set(profile.roles));
    return unique.filter(
      (r): r is UserRole => r === 'student' || r === 'teacher' || r === 'parent',
    );
  }
  return profile.role ? [profile.role] : [];
}

export function isParentAccount(profile: UserProfile | null | undefined): boolean {
  return profileRoles(profile).includes('parent');
}

/** V1 parent-only accounts (no student/teacher caps on the same UID). */
export function isParentOnly(profile: UserProfile | null | undefined): boolean {
  const roles = profileRoles(profile);
  return roles.length === 1 && roles[0] === 'parent';
}

export function canTeach(profile: UserProfile | null | undefined): boolean {
  return profileRoles(profile).includes('teacher');
}

/** Parents do not join classrooms as members in V1. */
export function canJoin(profile: UserProfile | null | undefined): boolean {
  return !isParentOnly(profile);
}

/** Short label for chips / empty states, e.g. "Student · Teacher". */
export function formatCapabilities(profile: UserProfile | null | undefined): string {
  const roles = profileRoles(profile);
  if (!roles.length) return '';
  const labels: Record<UserRole, string> = {
    student: 'Student',
    teacher: 'Teacher',
    parent: 'Parent',
  };
  const ordered: UserRole[] = [];
  if (roles.includes('parent')) ordered.push('parent');
  if (roles.includes('teacher')) ordered.push('teacher');
  if (roles.includes('student')) ordered.push('student');
  return ordered.map((r) => labels[r]).join(' · ');
}

/**
 * Normalize signup multi-select → primary role + roles array.
 * V1: parent is exclusive (cannot mix with student/teacher).
 * Teacher preferred as primary when both student + teacher.
 */
export function normalizeAccountRoles(selected: UserRole[]): {
  role: UserRole;
  roles: UserRole[];
} {
  const unique = Array.from(new Set(selected)).filter(
    (r): r is UserRole => r === 'student' || r === 'teacher' || r === 'parent',
  );
  if (!unique.length) {
    throw new Error('Choose at least one role: student, teacher, or parent.');
  }
  if (unique.includes('parent')) {
    if (unique.length > 1) {
      throw new Error('Parent accounts are parent-only for now. Multi-role comes later.');
    }
    return { role: 'parent', roles: ['parent'] };
  }
  const roles: UserRole[] = [];
  if (unique.includes('teacher')) roles.push('teacher');
  if (unique.includes('student')) roles.push('student');
  return { role: roles[0]!, roles };
}

/** Home path after onboarding for this account type. */
export function homePathForProfile(profile: UserProfile | null | undefined): string {
  return isParentOnly(profile) ? '/family' : '/dashboard';
}

/** New signups set this to false; skip/save sets true. Legacy profiles without the field are treated as done. */
export function needsProfileSetup(profile: UserProfile | null | undefined): boolean {
  return profile?.profileSetupComplete === false;
}

/** Legacy accounts created before Phase 1.7 must pick a username once. */
export function needsUsername(profile: UserProfile | null | undefined): boolean {
  return Boolean(profile && !profile.username);
}

export { needsParentDateOfBirth } from '../lib/dateOfBirth';

export interface Classroom {
  id: string;
  name: string;
  description?: string;
  teacherId: string;
  teacherName: string;
  inviteCode: string;
  createdAt: number;
  memberCount: number;
  defaultMeetLink?: string;
  defaultZoomLink?: string;
}

export interface ClassroomMember {
  uid: string;
  displayName: string;
  role: UserRole | 'chair';
  joinedAt: number;
  photoURL?: string;
}

export interface PracticeSession {
  id: string;
  classroomId: string;
  title: string;
  committee: string;
  topic: string;
  mode: PracticeMode;
  status: 'draft' | 'live' | 'ended';
  meetLink?: string;
  zoomLink?: string;
  createdAt: number;
  createdBy: string;
}

export interface ConferenceListing {
  id: string;
  name: string;
  shortName: string;
  location: string;
  region: string;
  level: 'High School' | 'University' | 'Open';
  startDate: string;
  endDate: string;
  website: string;
  source: string;
}
