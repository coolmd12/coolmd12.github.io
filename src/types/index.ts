export type UserRole = 'student' | 'teacher';

export type PracticeMode = 'live' | 'ai' | 'hybrid';

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  role: UserRole;
  school?: string;
  createdAt: number;
  classroomIds: string[];
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
