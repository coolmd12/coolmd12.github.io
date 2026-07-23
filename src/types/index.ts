export type UserRole = 'student' | 'teacher';

export type PracticeMode = 'live' | 'ai' | 'hybrid';

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  role: UserRole;
  school?: string;
  photoURL?: string;
  /** False for new accounts until they finish or skip the post-signup customize step. Missing = already set up (legacy). */
  profileSetupComplete?: boolean;
  createdAt: number;
  classroomIds: string[];
}

/** New signups set this to false; skip/save sets true. Legacy profiles without the field are treated as done. */
export function needsProfileSetup(profile: UserProfile | null | undefined): boolean {
  return profile?.profileSetupComplete === false;
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
