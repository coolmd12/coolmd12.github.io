/** Short wooden-tap style clicks via Web Audio (no asset files). */

let audioCtx: AudioContext | null = null;

function getCtx(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  const AC =
    window.AudioContext ||
    (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AC) return null;
  if (!audioCtx) audioCtx = new AC();
  return audioCtx;
}

/** Call from a click/submit so the browser allows later gavel playback. */
export async function unlockCommitteeAudio(): Promise<void> {
  const ctx = getCtx();
  if (!ctx) return;
  if (ctx.state === 'suspended') {
    await ctx.resume();
  }
}

function playOneTap(ctx: AudioContext, when: number) {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = 'triangle';
  osc.frequency.setValueAtTime(180, when);
  osc.frequency.exponentialRampToValueAtTime(60, when + 0.08);
  gain.gain.setValueAtTime(0.0001, when);
  gain.gain.exponentialRampToValueAtTime(0.45, when + 0.008);
  gain.gain.exponentialRampToValueAtTime(0.0001, when + 0.12);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(when);
  osc.stop(when + 0.14);
}

/** Play 1 or 2 gavel taps locally. */
export async function playGavelTaps(taps: 1 | 2): Promise<void> {
  const ctx = getCtx();
  if (!ctx) return;
  if (ctx.state === 'suspended') {
    await ctx.resume();
  }
  const start = ctx.currentTime + 0.02;
  playOneTap(ctx, start);
  if (taps === 2) {
    playOneTap(ctx, start + 0.22);
  }
}
