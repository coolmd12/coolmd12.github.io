export type UserRole = 'student' | 'teacher';

export type PracticeMode = 'live' | 'ai' | 'hybrid';

export interface UserProfile {
  uid: string;
  email: string;
  /** Discord-style unique handle; locked after signup. Missing on legacy accounts. */
  username?: string;
  displayName: string;
  role: UserRole;
  school?: string;
  photoURL?: string;
  /** Set when signup email code was consumed (Phase 1.7). */
  emailVerifiedAt?: number;
  /** False for new accounts until they finish or skip the post-signup customize step. Missing = already set up (legacy). */
  profileSetupComplete?: boolean;
  createdAt: number;
  classroomIds: string[];
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
