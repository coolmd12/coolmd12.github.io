import type { Room } from '../types/committee';

export interface CommitteeQueueEntry {
  id: string;
  userId: string;
  displayName: string;
  role: 'delegate' | 'chair';
}

export function buildSpeakerQueue(entries: CommitteeQueueEntry[]) {
  return entries.map((entry, index) => ({
    ...entry,
    queued: true,
    position: index + 1,
  }));
}

export function buildCommitteeRoomDraft(input: {
  name: string;
  classroomId?: string;
  chairId: string;
  defaultSpeakerTime?: number;
  votingDuration?: number;
}): Omit<Room, 'roomId'> {
  const cleanName = input.name.trim();
  return {
    name: cleanName,
    ...(input.classroomId ? { classroomId: input.classroomId } : {}),
    currentStatus: 'open',
    chairId: input.chairId,
    createdAt: Date.now(),
    settings: {
      defaultSpeakerTime: input.defaultSpeakerTime ?? 60,
      votingDuration: input.votingDuration ?? 60,
    },
    speakerQueue: [],
  };
}
