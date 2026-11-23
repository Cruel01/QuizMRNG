import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Brain,
  Lock,
  PawPrint,
  Play,
  RotateCcw,
  Scissors,
  Shield,
  Shuffle,
  Snowflake,
  Trophy,
  Users,
  Zap,
} from 'lucide-react';
import { POWERUP_CATALOG } from '../quiz/questions';
import type {
  InProgressState,
  PlayerRecord,
  PowerupId,
  Question,
  SessionMode,
} from '../quiz/types';
import {
  NusantaraCompassIcon,
  SpinningHourglassIcon,
} from './AnimatedIcons';

interface LobbyScreenProps {
  questions: Question[];
  sessionMode: SessionMode;
  playerName: string;
  nameError: string;
  hasPlayedThisDevice: boolean;
  savedPlayerRecord: PlayerRecord | null;
  leaderboardCount: number;
  recoverableProgress: InProgressState | null;
  onPlayerNameChange: (val: string) => void;
  onStartClick: () => void;
  onResumeProgress: () => void;
  onDiscardProgress: () => void;
  onOpenLeaderboard: () => void;
}

const CATEGORY_META = [
  {
    key: 'Manusia & Hewan',
    label: 'Manusia & Hewan',
    hint: 'Anatomi tubuh, satwa unik, dan adaptasi biologi.',
    accent: 'text-emerald-400',
  },
  {
    key: 'Logika & Hitungan',
    label: 'Logika & Hitungan',
    hint: 'Teka-teki logika, deret angka, dan aritmatika cepat.',
    accent: 'text-sky-400',
  },
  {
    key: 'Wawasan Nusantara',
    label: 'Wawasan Nusantara',
    hint: 'Geografi kepulauan, flora-fauna endemik, dan budaya.',
    accent: 'text-amber-400',
  },
] as const;

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
  }
}

export const LobbyScreen: React.FC<LobbyScreenProps> = ({
  questions,
  sessionMode,
  playerName,
  nameError,
  hasPlayedThisDevice,
  savedPlayerRecord,
  leaderboardCount,
  recoverableProgress,
  onPlayerNameChange,
  onStartClick,
  onResumeProgress,
  onDiscardProgress,
  onOpenLeaderboard,
}) => {
  const [lobbyTab, setLobbyTab] = useState<'categories' | 'powerups'>(
    'categories'
  );
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const modeMeta: Record<SessionMode, { label: string; colorClass: string }> = {
    unconfigured: {
      label: 'Menunggu Admin memilih mode kuis',
      colorClass: 'text-amber-300',
    },
    free: {
      label: 'Mode Bebas · Langsung main',
      colorClass: 'text-emerald-400',
    },
    live_waiting: {
      label: 'Mode Live · Ruang tunggu dibuka',
      colorClass: 'text-amber-300',
    },
    live_started: {
      label: 'Mode Live · Sesi sedang berlangsung',
      colorClass: 'text-rose-400',
    },
  };

  const currentModeInfo = modeMeta[sessionMode];

  const getCategoryCount = (catKey: string) =>
    questions.filter((q) => q.category === catKey).length;

  const selectedCategoryInfo = CATEGORY_META.find(
    (c) => c.key === selectedCategory
  );

  return (
    <motion.section
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
      aria-label="Beranda Kuis"
      className="bg-[#131C31] border border-[#23304C] rounded-2xl p-5 sm:p-9 shadow-xl"
    >
      {/* Header Utama */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#23304C] pb-6 mb-6">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-amber-400 text-slate-950 flex items-center justify-center shrink-0 anim-float-gentle">
            <Zap className="w-6 h-6 stroke-[2.5]" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
              Kuis Trivia Nusantara
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
              <span className="font-mono-num text-slate-200 font-semibold">
                {questions.length}
              </span>{' '}
              pertanyaan · Buff &amp; Debuff real-time
            </p>
          </div>
        </div>

        <div
          className={`inline-flex items-center gap-2 text-xs sm:text-sm font-semibold ${currentModeInfo.colorClass}`}
        >
          {(sessionMode === 'unconfigured' || sessionMode === 'live_waiting') && (
            <SpinningHourglassIcon className="w-4 h-4 shrink-0" />
          )}
          <span>{currentModeInfo.label}</span>
        </div>
      </div>

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
            aria-selected={lobbyTab === 'categories'}
            onClick={() => setLobbyTab('categories')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold cursor-pointer whitespace-nowrap ${
              lobbyTab === 'categories'
                ? 'bg-amber-400 text-slate-950'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            Kategori Soal
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={lobbyTab === 'powerups'}
            onClick={() => setLobbyTab('powerups')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold cursor-pointer whitespace-nowrap ${
              lobbyTab === 'powerups'
                ? 'bg-amber-400 text-slate-950'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            Buff &amp; Debuff (5)
          </button>
        </div>

        {lobbyTab === 'categories' && (
          <span className="text-[11px] text-slate-400 hidden sm:inline">
            Klik kartu kategori untuk lihat topik
          </span>
        )}
      </div>

      <AnimatePresence mode="wait">
        {lobbyTab === 'categories' ? (
          <motion.div
            key="tab-categories"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.16 }}
            className="mb-7 space-y-3"
          >
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {CATEGORY_META.map((cat) => {
                const isSelected = selectedCategory === cat.key;
                const count = getCategoryCount(cat.key);
                return (
                  <motion.button
                    key={cat.key}
                    type="button"
                    whileHover={{ y: -2 }}
                    whileTap={{ scale: 0.985 }}
                    onClick={() =>
                      setSelectedCategory(isSelected ? null : cat.key)
                    }
                    aria-expanded={isSelected}
                    className={`text-left rounded-xl p-4 border flex sm:flex-col items-center sm:items-start justify-between gap-2 transition-colors cursor-pointer ${
                      isSelected
                        ? 'bg-slate-800/70 border-amber-400/60'
                        : 'bg-[#0B1120] border-[#23304C] hover:border-slate-600'
                    }`}
                  >
                    <div className="flex items-center gap-2 text-slate-200 text-xs sm:text-sm font-medium">
                      {cat.key === 'Manusia & Hewan' && (
                        <PawPrint className="w-4 h-4 text-emerald-400 shrink-0" />
                      )}
                      {cat.key === 'Logika & Hitungan' && (
                        <Brain className="w-4 h-4 text-sky-400 shrink-0" />
                      )}
                      {cat.key === 'Wawasan Nusantara' && (
                        <NusantaraCompassIcon className="w-4 h-4 text-amber-400 shrink-0" />
                      )}
                      <span>{cat.label}</span>
                    </div>
                    <div className="font-mono-num font-bold text-base sm:text-xl text-white">
                      {count} Soal
                    </div>
                  </motion.button>
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
            className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mb-7"
          >
            {Object.values(POWERUP_CATALOG).map((item) => (
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
                        item.kind === 'buff' ? 'text-emerald-400' : 'text-sky-400'
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
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Banner Pemulihan Sesi Jika Halaman Sempat Ter-refresh */}
      {recoverableProgress && !hasPlayedThisDevice && (
        <div className="bg-sky-500/10 border border-sky-400/30 rounded-xl p-4 mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-bold text-sky-300">
              Sesi Sebelumnya Ditemukan
            </h2>
            <p className="text-xs text-slate-300 mt-0.5">
              Lanjutkan sebagai{' '}
              <strong className="text-white">{recoverableProgress.playerName}</strong>{' '}
              di soal #{recoverableProgress.currentQuestionIndex + 1} (Skor{' '}
              <span className="font-mono-num">{recoverableProgress.score}</span>).
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={onResumeProgress}
              className="bg-sky-400 hover:bg-sky-300 text-slate-950 font-bold text-xs px-4 py-2.5 rounded-lg transition cursor-pointer inline-flex items-center gap-1.5 whitespace-nowrap"
            >
              <RotateCcw className="w-3.5 h-3.5" /> Lanjutkan
            </button>
            <button
              type="button"
              onClick={onDiscardProgress}
              className="bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs px-3 py-2.5 rounded-lg transition cursor-pointer whitespace-nowrap"
            >
              Abaikan
            </button>
          </div>
        </div>
      )}

      {/* Status Utama: Terkunci / Menunggu Admin / Siap Input Nama */}
      {hasPlayedThisDevice ? (
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
            Kuis belum dibuka. Halaman ini otomatis aktif begitu Admin memilih
            pelaksanaan secara <strong className="text-slate-200">Mode Bebas</strong>{' '}
            atau <strong className="text-slate-200">Live Bareng</strong>.
          </p>
        </div>
      ) : (
        <div className="max-w-lg mx-auto mb-6">
          <label
            htmlFor="player-name"
            className="block text-xs sm:text-sm font-semibold text-slate-300 mb-2"
          >
            Nama Pemain / Tim
          </label>
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
            className="w-full px-4 py-3.5 rounded-xl bg-white text-slate-950 font-bold text-base sm:text-lg placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-400"
          />
          {nameError && (
            <p className="text-rose-400 text-xs mt-1.5 font-medium" role="alert">
              {nameError}
            </p>
          )}
        </div>
      )}

      {/* Aksi Utama */}
      <div className="flex flex-col sm:flex-row justify-center gap-3 max-w-lg mx-auto">
        {hasPlayedThisDevice ? (
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
        ) : (
          <motion.button
            type="button"
            whileHover={{ y: -1 }}
            whileTap={{ scale: 0.985 }}
            onClick={onStartClick}
            className="flex-1 bg-amber-400 hover:bg-amber-300 text-slate-950 font-extrabold text-sm sm:text-base py-3.5 px-6 rounded-xl transition-colors cursor-pointer inline-flex items-center justify-center gap-2 whitespace-nowrap"
          >
            {sessionMode === 'live_waiting' ? (
              <>
                <Users className="w-4 h-4" /> Gabung Ruang Tunggu Live
              </>
            ) : (
              <>
                <Play className="w-4 h-4 fill-current" /> Mulai Kuis Sekarang
              </>
            )}
          </motion.button>
        )}

        {(leaderboardCount > 0 || hasPlayedThisDevice) && (
          <motion.button
            type="button"
            whileHover={{ y: -1 }}
            whileTap={{ scale: 0.985 }}
            onClick={onOpenLeaderboard}
            className="bg-[#0B1120] hover:bg-slate-800 text-slate-100 font-semibold text-sm sm:text-base py-3.5 px-5 rounded-xl border border-[#23304C] transition-colors cursor-pointer inline-flex items-center justify-center gap-2 whitespace-nowrap"
          >
            <Trophy className="w-4 h-4 text-amber-400" /> Lihat Leaderboard
          </motion.button>
        )}
      </div>
    </motion.section>
  );
};
