// Tiny procedural sound effects via WebAudio. No external audio files,
// so the game stays fully offline-friendly for the Android build.

let ctx = null;
function getCtx() {
  if (!ctx) {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
  }
  if (ctx.state === 'suspended') ctx.resume();
  return ctx;
}

function tone({ freq = 440, duration = 0.15, type = 'sine', gain = 0.2, glideTo = null, delay = 0 }) {
  const c = getCtx();
  if (!c) return;
  const osc = c.createOscillator();
  const amp = c.createGain();
  osc.type = type;
  const start = c.currentTime + delay;
  osc.frequency.setValueAtTime(freq, start);
  if (glideTo) osc.frequency.exponentialRampToValueAtTime(glideTo, start + duration);
  amp.gain.setValueAtTime(0.0001, start);
  amp.gain.exponentialRampToValueAtTime(gain, start + 0.015);
  amp.gain.exponentialRampToValueAtTime(0.0001, start + duration);
  osc.connect(amp).connect(c.destination);
  osc.start(start);
  osc.stop(start + duration + 0.02);
}

export function playSnip() {
  tone({ freq: 1600, glideTo: 900, duration: 0.08, type: 'square', gain: 0.15 });
  tone({ freq: 2200, glideTo: 1400, duration: 0.06, type: 'square', gain: 0.08, delay: 0.03 });
}

export function playStitch() {
  tone({ freq: 520, glideTo: 780, duration: 0.09, type: 'triangle', gain: 0.18 });
}

export function playWrong() {
  tone({ freq: 180, duration: 0.12, type: 'sawtooth', gain: 0.12 });
}

export function playSuccess() {
  [523, 659, 784, 1046].forEach((f, i) => tone({ freq: f, duration: 0.18, type: 'sine', gain: 0.15, delay: i * 0.09 }));
}

export function playClick() {
  tone({ freq: 900, duration: 0.06, type: 'sine', gain: 0.1 });
}

export function playStar() {
  tone({ freq: 900, glideTo: 1300, duration: 0.12, type: 'sine', gain: 0.16 });
}

export function playSave() {
  [660, 880, 1100].forEach((f, i) => tone({ freq: f, duration: 0.14, type: 'sine', gain: 0.14, delay: i * 0.07 }));
}
