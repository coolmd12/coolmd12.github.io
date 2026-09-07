/**
 * GoMUN Practice Script — educational reference aligned with the live procedure floor.
 * Not official conference Rules of Procedure. Conference RoP and academic-honesty policies control at real events.
 */

export type MotionScriptKind = 'in_room' | 'reference_only';

export interface MotionScriptEntry {
  id: string;
  name: string;
  kind: MotionScriptKind;
  who: string;
  vote: string;
  phrasing: string;
  gomunTip: string;
}

export const MOTION_SCRIPT_DISCLAIMER = `This page is a GoMUN practice aid for club and classroom sessions. It is not the official Rules of Procedure for any conference, and it is not legal advice. At real Model UN events, that conference’s RoP, secretariat rulings, and academic-honesty / AI policies control. Many conferences prohibit generative AI during committee and/or for writing position papers and other submissions — always follow your conference and school rules. GoMUN does not authorize using this site to cheat, plagiarize, or violate those policies.`;

/** Motions the live GoMUN room can propose today. */
export const GOMUN_FLOOR_MOTIONS: MotionScriptEntry[] = [
  {
    id: 'moderated_caucus',
    name: 'Moderated caucus',
    kind: 'in_room',
    who: 'Any delegate may propose; chair opens the vote and, if passed, runs speaking time.',
    vote: 'Procedural yes / no (no abstain in GoMUN).',
    phrasing:
      '“Motion for a moderated caucus of [total time] with [speaker time] speaking time on the topic of [topic].”',
    gomunTip:
      'In GoMUN: propose with total time, per-speaker seconds, and topic. Chair opens voting, then starts the timer manually after a pass — nothing auto-starts.',
  },
  {
    id: 'unmoderated_caucus',
    name: 'Unmoderated caucus',
    kind: 'in_room',
    who: 'Any delegate may propose; chair opens the vote.',
    vote: 'Procedural yes / no (no abstain in GoMUN).',
    phrasing: '“Motion for an unmoderated caucus of [total time].”',
    gomunTip:
      'In GoMUN: propose with a total duration. Use Meet/Zoom (or later in-app calling) for free discussion; the floor is a procedure dashboard, not a video call.',
  },
  {
    id: 'adjourn',
    name: 'Adjourn',
    kind: 'in_room',
    who: 'Any delegate may propose; chair opens the vote.',
    vote: 'Procedural yes / no (no abstain in GoMUN).',
    phrasing: '“Motion to adjourn.”',
    gomunTip:
      'In GoMUN: adjourn is a motion like the others. Ending debate for a break without closing the room is usually Chair → End session (recess). Close room is separate and removes the room from live lists.',
  },
];

/** Common MUN points — educational only; not proposable in the GoMUN room yet. */
export const REFERENCE_ONLY_POINTS: MotionScriptEntry[] = [
  {
    id: 'point_of_order',
    name: 'Point of order',
    kind: 'reference_only',
    who: 'Typically any delegate when procedure may have been misapplied (exact rules vary by conference).',
    vote: 'Usually ruled by the chair; not a substantive vote.',
    phrasing: '“Point of order — [brief reason].”',
    gomunTip:
      'Not available as an in-room action in GoMUN yet. Use chat or voice to flag procedure during practice if needed.',
  },
  {
    id: 'point_of_inquiry',
    name: 'Point of parliamentary inquiry',
    kind: 'reference_only',
    who: 'Typically any delegate seeking clarification of procedure (wording varies by RoP).',
    vote: 'Answered by the chair; not a vote.',
    phrasing: '“Point of parliamentary inquiry — [question about procedure].”',
    gomunTip:
      'Not available as an in-room action in GoMUN yet. This page is for learning the idea only.',
  },
];

export const GOMUN_FLOOR_ACTIONS = [
  {
    id: 'placard',
    name: 'Raise placard → recognize',
    detail:
      'Delegates raise a placard; the chair recognizes speakers onto the live speaker queue. Speaking time uses the chair-controlled timer.',
  },
  {
    id: 'gavel',
    name: 'Gavel',
    detail:
      'Chair-only manual tap, synced so the room can hear it (after Enable sound). No automatic time-warning gavels.',
  },
] as const;
