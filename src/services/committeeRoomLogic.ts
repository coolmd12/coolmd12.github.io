import type {
  Motion,
  Participant,
  Room,
  RoomTimer,
  SessionRole,
  SpeakerQueueEntry,
} from '../types/committee';

export interface CommitteeQueueEntry extends SpeakerQueueEntry {
  id: string;
  displayName: string;
  role: SessionRole;
  queued: boolean;
  position: number;
}

export function buildSpeakerQueue(
  entries: SpeakerQueueEntry[],
  participants: Participant[] = [],
): CommitteeQueueEntry[] {
  return entries.map((entry, index) => {
    const person = participants.find((p) => p.userId === entry.userId);
    return {
      id: entry.userId,
      userId: entry.userId,
      displayName: person?.displayName ?? 'Unknown',
      role: person?.role ?? 'delegate',
      queued: true,
      position: index + 1,
    };
  });
}

/** UI label: "Chair · Name" or "Delegate · Country". */
export function formatSeatLabel(role: SessionRole, displayName: string): string {
  const prefix = role === 'chair' ? 'Chair' : 'Delegate';
  return `${prefix} · ${displayName.trim()}`;
}

export function seatDisplayName(input: {
  role: SessionRole;
  country?: string;
  chairName?: string;
  profileDisplayName: string;
}): string {
  if (input.role === 'delegate') {
    return (input.country ?? '').trim();
  }
  return (input.chairName ?? input.profileDisplayName).trim();
}

export function buildCommitteeRoomDraft(input: {
  name: string;
  createdBy: string;
  classroomId?: string;
  meetingLink?: string;
  defaultSpeakerTime?: number;
  votingDuration?: number;
}): Omit<Room, 'roomId'> {
  const cleanName = input.name.trim();
  const meetingLink = input.meetingLink?.trim() ?? '';
  return {
    name: cleanName,
    ...(input.classroomId ? { classroomId: input.classroomId } : {}),
    ...(meetingLink ? { meetingLink } : {}),
    createdBy: input.createdBy,
    chairId: '',
    currentStatus: 'open',
    createdAt: Date.now(),
    settings: {
      defaultSpeakerTime: input.defaultSpeakerTime ?? 60,
      votingDuration: input.votingDuration ?? 60,
    },
    speakerQueue: [],
    speechTimeBank: { totalUnusedSeconds: 0, entries: [] },
    activeMotionId: null,
    activeTimer: null,
  };
}

export function motionTypeLabel(type: Motion['type']): string {
  switch (type) {
    case 'moderated_caucus':
      return 'Moderated caucus';
    case 'unmoderated_caucus':
      return 'Unmoderated caucus';
    case 'adjourn':
      return 'Adjourn';
    default:
      return type;
  }
}

export function tallyVotes(votes: Motion['votes']): { yes: number; no: number; total: number } {
  let yes = 0;
  let no = 0;
  for (const v of Object.values(votes ?? {})) {
    if (v === 'yes') yes += 1;
    if (v === 'no') no += 1;
  }
  return { yes, no, total: yes + no };
}

export function buildParticipantDraft(input: {
  userId: string;
  role: SessionRole;
  profileDisplayName: string;
  chairName?: string;
  country?: string;
}): Omit<Participant, 'userId'> & { userId: string } {
  const displayName = seatDisplayName({
    role: input.role,
    country: input.country,
    chairName: input.chairName,
    profileDisplayName: input.profileDisplayName,
  });
  if (!displayName) {
    throw new Error(
      input.role === 'delegate' ? 'Enter a country for your seat.' : 'Enter a chair name.',
    );
  }
  return {
    userId: input.userId,
    displayName,
    role: input.role,
    ...(input.role === 'delegate' ? { country: displayName } : {}),
    raisedPlacard: false,
    joinedAt: Date.now(),
  };
}

export function remainingTimerSeconds(timer: RoomTimer | null | undefined, now = Date.now()): number {
  if (!timer) return 0;
  if (timer.status === 'paused' || timer.status === 'finished') {
    return Math.max(0, timer.remainingTime);
  }
  const elapsed = Math.floor((now - timer.startTime) / 1000);
  return Math.max(0, timer.remainingTime - elapsed);
}

export function formatTimerClock(totalSeconds: number): string {
  const s = Math.max(0, Math.floor(totalSeconds));
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m}:${r.toString().padStart(2, '0')}`;
}

export function buildSpeakerTimer(input: {
  durationSeconds: number;
  associatedUserId?: string;
}): RoomTimer {
  return {
    timerId: `t-${Date.now()}`,
    type: 'speaker',
    duration: input.durationSeconds,
    remainingTime: input.durationSeconds,
    startTime: Date.now(),
    status: 'running',
    ...(input.associatedUserId ? { associatedUserId: input.associatedUserId } : {}),
  };
}
