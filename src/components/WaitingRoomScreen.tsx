import React from 'react';
import { motion } from 'motion/react';
import { LogOut, Trophy, Volume2, VolumeX } from 'lucide-react';
import { playPopClickFx } from '../quiz/soundFx';
import type { WaitingPlayer } from '../quiz/types';
import { LiveRadarIcon, SpinningHourglassIcon } from './AnimatedIcons';

interface WaitingRoomScreenProps {
  playerName: string;
  teamName?: string;
  deviceId: string;
  waitingPlayers: WaitingPlayer[];
  showLiveLeaderboardToPlayers?: boolean;
  onOpenLiveLeaderboard?: () => void;
  isMuted: boolean;
  onToggleMute: () => void;
  onLeave: () => void;
}

export const WaitingRoomScreen: React.FC<WaitingRoomScreenProps> = ({
  playerName,
  teamName,
  deviceId,
  waitingPlayers,
  showLiveLeaderboardToPlayers,
  onOpenLiveLeaderboard,
  isMuted,
  onToggleMute,
  onLeave,
}) => {
  return (
    <motion.section
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
      aria-label="Ruang Tunggu Live"
      className="relative bg-[#131C31] border border-[#23304C] rounded-2xl p-6 sm:p-10 shadow-xl text-center"
    >
      <div className="absolute top-4 right-4 flex items-center gap-2">
        {showLiveLeaderboardToPlayers && onOpenLiveLeaderboard && (
          <button
            type="button"
            onClick={() => {
              playPopClickFx();
              onOpenLiveLeaderboard();
            }}
            className="arcade-btn px-3 py-2 rounded-lg bg-[#0B1120] border border-[#23304C] text-xs font-bold text-amber-300 hover:bg-slate-800 inline-flex items-center gap-1.5 cursor-pointer"
          >
            <Trophy className="w-3.5 h-3.5" /> Klasemen
          </button>
        )}
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

      <div className="w-14 h-14 rounded-2xl bg-amber-400/15 border border-amber-400/30 text-amber-300 flex items-center justify-center mx-auto mb-4">
        <LiveRadarIcon className="w-9 h-9" />
      </div>

      <h2 className="text-xl sm:text-3xl font-extrabold text-white mb-2">
        Menunggu Admin Memulai Kuis
      </h2>
      <p className="text-slate-400 text-xs sm:text-sm max-w-md mx-auto mb-6 leading-relaxed">
        Kamu masuk ruang tunggu sebagai{' '}
        <strong className="text-amber-300">{playerName}</strong>
        {teamName ? (
          <>
            {' '}
            (Tim <strong className="text-sky-300">{teamName}</strong>)
          </>
        ) : null}
        . Kuis akan dimulai serentak begitu Admin menekan tombol Mulai Live.
      </p>

      <div className="bg-[#0B1120] border border-[#23304C] rounded-xl p-4 sm:p-5 max-w-lg mx-auto mb-6 text-left">
        <div className="flex items-center justify-between text-xs font-semibold text-slate-400 mb-3">
          <span className="inline-flex items-center gap-1.5">
            <SpinningHourglassIcon className="w-3.5 h-3.5 text-amber-300" />
            Peserta di Ruang Tunggu
          </span>
          <span className="font-mono-num text-emerald-400">
            {waitingPlayers.length} Bergabung
          </span>
        </div>

        {waitingPlayers.length === 0 ? (
          <p className="text-xs text-slate-500 text-center py-4">
            Menghubungkan ke daftar ruang tunggu...
          </p>
        ) : (
          <div className="flex flex-wrap gap-2 max-h-52 overflow-y-auto">
            {waitingPlayers.map((p) => {
              const isMe = p.deviceId === deviceId;
              return (
                <motion.span
                  key={p.deviceId}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.16 }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold ${
                    isMe
                      ? 'bg-amber-400 text-slate-950'
                      : 'bg-[#131C31] text-slate-200 border border-[#23304C]'
                  }`}
                >
                  {p.name}
                  {p.teamName ? ` · ${p.teamName}` : ''}
                  {isMe ? ' (Kamu)' : ''}
                </motion.span>
              );
            })}
          </div>
        )}
      </div>

      <button
        type="button"
        onClick={() => {
          playPopClickFx();
          onLeave();
        }}
        className="inline-flex items-center gap-1.5 text-xs sm:text-sm text-slate-400 hover:text-white underline py-2 px-4 cursor-pointer"
      >
        <LogOut className="w-3.5 h-3.5" /> Ganti Nama / Keluar Ruang Tunggu
      </button>
    </motion.section>
  );
};
