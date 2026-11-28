import React, { useMemo, useState } from 'react';
import { motion } from 'motion/react';
import {
  Award,
  CheckCircle2,
  Crown,
  Home,
  Medal,
  RefreshCw,
  RotateCcw,
  Users,
  Volume2,
  VolumeX,
} from 'lucide-react';
import {
  aggregateTeamLeaderboard,
  mergeLiveAndFinishedLeaderboard,
} from '../quiz/engine';
import { playPopClickFx } from '../quiz/soundFx';
import type { ActivePlayer, PlayerRecord } from '../quiz/types';
import { GleamingTrophyIcon } from './AnimatedIcons';
import { ConfettiBurst } from './ConfettiBurst';

interface LeaderboardScreenProps {
  deviceId: string;
  totalQuestions: number;
  leaderboard: PlayerRecord[];
  activePlayers?: ActivePlayer[];
  playerResult: PlayerRecord | null;
  allowReplay: boolean;
  showConfetti: boolean;
  isMuted: boolean;
  onToggleMute: () => void;
  onRefresh: () => Promise<void>;
  onReplay: () => void;
  onBackToLobby: () => void;
}

export const LeaderboardScreen: React.FC<LeaderboardScreenProps> = ({
  deviceId,
  totalQuestions,
  leaderboard,
  activePlayers = [],
  playerResult,
  allowReplay,
  showConfetti,
  isMuted,
  onToggleMute,
  onRefresh,
  onReplay,
  onBackToLobby,
}) => {
  const [refreshing, setRefreshing] = useState(false);
  const [reviewFilter, setReviewFilter] = useState<'all' | 'wrong'>('all');
  const [standingsTab, setStandingsTab] = useState<'individual' | 'team'>(
    'individual'
  );

  const mergedRows = useMemo(
    () =>
      mergeLiveAndFinishedLeaderboard(
        leaderboard,
        activePlayers,
        totalQuestions
      ),
    [leaderboard, activePlayers, totalQuestions]
  );

  const teamStandings = useMemo(
    () => aggregateTeamLeaderboard(mergedRows),
    [mergedRows]
  );

  const hasAnyTeams = useMemo(
    () => mergedRows.some((p) => Boolean(p.teamName && p.teamName.trim())),
    [mergedRows]
  );

  const rankInfo = useMemo(() => {
    const idx = mergedRows.findIndex((p) => p.deviceId === deviceId);
    return {
      rank: idx >= 0 ? idx + 1 : null,
      total: mergedRows.length,
    };
  }, [mergedRows, deviceId]);

  const wrongCount = useMemo(() => {
    if (!playerResult || !Array.isArray(playerResult.history)) return 0;
    return playerResult.history.filter((h) => !h.isCorrect).length;
  }, [playerResult]);

  const filteredHistory = useMemo(() => {
    if (!playerResult || !Array.isArray(playerResult.history)) return [];
    if (reviewFilter === 'wrong') {
      return playerResult.history
        .map((item, idx) => ({ item, idx }))
        .filter(({ item }) => !item.isCorrect);
    }
    return playerResult.history.map((item, idx) => ({ item, idx }));
  }, [playerResult, reviewFilter]);

  const handleRefresh = async () => {
    playPopClickFx();
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
      className="relative bg-[#131C31] border border-[#23304C] rounded-2xl p-5 sm:p-9 shadow-xl overflow-hidden"
    >
      <ConfettiBurst active={showConfetti} />

      <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#23304C] pb-5 mb-6">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-amber-400 text-slate-950 flex items-center justify-center shrink-0 arcade-btn-amber">
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

        <div className="flex flex-wrap items-center gap-2">
          {allowReplay && (
            <button
              type="button"
              onClick={() => {
                playPopClickFx();
                onReplay();
              }}
              className="arcade-btn-amber bg-amber-400 hover:bg-amber-300 text-slate-950 font-extrabold text-xs px-3.5 py-2.5 rounded-lg inline-flex items-center gap-1.5 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" /> Main Lagi
            </button>
          )}
          <button
            type="button"
            onClick={handleRefresh}
            className="arcade-btn bg-[#0B1120] hover:bg-slate-800 text-amber-300 font-bold text-xs px-3.5 py-2.5 rounded-lg border border-[#23304C] inline-flex items-center gap-1.5 cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <button
            type="button"
            onClick={() => {
              playPopClickFx();
              onBackToLobby();
            }}
            className="arcade-btn bg-[#0B1120] hover:bg-slate-800 text-white font-semibold text-xs px-3.5 py-2.5 rounded-lg border border-[#23304C] inline-flex items-center gap-1.5 cursor-pointer"
          >
            <Home className="w-3.5 h-3.5" /> Beranda
          </button>
          <button
            type="button"
            onClick={onToggleMute}
            aria-label={isMuted ? 'Aktifkan suara efek' : 'Bisukan suara efek'}
            title={isMuted ? 'Aktifkan suara efek' : 'Bisukan suara efek'}
            className="arcade-btn p-2 rounded-lg bg-[#0B1120] border border-[#23304C] text-slate-200 hover:bg-slate-800 cursor-pointer"
          >
            {isMuted ? (
              <VolumeX className="w-4 h-4 text-rose-400" />
            ) : (
              <Volume2 className="w-4 h-4 text-emerald-400" />
            )}
          </button>
        </div>
      </div>

      {/* Ringkasan Hasil Pemain */}
      {playerResult && (
        <div className="relative z-10 bg-[#0B1120] border border-amber-400/35 rounded-xl p-4 sm:p-5 mb-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
          <div>
            <div className="text-xs text-slate-400 font-medium">
              Hasil Permainanmu
            </div>
            <div className="text-lg sm:text-xl font-extrabold text-white mt-0.5">
              {playerResult.name}
              {playerResult.teamName && (
                <span className="ml-2 text-xs font-bold text-sky-300">
                  · Tim {playerResult.teamName}
                </span>
              )}
            </div>
            {rankInfo.rank !== null && (
              <div className="text-xs font-bold text-amber-300 mt-1 font-mono-num">
                Peringkatmu saat ini: #{rankInfo.rank} dari {rankInfo.total} peserta
              </div>
            )}
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

      {/* Tab Klasemen Individu vs Tim (bila ada peserta bertim) */}
      {hasAnyTeams && (
        <div className="relative z-10 inline-flex items-center gap-1 p-1 bg-[#0B1120] border border-[#23304C] rounded-xl mb-3">
          <button
            type="button"
            onClick={() => {
              playPopClickFx();
              setStandingsTab('individual');
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer ${
              standingsTab === 'individual'
                ? 'bg-amber-400 text-slate-950'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            Individu ({mergedRows.length})
          </button>
          <button
            type="button"
            onClick={() => {
              playPopClickFx();
              setStandingsTab('team');
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer inline-flex items-center gap-1.5 ${
              standingsTab === 'team'
                ? 'bg-amber-400 text-slate-950'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            <Users className="w-3.5 h-3.5" /> Tim / Kru ({teamStandings.length})
          </button>
        </div>
      )}

      {/* Tabel Leaderboard */}
      {standingsTab === 'individual' || !hasAnyTeams ? (
        <div className="relative z-10 bg-[#0B1120] border border-[#23304C] rounded-xl overflow-hidden mb-7">
          <div className="grid grid-cols-12 px-4 py-3 text-xs font-semibold text-slate-400 border-b border-[#23304C]">
            <div className="col-span-2 text-center">Rank</div>
            <div className="col-span-5">Nama Pemain</div>
            <div className="col-span-2 text-center">Benar</div>
            <div className="col-span-3 text-right">Skor</div>
          </div>

          <div className="divide-y divide-[#23304C]/70 max-h-80 overflow-y-auto">
            {mergedRows.length === 0 ? (
              <div className="p-8 text-center text-sm text-slate-400">
                Belum ada peserta yang bermain atau menyelesaikan kuis.
              </div>
            ) : (
              mergedRows.map((player, index) => {
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
                      <div className="truncate">
                        {player.name}
                        {isMe && (
                          <span className="ml-1.5 text-xs text-amber-300 font-semibold">
                            (Kamu)
                          </span>
                        )}
                      </div>
                      <div className="flex flex-wrap items-center gap-1.5 text-[11px] font-semibold truncate">
                        {player.teamName && (
                          <span className="text-sky-300">
                            Tim {player.teamName} ·
                          </span>
                        )}
                        <span
                          className={`font-mono-num ${
                            player.status === 'finished'
                              ? 'text-emerald-400'
                              : 'text-sky-300'
                          }`}
                        >
                          {player.status === 'finished'
                            ? 'Selesai'
                            : `Bermain · Soal ${player.currentQuestion}/${player.totalQuestions}`}
                        </span>
                      </div>
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
      ) : (
        <div className="relative z-10 bg-[#0B1120] border border-[#23304C] rounded-xl overflow-hidden mb-7">
          <div className="grid grid-cols-12 px-4 py-3 text-xs font-semibold text-slate-400 border-b border-[#23304C]">
            <div className="col-span-2 text-center">Rank</div>
            <div className="col-span-5">Tim / Kru</div>
            <div className="col-span-2 text-center">Anggota</div>
            <div className="col-span-3 text-right">Total Skor</div>
          </div>
          <div className="divide-y divide-[#23304C]/70 max-h-80 overflow-y-auto">
            {teamStandings.map((team, idx) => (
              <div
                key={team.teamName}
                className="grid grid-cols-12 items-center px-4 py-3 text-sm"
              >
                <div className="col-span-2 text-center font-mono-num font-bold text-sky-300">
                  #{idx + 1}
                </div>
                <div className="col-span-5 truncate pr-2">
                  <div className="font-bold text-white truncate">
                    {team.teamName}
                  </div>
                  <div className="text-[11px] text-slate-400 truncate">
                    {team.members.join(', ')}
                  </div>
                </div>
                <div className="col-span-2 text-center font-mono-num text-slate-300">
                  {team.memberCount}
                </div>
                <div className="col-span-3 text-right font-mono-num font-extrabold text-amber-400">
                  {team.totalScore}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Kunci Jawaban & Pembahasan + Filter Salah Saja */}
      {playerResult &&
        Array.isArray(playerResult.history) &&
        playerResult.history.length > 0 && (
          <div className="relative z-10">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
              <h3 className="text-base sm:text-lg font-extrabold text-white">
                Kunci Jawaban &amp; Pembahasan
              </h3>
              <div
                role="tablist"
                aria-label="Filter Pembahasan"
                className="inline-flex items-center gap-1 p-1 bg-[#0B1120] border border-[#23304C] rounded-xl w-fit"
              >
                <button
                  type="button"
                  role="tab"
                  aria-selected={reviewFilter === 'all'}
                  onClick={() => {
                    playPopClickFx();
                    setReviewFilter('all');
                  }}
                  className={`px-3 py-1 rounded-lg text-xs font-bold cursor-pointer ${
                    reviewFilter === 'all'
                      ? 'bg-amber-400 text-slate-950'
                      : 'text-slate-300 hover:text-white'
                  }`}
                >
                  Semua ({playerResult.history.length})
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={reviewFilter === 'wrong'}
                  onClick={() => {
                    playPopClickFx();
                    setReviewFilter('wrong');
                  }}
                  className={`px-3 py-1 rounded-lg text-xs font-bold cursor-pointer ${
                    reviewFilter === 'wrong'
                      ? 'bg-rose-500 text-white'
                      : 'text-slate-300 hover:text-white'
                  }`}
                >
                  Salah Saja ({wrongCount})
                </button>
              </div>
            </div>

            {filteredHistory.length === 0 ? (
              <div className="bg-emerald-500/10 border border-emerald-400/30 rounded-xl p-5 text-center text-sm text-emerald-300 font-semibold flex items-center justify-center gap-2">
                <CheckCircle2 className="w-5 h-5" />
                <span>Sempurna! Tidak ada jawaban yang salah pada sesi ini.</span>
              </div>
            ) : (
              <div className="space-y-2.5 max-h-96 overflow-y-auto pr-1">
                {filteredHistory.map(({ item, idx }) => (
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
            )}
          </div>
        )}
    </motion.section>
  );
};
