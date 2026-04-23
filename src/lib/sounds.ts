// Lightweight sound effects using WebAudio (no external assets)
let ctx: AudioContext | null = null;
function getCtx() {
  if (!ctx) ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
  return ctx;
}

function tone(freq: number, duration: number, type: OscillatorType = "sine", gain = 0.15, when = 0) {
  const c = getCtx();
  const o = c.createOscillator();
  const g = c.createGain();
  o.type = type;
  o.frequency.setValueAtTime(freq, c.currentTime + when);
  g.gain.setValueAtTime(0, c.currentTime + when);
  g.gain.linearRampToValueAtTime(gain, c.currentTime + when + 0.01);
  g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + when + duration);
  o.connect(g).connect(c.destination);
  o.start(c.currentTime + when);
  o.stop(c.currentTime + when + duration);
}

export const sounds = {
  click() {
    try { tone(600, 0.08, "square", 0.08); } catch {}
  },
  correct() {
    try {
      tone(523.25, 0.15, "sine", 0.2, 0);
      tone(659.25, 0.15, "sine", 0.2, 0.12);
      tone(783.99, 0.3, "sine", 0.2, 0.24);
    } catch {}
  },
  wrong() {
    try {
      tone(220, 0.2, "sawtooth", 0.18, 0);
      tone(150, 0.35, "sawtooth", 0.18, 0.18);
    } catch {}
  },
  reveal() {
    try {
      tone(440, 0.1, "triangle", 0.15, 0);
      tone(660, 0.2, "triangle", 0.15, 0.08);
    } catch {}
  },
};
