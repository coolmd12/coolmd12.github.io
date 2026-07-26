export interface Room {
  roomId: string;
  name: string;
  conferenceId?: string;
  classroomId?: string;
  currentStatus: 'open' | 'caucus_moderated' | 'caucus_unmoderated' | 'voting' | 'recess';
  chairId: string;
  createdAt: number;
  settings: {
    defaultSpeakerTime: number;
    votingDuration: number;
  };
  speakerQueue?: Array<{
    userId: string;
    displayName: string;
    role: 'delegate' | 'chair';
  }>;
  activeCaucus?: {
    type: 'moderated' | 'unmoderated';
    duration: number;
    startTime: number;
    topic?: string;
    speakers?: string[]; // Array of UIDs for moderated caucuses
  };
}

export interface Participant {
  userId: string;
  displayName: string;
  country?: string;
  role: 'delegate' | 'chair';
  isInCaucus: boolean;
  canSpeak: boolean;
}

export interface Speaker {
  speakerId: string; // Could be a timestamp or order index
  userId: string;
  startTime: number;
  duration: number;
  status: 'speaking' | 'finished' | 'queued';
  queuePosition?: number; // New field for ordering in the queue
}

export interface Motion {
  motionId: string;
  proposerId: string;
  type: 'moderated_caucus' | 'unmoderated_caucus' | 'adjourn' | 'vote_on_resolution';
  topic?: string;
  duration?: number; // For caucuses
  status: 'proposed' | 'debated' | 'voting' | 'passed' | 'failed' | 'withdrawn';
  votes?: { [userId: string]: boolean }; // userId -> true (yes) / false (no)
  createdAt: number;
}

export interface RoomTimer {
  timerId: string;
  type: 'speaker' | 'caucus' | 'voting';
  duration: number;
  remainingTime: number;
  startTime: number;
  status: 'running' | 'paused' | 'finished';
  associatedUserId?: string; // For speaker timers
}
