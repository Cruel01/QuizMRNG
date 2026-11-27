import React from 'react';
import { Anchor, Compass, Flag, MapPin, Ship, Users } from 'lucide-react';
import type { ActivePlayer, VoyageProgressState } from '../quiz/types';

interface VoyageRoadmapProps {
  progress: VoyageProgressState;
  answeredCount: number;
  totalQuestions: number;
  teamName?: string;
  activePlayers: ActivePlayer[];
  selfDeviceId: string;
}

export const VoyageRoadmap: React.FC<VoyageRoadmapProps> = ({
  progress,
  answeredCount,
  totalQuestions,
  teamName,
  activePlayers,
  selfDeviceId,
}) => {
  const { checkpoints, completedIslands, legStep, nextIsland, dockedIsland, shipPercent } =
    progress;

  const rivalShips = activePlayers
    .filter((p) => p.deviceId && p.deviceId !== selfDeviceId)
    .slice(0, 3);

  return (
    <div
      aria-label="Peta Pelayaran Harta Karun"
      className="bg-[#131C31] border border-[#23304C] rounded-xl p-3.5 sm:px-4 sm:py-3.5 space-y-2.5"
    >
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-2 min-w-0">
          <Compass className="w-4 h-4 text-sky-400 shrink-0" />
          <span className="font-bold text-white truncate">
            {dockedIsland
              ? `Berlabuh di Pulau ${dockedIsland.islandNumber}: ${dockedIsland.name}`
              : nextIsland
                ? `Berlayar ke Pulau ${nextIsland.islandNumber}/${progress.totalIslands}: ${nextIsland.name}`
                : 'Pelayaran Selesai'}
          </span>
          {teamName && (
            <>
              <span className="text-slate-600" aria-hidden="true">
                ·
              </span>
              <span className="inline-flex items-center gap-1 text-amber-300 font-semibold shrink-0">
                <Users className="w-3.5 h-3.5" />
                Tim {teamName}
              </span>
            </>
          )}
        </div>

        <div className="flex items-center gap-2 font-mono-num text-[11px] text-slate-300 shrink-0">
          <span className="text-sky-300 font-bold">
            Langkah {legStep}/3
          </span>
          <span className="text-slate-600" aria-hidden="true">
            ·
          </span>
          <span>
            Pulau {completedIslands}/{progress.totalIslands}
          </span>
          <span className="text-slate-600 hidden sm:inline" aria-hidden="true">
            ·
          </span>
          <span className="hidden sm:inline text-slate-400">
            {answeredCount}/{totalQuestions} soal
          </span>
        </div>
      </div>

      {/* 3-Step Leg Progress Indicator + Sea Map Track */}
      <div className="relative pt-3 pb-1 px-2">
        <div className="relative h-2 rounded-full bg-[#0B1120] border border-[#23304C]">
          <div
            className="h-full rounded-full bg-gradient-to-r from-sky-500 via-cyan-400 to-amber-400 transition-all duration-300"
            style={{ width: `${Math.max(4, shipPercent)}%` }}
          />
        </div>

        {/* Moving Ship Marker */}
        <div
          className="absolute top-0 -translate-x-1/2 transition-all duration-300 pointer-events-none z-10"
          style={{ left: `${Math.max(3, Math.min(97, shipPercent))}%` }}
        >
          <div className="anim-ship-bob w-6 h-6 rounded-lg bg-amber-400 text-slate-950 flex items-center justify-center shadow-md border border-amber-200">
            <Ship className="w-3.5 h-3.5" />
          </div>
        </div>

        {/* Island Checkpoints Row */}
        <div className="mt-3 grid gap-1.5" style={{ gridTemplateColumns: `repeat(${checkpoints.length}, minmax(0, 1fr))` }}>
          {checkpoints.map((cp) => {
            const reached = answeredCount >= cp.questionNumber;
            const isCurrentTarget =
              !reached && nextIsland?.islandIndex === cp.islandIndex;
            return (
              <div
                key={cp.islandIndex}
                title={`Pulau ${cp.islandNumber}: ${cp.name} (Soal #${cp.questionNumber})`}
                className={`rounded-lg px-2 py-1.5 border text-left transition ${
                  reached
                    ? 'bg-emerald-500/15 border-emerald-400/40 text-emerald-200'
                    : isCurrentTarget
                      ? 'bg-sky-500/15 border-sky-400/45 text-sky-200'
                      : 'bg-[#0B1120] border-[#23304C] text-slate-400'
                }`}
              >
                <div className="flex items-center justify-between gap-1 text-[10px] font-mono-num font-bold">
                  <span className="inline-flex items-center gap-1 truncate">
                    {reached ? (
                      <Flag className="w-3 h-3 text-emerald-400 shrink-0" />
                    ) : isCurrentTarget ? (
                      <Anchor className="w-3 h-3 text-sky-400 shrink-0" />
                    ) : (
                      <MapPin className="w-3 h-3 text-slate-500 shrink-0" />
                    )}
                    P{cp.islandNumber}
                  </span>
                  <span>#{cp.questionNumber}</span>
                </div>
                <div className="text-[10px] truncate mt-0.5 font-semibold">
                  {cp.name.replace(/^Pulau\s+/i, '')}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 3-Step Leg Bar & Rival Ships */}
      <div className="flex flex-wrap items-center justify-between gap-2 pt-1 text-[11px] text-slate-400">
        <div className="flex items-center gap-1.5">
          <span>Tahap layar:</span>
          {[1, 2, 3].map((step) => (
            <span
              key={step}
              className={`px-1.5 py-0.5 rounded font-mono-num font-bold border ${
                legStep >= step
                  ? 'bg-sky-400/20 border-sky-400/40 text-sky-200'
                  : 'bg-[#0B1120] border-[#23304C] text-slate-500'
              }`}
            >
              {step === 3 ? '3 · Berlabuh' : `${step}`}
            </span>
          ))}
        </div>

        {rivalShips.length > 0 && (
          <div className="flex items-center gap-2 truncate">
            <span className="text-slate-500">Pelaut lain:</span>
            {rivalShips.map((r) => (
              <span key={r.deviceId} className="font-mono-num text-slate-300">
                {r.name} (#{r.currentQuestion || 1})
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
