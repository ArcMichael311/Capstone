// Tiny synthesized sound effects for the student games (Web Audio API, no audio files).
// Call playSound('name') from game events; the 🔊/🔇 toggle mutes them all.

const MUTE_KEY = 'phonexis_sfx_muted';
const MUTE_EVENT = 'phonexis:sfx-muted-change';
const MASTER_VOLUME = 0.35;

let audioContext = null;
let muted = false;

try {
  muted = window.localStorage.getItem(MUTE_KEY) === 'true';
} catch (error) {
  // storage can be unavailable (private mode); default to sound on
}

const getContext = () => {
  if (typeof window === 'undefined') return null;
  const AudioContextConstructor = window.AudioContext || window.webkitAudioContext;
  if (!AudioContextConstructor) return null;
  if (!audioContext) {
    audioContext = new AudioContextConstructor();
  }
  if (audioContext.state === 'suspended') {
    audioContext.resume().catch(() => {});
  }
  return audioContext;
};

// One oscillator note. `at` is seconds from now; `slideTo` glides the pitch.
const tone = (ctx, { freq, at = 0, dur = 0.15, type = 'sine', volume = 0.6, slideTo = null }) => {
  const start = ctx.currentTime + at;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, start);
  if (slideTo) {
    osc.frequency.exponentialRampToValueAtTime(slideTo, start + dur);
  }
  gain.gain.setValueAtTime(0.0001, start);
  gain.gain.exponentialRampToValueAtTime(volume * MASTER_VOLUME, start + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.0001, start + dur);
  osc.connect(gain).connect(ctx.destination);
  osc.start(start);
  osc.stop(start + dur + 0.02);
};

// A burst of filtered noise for explosions, pops and whooshes.
const noise = (ctx, { at = 0, dur = 0.3, volume = 0.5, filterFrom = 2000, filterTo = 200 }) => {
  const start = ctx.currentTime + at;
  const length = Math.max(1, Math.floor(ctx.sampleRate * dur));
  const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < length; i += 1) {
    data[i] = Math.random() * 2 - 1;
  }
  const source = ctx.createBufferSource();
  source.buffer = buffer;
  const filter = ctx.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.setValueAtTime(filterFrom, start);
  filter.frequency.exponentialRampToValueAtTime(filterTo, start + dur);
  const gain = ctx.createGain();
  gain.gain.setValueAtTime(volume * MASTER_VOLUME, start);
  gain.gain.exponentialRampToValueAtTime(0.0001, start + dur);
  source.connect(filter).connect(gain).connect(ctx.destination);
  source.start(start);
  source.stop(start + dur + 0.02);
};

const arpeggio = (ctx, notes, { step = 0.1, dur = 0.18, type = 'triangle', volume = 0.55, at = 0 } = {}) => {
  notes.forEach((freq, index) => tone(ctx, { freq, at: at + index * step, dur, type, volume }));
};

const SOUNDS = {
  // UI
  click: (ctx) => tone(ctx, { freq: 660, dur: 0.06, type: 'square', volume: 0.25 }),
  start: (ctx) => arpeggio(ctx, [392, 523, 659, 784], { step: 0.07, dur: 0.14 }),
  countdown: (ctx) => tone(ctx, { freq: 523, dur: 0.12, type: 'square', volume: 0.35 }),
  go: (ctx) => tone(ctx, { freq: 1047, dur: 0.3, type: 'square', volume: 0.35 }),
  whoosh: (ctx) => noise(ctx, { dur: 0.35, volume: 0.35, filterFrom: 400, filterTo: 3000 }),

  // Answers
  correct: (ctx) => arpeggio(ctx, [784, 1175], { step: 0.07, dur: 0.14, volume: 0.45 }),
  wrong: (ctx) => {
    tone(ctx, { freq: 220, dur: 0.18, type: 'sawtooth', volume: 0.3 });
    tone(ctx, { freq: 165, at: 0.12, dur: 0.25, type: 'sawtooth', volume: 0.3 });
  },

  // Combat
  hit: (ctx) => {
    tone(ctx, { freq: 880, dur: 0.12, type: 'square', volume: 0.3, slideTo: 220 });
    noise(ctx, { dur: 0.12, volume: 0.35, filterFrom: 4000, filterTo: 600 });
  },
  hurt: (ctx) => {
    tone(ctx, { freq: 300, dur: 0.3, type: 'sawtooth', volume: 0.35, slideTo: 90 });
    noise(ctx, { dur: 0.2, volume: 0.3, filterFrom: 1200, filterTo: 150 });
  },
  explosion: (ctx) => {
    noise(ctx, { dur: 0.7, volume: 0.7, filterFrom: 3000, filterTo: 60 });
    tone(ctx, { freq: 120, dur: 0.5, type: 'sine', volume: 0.6, slideTo: 40 });
  },
  // Cartoon "poof" + boing, then a happy jingle (no explosion).
  enemyDefeated: (ctx) => {
    noise(ctx, { dur: 0.25, volume: 0.35, filterFrom: 800, filterTo: 5000 });
    tone(ctx, { freq: 200, at: 0.05, dur: 0.3, type: 'sine', volume: 0.5, slideTo: 900 });
    arpeggio(ctx, [784, 988, 1175, 1568], { at: 0.35, step: 0.08, dur: 0.16, type: 'square', volume: 0.28 });
    arpeggio(ctx, [1175, 1568], { at: 0.72, step: 0.12, dur: 0.3, type: 'triangle', volume: 0.45 });
  },

  // Rewards
  coin: (ctx) => arpeggio(ctx, [988, 1319], { step: 0.06, dur: 0.12, type: 'square', volume: 0.3 }),
  pop: (ctx) => {
    noise(ctx, { dur: 0.08, volume: 0.6, filterFrom: 6000, filterTo: 1500 });
    tone(ctx, { freq: 600, dur: 0.1, type: 'sine', volume: 0.45, slideTo: 1400 });
  },
  sparkle: (ctx) => arpeggio(ctx, [1319, 1568, 2093], { step: 0.05, dur: 0.12, type: 'sine', volume: 0.3 }),
  powerUp: (ctx) => tone(ctx, { freq: 330, dur: 0.45, type: 'triangle', volume: 0.45, slideTo: 1320 }),
  heal: (ctx) => arpeggio(ctx, [523, 659, 784], { step: 0.08, dur: 0.2, type: 'sine', volume: 0.4 }),
  combo: (ctx) => arpeggio(ctx, [659, 784, 988, 1319], { step: 0.05, dur: 0.12, type: 'square', volume: 0.3 }),
  levelUp: (ctx) => arpeggio(ctx, [523, 659, 784, 1047, 1319], { step: 0.08, dur: 0.22, volume: 0.5 }),

  // Endings
  victory: (ctx) => {
    arpeggio(ctx, [523, 523, 523, 659], { step: 0.12, dur: 0.14, type: 'square', volume: 0.35 });
    arpeggio(ctx, [784, 1047], { at: 0.55, step: 0.18, dur: 0.45, type: 'triangle', volume: 0.5 });
  },
  // Soft cartoon "bonk", a falling slide-whistle, then two gentle "aww" notes.
  lose: (ctx) => {
    tone(ctx, { freq: 150, dur: 0.18, type: 'sine', volume: 0.7, slideTo: 60 });
    noise(ctx, { dur: 0.1, volume: 0.25, filterFrom: 900, filterTo: 200 });
    tone(ctx, { freq: 1200, at: 0.2, dur: 0.7, type: 'sine', volume: 0.35, slideTo: 250 });
    tone(ctx, { freq: 330, at: 1.0, dur: 0.35, type: 'triangle', volume: 0.4 });
    tone(ctx, { freq: 262, at: 1.35, dur: 0.7, type: 'triangle', volume: 0.4, slideTo: 247 });
  },
};

export const playSound = (name) => {
  if (muted) return;
  const sound = SOUNDS[name];
  if (!sound) return;
  try {
    const ctx = getContext();
    if (ctx) {
      sound(ctx);
    }
  } catch (error) {
    // never let a sound effect break the game
  }
};

export const isSoundMuted = () => muted;

export const setSoundMuted = (nextMuted) => {
  muted = Boolean(nextMuted);
  try {
    window.localStorage.setItem(MUTE_KEY, String(muted));
  } catch (error) {
    // ignore storage errors
  }
  window.dispatchEvent(new CustomEvent(MUTE_EVENT, { detail: muted }));
};

export const onSoundMutedChange = (listener) => {
  const handler = (event) => listener(Boolean(event.detail));
  window.addEventListener(MUTE_EVENT, handler);
  return () => window.removeEventListener(MUTE_EVENT, handler);
};
