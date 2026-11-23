import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Award, Crown, Home, Medal, RefreshCw } from 'lucide-react';
import type { PlayerRecord } from '../quiz/types';
import { GleamingTrophyIcon } from './AnimatedIcons';

interface LeaderboardScreenProps {
  deviceId: string;
  totalQuestions: number;
  leaderboard: PlayerRecord[];
  playerResult: PlayerRecord | null;
  onRefresh: () => Promise<void>;
  onBackToLobby: () => void;
}

export const LeaderboardScreen: React.FC<LeaderboardScreenProps> = ({
  deviceId,
  totalQuestions,
  leaderboard,
  playerResult,
  onRefresh,
  onBackToLobby,
}) => {
  const [refreshing, setRefreshing] = useState(false);
  const sorted = [...leaderboard].sort((a, b) => (b.score || 0) - (a.score || 0));

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await onRefresh();
    } finally {
      setTimeout(() => setRefreshing(false), 350);
    }
  };

  return (
    <motion.section
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
      aria-label="Papan Peringkat"
      className="bg-[#131C31] border border-[#23304C] rounded-2xl p-5 sm:p-9 shadow-xl"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#23304C] pb-5 mb-6">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-amber-400 text-slate-950 flex items-center justify-center shrink-0">
            <GleamingTrophyIcon className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-extrabold text-white">
              Papan Peringkat
            </h2>
            <p className="text-xs sm:text-sm text-slate-400">
              Klasemen skor tertinggi seluruh peserta secara real-time
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleRefresh}
            className="bg-[#0B1120] hover:bg-slate-800 text-amber-300 font-bold text-xs px-3.5 py-2.5 rounded-lg border border-[#23304C] inline-flex items-center gap-1.5 cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <button
            type="button"
            onClick={onBackToLobby}
            className="bg-[#0B1120] hover:bg-slate-800 text-white font-semibold text-xs px-3.5 py-2.5 rounded-lg border border-[#23304C] inline-flex items-center gap-1.5 cursor-pointer"
          >
            <Home className="w-3.5 h-3.5" /> Beranda
          </button>
        </div>
      </div>

      {/* Ringkasan Hasil Pemain */}
      {playerResult && (
        <div className="bg-[#0B1120] border border-amber-400/30 rounded-xl p-4 sm:p-5 mb-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
          <div>
            <div className="text-xs text-slate-400 font-medium">
              Hasil Permainanmu
            </div>
            <div className="text-lg sm:text-xl font-extrabold text-white mt-0.5">
              {playerResult.name}
            </div>
          </div>
          <div className="flex items-center gap-6">
            <div>
              <div className="text-xs text-slate-400">Benar</div>
              <div className="font-mono-num text-lg sm:text-xl font-extrabold text-emerald-400">
                {playerResult.correct}/{playerResult.totalQuestions || totalQuestions}
              </div>
            </div>
            <div className="h-8 w-px bg-[#23304C]" />
            <div>
              <div className="text-xs text-slate-400">Total Skor</div>
              <div className="font-mono-num text-xl sm:text-2xl font-extrabold text-amber-400">
                {playerResult.score}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tabel Leaderboard */}
      <div className="bg-[#0B1120] border border-[#23304C] rounded-xl overflow-hidden mb-7">
        <div className="grid grid-cols-12 px-4 py-3 text-xs font-semibold text-slate-400 border-b border-[#23304C]">
          <div className="col-span-2 text-center">Rank</div>
          <div className="col-span-5">Nama Pemain</div>
          <div className="col-span-2 text-center">Benar</div>
          <div className="col-span-3 text-right">Skor</div>
        </div>

        <div className="divide-y divide-[#23304C]/70 max-h-80 overflow-y-auto">
          {sorted.length === 0 ? (
            <div className="p-8 text-center text-sm text-slate-400">
              Belum ada peserta yang menyelesaikan kuis.
            </div>
          ) : (
            sorted.map((player, index) => {
              const rank = index + 1;
              const isMe = player.deviceId === deviceId;
              return (
                <div
                  key={player.deviceId || `${player.name}-${index}`}
                  className={`grid grid-cols-12 items-center px-4 py-3 text-sm ${
                    isMe ? 'bg-amber-400/10 font-bold' : ''
                  }`}
                >
                  <div className="col-span-2 flex justify-center font-mono-num">
                    {rank === 1 ? (
                      <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-amber-400 text-slate-950">
                        <Crown className="w-3.5 h-3.5" />
                      </span>
                    ) : rank === 2 ? (
                      <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-slate-300 text-slate-950">
                        <Medal className="w-3.5 h-3.5" />
                      </span>
                    ) : rank === 3 ? (
                      <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-amber-700 text-white">
                        <Award className="w-3.5 h-3.5" />
                      </span>
                    ) : (
                      <span className="text-slate-300 font-bold">#{rank}</span>
                    )}
                  </div>
                  <div className="col-span-5 truncate pr-2 text-white">
                    {player.name}
                    {isMe && (
                      <span className="ml-1.5 text-xs text-amber-300 font-semibold">
                        (Kamu)
                      </span>
                    )}
                  </div>
                  <div className="col-span-2 text-center font-mono-num text-emerald-400 font-semibold">
                    {player.correct}/{player.totalQuestions || totalQuestions}
                  </div>
                  <div className="col-span-3 text-right font-mono-num font-extrabold text-amber-400">
                    {player.score}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Kunci Jawaban & Pembahasan */}
      {playerResult &&
        Array.isArray(playerResult.history) &&
        playerResult.history.length > 0 && (
          <div>
            <h3 className="text-base sm:text-lg font-extrabold text-white mb-3">
              Kunci Jawaban &amp; Pembahasan
            </h3>
            <div className="space-y-2.5 max-h-96 overflow-y-auto pr-1">
              {playerResult.history.map((item, idx) => (
                <div
                  key={idx}
                  className={`p-4 rounded-xl border ${
                    item.isCorrect
                      ? 'bg-emerald-500/5 border-emerald-400/30'
                      : 'bg-rose-500/5 border-rose-400/30'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 text-xs mb-1.5">
                    <span
                      className={`font-bold ${
                        item.isCorrect ? 'text-emerald-400' : 'text-rose-400'
                      }`}
                    >
                      Soal {idx + 1} · {item.isCorrect ? 'Benar' : 'Salah'}
                    </span>
                    <span className="text-slate-400">{item.category}</span>
                  </div>
                  <p className="font-bold text-sm text-white mb-2">
                    {item.question}
                  </p>
                  <div className="text-xs space-y-1 mb-2">
                    <div
                      className={
                        item.isCorrect ? 'text-emerald-300' : 'text-rose-300'
                      }
                    >
                      <strong>Jawabanmu:</strong> {item.userAnswer}
                    </div>
                    {!item.isCorrect && (
                      <div className="text-emerald-300">
                        <strong>Kunci Jawaban:</strong> {item.correctAnswer}
                      </div>
                    )}
                  </div>
                  <p className="text-xs text-slate-300 bg-[#0B1120] border border-[#23304C] p-2.5 rounded-lg">
                    {item.explanation}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
    </motion.section>
  );
};
