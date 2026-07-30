export type RoomStatus =
  | 'open'
  | 'caucus_moderated'
  | 'caucus_unmoderated'
  | 'voting'
  | 'recess';

export type SessionRole = 'delegate' | 'chair';

export type MotionType = 'moderated_caucus' | 'unmoderated_caucus' | 'adjourn';

export type MotionStatus = 'proposed' | 'voting' | 'passed' | 'failed' | 'withdrawn';

/** Procedural votes only for now — abstain comes with substantive + attendance later. */
export type ProceduralVote = 'yes' | 'no';

export interface SpeakerQueueEntry {
  userId: string;
}

export interface SpeechTimeBankEntry {
  userId: string;
  label: string;
  unusedSeconds: number;
  at: number;
}

export interface SpeechTimeBank {
  totalUnusedSeconds: number;
  entries: SpeechTimeBankEntry[];
}

export interface Room {
  roomId: string;
  name: string;
  /** Optional — rooms are open; classroom link is not required. */
  classroomId?: string;
  conferenceId?: string;
  createdBy: string;
  currentStatus: RoomStatus;
  /** Set when someone joins as chair (or on create if creator joins as chair). */
  chairId: string;
  createdAt: number;
  settings: {
    defaultSpeakerTime: number;
    votingDuration: number;
  };
  speakerQueue: SpeakerQueueEntry[];
  /** Chair-visible log of unused seconds when a speech timer ends early (practice aid). */
  speechTimeBank?: SpeechTimeBank;
  /** Id of the motion currently on the floor (debating / voting). */
  activeMotionId?: string | null;
  activeTimer?: RoomTimer | null;
  activeCaucus?: {
    type: 'moderated' | 'unmoderated';
    duration: number;
    startTime: number;
    topic?: string;
    speakers?: string[];
  };
  meetLink?: string;
  zoomLink?: string;
  /** Single external call link (Meet, Zoom, etc.) until in-app calling. */
  meetingLink?: string;
  /** Chair gavel pulse — all clients play taps when `at` changes. */
  lastGavel?: {
    taps: 1 | 2;
    at: number;
    byUserId: string;
  } | null;
}

/**
 * Seat in a room. For delegates, `displayName` is the country (manual for now).
 * For chairs, `displayName` is a typed chair name (defaults to profile name on join).
 */
export interface Participant {
  userId: string;
  displayName: string;
  role: SessionRole;
  /** Set when role is delegate — same value as displayName. */
  country?: string;
  raisedPlacard: boolean;
  joinedAt: number;
}

export interface Speaker {
  speakerId: string;
  userId: string;
  startTime: number;
  duration: number;
  status: 'speaking' | 'finished' | 'queued';
  queuePosition?: number;
}

export interface Motion {
  motionId: string;
  proposerId: string;
  proposerLabel: string;
  type: MotionType;
  topic?: string;
  /** Total caucus length in seconds (mod / unmod). */
  totalDuration?: number;
  /** Per-speaker seconds (moderated caucus). */
  speakerTime?: number;
  status: MotionStatus;
  votes: Record<string, ProceduralVote>;
  createdAt: number;
  closedAt?: number;
}

export interface RoomTimer {
  timerId: string;
  type: 'speaker' | 'caucus' | 'voting';
  duration: number;
  remainingTime: number;
  startTime: number;
  status: 'running' | 'paused' | 'finished';
  associatedUserId?: string;
}

export interface RoomMessage {
  messageId: string;
  userId: string;
  displayName: string;
  text: string;
  createdAt: number;
}
