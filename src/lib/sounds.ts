// ── Discord-style UI sounds via Web Audio API ───────────────
let ctx: AudioContext | null = null;

function getCtx(): AudioContext {
  if (!ctx) ctx = new AudioContext();
  if (ctx.state === 'suspended') ctx.resume();
  return ctx;
}

function playTone(freq: number, duration: number, type: OscillatorType = 'sine', gain = 0.18) {
  const c = getCtx();
  const osc = c.createOscillator();
  const g = c.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  g.gain.setValueAtTime(gain, c.currentTime);
  g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + duration);
  osc.connect(g).connect(c.destination);
  osc.start(c.currentTime);
  osc.stop(c.currentTime + duration);
}

/** Two ascending tones — join / connect */
export function playJoinSound() {
  playTone(600, 0.12, 'sine', 0.15);
  setTimeout(() => playTone(900, 0.15, 'sine', 0.15), 100);
}

/** Two descending tones — leave / disconnect */
export function playLeaveSound() {
  playTone(800, 0.12, 'sine', 0.15);
  setTimeout(() => playTone(500, 0.18, 'sine', 0.15), 100);
}

/** Short click — mute toggle */
export function playMuteSound() {
  playTone(480, 0.06, 'square', 0.08);
}

/** Slightly higher click — unmute toggle */
export function playUnmuteSound() {
  playTone(640, 0.06, 'square', 0.08);
}

/** Low click — deafen toggle */
export function playDeafenSound() {
  playTone(350, 0.08, 'square', 0.07);
}
