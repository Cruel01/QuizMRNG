import React, { useEffect, useRef } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import {
  ArrowRight,
  Check,
  Scissors,
  Shield,
  Shuffle,
  Snowflake,
  Star,
  Volume2,
  VolumeX,
  X,
  Zap,
} from 'lucide-react';
import { POWERUP_CATALOG } from '../quiz/questions';
import { getDebuffMilestones, getStreakRewardTarget } from '../quiz/engine';
import type { PowerupId, Question } from '../quiz/types';
import { AnimatedFlameIcon, SpinningHourglassIcon } from './AnimatedIcons';

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
  score: number;
  timeLeft: number;
  currentStreak: number;
  powerupInventory: (PowerupId | null)[];
  powerupUsedThisQuestion: boolean;
  doubleScoreActive: boolean;
  immuneQuestionsRemaining: number;
  isFrozen: boolean;
  freezeCountdown: number;
  freezeAttackerName: string;
  optionOrder: number[];
  eliminatedIndices: number[];
  selectedSingleIndex: number | null;
  selectedMultipleIndices: number[];
  textAnswer: string;
  glitchShake: boolean;
  feedback: QuestionFeedbackState | null;
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
  }
}

export const QuizScreen: React.FC<QuizScreenProps> = ({
  question,
  questionIndex,
  totalQuestions,
  score,
  timeLeft,
  currentStreak,
  powerupInventory,
  powerupUsedThisQuestion,
  doubleScoreActive,
  immuneQuestionsRemaining,
  isFrozen,
  freezeCountdown,
  freezeAttackerName,
  optionOrder,
  eliminatedIndices,
  selectedSingleIndex,
  selectedMultipleIndices,
  textAnswer,
  glitchShake,
  feedback,
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

  useEffect(() => {
    if (question.type === 'TEXT' && !feedback && !isFrozen) {
      const t = setTimeout(() => textInputRef.current?.focus(), 60);
      return () => clearTimeout(t);
    }
  }, [questionIndex, question.type, feedback, isFrozen]);

  // Keyboard shortcuts: 1-4 / A-D for MC/TF options, Enter to continue after feedback
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
        if (e.key === 'Enter') {
          e.preventDefault();
          onNextQuestion();
        }
        return;
      }

      if (isTyping) return;

      if (question.type === 'MC' || question.type === 'TF') {
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
        const dispIdx = keyMap[e.key.toLowerCase()];
        if (dispIdx !== undefined && dispIdx < optionOrder.length) {
          const origIdx = optionOrder[dispIdx];
          if (!eliminatedIndices.includes(origIdx)) {
            e.preventDefault();
            onSelectSingle(origIdx);
          }
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
    optionOrder,
    question.type,
  ]);

  const totalTime = question.time || 25;
  const timerPct = Math.max(0, Math.min(100, (timeLeft / totalTime) * 100));
  const isUrgent = !feedback && !isFrozen && timeLeft <= 5 && timeLeft > 0;
  const streakTarget = getStreakRewardTarget(totalQuestions);
  const milestones = getDebuffMilestones(totalQuestions);

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
    <section aria-label="Arena Kuis" className="space-y-3 sm:space-y-4">
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
          {(doubleScoreActive || immuneQuestionsRemaining > 0) && (
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

          {/* Spinning Hourglass Timer */}
          <div
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
            <span className={timeLeft <= 5 ? 'text-rose-400 font-bold' : 'text-white'}>
              {Math.max(0, timeLeft)}d
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

          <button
            type="button"
            onClick={onToggleMute}
            aria-label={isMuted ? 'Aktifkan suara efek' : 'Bisukan suara efek'}
            title={isMuted ? 'Aktifkan suara efek' : 'Bisukan suara efek'}
            className="p-2 rounded-lg bg-[#0B1120] border border-[#23304C] text-slate-300 hover:text-white transition-colors cursor-pointer"
          >
            {isMuted ? (
              <VolumeX className="w-4 h-4" />
            ) : (
              <Volume2 className="w-4 h-4" />
            )}
          </button>
        </div>
      </div>

      {/* Timer Progress Bar */}
      <div
        role="progressbar"
        aria-valuenow={Math.max(0, timeLeft)}
        aria-valuemin={0}
        aria-valuemax={totalTime}
        aria-label="Sisa waktu soal"
        className="w-full bg-[#0B1120] border border-[#23304C] h-2 rounded-full overflow-hidden"
      >
        <div
          className={`h-full transition-all duration-1000 ease-linear ${
            timeLeft <= 5
              ? 'bg-rose-500'
              : timeLeft <= 12
                ? 'bg-amber-400'
                : 'bg-emerald-400'
          }`}
          style={{ width: `${timerPct}%` }}
        />
      </div>

      {/* Inventory Buff & Debuff (Maks 2 Slot) + Segmented Streak Tracker */}
      <div className="bg-[#131C31] border border-[#23304C] rounded-xl p-3 sm:px-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="space-y-1.5 min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-slate-400">
            <span className="inline-flex items-center gap-1 font-bold text-amber-300 shrink-0 font-mono-num">
              <AnimatedFlameIcon
                active={currentStreak > 0}
                className="w-4 h-4 text-amber-400"
              />
              Streak {currentStreak}/{streakTarget}
            </span>
            <span className="text-slate-600" aria-hidden="true">
              ·
            </span>
            <span>
              Item tiap {streakTarget} benar
              {milestones.length > 0 ? ` · Debuff #${milestones.join(', #')}` : ''}
            </span>
          </div>

          {/* Segmented Streak Progress */}
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
                initial={{ scale: 0.92, opacity: 0 }}
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
                  className="text-[11px] font-extrabold px-2 py-1 rounded bg-amber-400 hover:bg-amber-300 text-slate-950 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer shrink-0"
                >
                  Pakai
                </button>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Kartu Pertanyaan */}
      <motion.div
        key={questionIndex}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
        className="relative bg-[#131C31] border border-[#23304C] rounded-2xl p-5 sm:p-8 shadow-xl overflow-hidden"
      >
        {/* Overlay Beku (Freeze Debuff) */}
        {isFrozen && (
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
          {(question.type === 'MC' || question.type === 'TF') && !feedback && (
            <span className="hidden sm:inline text-[11px] text-slate-500">
              Pintasan keyboard: tekan A–{question.type === 'TF' ? 'B' : 'D'}
            </span>
          )}
        </div>

        <h2 className="text-lg sm:text-2xl font-bold leading-snug text-white mb-6">
          {question.question}
        </h2>

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
                'bg-[#0B1120] hover:bg-slate-800/90 border-[#23304C] text-slate-100';
              if (feedback) {
                if (isCorrectChoice) {
                  btnClass =
                    'bg-emerald-500 border-emerald-300 text-slate-950 font-extrabold';
                } else if (isSelectedChoice && !feedback.isCorrect) {
                  btnClass = 'bg-rose-600 border-rose-400 text-white';
                } else {
                  btnClass = 'bg-[#0B1120] border-[#23304C] text-slate-400 opacity-40';
                }
              } else if (isEliminated) {
                btnClass =
                  'bg-[#0B1120] border-[#23304C] text-slate-500 opacity-25 line-through';
              }

              return (
                <motion.button
                  key={`${questionIndex}-${origIdx}`}
                  type="button"
                  disabled={isLocked}
                  whileHover={!isLocked ? { y: -1 } : undefined}
                  whileTap={!isLocked ? { scale: 0.985 } : undefined}
                  onClick={() => onSelectSingle(origIdx)}
                  className={`w-full text-left p-4 rounded-xl border font-semibold text-sm sm:text-base flex items-center gap-3.5 transition-transform duration-150 min-h-[52px] cursor-pointer disabled:cursor-default ${btnClass}`}
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
                </motion.button>
              );
            })}

          {question.type === 'MS' &&
            optionOrder.map((origIdx) => {
              const optText = question.options?.[origIdx] ?? '';
              const isEliminated = eliminatedIndices.includes(origIdx);
              const isSelected = selectedMultipleIndices.includes(origIdx);
              const isCorrectChoice = correctIndices.includes(origIdx);
              const isLocked = Boolean(feedback) || isFrozen || isEliminated;

              let btnClass =
                'bg-[#0B1120] hover:bg-slate-800/80 border-[#23304C] text-slate-100';
              if (feedback) {
                if (isCorrectChoice) {
                  btnClass =
                    'bg-emerald-500 border-emerald-300 text-slate-950 font-extrabold';
                } else if (isSelected) {
                  btnClass = 'bg-rose-600 border-rose-400 text-white';
                } else {
                  btnClass = 'bg-[#0B1120] border-[#23304C] text-slate-400 opacity-40';
                }
              } else if (isEliminated) {
                btnClass =
                  'bg-[#0B1120] border-[#23304C] text-slate-500 opacity-25 line-through';
              } else if (isSelected) {
                btnClass = 'bg-amber-400/15 border-amber-400 text-white';
              }

              return (
                <motion.button
                  key={`${questionIndex}-${origIdx}`}
                  type="button"
                  disabled={isLocked}
                  whileHover={!isLocked ? { y: -1 } : undefined}
                  whileTap={!isLocked ? { scale: 0.985 } : undefined}
                  onClick={() => onToggleMultiple(origIdx)}
                  aria-pressed={isSelected}
                  className={`w-full text-left p-4 rounded-xl border font-semibold text-sm sm:text-base flex items-center justify-between gap-3.5 transition-transform duration-150 min-h-[52px] cursor-pointer disabled:cursor-default ${btnClass}`}
                >
                  <span>{optText}</span>
                  <span
                    className={`w-6 h-6 rounded border flex items-center justify-center shrink-0 ${
                      isSelected
                        ? 'bg-amber-400 border-amber-400 text-slate-950'
                        : 'border-slate-600'
                    }`}
                  >
                    {isSelected && <Check className="w-4 h-4 stroke-[3]" />}
                  </span>
                </motion.button>
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
            <motion.button
              type="button"
              whileTap={{ scale: 0.985 }}
              disabled={
                isFrozen ||
                (question.type === 'MS'
                  ? selectedMultipleIndices.length === 0
                  : textAnswer.trim().length === 0)
              }
              onClick={onSubmitComplex}
              className="w-full bg-amber-400 hover:bg-amber-300 disabled:bg-slate-800 disabled:text-slate-500 text-slate-950 font-extrabold py-3.5 rounded-xl transition-colors cursor-pointer disabled:cursor-not-allowed"
            >
              Kirim Jawaban
            </motion.button>
          </div>
        )}

        {/* Kotak Feedback & Pembahasan */}
        {feedback && (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.18 }}
            role="status"
            className={`mt-6 p-4 sm:p-5 rounded-xl border ${
              feedback.isCorrect
                ? 'bg-emerald-500/10 border-emerald-400/40'
                : 'bg-rose-500/10 border-rose-400/40'
            }`}
          >
            <div className="flex items-center justify-between gap-3 mb-2">
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

            <motion.button
              type="button"
              whileHover={{ y: -1 }}
              whileTap={{ scale: 0.99 }}
              onClick={onNextQuestion}
              className="mt-4 w-full bg-white hover:bg-slate-200 text-slate-950 font-extrabold text-sm sm:text-base py-3 rounded-xl transition-colors inline-flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>
                {questionIndex + 1 < totalQuestions
                  ? 'Lanjut Soal Berikutnya'
                  : 'Lihat Hasil & Leaderboard'}
              </span>
              <ArrowRight className="w-4 h-4" />
            </motion.button>
          </motion.div>
        )}
      </motion.div>
    </section>
  );
};
