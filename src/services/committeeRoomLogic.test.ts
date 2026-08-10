import { describe, expect, it } from 'vitest';
import {
  buildCommitteeRoomDraft,
  buildParticipantDraft,
  buildSpeakerQueue,
  formatSeatLabel,
  formatTimerClock,
  isRoomClosed,
  normalizeChatText,
  remainingTimerSeconds,
  resolveChatLabel,
  seatDisplayName,
  tallyVotes,
} from './committeeRoomLogic';

describe('buildSpeakerQueue', () => {
  it('resolves labels from participants', () => {
    const queue = buildSpeakerQueue(
      [{ userId: 'u1' }, { userId: 'u2' }],
      [
        {
          userId: 'u1',
          displayName: 'France',
          role: 'delegate',
          country: 'France',
          raisedPlacard: false,
          joinedAt: 1,
        },
        {
          userId: 'u2',
          displayName: 'Jordan Kim',
          role: 'chair',
          raisedPlacard: false,
          joinedAt: 1,
        },
      ],
    );

    expect(queue).toEqual([
      {
        id: 'u1',
        userId: 'u1',
        displayName: 'France',
        role: 'delegate',
        queued: true,
        position: 1,
      },
      {
        id: 'u2',
        userId: 'u2',
        displayName: 'Jordan Kim',
        role: 'chair',
        queued: true,
        position: 2,
      },
    ]);
  });
});

describe('formatSeatLabel', () => {
  it('prefixes Chair or Delegate', () => {
    expect(formatSeatLabel('chair', 'Ms. Rivera')).toBe('Chair · Ms. Rivera');
    expect(formatSeatLabel('delegate', 'Brazil')).toBe('Delegate · Brazil');
  });
});

describe('seatDisplayName', () => {
  it('uses country for delegates and typed chair name for chairs', () => {
    expect(
      seatDisplayName({ role: 'delegate', country: ' Brazil ', profileDisplayName: 'Ava' }),
    ).toBe('Brazil');
    expect(
      seatDisplayName({
        role: 'chair',
        chairName: ' Chair Rivera ',
        profileDisplayName: 'Ava Patel',
      }),
    ).toBe('Chair Rivera');
  });
});

describe('buildCommitteeRoomDraft', () => {
  it('creates an open room with optional meeting link', () => {
    const room = buildCommitteeRoomDraft({
      name: ' GA First Committee ',
      createdBy: 'user-1',
      meetingLink: ' https://meet.google.com/abc ',
    });

    expect(room).toMatchObject({
      name: 'GA First Committee',
      createdBy: 'user-1',
      chairId: '',
      meetingLink: 'https://meet.google.com/abc',
      currentStatus: 'open',
      speakerQueue: [],
      speechTimeBank: { totalUnusedSeconds: 0, entries: [] },
      activeMotionId: null,
      activeTimer: null,
      closedAt: null,
      closedBy: null,
      settings: { defaultSpeakerTime: 60, votingDuration: 60 },
    });
  });
});

describe('tallyVotes', () => {
  it('counts yes and no', () => {
    expect(tallyVotes({ a: 'yes', b: 'no', c: 'yes' })).toEqual({ yes: 2, no: 1, total: 3 });
  });
});

describe('buildParticipantDraft', () => {
  it('stores country as displayName for delegates', () => {
    expect(
      buildParticipantDraft({
        userId: 'u1',
        role: 'delegate',
        profileDisplayName: 'Ava',
        country: 'Kenya',
      }),
    ).toMatchObject({
      userId: 'u1',
      role: 'delegate',
      displayName: 'Kenya',
      country: 'Kenya',
      raisedPlacard: false,
    });
  });

  it('uses typed chair name', () => {
    expect(
      buildParticipantDraft({
        userId: 'u2',
        role: 'chair',
        profileDisplayName: 'Ava',
        chairName: 'Ms. Rivera',
      }),
    ).toMatchObject({
      userId: 'u2',
      role: 'chair',
      displayName: 'Ms. Rivera',
      raisedPlacard: false,
    });
  });
});

describe('timer helpers', () => {
  it('formats clock and remaining time', () => {
    expect(formatTimerClock(125)).toBe('2:05');
    expect(
      remainingTimerSeconds({
        timerId: 't1',
        type: 'speaker',
        duration: 60,
        remainingTime: 60,
        startTime: 1_000,
        status: 'running',
      }, 1_000 + 15_000),
    ).toBe(45);
  });
});

describe('chat helpers', () => {
  it('normalizes chat text', () => {
    expect(normalizeChatText('  hello  ')).toBe('hello');
    expect(() => normalizeChatText('   ')).toThrow(/empty/i);
    expect(() => normalizeChatText('x'.repeat(1001))).toThrow(/too many characters/i);
  });

  it('resolves live seat labels then falls back', () => {
    const participants = [
      {
        userId: 'u1',
        displayName: 'USA',
        role: 'delegate' as const,
        country: 'USA',
        raisedPlacard: false,
        joinedAt: 1,
      },
    ];
    expect(
      resolveChatLabel({ userId: 'u1', displayName: 'Delegate · France' }, participants),
    ).toBe('Delegate · USA');
    expect(
      resolveChatLabel({ userId: 'gone', displayName: 'Chair · Sam' }, participants),
    ).toBe('Chair · Sam');
  });
});

describe('room closed helper', () => {
  it('treats missing closedAt as open', () => {
    expect(isRoomClosed({ closedAt: null })).toBe(false);
    expect(isRoomClosed({ closedAt: undefined })).toBe(false);
    expect(isRoomClosed({ closedAt: Date.now() })).toBe(true);
  });
});
