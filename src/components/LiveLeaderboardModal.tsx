import React, { useMemo, useState } from 'react';
import { Trophy, Users, X } from 'lucide-react';
import {
  aggregateTeamLeaderboard,
  mergeLiveAndFinishedLeaderboard,
} from '../quiz/engine';
import { playPopClickFx } from '../quiz/soundFx';
import type { ActivePlayer, PlayerRecord } from '../quiz/types';

interface LiveLeaderboardModalProps {
  isOpen: boolean;
  onClose: () => void;
  leaderboard: PlayerRecord[];
  activePlayers: ActivePlayer[];
  totalQuestions: number;
  selfDeviceId: string;
}

export const LiveLeaderboardModal: React.FC<LiveLeaderboardModalProps> = ({
  isOpen,
  onClose,
  leaderboard,
  activePlayers,
  totalQuestions,
  selfDeviceId,
}) => {
  const [tab, setTab] = useState<'individual' | 'team'>('individual');

  const mergedRows = useMemo(
    () => mergeLiveAndFinishedLeaderboard(leaderboard, activePlayers, totalQuestions),
    [leaderboard, activePlayers, totalQuestions]
  );

  const teamRows = useMemo(
    () => aggregateTeamLeaderboard(mergedRows),
    [mergedRows]
  );

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="live-lb-modal-title"
      className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
    >
      <div className="bg-[#131C31] border border-[#23304C] rounded-2xl p-5 sm:p-6 max-w-xl w-full shadow-2xl max-h-[88vh] flex flex-col">
        <div className="flex items-center justify-between gap-3 border-b border-[#23304C] pb-3.5 mb-4">
          <div className="flex items-center gap-2.5">
            <Trophy className="w-5 h-5 text-amber-400" />
            <div>
              <h3
                id="live-lb-modal-title"
                className="text-base sm:text-lg font-extrabold text-white"
              >
                Klasemen Sementara (Live)
              </h3>
              <p className="text-[11px] text-slate-400">
                Menggabungkan peserta yang sedang bermain &amp; yang sudah selesai
              </p>
            </div>
          </div>
          <button
            type="button"
            aria-label="Tutup klasemen sementara"
            onClick={onClose}
            className="text-slate-400 hover:text-white cursor-pointer p-1"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="inline-flex items-center gap-1 p-1 bg-[#0B1120] border border-[#23304C] rounded-xl w-fit mb-4">
          <button
            type="button"
            onClick={() => {
              playPopClickFx();
              setTab('individual');
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer ${
              tab === 'individual'
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
              setTab('team');
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer inline-flex items-center gap-1.5 ${
              tab === 'team'
                ? 'bg-amber-400 text-slate-950'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            <Users className="w-3.5 h-3.5" /> Tim / Kru ({teamRows.length})
          </button>
        </div>

        <div className="bg-[#0B1120] border border-[#23304C] rounded-xl overflow-y-auto divide-y divide-[#23304C]/70 flex-1">
          {tab === 'individual' ? (
            mergedRows.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400">
                Belum ada peserta aktif maupun selesai di ruangan ini.
              </div>
            ) : (
              mergedRows.map((row, idx) => {
                const isMe = row.deviceId === selfDeviceId;
                return (
                  <div
                    key={row.deviceId}
                    className={`flex items-center justify-between gap-3 px-4 py-3 text-xs sm:text-sm ${
                      isMe ? 'bg-amber-400/10' : ''
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="font-mono-num font-extrabold text-amber-300 w-7 shrink-0">
                        #{idx + 1}
                      </span>
                      <div className="min-w-0">
                        <div className="font-bold text-white truncate">
                          {row.name}
                          {isMe && (
                            <span className="ml-1.5 text-[11px] text-amber-300">
                              (Kamu)
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-400 font-mono-num">
                          {row.teamName ? `Tim ${row.teamName} · ` : ''}
                          {row.status === 'finished'
                            ? `Selesai (${row.correct}/${row.totalQuestions})`
                            : `Bermain · Soal ${row.currentQuestion}/${row.totalQuestions}`}
                        </div>
                      </div>
                    </div>
                    <div className="font-mono-num font-extrabold text-amber-400 shrink-0">
                      {row.score}
                    </div>
                  </div>
                );
              })
            )
          ) : teamRows.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-400">
              Belum ada data tim.
            </div>
          ) : (
            teamRows.map((t, idx) => (
              <div
                key={t.teamName}
                className="flex items-center justify-between gap-3 px-4 py-3 text-xs sm:text-sm"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span className="font-mono-num font-extrabold text-sky-300 w-7 shrink-0">
                    #{idx + 1}
                  </span>
                  <div className="min-w-0">
                    <div className="font-bold text-white truncate">
                      {t.teamName}
                    </div>
                    <div className="text-[11px] text-slate-400 truncate">
                      {t.memberCount} anggota · Rata-rata {t.avgScore} poin
                    </div>
                  </div>
                </div>
                <div className="font-mono-num font-extrabold text-amber-400 shrink-0">
                  {t.totalScore}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
