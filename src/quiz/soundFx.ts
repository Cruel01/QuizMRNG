import { safeGetStorage, safeSetStorage } from './engine';

const MUTE_STORAGE_KEY = 'quiz_sfx_muted_v1';

let audioCtx: AudioContext | null = null;
let isMuted = safeGetStorage(MUTE_STORAGE_KEY) === '1';

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
  safeSetStorage(MUTE_STORAGE_KEY, muted ? '1' : '0');
}

export function getSoundMuted(): boolean {
  return isMuted;
}

function playTone(
  freq: number,
  durationSec: number,
  type: OscillatorType = 'sine',
  gainValue: number = 0.08,
  delaySec: number = 0,
  endFreq?: number
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
    if (endFreq && endFreq !== freq) {
      osc.frequency.exponentialRampToValueAtTime(
        Math.max(40, endFreq),
        now + durationSec
      );
    }
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

/** Tactile bubble pop for button/card/tab clicks */
export function playPopClickFx() {
  playTone(460, 0.06, 'sine', 0.045, 0, 680);
}

/** Crisp tick for pre-quiz 3-2-1 countdown */
export function playCountdownTickFx(step: number) {
  const base = step === 3 ? 440 : step === 2 ? 523.25 : 659.25;
  playTone(base, 0.14, 'triangle', 0.09, 0);
}

/** Energetic launch chime after countdown finishes */
export function playCountdownGoFx() {
  playTone(523.25, 0.09, 'triangle', 0.08, 0);
  playTone(783.99, 0.11, 'triangle', 0.09, 0.07);
  playTone(1046.5, 0.22, 'triangle', 0.1, 0.14);
}

/** Subtle clock tick when timer <= 5s */
export function playUrgentTickFx() {
  playTone(880, 0.045, 'square', 0.025, 0, 660);
}

/** Crisp double-chime + streak harmonic sparkle */
export function playCorrectFx() {
  playTone(523.25, 0.1, 'triangle', 0.09, 0);
  playTone(659.25, 0.12, 'triangle', 0.09, 0.07);
  playTone(783.99, 0.18, 'sine', 0.08, 0.14);
}

/** Rising combo flourish on streaks >= 2 */
export function playStreakComboFx(streak: number) {
  const semitoneBoost = Math.min(8, Math.max(0, streak - 2));
  const root = 587.33 * Math.pow(2, semitoneBoost / 12);
  playTone(root, 0.1, 'sine', 0.07, 0);
  playTone(root * 1.25, 0.12, 'triangle', 0.08, 0.06);
  playTone(root * 1.5, 0.18, 'triangle', 0.08, 0.12);
}

export function playWrongFx() {
  playTone(230, 0.16, 'sawtooth', 0.055, 0, 175);
  playTone(170, 0.22, 'sawtooth', 0.05, 0.1, 130);
}

export function playPowerupFx() {
  playTone(587.33, 0.09, 'sine', 0.08, 0);
  playTone(880, 0.11, 'triangle', 0.08, 0.06);
  playTone(1174.66, 0.18, 'sine', 0.07, 0.12);
}

export function playFreezeFx() {
  playTone(987.77, 0.08, 'sine', 0.07, 0);
  playTone(740, 0.12, 'sine', 0.07, 0.06);
  playTone(523.25, 0.22, 'sine', 0.06, 0.12);
}

/** Swirling windstorm synth for Puting Beliung debuff */
export function playTornadoFx() {
  playTone(180, 0.28, 'sawtooth', 0.045, 0, 520);
  playTone(480, 0.3, 'triangle', 0.055, 0.14, 190);
  playTone(220, 0.34, 'sawtooth', 0.04, 0.28, 620);
}

/** Ship harbor chime when docking at an island checkpoint */
export function playIslandDockFx() {
  playTone(392.0, 0.12, 'triangle', 0.08, 0);
  playTone(523.25, 0.14, 'triangle', 0.085, 0.1);
  playTone(659.25, 0.22, 'sine', 0.08, 0.2);
}

/** Sparkling treasure chest unlock sound */
export function playChestRewardFx() {
  playTone(659.25, 0.08, 'triangle', 0.08, 0);
  playTone(880.0, 0.1, 'triangle', 0.085, 0.07);
  playTone(1046.5, 0.12, 'sine', 0.08, 0.14);
  playTone(1318.51, 0.24, 'sine', 0.08, 0.21);
}

export function playFinishFx() {
  playTone(523.25, 0.11, 'triangle', 0.08, 0);
  playTone(659.25, 0.11, 'triangle', 0.08, 0.09);
  playTone(783.99, 0.13, 'triangle', 0.08, 0.18);
  playTone(1046.5, 0.28, 'triangle', 0.095, 0.28);
  playTone(1318.51, 0.32, 'sine', 0.065, 0.36);
}
