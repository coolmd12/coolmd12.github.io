export type ActivityKind =
  | 'account_created'
  | 'classroom_created'
  | 'classroom_joined'
  | 'room_created'
  | 'room_joined'
  | 'room_closed';

export interface ActivityEvent {
  eventId: string;
  kind: ActivityKind;
  title: string;
  detail?: string;
  at: number;
  href?: string;
  /** Stable dedupe key (also used as Firestore doc id when logging). */
  dedupeKey: string;
}

export interface ActivityUsageStats {
  roomsHosted: number;
  roomsJoined: number;
  classrooms: number;
  totalEvents: number;
}
