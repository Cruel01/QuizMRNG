import React from 'react';
import { motion } from 'motion/react';
import { LogOut } from 'lucide-react';
import type { WaitingPlayer } from '../quiz/types';
import { LiveRadarIcon, SpinningHourglassIcon } from './AnimatedIcons';

interface WaitingRoomScreenProps {
  playerName: string;
  deviceId: string;
  waitingPlayers: WaitingPlayer[];
  onLeave: () => void;
}

export const WaitingRoomScreen: React.FC<WaitingRoomScreenProps> = ({
  playerName,
  deviceId,
  waitingPlayers,
  onLeave,
}) => {
  return (
    <motion.section
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
      aria-label="Ruang Tunggu Live"
      className="bg-[#131C31] border border-[#23304C] rounded-2xl p-6 sm:p-10 shadow-xl text-center"
    >
      <div className="w-14 h-14 rounded-2xl bg-amber-400/15 border border-amber-400/30 text-amber-300 flex items-center justify-center mx-auto mb-4">
        <LiveRadarIcon className="w-9 h-9" />
      </div>

      <h2 className="text-xl sm:text-3xl font-extrabold text-white mb-2">
        Menunggu Admin Memulai Kuis
      </h2>
      <p className="text-slate-400 text-xs sm:text-sm max-w-md mx-auto mb-6 leading-relaxed">
        Kamu masuk ruang tunggu sebagai{' '}
        <strong className="text-amber-300">{playerName}</strong>. Kuis akan
        dimulai serentak begitu Admin menekan tombol Mulai Live.
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
                  {isMe ? ' (Kamu)' : ''}
                </motion.span>
              );
            })}
          </div>
        )}
      </div>

      <button
        type="button"
        onClick={onLeave}
        className="inline-flex items-center gap-1.5 text-xs sm:text-sm text-slate-400 hover:text-white underline py-2 px-4 cursor-pointer"
      >
        <LogOut className="w-3.5 h-3.5" /> Ganti Nama / Keluar Ruang Tunggu
      </button>
    </motion.section>
  );
};
