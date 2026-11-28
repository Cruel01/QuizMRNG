import React, { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Brain,
  Compass,
  DoorOpen,
  Lock,
  PawPrint,
  Play,
  Radio,
  RotateCcw,
  Scissors,
  Shield,
  Ship,
  Shuffle,
  Snowflake,
  Tag,
  Tornado,
  Trophy,
  Users,
  Volume2,
  VolumeX,
  Zap,
} from 'lucide-react';
import {
  getDynamicCategoryStats,
  getEffectiveParticipationMode,
  getEnabledPowerups,
  isGamificationActive,
  isTeamParticipationAvailable,
  STALE_ACTIVE_PLAYER_MS,
} from '../quiz/engine';
import { POWERUP_CATALOG } from '../quiz/questions';
import { playPopClickFx } from '../quiz/soundFx';
import type {
  ActivePlayer,
  InProgressState,
  PlayerRecord,
  PowerupId,
  Question,
  QuizSettings,
  SessionMode,
  WaitingPlayer,
} from '../quiz/types';
import {
  LiveRadarIcon,
  NusantaraCompassIcon,
  SpinningHourglassIcon,
} from './AnimatedIcons';

interface LobbyScreenProps {
  questions: Question[];
  sessionMode: SessionMode;
  settings: QuizSettings;
  roomCode: string;
  roomGateUnlocked: boolean;
  roomGateInput: string;
  roomGateError: string;
  waitingPlayers: WaitingPlayer[];
  activePlayers: ActivePlayer[];
  playerName: string;
  teamModeChoice: 'solo' | 'team';
  teamName: string;
  nameError: string;
  hasPlayedThisDevice: boolean;
  savedPlayerRecord: PlayerRecord | null;
  leaderboardCount: number;
  recoverableProgress: InProgressState | null;
  isMuted: boolean;
  onToggleMute: () => void;
  onRoomGateInputChange: (val: string) => void;
  onSubmitRoomGate: () => void;
  onOpenRoomModal: () => void;
  onPlayerNameChange: (val: string) => void;
  onTeamModeChoiceChange: (mode: 'solo' | 'team') => void;
  onTeamNameChange: (val: string) => void;
  onStartClick: () => void;
  onResumeProgress: () => void;
  onDiscardProgress: () => void;
  onOpenLeaderboard: () => void;
}

function renderPowerupGlyph(id: PowerupId) {
  switch (id) {
    case 'DOUBLE_SCORE':
      return <Zap className="w-4 h-4 text-amber-300 shrink-0" />;
    case 'FIFTY_FIFTY':
      return <Scissors className="w-4 h-4 text-sky-300 shrink-0" />;
    case 'SHIELD':
      return <Shield className="w-4 h-4 text-emerald-300 shrink-0" />;
    case 'FREEZE_LEADER':
      return <Snowflake className="w-4 h-4 text-cyan-300 shrink-0" />;
    case 'GLITCH_SHUFFLE':
      return <Shuffle className="w-4 h-4 text-fuchsia-300 shrink-0" />;
    case 'TORNADO':
      return <Tornado className="w-4 h-4 text-rose-300 shrink-0" />;
  }
}

export const LobbyScreen: React.FC<LobbyScreenProps> = ({
  questions,
  sessionMode,
  settings,
  roomCode,
  roomGateUnlocked,
  roomGateInput,
  roomGateError,
  waitingPlayers,
  activePlayers,
  playerName,
  teamModeChoice,
  teamName,
  nameError,
  hasPlayedThisDevice,
  savedPlayerRecord,
  leaderboardCount,
  recoverableProgress,
  isMuted,
  onToggleMute,
  onRoomGateInputChange,
  onSubmitRoomGate,
  onOpenRoomModal,
  onPlayerNameChange,
  onTeamModeChoiceChange,
  onTeamNameChange,
  onStartClick,
  onResumeProgress,
  onDiscardProgress,
  onOpenLeaderboard,
}) => {
  const [lobbyTab, setLobbyTab] = useState<'categories' | 'powerups'>(
    'categories'
  );
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const dynamicCategories = useMemo(
    () => getDynamicCategoryStats(questions),
    [questions]
  );

  const freshActiveCount = useMemo(() => {
    const now = Date.now();
    return activePlayers.filter(
      (p) => now - (p.lastSeen || p.startedAt || 0) <= STALE_ACTIVE_PLAYER_MS
    ).length;
  }, [activePlayers]);

  const modeMeta: Record<SessionMode, { label: string; colorClass: string }> = {
    unconfigured: {
      label: 'Menunggu Admin memilih mode kuis',
      colorClass: 'text-amber-300',
    },
    free: {
      label: 'Mode Bebas · Kerjakan Mandiri',
      colorClass: 'text-emerald-400',
    },
    live_waiting: {
      label: 'Mode Live · Ruang Tunggu Dibuka',
      colorClass: 'text-amber-300',
    },
    live_started: {
      label: 'Mode Live · Sesi Berlangsung',
      colorClass: 'text-rose-400',
    },
  };

  const gamificationActive = isGamificationActive(settings);
  const enabledPowerups = useMemo(
    () => getEnabledPowerups(settings),
    [settings]
  );
  const showPowerupGuideTab = gamificationActive && enabledPowerups.length > 0;
  const voyageMode = isTeamParticipationAvailable(settings);
  const effectivePartMode = getEffectiveParticipationMode(settings);
  const showParticipationChoice = voyageMode && effectivePartMode === 'either';
  const showTeamInput =
    voyageMode &&
    (effectivePartMode === 'team' ||
      (effectivePartMode === 'either' && teamModeChoice === 'team'));

  const activeLobbyTab =
    !showPowerupGuideTab && lobbyTab === 'powerups' ? 'categories' : lobbyTab;

  const classicSubtitleLabel = useMemo(() => {
    if (!gamificationActive || enabledPowerups.length === 0) {
      return 'Kuis interaktif real-time';
    }
    if (enabledPowerups.length === 1) {
      return `Fitur ${POWERUP_CATALOG[enabledPowerups[0]].name} aktif`;
    }
    const hasDebuff = enabledPowerups.some(
      (id) => POWERUP_CATALOG[id]?.kind === 'debuff'
    );
    return hasDebuff ? 'Buff & Debuff real-time' : 'Buff real-time aktif';
  }, [enabledPowerups, gamificationActive]);

  const currentModeInfo = modeMeta[sessionMode];
  const selectedCategoryInfo = dynamicCategories.find(
    (c) => c.key === selectedCategory
  );
  const effectiveLocked = hasPlayedThisDevice && !settings.allowReplay;
  const activeQuestionTarget =
    settings.questionLimit > 0 && settings.questionLimit < questions.length
      ? `${settings.questionLimit} dari ${questions.length}`
      : `${questions.length}`;

  const isLiveMode =
    sessionMode === 'live_waiting' || sessionMode === 'live_started';

  return (
    <motion.section
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
      aria-label="Beranda Kuis"
      className={`bg-[#131C31] border border-[#23304C] rounded-2xl shadow-xl ${
        settings.compactMode ? 'p-4 sm:p-6' : 'p-5 sm:p-9'
      }`}
    >
      {/* Header Utama */}
      <div
        className={`flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#23304C] ${
          settings.compactMode ? 'pb-4 mb-5' : 'pb-6 mb-6'
        }`}
      >
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-amber-400 text-slate-950 flex items-center justify-center shrink-0 anim-float-gentle arcade-btn-amber">
            <Zap className="w-6 h-6 stroke-[2.5]" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
              Kuis Trivia Nusantara
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
              {roomGateUnlocked ? (
                <>
                  <span className="font-mono-num text-slate-200 font-semibold">
                    {activeQuestionTarget}
                  </span>{' '}
                  pertanyaan ·{' '}
                  {voyageMode ? (
                    <span className="text-sky-300 font-semibold inline-flex items-center gap-1">
                      <Ship className="w-3.5 h-3.5 inline" /> Berlayar Harta Karun
                    </span>
                  ) : (
                    classicSubtitleLabel
                  )}
                  {settings.quizDurationMinutes > 0
                    ? ` · Timer Global ${settings.quizDurationMinutes} Menit`
                    : ''}
                  {settings.allowReplay ? ' · Mode Latihan' : ''}
                  {settings.shuffleQuestions ? ' · Soal Acak' : ''}
                </>
              ) : (
                'Masukkan kode kelas untuk membuka ruang kuis'
              )}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {roomGateUnlocked && (
            <div
              className={`inline-flex items-center gap-2 text-xs font-semibold ${currentModeInfo.colorClass}`}
            >
              {(sessionMode === 'unconfigured' ||
                sessionMode === 'live_waiting') && (
                <SpinningHourglassIcon className="w-4 h-4 shrink-0" />
              )}
              <span>{currentModeInfo.label}</span>
            </div>
          )}

          <div className="flex items-center gap-1.5">
            {roomGateUnlocked && (
              <button
                type="button"
                onClick={() => {
                  playPopClickFx();
                  onOpenRoomModal();
                }}
                title="Ganti Kode Ruangan / Kelas"
                className="arcade-btn px-2.5 py-1.5 rounded-lg bg-[#0B1120] hover:bg-slate-800 border border-[#23304C] text-xs font-bold text-slate-200 inline-flex items-center gap-1.5 cursor-pointer"
              >
                <DoorOpen className="w-3.5 h-3.5 text-sky-400" />
                <span className="font-mono-num">
                  {roomCode ? `#${roomCode}` : 'Umum'}
                </span>
              </button>
            )}

            <button
              type="button"
              onClick={() => {
                onToggleMute();
                if (isMuted) {
                  setTimeout(() => playPopClickFx(), 20);
                }
              }}
              aria-label={isMuted ? 'Aktifkan suara efek' : 'Bisukan suara efek'}
              title={isMuted ? 'Aktifkan suara efek' : 'Bisukan suara efek'}
              className="arcade-btn p-2 rounded-lg bg-[#0B1120] hover:bg-slate-800 border border-[#23304C] text-slate-200 cursor-pointer"
            >
              {isMuted ? (
                <VolumeX className="w-4 h-4 text-rose-400" />
              ) : (
                <Volume2 className="w-4 h-4 text-emerald-400" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* GERBANG KODE KELAS: Wajib Memasukkan Kode Kelas Sebelum Mengakses Kuis */}
      {!roomGateUnlocked ? (
        <div
          data-testid="room-code-gate"
          className="max-w-lg mx-auto bg-[#0B1120] border border-sky-400/35 rounded-2xl p-6 sm:p-7 text-center space-y-4"
        >
          <div className="w-12 h-12 rounded-2xl bg-sky-400/15 border border-sky-400/30 text-sky-300 flex items-center justify-center mx-auto">
            <DoorOpen className="w-6 h-6" />
          </div>
          <div className="space-y-1.5">
            <h2 className="text-lg sm:text-xl font-extrabold text-white">
              Masukkan Kode Kelas
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 leading-relaxed max-w-md mx-auto">
              Masukkan kode kelas dari penyelenggara agar kamu dapat mengakses
              kuis dan ruang tunggu. Ketik{' '}
              <strong className="text-slate-200 font-mono-num">UMUM</strong>{' '}
              jika menggunakan ruang default.
            </p>
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              playPopClickFx();
              onSubmitRoomGate();
            }}
            className="space-y-3 text-left"
          >
            <div>
              <label
                htmlFor="lobby-room-gate-input"
                className="block text-xs font-semibold text-slate-300 mb-1.5"
              >
                Kode Kelas / Ruangan
              </label>
              <input
                id="lobby-room-gate-input"
                type="text"
                maxLength={20}
                autoFocus
                value={roomGateInput}
                onChange={(e) =>
                  onRoomGateInputChange(e.target.value.toUpperCase())
                }
                placeholder="Contoh: KELAS8A atau UMUM"
                className="w-full px-4 py-3.5 rounded-xl bg-white text-slate-950 font-mono-num font-bold text-center text-base sm:text-lg tracking-wider uppercase placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-400"
              />
              {roomGateError && (
                <p
                  className="text-rose-400 text-xs mt-1.5 font-medium text-center"
                  role="alert"
                >
                  {roomGateError}
                </p>
              )}
            </div>

            <button
              type="submit"
              className="arcade-btn w-full bg-sky-400 hover:bg-sky-300 text-slate-950 font-extrabold text-sm sm:text-base py-3.5 px-6 rounded-xl cursor-pointer inline-flex items-center justify-center gap-2"
            >
              <DoorOpen className="w-4 h-4" /> Masuk Kelas
            </button>
          </form>
        </div>
      ) : (
        <>
          {/* Tab Interaktif: Kategori Soal vs Panduan Buff & Debuff */}
          <div className="flex items-center justify-between gap-3 mb-4">
            <div
              role="tablist"
              aria-label="Informasi Kuis"
              className="inline-flex items-center gap-1 p-1 bg-[#0B1120] border border-[#23304C] rounded-xl"
            >
              <button
                type="button"
                role="tab"
                aria-selected={activeLobbyTab === 'categories'}
                onClick={() => {
                  playPopClickFx();
                  setLobbyTab('categories');
                }}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold cursor-pointer whitespace-nowrap transition-colors ${
                  activeLobbyTab === 'categories'
                    ? 'bg-amber-400 text-slate-950'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                Kategori Soal ({dynamicCategories.length})
              </button>
              {showPowerupGuideTab && (
                <button
                  type="button"
                  role="tab"
                  aria-selected={activeLobbyTab === 'powerups'}
                  onClick={() => {
                    playPopClickFx();
                    setLobbyTab('powerups');
                  }}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-bold cursor-pointer whitespace-nowrap transition-colors ${
                    activeLobbyTab === 'powerups'
                      ? 'bg-amber-400 text-slate-950'
                      : 'text-slate-300 hover:text-white'
                  }`}
                >
                  Buff &amp; Debuff ({enabledPowerups.length})
                </button>
              )}
            </div>

            {activeLobbyTab === 'categories' && (
              <span className="text-[11px] text-slate-400 hidden sm:inline">
                Klik kartu kategori untuk lihat topik
              </span>
            )}
          </div>

          <AnimatePresence mode="wait">
            {activeLobbyTab === 'categories' ? (
              <motion.div
                key="tab-categories"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.16 }}
                className="mb-6 space-y-3"
              >
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {dynamicCategories.map((cat) => {
                    const isSelected = selectedCategory === cat.key;
                    return (
                      <button
                        key={cat.key}
                        type="button"
                        onClick={() => {
                          playPopClickFx();
                          setSelectedCategory(isSelected ? null : cat.key);
                        }}
                        aria-expanded={isSelected}
                        className={`arcade-btn text-left rounded-xl p-4 border flex sm:flex-col items-center sm:items-start justify-between gap-2 cursor-pointer ${
                          isSelected
                            ? 'bg-slate-800/80 border-amber-400/70'
                            : 'bg-[#0B1120] border-[#23304C] hover:border-slate-500'
                        }`}
                      >
                        <div className="flex items-center gap-2 text-slate-200 text-xs sm:text-sm font-medium min-w-0">
                          {cat.kind === 'animals' && (
                            <PawPrint className="w-4 h-4 text-emerald-400 shrink-0" />
                          )}
                          {cat.kind === 'logic' && (
                            <Brain className="w-4 h-4 text-sky-400 shrink-0" />
                          )}
                          {cat.kind === 'nusantara' && (
                            <NusantaraCompassIcon className="w-4 h-4 text-amber-400 shrink-0" />
                          )}
                          {cat.kind === 'custom' && (
                            <Tag className={`w-4 h-4 shrink-0 ${cat.accent}`} />
                          )}
                          <span className="truncate">{cat.label}</span>
                        </div>
                        <div className="font-mono-num font-bold text-base sm:text-xl text-white shrink-0">
                          {cat.count} Soal
                        </div>
                      </button>
                    );
                  })}
                </div>

                {selectedCategoryInfo && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="bg-[#0B1120] border border-[#23304C] rounded-xl px-4 py-3 text-xs text-slate-300 flex items-center justify-between gap-2"
                  >
                    <span>
                      <strong className={selectedCategoryInfo.accent}>
                        {selectedCategoryInfo.label}:
                      </strong>{' '}
                      {selectedCategoryInfo.hint}
                    </span>
                    <span className="text-[11px] text-slate-400 shrink-0 font-mono-num">
                      MC · TF · MS · Isian
                    </span>
                  </motion.div>
                )}
              </motion.div>
            ) : (
              <motion.div
                key="tab-powerups"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.16 }}
                className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mb-6"
              >
                {enabledPowerups.map((id) => {
                  const item = POWERUP_CATALOG[id];
                  if (!item) return null;
                  return (
                    <div
                      key={item.id}
                      className="bg-[#0B1120] border border-[#23304C] rounded-xl p-3.5 flex items-start gap-3"
                    >
                      <div className="w-8 h-8 rounded-lg bg-[#131C31] border border-[#23304C] flex items-center justify-center shrink-0">
                        {renderPowerupGlyph(item.id)}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 text-xs font-bold text-white">
                          <span>{item.name}</span>
                          <span className="text-slate-500" aria-hidden="true">
                            ·
                          </span>
                          <span
                            className={
                              item.kind === 'buff'
                                ? 'text-emerald-400'
                                : 'text-sky-400'
                            }
                          >
                            {item.kind === 'buff' ? 'Buff' : 'Debuff'}
                          </span>
                        </div>
                        <p className="text-xs text-slate-400 mt-0.5 leading-snug">
                          {item.desc}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Banner Pemulihan Sesi Jika Halaman Sempat Ter-refresh */}
          {recoverableProgress && !effectiveLocked && (
            <div className="bg-sky-500/10 border border-sky-400/30 rounded-xl p-4 mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-sm font-bold text-sky-300">
                  Sesi Sebelumnya Ditemukan
                </h2>
                <p className="text-xs text-slate-300 mt-0.5">
                  Lanjutkan sebagai{' '}
                  <strong className="text-white">
                    {recoverableProgress.playerName}
                  </strong>{' '}
                  di soal #{recoverableProgress.currentQuestionIndex + 1} (Skor{' '}
                  <span className="font-mono-num">
                    {recoverableProgress.score}
                  </span>
                  ).
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    playPopClickFx();
                    onResumeProgress();
                  }}
                  className="arcade-btn bg-sky-400 hover:bg-sky-300 text-slate-950 font-bold text-xs px-4 py-2.5 rounded-lg cursor-pointer inline-flex items-center gap-1.5 whitespace-nowrap"
                >
                  <RotateCcw className="w-3.5 h-3.5" /> Lanjutkan
                </button>
                <button
                  type="button"
                  onClick={() => {
                    playPopClickFx();
                    onDiscardProgress();
                  }}
                  className="bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs px-3 py-2.5 rounded-lg transition cursor-pointer whitespace-nowrap"
                >
                  Abaikan
                </button>
              </div>
            </div>
          )}

          {/* Status Utama: Terkunci / Menunggu Admin / Mode Bebas vs Mode Live */}
          {effectiveLocked ? (
            <div className="bg-[#0B1120] border border-amber-400/30 rounded-xl p-5 text-center mb-6">
              <div className="w-11 h-11 rounded-full bg-amber-400/15 text-amber-300 flex items-center justify-center mx-auto mb-2.5">
                <Lock className="w-5 h-5" />
              </div>
              <h2 className="font-bold text-base sm:text-lg text-amber-300">
                Kuis Terkunci (Sudah Dikerjakan)
              </h2>
              <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-md mx-auto">
                {savedPlayerRecord
                  ? `Kamu sudah menyelesaikan kuis sebagai ${savedPlayerRecord.name} dengan skor ${savedPlayerRecord.score} (${savedPlayerRecord.correct}/${savedPlayerRecord.totalQuestions || questions.length} benar).`
                  : 'Perangkat ini sudah menyelesaikan kuis 1 kali dan terekam di Leaderboard.'}
              </p>
            </div>
          ) : sessionMode === 'unconfigured' ? (
            <div className="bg-[#0B1120] border border-[#23304C] rounded-xl p-6 text-center mb-6">
              <div className="w-12 h-12 rounded-2xl bg-amber-400/10 border border-amber-400/25 text-amber-300 flex items-center justify-center mx-auto mb-3">
                <SpinningHourglassIcon className="w-6 h-6" />
              </div>
              <h2 className="font-bold text-base sm:text-lg text-white">
                Menunggu Penyelenggara (Admin)
              </h2>
              <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-md mx-auto leading-relaxed">
                Kamu sudah terhubung ke kelas{' '}
                <strong className="text-sky-300 font-mono-num">
                  {roomCode ? `#${roomCode}` : 'Umum'}
                </strong>
                . Halaman ini otomatis aktif begitu Admin memilih{' '}
                <strong className="text-emerald-300">Mode Bebas</strong> atau{' '}
                <strong className="text-amber-300">Mode Live</strong>.
              </p>
            </div>
          ) : (
            <div
              data-testid={
                isLiveMode ? 'lobby-mode-live-panel' : 'lobby-mode-free-panel'
              }
              className={`max-w-xl mx-auto mb-6 rounded-2xl border overflow-hidden ${
                isLiveMode
                  ? 'bg-[#0B1120] border-amber-400/35'
                  : 'bg-[#0B1120] border-emerald-500/35'
              }`}
            >
              {/* Header Pembeda Pengalaman Mode Bebas vs Mode Live */}
              <div
                className={`px-5 py-4 border-b flex items-start gap-3 ${
                  isLiveMode
                    ? 'bg-amber-400/[0.08] border-amber-400/20'
                    : 'bg-emerald-500/[0.08] border-emerald-500/20'
                }`}
              >
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                    isLiveMode
                      ? 'bg-amber-400/15 text-amber-300 border border-amber-400/30'
                      : 'bg-emerald-500/15 text-emerald-300 border border-emerald-400/30'
                  }`}
                >
                  {isLiveMode ? (
                    <LiveRadarIcon className="w-6 h-6" />
                  ) : (
                    <Compass className="w-5 h-5" />
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h2
                      className={`text-sm sm:text-base font-extrabold ${
                        isLiveMode ? 'text-amber-300' : 'text-emerald-300'
                      }`}
                    >
                      {sessionMode === 'free'
                        ? 'Mode Bebas · Kerjakan Mandiri'
                        : sessionMode === 'live_waiting'
                          ? 'Mode Live · Ruang Tunggu Serentak'
                          : 'Mode Live · Arena Sedang Berlangsung'}
                    </h2>
                    <span className="text-[11px] font-mono-num text-slate-300">
                      {isLiveMode
                        ? sessionMode === 'live_waiting'
                          ? `${waitingPlayers.length} di ruang tunggu`
                          : `${freshActiveCount} sedang bermain`
                        : 'Langsung mulai'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                    {sessionMode === 'free'
                      ? 'Kerjakan kapan saja sesuai kecepatanmu sendiri tanpa perlu menunggu peserta lain di ruang tunggu.'
                      : sessionMode === 'live_waiting'
                        ? 'Masukkan namamu untuk masuk ke Ruang Tunggu Live. Kuis akan dimulai serentak ketika Admin menekan Mulai Live.'
                        : 'Sesi Live sudah dimulai! Masukkan namamu untuk langsung menyusul masuk bersama peserta lainnya.'}
                  </p>

                  {/* Info metadata ringkas khusus mode */}
                  <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-400 mt-2 font-mono-num">
                    {sessionMode === 'free' ? (
                      <>
                        <span>Tanpa ruang tunggu</span>
                        <span aria-hidden="true">·</span>
                        <span>
                          {settings.quizDurationMinutes > 0
                            ? `Timer ${settings.quizDurationMinutes} Menit`
                            : 'Timer per soal'}
                        </span>
                        {settings.allowReplay && (
                          <>
                            <span aria-hidden="true">·</span>
                            <span className="text-emerald-300">Boleh ulang</span>
                          </>
                        )}
                      </>
                    ) : (
                      <>
                        <span className="inline-flex items-center gap-1 text-amber-200">
                          <Radio className="w-3 h-3" /> Sesi serentak
                        </span>
                        <span aria-hidden="true">·</span>
                        <span>
                          {settings.quizDurationMinutes > 0
                            ? `Timer ${settings.quizDurationMinutes} Menit`
                            : 'Timer per soal'}
                        </span>
                        {waitingPlayers.length > 0 &&
                          sessionMode === 'live_waiting' && (
                            <>
                              <span aria-hidden="true">·</span>
                              <span className="truncate max-w-[220px] text-slate-300">
                                Standby:{' '}
                                {waitingPlayers
                                  .slice(0, 3)
                                  .map((w) => w.name)
                                  .join(', ')}
                                {waitingPlayers.length > 3
                                  ? ` +${waitingPlayers.length - 3}`
                                  : ''}
                              </span>
                            </>
                          )}
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Form Nama & Kepesertaan (Solo/Tim hanya muncul di Mode Berlayar Harta Karun) */}
              <div className="p-5 space-y-3.5">
                {showParticipationChoice && (
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-semibold text-slate-300">
                      Bentuk Kepesertaan
                    </span>
                    <div className="inline-flex items-center gap-1 p-1 bg-[#131C31] border border-[#23304C] rounded-xl">
                      <button
                        type="button"
                        onClick={() => {
                          playPopClickFx();
                          onTeamModeChoiceChange('solo');
                        }}
                        className={`px-3 py-1 rounded-lg text-xs font-bold cursor-pointer ${
                          teamModeChoice === 'solo'
                            ? 'bg-amber-400 text-slate-950'
                            : 'text-slate-300 hover:text-white'
                        }`}
                      >
                        Solo
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          playPopClickFx();
                          onTeamModeChoiceChange('team');
                        }}
                        className={`px-3 py-1 rounded-lg text-xs font-bold cursor-pointer ${
                          teamModeChoice === 'team'
                            ? 'bg-sky-400 text-slate-950'
                            : 'text-slate-300 hover:text-white'
                        }`}
                      >
                        Tim / Kru
                      </button>
                    </div>
                  </div>
                )}

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label
                      htmlFor="player-name"
                      className="block text-xs sm:text-sm font-semibold text-slate-300"
                    >
                      {showTeamInput ? 'Nama Pelaut / Anggota' : 'Nama Pemain'}
                    </label>
                    {settings.allowReplay && hasPlayedThisDevice && (
                      <span className="text-[11px] font-semibold text-emerald-400">
                        Mode Latihan aktif · Boleh main ulang
                      </span>
                    )}
                  </div>
                  <input
                    id="player-name"
                    type="text"
                    value={playerName}
                    maxLength={20}
                    placeholder="Masukkan namamu di sini..."
                    onChange={(e) => onPlayerNameChange(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') onStartClick();
                    }}
                    className={`w-full px-4 py-3.5 rounded-xl bg-white text-slate-950 font-bold text-base sm:text-lg placeholder-slate-400 focus:outline-none focus:ring-2 ${
                      isLiveMode
                        ? 'focus:ring-amber-400'
                        : 'focus:ring-emerald-400'
                    }`}
                  />
                </div>

                {showTeamInput && (
                  <div>
                    <label
                      htmlFor="player-team-name"
                      className="block text-xs sm:text-sm font-semibold text-sky-300 mb-1.5"
                    >
                      Nama Tim / Kapal{' '}
                      {effectivePartMode === 'team' ? '(Wajib)' : '(Opsional)'}
                    </label>
                    <input
                      id="player-team-name"
                      type="text"
                      value={teamName}
                      maxLength={20}
                      placeholder="Contoh: Bajak Laut Garuda"
                      onChange={(e) => onTeamNameChange(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') onStartClick();
                      }}
                      className="w-full px-4 py-3 rounded-xl bg-[#131C31] border border-sky-400/50 text-white font-bold text-sm sm:text-base placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-400"
                    />
                  </div>
                )}

                {nameError && (
                  <p
                    className="text-rose-400 text-xs mt-1 font-medium"
                    role="alert"
                  >
                    {nameError}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Aksi Utama */}
          <div className="flex flex-col sm:flex-row justify-center gap-3 max-w-xl mx-auto">
            {effectiveLocked ? (
              <button
                type="button"
                disabled
                className="flex-1 bg-slate-800/80 text-slate-500 font-bold text-sm sm:text-base py-3.5 px-6 rounded-xl border border-slate-700 cursor-not-allowed inline-flex items-center justify-center gap-2 whitespace-nowrap"
              >
                <Lock className="w-4 h-4" /> Kuis Sudah Selesai
              </button>
            ) : sessionMode === 'unconfigured' ? (
              <button
                type="button"
                disabled
                className="flex-1 bg-slate-800/80 text-slate-400 font-bold text-sm sm:text-base py-3.5 px-6 rounded-xl border border-slate-700 cursor-not-allowed inline-flex items-center justify-center gap-2 whitespace-nowrap"
              >
                <SpinningHourglassIcon className="w-4 h-4" /> Menunggu Admin...
              </button>
            ) : sessionMode === 'free' ? (
              <button
                type="button"
                onClick={() => {
                  playPopClickFx();
                  onStartClick();
                }}
                className="arcade-btn flex-1 bg-emerald-400 hover:bg-emerald-300 text-slate-950 font-extrabold text-sm sm:text-base py-3.5 px-6 rounded-xl cursor-pointer inline-flex items-center justify-center gap-2 whitespace-nowrap"
              >
                <Play className="w-4 h-4 fill-current" />
                {hasPlayedThisDevice && settings.allowReplay
                  ? 'Main Lagi Sekarang'
                  : voyageMode
                    ? 'Mulai Berlayar Mandiri'
                    : 'Mulai Kuis Mandiri'}
              </button>
            ) : (
              <button
                type="button"
                onClick={() => {
                  playPopClickFx();
                  onStartClick();
                }}
                className="arcade-btn-amber flex-1 bg-amber-400 hover:bg-amber-300 text-slate-950 font-extrabold text-sm sm:text-base py-3.5 px-6 rounded-xl cursor-pointer inline-flex items-center justify-center gap-2 whitespace-nowrap"
              >
                {sessionMode === 'live_waiting' ? (
                  <>
                    <Users className="w-4 h-4" /> Masuk Ruang Tunggu Live
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 fill-current" /> Gabung Arena Live
                    Sekarang
                  </>
                )}
              </button>
            )}

            {(leaderboardCount > 0 ||
              hasPlayedThisDevice ||
              settings.showLiveLeaderboardToPlayers) && (
              <button
                type="button"
                onClick={() => {
                  playPopClickFx();
                  onOpenLeaderboard();
                }}
                className="arcade-btn bg-[#0B1120] hover:bg-slate-800 text-slate-100 font-semibold text-sm sm:text-base py-3.5 px-5 rounded-xl border border-[#23304C] cursor-pointer inline-flex items-center justify-center gap-2 whitespace-nowrap"
              >
                <Trophy className="w-4 h-4 text-amber-400" /> Lihat Leaderboard
              </button>
            )}
          </div>
        </>
      )}
    </motion.section>
  );
};
