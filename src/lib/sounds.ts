// Lightweight sound effects using WebAudio (no external assets)
let ctx: AudioContext | null = null;
function getCtx() {
  if (!ctx) ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
  return ctx;
}

// Master volume (0..1). Applied to every sound.
let masterVolume = 0.8;
export function setMasterVolume(v: number) {
  masterVolume = Math.max(0, Math.min(1, v));
  if (tickingMaster) tickingMaster.gain.value = masterVolume;
}
export function getMasterVolume() {
  return masterVolume;
}

function tone(freq: number, duration: number, type: OscillatorType = "sine", gain = 0.15, when = 0) {
  const c = getCtx();
  const o = c.createOscillator();
  const g = c.createGain();
  o.type = type;
  o.frequency.setValueAtTime(freq, c.currentTime + when);
  g.gain.setValueAtTime(0, c.currentTime + when);
  g.gain.linearRampToValueAtTime(gain * masterVolume, c.currentTime + when + 0.01);
  g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + when + duration);
  o.connect(g).connect(c.destination);
  o.start(c.currentTime + when);
  o.stop(c.currentTime + when + duration);
}

// ---- Ticking loop (non-overlapping)
let tickingTimer: number | null = null;
let tickingMaster: GainNode | null = null;

function playTickOnce() {
  try {
    const c = getCtx();
    const o = c.createOscillator();
    const g = c.createGain();
    o.type = "square";
    o.frequency.setValueAtTime(1200, c.currentTime);
    g.gain.setValueAtTime(0, c.currentTime);
    g.gain.linearRampToValueAtTime(0.05, c.currentTime + 0.005);
    g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.05);
    o.connect(g);
    if (!tickingMaster) {
      tickingMaster = c.createGain();
      tickingMaster.gain.value = masterVolume;
      tickingMaster.connect(c.destination);
    }
    g.connect(tickingMaster);
    o.start();
    o.stop(c.currentTime + 0.06);
  } catch {}
}

export const sounds = {
  click() {
    try { tone(600, 0.08, "square", 0.08); } catch {}
  },
  correct() {
    try {
      tone(523.25, 0.15, "sine", 0.25, 0);
      tone(659.25, 0.15, "sine", 0.25, 0.12);
      tone(783.99, 0.3, "sine", 0.25, 0.24);
    } catch {}
  },
  wrong() {
    try {
      tone(220, 0.2, "sawtooth", 0.22, 0);
      tone(150, 0.35, "sawtooth", 0.22, 0.18);
    } catch {}
  },
  reveal() {
    try {
      tone(440, 0.1, "triangle", 0.18, 0);
      tone(660, 0.2, "triangle", 0.18, 0.08);
    } catch {}
  },
  startTicking() {
    if (tickingTimer != null) return; // prevent overlap
    playTickOnce();
    tickingTimer = window.setInterval(playTickOnce, 1000);
  },
  stopTicking() {
    if (tickingTimer != null) {
      window.clearInterval(tickingTimer);
      tickingTimer = null;
    }
    if (tickingMaster) {
      try {
        const c = getCtx();
        tickingMaster.gain.cancelScheduledValues(c.currentTime);
        tickingMaster.gain.setValueAtTime(0, c.currentTime);
      } catch {}
    }
  },
  timeout() {
    try {
      tone(330, 0.25, "sawtooth", 0.2, 0);
      tone(220, 0.5, "sawtooth", 0.2, 0.2);
    } catch {}
  },
};
