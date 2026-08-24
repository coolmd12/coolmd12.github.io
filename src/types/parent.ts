export const MAX_PARENT_LINKS = 5;

export interface ParentLink {
  linkId: string;
  parentUid: string;
  studentUid: string;
  studentUsername: string;
  studentDisplayName?: string;
  createdAt: number;
  createdByParentUid: string;
  /** Code used at link time (rules validate; kept for audit). */
  familyCode: string;
}

export interface LinkedStudentSummary {
  link: ParentLink;
  displayName: string;
  username: string;
}

export interface MonthlyActivitySummary {
  year: number;
  /** 1–12 */
  month: number;
  label: string;
  totalEvents: number;
  roomsHosted: number;
  roomsJoined: number;
  roomsClosed: number;
  classroomsCreated: number;
  classroomsJoined: number;
  bullets: string[];
}
