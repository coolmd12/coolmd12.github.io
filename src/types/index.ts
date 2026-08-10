export type UserRole = 'student' | 'teacher';

export type PracticeMode = 'live' | 'ai' | 'hybrid';

export interface UserProfile {
  uid: string;
  email: string;
  /** Discord-style unique handle. Missing on legacy accounts until claimed. */
  username?: string;
  displayName: string;
  /** Primary role (legacy + display). Prefer `roles` for capabilities. */
  role: UserRole;
  /** Account capabilities (Phase 1.6). Missing on legacy → treat as `[role]`. */
  roles?: UserRole[];
  school?: string;
  photoURL?: string;
  /** Set when signup email code was consumed (Phase 1.7). */
  emailVerifiedAt?: number;
  /** False for new accounts until they finish or skip the post-signup customize step. Missing = already set up (legacy). */
  profileSetupComplete?: boolean;
  createdAt: number;
  classroomIds: string[];
}

/** Capability list: prefer `roles`, fall back to legacy single `role`. */
export function profileRoles(profile: UserProfile | null | undefined): UserRole[] {
  if (!profile) return [];
  if (profile.roles?.length) {
    const unique = Array.from(new Set(profile.roles));
    return unique.filter((r): r is UserRole => r === 'student' || r === 'teacher');
  }
  return profile.role ? [profile.role] : [];
}

export function canTeach(profile: UserProfile | null | undefined): boolean {
  return profileRoles(profile).includes('teacher');
}

/** Signed-in users can always join classrooms with an invite code. */
export function canJoin(_profile: UserProfile | null | undefined): boolean {
  return true;
}

/** Short label for chips / empty states, e.g. "Student · Teacher". */
export function formatCapabilities(profile: UserProfile | null | undefined): string {
  const roles = profileRoles(profile);
  if (!roles.length) return '';
  const labels: Record<UserRole, string> = {
    student: 'Student',
    teacher: 'Teacher',
  };
  // Teacher first when both, so dual-role reads consistently.
  const ordered: UserRole[] = [];
  if (roles.includes('teacher')) ordered.push('teacher');
  if (roles.includes('student')) ordered.push('student');
  return ordered.map((r) => labels[r]).join(' · ');
}

/** Normalize signup multi-select → primary role + roles array (teacher preferred as primary when both). */
export function normalizeAccountRoles(selected: UserRole[]): {
  role: UserRole;
  roles: UserRole[];
} {
  const unique = Array.from(new Set(selected)).filter(
    (r): r is UserRole => r === 'student' || r === 'teacher',
  );
  if (!unique.length) {
    throw new Error('Choose at least one role: student and/or teacher.');
  }
  const roles: UserRole[] = [];
  if (unique.includes('teacher')) roles.push('teacher');
  if (unique.includes('student')) roles.push('student');
  return { role: roles[0], roles };
}

/** New signups set this to false; skip/save sets true. Legacy profiles without the field are treated as done. */
export function needsProfileSetup(profile: UserProfile | null | undefined): boolean {
  return profile?.profileSetupComplete === false;
}

/** Legacy accounts created before Phase 1.7 must pick a username once. */
export function needsUsername(profile: UserProfile | null | undefined): boolean {
  return Boolean(profile && !profile.username);
}

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
