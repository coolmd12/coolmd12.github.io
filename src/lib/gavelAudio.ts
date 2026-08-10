/** Committee-room sounds — gavel uses a real wooden sample; timers stay synth. */

const GAVEL_SAMPLE_URL = `${import.meta.env.BASE_URL}sounds/gavel-tap.wav`;

let audioCtx: AudioContext | null = null;
let unlocked = false;
let gavelBuffer: AudioBuffer | null = null;
let gavelLoadPromise: Promise<AudioBuffer | null> | null = null;

type UnlockListener = (ready: boolean) => void;
const unlockListeners = new Set<UnlockListener>();

function getCtx(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  const AC =
    window.AudioContext ||
    (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AC) return null;
  if (!audioCtx) audioCtx = new AC();
  return audioCtx;
}

export function isCommitteeAudioUnlocked(): boolean {
  return unlocked;
}

export function subscribeCommitteeAudioUnlock(listener: UnlockListener): () => void {
  unlockListeners.add(listener);
  listener(unlocked);
  return () => {
    unlockListeners.delete(listener);
  };
}

function notifyUnlock() {
  for (const listener of unlockListeners) listener(unlocked);
}

async function loadGavelBuffer(ctx: AudioContext): Promise<AudioBuffer | null> {
  if (gavelBuffer) return gavelBuffer;
  if (!gavelLoadPromise) {
    gavelLoadPromise = (async () => {
      try {
        const res = await fetch(GAVEL_SAMPLE_URL);
        if (!res.ok) throw new Error(`Gavel sample HTTP ${res.status}`);
        const raw = await res.arrayBuffer();
        const decoded = await ctx.decodeAudioData(raw.slice(0));
        gavelBuffer = decoded;
        return decoded;
      } catch (err) {
        console.warn('Could not load gavel sample', err);
        gavelLoadPromise = null;
        return null;
      }
    })();
  }
  return gavelLoadPromise;
}

/** Call from a click/key so the browser allows later playback. */
export async function unlockCommitteeAudio(): Promise<boolean> {
  const ctx = getCtx();
  if (!ctx) return false;
  try {
    if (ctx.state === 'suspended') {
      await ctx.resume();
    }
    const buffer = ctx.createBuffer(1, 1, ctx.sampleRate);
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.connect(ctx.destination);
    source.start(0);
    await loadGavelBuffer(ctx);
    unlocked = ctx.state === 'running';
    notifyUnlock();
    return unlocked;
  } catch {
    unlocked = false;
    notifyUnlock();
    return false;
  }
}

function playBuffer(ctx: AudioContext, buffer: AudioBuffer, when: number, gainValue = 1) {
  const source = ctx.createBufferSource();
  const gain = ctx.createGain();
  source.buffer = buffer;
  gain.gain.setValueAtTime(gainValue, when);
  source.connect(gain);
  gain.connect(ctx.destination);
  source.start(when);
}

/** Fallback if the sample fails to load — brighter than the old muffled synth. */
function playSynthWoodTap(ctx: AudioContext, when: number) {
  const noiseDur = 0.04;
  const frames = Math.max(1, Math.floor(ctx.sampleRate * noiseDur));
  const noiseBuf = ctx.createBuffer(1, frames, ctx.sampleRate);
  const data = noiseBuf.getChannelData(0);
  for (let i = 0; i < frames; i += 1) {
    data[i] = (Math.random() * 2 - 1) * Math.exp(-i / frames * 6);
  }
  playBuffer(ctx, noiseBuf, when, 0.35);

  const partials: Array<[number, number, number]> = [
    [920, 0.45, 0.28],
    [1480, 0.28, 0.22],
    [2100, 0.16, 0.16],
    [110, 0.2, 0.12],
  ];
  for (const [freq, amp, len] of partials) {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, when);
    gain.gain.setValueAtTime(0.001, when);
    gain.gain.linearRampToValueAtTime(amp, when + 0.004);
    gain.gain.exponentialRampToValueAtTime(0.001, when + len);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(when);
    osc.stop(when + len + 0.02);
  }
}

/** Play 1 or 2 wooden gavel taps (real sample). */
export async function playGavelTaps(taps: 1 | 2 = 1): Promise<void> {
  const ctx = getCtx();
  if (!ctx) return;
  if (ctx.state === 'suspended') {
    await ctx.resume();
  }
  if (ctx.state !== 'running') return;
  unlocked = true;
  notifyUnlock();

  const buffer = await loadGavelBuffer(ctx);
  const start = ctx.currentTime + 0.01;
  const playOne = (when: number) => {
    if (buffer) playBuffer(ctx, buffer, when, 1);
    else playSynthWoodTap(ctx, when);
  };
  playOne(start);
  if (taps === 2) playOne(start + 0.22);
}

/** Soft chime when the speaker timer hits zero. */
export async function playTimerEndChime(): Promise<void> {
  const ctx = getCtx();
  if (!ctx) return;
  if (ctx.state === 'suspended') {
    await ctx.resume();
  }
  if (ctx.state !== 'running') return;
  unlocked = true;
  notifyUnlock();

  const start = ctx.currentTime + 0.02;
  const tones = [523.25, 659.25];
  tones.forEach((freq, i) => {
    const when = start + i * 0.18;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, when);
    gain.gain.setValueAtTime(0.001, when);
    gain.gain.linearRampToValueAtTime(0.28, when + 0.02);
    gain.gain.linearRampToValueAtTime(0.001, when + 0.2);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(when);
    osc.stop(when + 0.22);
  });
}

/** Short warning tick near the end of a speech (e.g. 10s left). */
export async function playTimerWarningTick(): Promise<void> {
  const ctx = getCtx();
  if (!ctx) return;
  if (ctx.state === 'suspended') {
    await ctx.resume();
  }
  if (ctx.state !== 'running') return;
  unlocked = true;
  notifyUnlock();

  const when = ctx.currentTime + 0.02;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(880, when);
  gain.gain.setValueAtTime(0.001, when);
  gain.gain.linearRampToValueAtTime(0.22, when + 0.01);
  gain.gain.linearRampToValueAtTime(0.001, when + 0.08);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(when);
  osc.stop(when + 0.1);
}
