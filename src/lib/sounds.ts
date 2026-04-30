// Sound engine: WebAudio fallbacks + custom HTMLAudio overrides.
// Single background track at a time, non-overlapping ticking.

let ctx: AudioContext | null = null;
function getCtx() {
  if (!ctx) ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
  return ctx;
}

let masterVolume = 0.8;
export function setMasterVolume(v: number) {
  masterVolume = Math.max(0, Math.min(1, v));
  if (tickingMaster) tickingMaster.gain.value = masterVolume;
  if (currentBg) currentBg.volume = masterVolume * currentBgScale;
  if (customTickAudio) customTickAudio.volume = masterVolume;
}

// Ducking: temporarily lower background music volume for sound effects
let currentBgScale = 0.5;
let duckTimer: number | null = null;
export function duckBackground(duration = 600, scale = 0.15) {
  if (!currentBg) return;
  if (duckTimer != null) {
    window.clearTimeout(duckTimer);
    duckTimer = null;
  }
  try {
    currentBg.volume = masterVolume * scale;
  } catch {}
  duckTimer = window.setTimeout(() => {
    if (currentBg) {
      try {
        currentBg.volume = masterVolume * currentBgScale;
      } catch {}
    }
    duckTimer = null;
  }, duration);
}
export function getMasterVolume() {
  return masterVolume;
}

// ---- Custom sound registry (data URLs from uploads)
export type SoundKey =
  | "homeMusic"
  | "questionMusic"
  | "ticking"
  | "correct"
  | "wrong";

let customSounds: Partial<Record<SoundKey, string>> = {};
export function setCustomSounds(map: Partial<Record<SoundKey, string>>) {
  customSounds = { ...map };
  // If ticking is currently playing and a custom is set/cleared, restart loop
  if (tickingTimer != null || customTickAudio) {
    sounds.stopTicking();
    sounds.startTicking();
  }
}

function playCustom(key: SoundKey, loop = false, volumeScale = 1): HTMLAudioElement | null {
  const src = customSounds[key];
  if (!src) return null;
  try {
    const a = new Audio(src);
    a.loop = loop;
    a.volume = Math.max(0, Math.min(1, masterVolume * volumeScale));
    void a.play().catch(() => {});
    return a;
  } catch {
    return null;
  }
}

// ---- Background music (single track)
let currentBg: HTMLAudioElement | null = null;
let currentBgKey: SoundKey | null = null;

export function playBackground(key: "homeMusic" | "questionMusic") {
  if (currentBgKey === key && currentBg) return; // already playing
  stopBackground();
  const src = customSounds[key];
  if (!src) return; // no custom track => silent (no built-in music)
  try {
    const a = new Audio(src);
    a.loop = true;
    a.volume = masterVolume * currentBgScale;
    void a.play().catch(() => {});
    currentBg = a;
    currentBgKey = key;
  } catch {}
}

export function stopBackground() {
  if (currentBg) {
    try {
      currentBg.pause();
      currentBg.currentTime = 0;
    } catch {}
    currentBg = null;
    currentBgKey = null;
  }
}

// ---- WebAudio tone helper
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

// ---- Ticking
let tickingTimer: number | null = null;
let tickingMaster: GainNode | null = null;
let customTickAudio: HTMLAudioElement | null = null;

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
    duckBackground(800, 0.12);
    if (playCustom("correct")) return;
    try {
      tone(523.25, 0.15, "sine", 0.25, 0);
      tone(659.25, 0.15, "sine", 0.25, 0.12);
      tone(783.99, 0.3, "sine", 0.25, 0.24);
    } catch {}
  },
  wrong() {
    duckBackground(700, 0.15);
    if (playCustom("wrong")) return;
    try {
      tone(220, 0.2, "sawtooth", 0.22, 0);
      tone(150, 0.35, "sawtooth", 0.22, 0.18);
    } catch {}
  },
  reveal() {
    duckBackground(500, 0.15);
    try {
      tone(440, 0.1, "triangle", 0.18, 0);
      tone(660, 0.2, "triangle", 0.18, 0.08);
    } catch {}
  },
  },
  startTicking() {
    if (tickingTimer != null || customTickAudio) return;
    if (customSounds.ticking) {
      try {
        const a = new Audio(customSounds.ticking);
        a.loop = true;
        a.volume = masterVolume;
        void a.play().catch(() => {});
        customTickAudio = a;
        return;
      } catch {}
    }
    playTickOnce();
    tickingTimer = window.setInterval(playTickOnce, 1000);
  },
  stopTicking() {
    if (tickingTimer != null) {
      window.clearInterval(tickingTimer);
      tickingTimer = null;
    }
    if (customTickAudio) {
      try {
        customTickAudio.pause();
        customTickAudio.currentTime = 0;
      } catch {}
      customTickAudio = null;
    }
    if (tickingMaster) {
      try {
        const c = getCtx();
        tickingMaster.gain.cancelScheduledValues(c.currentTime);
        tickingMaster.gain.setValueAtTime(0, c.currentTime);
        // reset for next start
        window.setTimeout(() => {
          if (tickingMaster) tickingMaster.gain.setValueAtTime(masterVolume, getCtx().currentTime);
        }, 100);
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
