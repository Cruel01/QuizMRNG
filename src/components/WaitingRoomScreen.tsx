import React from 'react';
import { motion } from 'motion/react';
import {
  Compass,
  DoorOpen,
  LogOut,
  Radio,
  Ship,
  Trophy,
  Users,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { playPopClickFx } from '../quiz/soundFx';
import type { GameplayMode, SessionMode, WaitingPlayer } from '../quiz/types';
import { LiveRadarIcon, SpinningHourglassIcon } from './AnimatedIcons';

interface WaitingRoomScreenProps {
  playerName: string;
  teamName?: string;
  roomCode?: string;
  sessionMode?: SessionMode;
  gameplayMode?: GameplayMode;
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
  roomCode,
  sessionMode = 'live_waiting',
  gameplayMode = 'classic',
  deviceId,
  waitingPlayers,
  showLiveLeaderboardToPlayers,
  onOpenLiveLeaderboard,
  isMuted,
  onToggleMute,
  onLeave,
}) => {
  const isVoyage = gameplayMode === 'voyage';
  const isFreeWaiting = sessionMode === 'free_waiting' || sessionMode === 'free';
  const isUnconfigured = sessionMode === 'unconfigured';

  return (
    <motion.section
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
      aria-label={isFreeWaiting ? 'Ruang Tunggu Mode Bebas' : 'Ruang Tunggu Live'}
      className={`relative bg-[#131C31] rounded-2xl p-6 sm:p-9 shadow-xl text-center border ${
        isFreeWaiting ? 'border-emerald-400/35' : 'border-amber-400/35'
      }`}
    >
      {/* Top Context Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#23304C] pb-4 mb-6 text-left">
        <div className="flex flex-wrap items-center gap-2 text-xs text-slate-300 font-mono-num">
          <span
            className={`inline-flex items-center gap-1.5 font-bold ${
              isFreeWaiting ? 'text-emerald-300' : 'text-amber-300'
            }`}
          >
            {isFreeWaiting ? (
              <>
                <Compass className="w-3.5 h-3.5" /> Ruang Tunggu · Mode Bebas
              </>
            ) : (
              <>
                <Radio className="w-3.5 h-3.5" /> Ruang Tunggu · Mode Live
              </>
            )}
          </span>
          <span className="text-slate-600" aria-hidden="true">
            ·
          </span>
          <span className="inline-flex items-center gap-1 text-sky-300 font-bold">
            <DoorOpen className="w-3.5 h-3.5" />{' '}
            {roomCode ? `#${roomCode}` : 'Umum'}
          </span>
          <span className="text-slate-600 hidden sm:inline" aria-hidden="true">
            ·
          </span>
          <span className="hidden sm:inline-flex items-center gap-1 text-slate-300">
            {isVoyage ? (
              <>
                <Ship className="w-3.5 h-3.5 text-sky-300" /> Berlayar Harta
                Karun
              </>
            ) : isFreeWaiting ? (
              'Kuis Mandiri'
            ) : (
              'Kuis Klasik Serentak'
            )}
          </span>
        </div>

        <div className="flex items-center gap-2">
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
      </div>

      {/* Radar & Heading */}
      <div
        className={`w-14 h-14 rounded-2xl border flex items-center justify-center mx-auto mb-4 ${
          isFreeWaiting
            ? 'bg-emerald-400/15 border-emerald-400/30 text-emerald-300'
            : 'bg-amber-400/15 border-amber-400/30 text-amber-300'
        }`}
      >
        {isFreeWaiting ? (
          <Compass className="w-8 h-8" />
        ) : (
          <LiveRadarIcon className="w-9 h-9" />
        )}
      </div>

      <h2 className="text-xl sm:text-3xl font-extrabold text-white mb-2">
        {isUnconfigured
          ? 'Menunggu Admin Memilih Mode'
          : isFreeWaiting
            ? 'Mode Bebas Siap · Menunggu Start Admin'
            : 'Menunggu Admin Memulai Sesi Live'}
      </h2>
      <p className="text-slate-400 text-xs sm:text-sm max-w-lg mx-auto mb-6 leading-relaxed">
        {isUnconfigured ? (
          'Admin sedang meninjau ulang mode pelaksanaan. Tampilan ini akan otomatis menyesuaikan secara real-time.'
        ) : isFreeWaiting ? (
          <>
            Admin memilih <strong className="text-emerald-300">Mode Bebas</strong>.
            Kuis akan langsung terbuka otomatis segera setelah Admin menekan
            tombol <strong className="text-emerald-300">Mulai Mode Bebas</strong>.
          </>
        ) : (
          <>
            Tetap buka halaman ini. Layar pertanyaan akan terbuka secara serentak
            untuk seluruh peserta segera setelah Admin menekan tombol{' '}
            <strong className="text-amber-300">Mulai Live Sekarang</strong>.
          </>
        )}
      </p>

      {/* Identitas Peserta Aktif */}
      <div className="max-w-lg mx-auto mb-4 bg-[#0B1120] border border-[#23304C] rounded-xl px-4 py-3 flex flex-wrap items-center justify-between gap-2 text-left text-xs">
        <div className="min-w-0">
          <div className="text-[11px] text-slate-400">Identitas Kamu</div>
          <div className="font-bold text-white truncate">
            {playerName}
            {isVoyage && (
              <span className="ml-2 text-sky-300 font-semibold">
                {teamName ? `· Tim ${teamName}` : '· Solo'}
              </span>
            )}
          </div>
        </div>
        <span className="font-mono-num text-[11px] font-bold text-emerald-400">
          {isFreeWaiting ? 'Standby Mode Bebas' : 'Siap Mulai Serentak'}
        </span>
      </div>

      {/* Daftar Peserta Standby */}
      <div className="bg-[#0B1120] border border-[#23304C] rounded-xl p-4 sm:p-5 max-w-lg mx-auto mb-6 text-left">
        <div className="flex items-center justify-between text-xs font-semibold text-slate-400 mb-3">
          <span className="inline-flex items-center gap-1.5">
            <SpinningHourglassIcon className="w-3.5 h-3.5 text-amber-300" />
            <span>
              <Users className="w-3.5 h-3.5 inline mr-1 text-slate-400" />
              Peserta Standby di Ruang Tunggu
            </span>
          </span>
          <span className="font-mono-num text-emerald-400 font-bold">
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
                  {isVoyage && p.teamName ? ` · ${p.teamName}` : ''}
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
