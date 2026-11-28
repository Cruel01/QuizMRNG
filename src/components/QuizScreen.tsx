import React, { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import {
  ArrowRight,
  Check,
  ImageOff,
  Scissors,
  Shield,
  Shuffle,
  Snowflake,
  Star,
  Tornado,
  Trophy,
  Volume2,
  VolumeX,
  X,
  Zap,
} from 'lucide-react';
import { ALL_POWERUP_IDS, POWERUP_CATALOG } from '../quiz/questions';
import {
  formatCountdownClock,
  getDebuffMilestones,
  getStreakRewardTarget,
  sanitizeImageUrl,
} from '../quiz/engine';
import { playPopClickFx } from '../quiz/soundFx';
import type {
  ActivePlayer,
  GameplayMode,
  PowerupId,
  Question,
  VoyageProgressState,
} from '../quiz/types';
import { AnimatedFlameIcon, SpinningHourglassIcon } from './AnimatedIcons';
import { VoyageRoadmap } from './VoyageRoadmap';

export interface QuestionFeedbackState {
  isCorrect: boolean;
  isTimeout: boolean;
  userAnswer: string;
  correctAnswer: string;
  pointsEarned: number;
  explanation: string;
}

interface QuizScreenProps {
  question: Question;
  questionIndex: number;
  totalQuestions: number;
  answeredCount: number;
  score: number;
  timeLeft: number;
  isGlobalTimer: boolean;
  globalTimeLeft: number;
  totalGlobalSeconds: number;
  gameplayMode: GameplayMode;
  voyageProgress: VoyageProgressState | null;
  teamName?: string;
  activePlayers: ActivePlayer[];
  selfDeviceId: string;
  showLiveLeaderboardToPlayers: boolean;
  onOpenLiveLeaderboard: () => void;
  gamificationEnabled: boolean;
  enabledPowerups?: PowerupId[];
  streakEnabled?: boolean;
  milestoneDropsEnabled?: boolean;
  currentStreak: number;
  compactMode: boolean;
  powerupInventory: (PowerupId | null)[];
  powerupUsedThisQuestion: boolean;
  doubleScoreActive: boolean;
  immuneQuestionsRemaining: number;
  isFrozen: boolean;
  freezeCountdown: number;
  freezeAttackerName: string;
  tornadoCountdown: number;
  tornadoAttackerName: string;
  optionOrder: number[];
  eliminatedIndices: number[];
  selectedSingleIndex: number | null;
  selectedMultipleIndices: number[];
  textAnswer: string;
  glitchShake: boolean;
  feedback: QuestionFeedbackState | null;
  suppressFeedbackPopup?: boolean;
  isMuted: boolean;
  onToggleMute: () => void;
  onSelectSingle: (origIdx: number) => void;
  onToggleMultiple: (origIdx: number) => void;
  onTextAnswerChange: (val: string) => void;
  onSubmitComplex: () => void;
  onNextQuestion: () => void;
  onActivatePowerup: (slotIndex: number) => void;
}

function PowerupIcon({ id }: { id: PowerupId }) {
  switch (id) {
    case 'DOUBLE_SCORE':
      return <Zap className="w-3.5 h-3.5 text-amber-300 shrink-0" />;
    case 'FIFTY_FIFTY':
      return <Scissors className="w-3.5 h-3.5 text-sky-300 shrink-0" />;
    case 'SHIELD':
      return <Shield className="w-3.5 h-3.5 text-emerald-300 shrink-0" />;
    case 'FREEZE_LEADER':
      return <Snowflake className="w-3.5 h-3.5 text-cyan-300 shrink-0" />;
    case 'GLITCH_SHUFFLE':
      return <Shuffle className="w-3.5 h-3.5 text-fuchsia-300 shrink-0" />;
    case 'TORNADO':
      return <Tornado className="w-3.5 h-3.5 text-rose-300 shrink-0" />;
  }
}

export const QuizScreen: React.FC<QuizScreenProps> = ({
  question,
  questionIndex,
  totalQuestions,
  answeredCount,
  score,
  timeLeft,
  isGlobalTimer,
  globalTimeLeft,
  totalGlobalSeconds,
  gameplayMode,
  voyageProgress,
  teamName,
  activePlayers,
  selfDeviceId,
  showLiveLeaderboardToPlayers,
  onOpenLiveLeaderboard,
  gamificationEnabled,
  enabledPowerups = ALL_POWERUP_IDS,
  streakEnabled = true,
  milestoneDropsEnabled = true,
  currentStreak,
  compactMode,
  powerupInventory,
  powerupUsedThisQuestion,
  doubleScoreActive,
  immuneQuestionsRemaining,
  isFrozen,
  freezeCountdown,
  freezeAttackerName,
  tornadoCountdown,
  tornadoAttackerName,
  optionOrder,
  eliminatedIndices,
  selectedSingleIndex,
  selectedMultipleIndices,
  textAnswer,
  glitchShake,
  feedback,
  suppressFeedbackPopup = false,
  isMuted,
  onToggleMute,
  onSelectSingle,
  onToggleMultiple,
  onTextAnswerChange,
  onSubmitComplex,
  onNextQuestion,
  onActivatePowerup,
}) => {
  const textInputRef = useRef<HTMLInputElement | null>(null);
  const [imgError, setImgError] = useState(false);

  const safeImgUrl = sanitizeImageUrl(question.imageUrl);

  useEffect(() => {
    setImgError(false);
  }, [questionIndex, safeImgUrl]);

  useEffect(() => {
    if (question.type === 'TEXT' && !feedback && !isFrozen) {
      const t = setTimeout(() => textInputRef.current?.focus(), 60);
      return () => clearTimeout(t);
    }
  }, [questionIndex, question.type, feedback, isFrozen]);

  // Keyboard shortcuts:
  // - MC / TF: 1-4 or A-D picks & submits immediately
  // - MS: 1-4 or A-D toggles option; Enter submits when >= 1 selected
  // - Feedback shown: Enter goes to next question
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isFrozen) return;
      const target = e.target as HTMLElement | null;
      const isTyping =
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.isContentEditable);

      if (feedback) {
        if (!suppressFeedbackPopup && e.key === 'Enter') {
          e.preventDefault();
          onNextQuestion();
        }
        return;
      }

      if (isTyping) return;

      const keyMap: Record<string, number> = {
        '1': 0,
        '2': 1,
        '3': 2,
        '4': 3,
        a: 0,
        b: 1,
        c: 2,
        d: 3,
      };

      if (question.type === 'MC' || question.type === 'TF') {
        const dispIdx = keyMap[e.key.toLowerCase()];
        if (dispIdx !== undefined && dispIdx < optionOrder.length) {
          const origIdx = optionOrder[dispIdx];
          if (!eliminatedIndices.includes(origIdx)) {
            e.preventDefault();
            onSelectSingle(origIdx);
          }
        }
      } else if (question.type === 'MS') {
        const dispIdx = keyMap[e.key.toLowerCase()];
        if (dispIdx !== undefined && dispIdx < optionOrder.length) {
          const origIdx = optionOrder[dispIdx];
          if (!eliminatedIndices.includes(origIdx)) {
            e.preventDefault();
            playPopClickFx();
            onToggleMultiple(origIdx);
          }
        } else if (e.key === 'Enter' && selectedMultipleIndices.length > 0) {
          e.preventDefault();
          onSubmitComplex();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    eliminatedIndices,
    feedback,
    isFrozen,
    onNextQuestion,
    onSelectSingle,
    onSubmitComplex,
    onToggleMultiple,
    optionOrder,
    question.type,
    selectedMultipleIndices.length,
    suppressFeedbackPopup,
  ]);

  const activeTimerMax = isGlobalTimer
    ? Math.max(1, totalGlobalSeconds)
    : question.time || 25;
  const activeTimerVal = isGlobalTimer ? globalTimeLeft : timeLeft;
  const timerPct = Math.max(
    0,
    Math.min(100, (activeTimerVal / activeTimerMax) * 100)
  );
  const urgentThreshold = isGlobalTimer ? 60 : 5;
  const warnThreshold = isGlobalTimer ? 180 : 12;
  const isUrgent =
    !isFrozen &&
    activeTimerVal <= urgentThreshold &&
    activeTimerVal > 0 &&
    (isGlobalTimer || !feedback);
  const streakTarget = getStreakRewardTarget(totalQuestions);
  const milestones = getDebuffMilestones(totalQuestions);
  const willDockAfterThis =
    gameplayMode === 'voyage' &&
    Boolean(feedback) &&
    Boolean(voyageProgress?.dockedIsland);

  const typeLabelMap: Record<Question['type'], string> = {
    MC: 'Pilihan Ganda',
    TF: 'Benar / Salah',
    MS: 'Pilih Beberapa',
    TEXT: 'Isian Singkat',
  };

  const letters = ['A', 'B', 'C', 'D'];
  const correctIndices = Array.isArray(question.answer)
    ? question.answer
    : typeof question.answer === 'number'
      ? [question.answer]
      : [];

  return (
    <section
      aria-label="Arena Kuis"
      className={compactMode ? 'space-y-2.5' : 'space-y-3 sm:space-y-4'}
    >
      {/* Top HUD Bar */}
      <div className="bg-[#131C31] border border-[#23304C] rounded-xl px-4 py-3 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-xs sm:text-sm text-slate-300 min-w-0">
          <span className="font-mono-num font-bold text-white shrink-0">
            {questionIndex + 1} / {totalQuestions}
          </span>
          <span className="text-slate-600" aria-hidden="true">
            ·
          </span>
          <span className="font-semibold text-amber-300 truncate">
            {question.category}
          </span>
          <span className="text-slate-600 hidden sm:inline" aria-hidden="true">
            ·
          </span>
          <span className="text-slate-400 hidden sm:inline">
            {typeLabelMap[question.type]}
          </span>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          {gamificationEnabled &&
            (doubleScoreActive || immuneQuestionsRemaining > 0) && (
              <div className="flex items-center gap-2 text-xs font-bold">
                {doubleScoreActive && (
                  <span className="inline-flex items-center gap-1 text-amber-300">
                    <Zap className="w-3.5 h-3.5" /> 2x
                  </span>
                )}
                {immuneQuestionsRemaining > 0 && (
                  <span className="inline-flex items-center gap-1 text-emerald-300">
                    <Shield className="w-3.5 h-3.5" /> Perisai
                  </span>
                )}
              </div>
            )}

          {/* Spinning Hourglass Timer (Global vs Per-Question) */}
          <div
            data-testid="quiz-timer-display"
            className={`inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold font-mono-num ${
              isUrgent ? 'text-rose-400 anim-urgent-tick' : 'text-slate-300'
            }`}
          >
            <SpinningHourglassIcon
              fast={isUrgent}
              className={`w-4 h-4 ${
                isUrgent ? 'text-rose-400' : 'text-amber-300'
              }`}
            />
            {isGlobalTimer && (
              <span className="hidden sm:inline text-[11px] text-slate-400 font-sans">
                Sisa Kuis
              </span>
            )}
            <span
              className={
                activeTimerVal <= urgentThreshold
                  ? 'text-rose-400 font-bold'
                  : 'text-white'
              }
            >
              {isGlobalTimer
                ? formatCountdownClock(globalTimeLeft)
                : `${Math.max(0, timeLeft)}d`}
            </span>
          </div>

          {/* Score Counter + Floating +pts Burst */}
          <div className="relative inline-flex items-center gap-1.5 bg-[#0B1120] border border-[#23304C] px-3 py-1 rounded-lg">
            <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
            <span
              data-testid="quiz-score"
              className="font-mono-num font-extrabold text-sm sm:text-base text-white"
            >
              {score}
            </span>
            <AnimatePresence>
              {feedback?.isCorrect && feedback.pointsEarned > 0 && (
                <motion.span
                  key={`pop-${questionIndex}`}
                  initial={{ opacity: 0, y: 6, scale: 0.85 }}
                  animate={{ opacity: 1, y: -18, scale: 1 }}
                  exit={{ opacity: 0, y: -26 }}
                  transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                  className="pointer-events-none absolute -top-2 right-1 text-[11px] font-mono-num font-extrabold text-emerald-400 whitespace-nowrap"
                >
                  +{feedback.pointsEarned}
                </motion.span>
              )}
            </AnimatePresence>
          </div>

          {showLiveLeaderboardToPlayers && (
            <button
              type="button"
              onClick={() => {
                playPopClickFx();
                onOpenLiveLeaderboard();
              }}
              aria-label="Lihat klasemen sementara"
              title="Klasemen Sementara"
              className="arcade-btn px-2.5 py-2 rounded-lg bg-[#0B1120] border border-[#23304C] text-xs font-bold text-amber-300 hover:bg-slate-800 inline-flex items-center gap-1 cursor-pointer"
            >
              <Trophy className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Klasemen</span>
            </button>
          )}

          <button
            type="button"
            onClick={onToggleMute}
            aria-label={isMuted ? 'Aktifkan suara efek' : 'Bisukan suara efek'}
            title={isMuted ? 'Aktifkan suara efek' : 'Bisukan suara efek'}
            className="arcade-btn p-2 rounded-lg bg-[#0B1120] border border-[#23304C] text-slate-300 hover:text-white cursor-pointer"
          >
            {isMuted ? (
              <VolumeX className="w-4 h-4 text-rose-400" />
            ) : (
              <Volume2 className="w-4 h-4 text-emerald-400" />
            )}
          </button>
        </div>
      </div>

      {/* Timer Progress Bar */}
      <div
        role="progressbar"
        aria-valuenow={Math.max(0, activeTimerVal)}
        aria-valuemin={0}
        aria-valuemax={activeTimerMax}
        aria-label={isGlobalTimer ? 'Sisa waktu kuis global' : 'Sisa waktu soal'}
        className="w-full bg-[#0B1120] border border-[#23304C] h-2 rounded-full overflow-hidden"
      >
        <div
          className={`h-full transition-all duration-1000 ease-linear ${
            activeTimerVal <= urgentThreshold
              ? 'bg-rose-500'
              : activeTimerVal <= warnThreshold
                ? 'bg-amber-400'
                : 'bg-emerald-400'
          }`}
          style={{ width: `${timerPct}%` }}
        />
      </div>

      {/* Voyage Sea Roadmap (Mode Berlayar Mencari Harta Karun) */}
      {gameplayMode === 'voyage' && voyageProgress && (
        <VoyageRoadmap
          progress={voyageProgress}
          answeredCount={answeredCount}
          totalQuestions={totalQuestions}
          teamName={teamName}
          activePlayers={activePlayers}
          selfDeviceId={selfDeviceId}
        />
      )}

      {/* Inventory Buff & Debuff (Maks 2 Slot) + Segmented Streak Tracker */}
      {gamificationEnabled && enabledPowerups.length > 0 && (
        <div
          data-testid="quiz-gamification-bar"
          className="bg-[#131C31] border border-[#23304C] rounded-xl p-3 sm:px-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
        >
        {streakEnabled ? (
          <div className="space-y-1.5 min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-slate-400">
              <span className="inline-flex items-center gap-1 font-bold text-amber-300 shrink-0 font-mono-num">
                <AnimatedFlameIcon
                  active={currentStreak > 0}
                  className="w-4 h-4 text-amber-400"
                />
                Streak {currentStreak}/{streakTarget}
              </span>
              {currentStreak >= 2 && (
                <motion.span
                  key={`combo-${currentStreak}`}
                  initial={{ scale: 0.75, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="font-mono-num font-extrabold text-[11px] text-emerald-400"
                >
                  Kombo x{currentStreak}!
                </motion.span>
              )}
              <span className="text-slate-600" aria-hidden="true">
                ·
              </span>
              <span>
                {enabledPowerups.length === 1
                  ? `${POWERUP_CATALOG[enabledPowerups[0]].name} tiap ${streakTarget} benar`
                  : `Item tiap ${streakTarget} benar`}
                {milestoneDropsEnabled &&
                enabledPowerups.some(
                  (id) => POWERUP_CATALOG[id]?.kind === 'debuff'
                ) &&
                milestones.length > 0
                  ? ` · Debuff #${milestones.join(', #')}`
                  : ''}
              </span>
            </div>

            <div
              className="grid gap-1 max-w-xs"
              style={{ gridTemplateColumns: `repeat(${streakTarget}, minmax(0, 1fr))` }}
              aria-hidden="true"
            >
              {Array.from({ length: streakTarget }).map((_, i) => (
                <div
                  key={i}
                  className={`h-1 rounded-full transition-colors ${
                    i < currentStreak ? 'bg-amber-400' : 'bg-[#0B1120]'
                  }`}
                />
              ))}
            </div>
          </div>
        ) : (
          <div className="min-w-0 flex-1 text-xs text-slate-300 font-medium">
            Fitur aktif:{' '}
            <span className="text-amber-300 font-bold">
              {enabledPowerups.map((id) => POWERUP_CATALOG[id]?.name).join(', ')}
            </span>
          </div>
        )}

        <div className="grid grid-cols-2 gap-2 w-full sm:w-80 shrink-0">
          {[0, 1].map((slotIdx) => {
            const itemId = powerupInventory[slotIdx];
            const spec = itemId ? POWERUP_CATALOG[itemId] : null;
            if (!spec || !itemId) {
              return (
                <div
                  key={slotIdx}
                  className="rounded-lg border border-dashed border-[#23304C] bg-[#0B1120]/60 px-3 py-2 text-[11px] text-slate-500 text-center font-medium"
                >
                  Slot {slotIdx + 1} Kosong
                </div>
              );
            }
            const disabled = powerupUsedThisQuestion || isFrozen || Boolean(feedback);
            return (
              <motion.div
                key={`${slotIdx}-${itemId}`}
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.18 }}
                title={spec.desc}
                className="rounded-lg border border-amber-400/40 bg-[#0B1120] px-2.5 py-1.5 flex items-center justify-between gap-2"
              >
                <div className="flex items-center gap-1.5 min-w-0">
                  <PowerupIcon id={itemId} />
                  <span className="text-xs font-bold text-slate-100 truncate">
                    {spec.name}
                  </span>
                </div>
                <button
                  type="button"
                  disabled={disabled}
                  onClick={() => onActivatePowerup(slotIdx)}
                  className="arcade-btn-amber text-[11px] font-extrabold px-2 py-1 rounded bg-amber-400 hover:bg-amber-300 text-slate-950 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer shrink-0"
                >
                  Pakai
                </button>
              </motion.div>
            );
          })}
        </div>
      </div>
      )}

      {/* Kartu Pertanyaan */}
      <motion.div
        key={questionIndex}
        initial={{ opacity: 0, y: 8, scale: 0.99 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
        className={`relative bg-[#131C31] border border-[#23304C] rounded-2xl shadow-xl overflow-hidden ${
          compactMode ? 'p-4 sm:p-6' : 'p-5 sm:p-8'
        } ${
          gamificationEnabled && tornadoCountdown > 0
            ? 'tornado-storm-active border-fuchsia-400/60'
            : ''
        }`}
      >
        {/* Banner Gangguan Puting Beliung (Tornado Debuff) */}
        {gamificationEnabled && tornadoCountdown > 0 && (
          <div
            role="alert"
            className="mb-4 rounded-xl bg-fuchsia-500/15 border border-fuchsia-400/45 px-4 py-2.5 flex items-center justify-between gap-2 text-xs text-fuchsia-200"
          >
            <div className="flex items-center gap-2 font-bold min-w-0">
              <Tornado className="w-4 h-4 text-fuchsia-300 shrink-0 animate-spin" />
              <span className="truncate">
                Badai Puting Beliung dari {tornadoAttackerName || 'lawan'}! Layar
                terguncang &amp; opsi teracak!
              </span>
            </div>
            <span className="font-mono-num font-extrabold text-fuchsia-300 shrink-0">
              {tornadoCountdown}d
            </span>
          </div>
        )}

        {/* Overlay Beku (Freeze Debuff) */}
        {gamificationEnabled && isFrozen && (
          <div
            role="alert"
            className="absolute inset-0 z-30 bg-sky-950/95 backdrop-blur-sm flex flex-col items-center justify-center text-center p-6 border border-sky-400/40 rounded-2xl"
          >
            <div className="w-14 h-14 rounded-2xl bg-sky-400/20 text-sky-300 flex items-center justify-center mb-3 animate-bounce">
              <Snowflake className="w-8 h-8" />
            </div>
            <h3 className="text-xl sm:text-2xl font-extrabold text-sky-200 mb-1">
              Layarmu Dibekukan!
            </h3>
            <p className="text-xs sm:text-sm text-sky-100/90 max-w-sm mb-3">
              {freezeAttackerName || 'Pemain lain'} mengirim serangan es! Timer
              dijeda sementara hingga es mencair.
            </p>
            <div className="bg-sky-300 text-slate-950 font-extrabold px-4 py-1.5 rounded-lg text-xs sm:text-sm font-mono-num">
              Mencair dalam {Math.max(0, freezeCountdown)} detik...
            </div>
          </div>
        )}

        <div className="flex items-center justify-between gap-2 mb-3 text-xs text-slate-400">
          <span className="sm:hidden">{typeLabelMap[question.type]}</span>
          {!feedback && question.type !== 'TEXT' && (
            <span className="hidden sm:inline text-[11px] text-slate-500">
              {question.type === 'MS'
                ? 'Pintasan keyboard: 1–4 / A–D pilih opsi, Enter kirim'
                : `Pintasan keyboard: tekan 1–${question.type === 'TF' ? '2 / A–B' : '4 / A–D'}`}
            </span>
          )}
        </div>

        <h2
          className={`font-bold leading-snug text-white ${
            compactMode
              ? 'text-base sm:text-xl mb-4'
              : 'text-lg sm:text-2xl mb-5'
          }`}
        >
          {question.question}
        </h2>

        {/* Opsional Gambar Pendukung Soal */}
        {safeImgUrl && (
          <div className="mb-5">
            {!imgError ? (
              <div className="rounded-xl overflow-hidden border border-[#23304C] bg-[#0B1120] max-h-60 flex items-center justify-center">
                <img
                  src={safeImgUrl}
                  alt={`Ilustrasi soal ${questionIndex + 1}`}
                  referrerPolicy="no-referrer"
                  onError={() => setImgError(true)}
                  className="max-h-60 w-auto object-contain mx-auto"
                />
              </div>
            ) : (
              <div className="rounded-xl border border-dashed border-[#23304C] bg-[#0B1120] p-4 flex items-center justify-center gap-2 text-xs text-slate-400">
                <ImageOff className="w-4 h-4 text-slate-500" />
                <span>Gambar soal gagal dimuat dari tautan eksternal.</span>
              </div>
            )}
          </div>
        )}

        {/* Opsi Jawaban */}
        <div className={`space-y-2.5 ${glitchShake ? 'glitch-active' : ''}`}>
          {(question.type === 'MC' || question.type === 'TF') &&
            optionOrder.map((origIdx, dispIdx) => {
              const optText = question.options?.[origIdx] ?? '';
              const isEliminated = eliminatedIndices.includes(origIdx);
              const isLocked = Boolean(feedback) || isFrozen || isEliminated;
              const isCorrectChoice = origIdx === question.answer;
              const isSelectedChoice = origIdx === selectedSingleIndex;

              let btnClass =
                'arcade-btn bg-[#0B1120] hover:bg-slate-800/90 border-[#23304C] text-slate-100';
              if (feedback) {
                if (isCorrectChoice) {
                  btnClass =
                    'bg-emerald-500 border-emerald-300 text-slate-950 font-extrabold';
                } else if (isSelectedChoice && !feedback.isCorrect) {
                  btnClass = 'bg-rose-600 border-rose-400 text-white';
                } else {
                  btnClass =
                    'bg-[#0B1120] border-[#23304C] text-slate-400 opacity-40';
                }
              } else if (isEliminated) {
                btnClass =
                  'bg-[#0B1120] border-[#23304C] text-slate-500 opacity-25 line-through';
              }

              return (
                <button
                  key={`${questionIndex}-${origIdx}`}
                  type="button"
                  disabled={isLocked}
                  onClick={() => onSelectSingle(origIdx)}
                  className={`w-full text-left p-4 rounded-xl border font-semibold text-sm sm:text-base flex items-center gap-3.5 min-h-[52px] cursor-pointer disabled:cursor-default ${btnClass}`}
                >
                  <span
                    className={`w-8 h-8 rounded-lg flex items-center justify-center font-extrabold text-xs shrink-0 ${
                      feedback && isCorrectChoice
                        ? 'bg-slate-950/20 text-slate-950'
                        : 'bg-[#131C31] text-slate-300 border border-[#23304C]'
                    }`}
                  >
                    {letters[dispIdx]}
                  </span>
                  <span className="flex-1">{optText}</span>
                </button>
              );
            })}

          {question.type === 'MS' &&
            optionOrder.map((origIdx, dispIdx) => {
              const optText = question.options?.[origIdx] ?? '';
              const isEliminated = eliminatedIndices.includes(origIdx);
              const isSelected = selectedMultipleIndices.includes(origIdx);
              const isCorrectChoice = correctIndices.includes(origIdx);
              const isLocked = Boolean(feedback) || isFrozen || isEliminated;

              let btnClass =
                'arcade-btn bg-[#0B1120] hover:bg-slate-800/80 border-[#23304C] text-slate-100';
              if (feedback) {
                if (isCorrectChoice) {
                  btnClass =
                    'bg-emerald-500 border-emerald-300 text-slate-950 font-extrabold';
                } else if (isSelected) {
                  btnClass = 'bg-rose-600 border-rose-400 text-white';
                } else {
                  btnClass =
                    'bg-[#0B1120] border-[#23304C] text-slate-400 opacity-40';
                }
              } else if (isEliminated) {
                btnClass =
                  'bg-[#0B1120] border-[#23304C] text-slate-500 opacity-25 line-through';
              } else if (isSelected) {
                btnClass = 'arcade-btn bg-amber-400/15 border-amber-400 text-white';
              }

              return (
                <button
                  key={`${questionIndex}-${origIdx}`}
                  type="button"
                  disabled={isLocked}
                  onClick={() => {
                    playPopClickFx();
                    onToggleMultiple(origIdx);
                  }}
                  aria-pressed={isSelected}
                  className={`w-full text-left p-4 rounded-xl border font-semibold text-sm sm:text-base flex items-center justify-between gap-3.5 min-h-[52px] cursor-pointer disabled:cursor-default ${btnClass}`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="w-7 h-7 rounded-lg bg-[#131C31] text-slate-300 border border-[#23304C] flex items-center justify-center font-extrabold text-xs shrink-0">
                      {letters[dispIdx]}
                    </span>
                    <span>{optText}</span>
                  </div>
                  <span
                    className={`w-6 h-6 rounded border flex items-center justify-center shrink-0 ${
                      isSelected
                        ? 'bg-amber-400 border-amber-400 text-slate-950'
                        : 'border-slate-600'
                    }`}
                  >
                    {isSelected && <Check className="w-4 h-4 stroke-[3]" />}
                  </span>
                </button>
              );
            })}

          {question.type === 'TEXT' && (
            <div>
              <label htmlFor="text-answer-input" className="sr-only">
                Jawaban singkat
              </label>
              <input
                ref={textInputRef}
                id="text-answer-input"
                type="text"
                value={textAnswer}
                disabled={Boolean(feedback) || isFrozen}
                onChange={(e) => onTextAnswerChange(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !feedback) onSubmitComplex();
                }}
                placeholder="Ketik jawabanmu di sini..."
                autoComplete="off"
                className="w-full px-4 py-3.5 rounded-xl bg-white text-slate-950 font-bold text-base sm:text-lg placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-400 disabled:bg-slate-200"
              />
            </div>
          )}
        </div>

        {/* Tombol Kirim untuk Multiple Select & Isian Singkat */}
        {!feedback && (question.type === 'MS' || question.type === 'TEXT') && (
          <div className="mt-5">
            <button
              type="button"
              disabled={
                isFrozen ||
                (question.type === 'MS'
                  ? selectedMultipleIndices.length === 0
                  : textAnswer.trim().length === 0)
              }
              onClick={onSubmitComplex}
              className="arcade-btn-amber w-full bg-amber-400 hover:bg-amber-300 disabled:bg-slate-800 disabled:text-slate-500 text-slate-950 font-extrabold py-3.5 rounded-xl cursor-pointer disabled:cursor-not-allowed"
            >
              Kirim Jawaban
            </button>
          </div>
        )}
      </motion.div>

      {/* Popup Feedback & Pembahasan di Tengah Layar */}
      <AnimatePresence>
        {feedback && !suppressFeedbackPopup && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.16 }}
            role="dialog"
            aria-modal="true"
            aria-labelledby="feedback-popup-title"
            data-testid="feedback-popup"
            className="fixed inset-0 z-40 bg-slate-950/75 backdrop-blur-sm flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.94, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 6 }}
              transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
              className={`w-full max-w-lg max-h-[90vh] overflow-y-auto bg-[#131C31] rounded-2xl border shadow-2xl ${
                feedback.isCorrect
                  ? 'border-emerald-400/50'
                  : 'border-rose-400/50'
              }`}
            >
              <div
                className={`p-5 sm:p-6 ${
                  feedback.isCorrect ? 'bg-emerald-500/10' : 'bg-rose-500/10'
                }`}
              >
                <div className="flex items-center justify-between gap-3 mb-2.5">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div
                      className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${
                        feedback.isCorrect
                          ? 'bg-emerald-400 text-slate-950'
                          : 'bg-rose-500 text-white'
                      }`}
                    >
                      {feedback.isCorrect ? (
                        <Check className="w-4 h-4 stroke-[3]" />
                      ) : (
                        <X className="w-4 h-4 stroke-[3]" />
                      )}
                    </div>
                    <h3
                      id="feedback-popup-title"
                      className={`font-extrabold text-sm sm:text-base ${
                        feedback.isCorrect ? 'text-emerald-300' : 'text-rose-300'
                      }`}
                    >
                      {feedback.isCorrect
                        ? 'Jawaban Benar!'
                        : feedback.isTimeout
                          ? `Waktu Habis! (Jawaban: ${feedback.correctAnswer})`
                          : `Kurang Tepat (Jawaban: ${feedback.correctAnswer})`}
                    </h3>
                  </div>
                  <span className="font-mono-num font-bold text-xs sm:text-sm text-amber-300 shrink-0">
                    +{feedback.pointsEarned} poin
                  </span>
                </div>

                <p className="text-xs sm:text-sm text-slate-200 leading-relaxed">
                  {feedback.explanation}
                </p>

                <button
                  type="button"
                  onClick={() => {
                    playPopClickFx();
                    onNextQuestion();
                  }}
                  className="arcade-btn mt-5 w-full bg-white hover:bg-slate-200 text-slate-950 font-extrabold text-sm sm:text-base py-3 rounded-xl inline-flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span>
                    {willDockAfterThis && voyageProgress?.dockedIsland
                      ? `Berlabuh di ${voyageProgress.dockedIsland.name}`
                      : questionIndex + 1 < totalQuestions
                        ? 'Lanjut Soal Berikutnya'
                        : 'Lihat Hasil & Leaderboard'}
                  </span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
};
