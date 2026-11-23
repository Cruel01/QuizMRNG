let audioCtx: AudioContext | null = null;
let isMuted = false;

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!audioCtx) {
    const Ctx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext?: typeof AudioContext })
        .webkitAudioContext;
    if (Ctx) {
      audioCtx = new Ctx();
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume().catch(() => {});
  }
  return audioCtx;
}

export function setSoundMuted(muted: boolean) {
  isMuted = muted;
}

export function getSoundMuted(): boolean {
  return isMuted;
}

function playTone(
  freq: number,
  durationSec: number,
  type: OscillatorType = 'sine',
  gainValue: number = 0.08,
  delaySec: number = 0
) {
  if (isMuted) return;
  const ctx = getAudioContext();
  if (!ctx) return;
  try {
    const now = ctx.currentTime + delaySec;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, now);
    gain.gain.setValueAtTime(gainValue, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + durationSec);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + durationSec + 0.02);
  } catch {
    // Audio playback is optional
  }
}

export function playCorrectFx() {
  playTone(523.25, 0.12, 'triangle', 0.09, 0);
  playTone(659.25, 0.16, 'triangle', 0.09, 0.08);
}

export function playWrongFx() {
  playTone(220, 0.18, 'sawtooth', 0.06, 0);
  playTone(174.61, 0.22, 'sawtooth', 0.05, 0.1);
}

export function playPowerupFx() {
  playTone(587.33, 0.1, 'sine', 0.08, 0);
  playTone(880, 0.18, 'sine', 0.08, 0.07);
}

export function playFreezeFx() {
  playTone(987.77, 0.08, 'sine', 0.07, 0);
  playTone(740, 0.12, 'sine', 0.07, 0.06);
  playTone(523.25, 0.22, 'sine', 0.06, 0.12);
}

export function playFinishFx() {
  playTone(523.25, 0.12, 'triangle', 0.08, 0);
  playTone(659.25, 0.12, 'triangle', 0.08, 0.1);
  playTone(783.99, 0.14, 'triangle', 0.08, 0.2);
  playTone(1046.5, 0.28, 'triangle', 0.09, 0.3);
}
