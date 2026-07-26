import { describe, expect, it } from 'vitest';
import { buildCommitteeRoomDraft, buildSpeakerQueue } from './committeeRoomLogic';

describe('buildSpeakerQueue', () => {
  it('adds queue positions in the order provided', () => {
    const queue = buildSpeakerQueue([
      { id: '1', userId: 'u1', displayName: 'Ava', role: 'delegate' },
      { id: '2', userId: 'u2', displayName: 'Ben', role: 'delegate' },
    ]);

    expect(queue).toEqual([
      { id: '1', userId: 'u1', displayName: 'Ava', role: 'delegate', queued: true, position: 1 },
      { id: '2', userId: 'u2', displayName: 'Ben', role: 'delegate', queued: true, position: 2 },
    ]);
  });
});

describe('buildCommitteeRoomDraft', () => {
  it('creates a classroom-linked room payload with defaults', () => {
    const room = buildCommitteeRoomDraft({
      name: ' Period 3 ',
      classroomId: 'class-1',
      chairId: 'teacher-1',
    });

    expect(room).toMatchObject({
      name: 'Period 3',
      classroomId: 'class-1',
      chairId: 'teacher-1',
      currentStatus: 'open',
      speakerQueue: [],
      settings: { defaultSpeakerTime: 60, votingDuration: 60 },
    });
  });
});
