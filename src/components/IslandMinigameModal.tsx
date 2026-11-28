import React, { useEffect, useState } from 'react';
import { Anchor, Compass, Gem, Navigation, Sparkles, Tornado, Waves } from 'lucide-react';
import { rollIslandRewardPowerup } from '../quiz/engine';
import { POWERUP_CATALOG } from '../quiz/questions';
import { playChestRewardFx, playPopClickFx } from '../quiz/soundFx';
import type { PowerupId, VoyageCheckpoint } from '../quiz/types';

export interface IslandMinigameReward {
  powerupId: PowerupId | null;
  bonusPoints: number;
  islandName: string;
}

interface IslandMinigameModalProps {
  island: VoyageCheckpoint;
  gamificationEnabled?: boolean;
  enabledPowerups?: PowerupId[];
  onComplete: (reward: IslandMinigameReward) => void;
}

type MinigameKind = 'chest' | 'helm' | 'compass';

const COMPASS_DIRS = [
  { id: 'U', label: 'Utara' },
  { id: 'T', label: 'Timur' },
  { id: 'S', label: 'Selatan' },
  { id: 'B', label: 'Barat' },
] as const;

export const IslandMinigameModal: React.FC<IslandMinigameModalProps> = ({
  island,
  gamificationEnabled = true,
  enabledPowerups,
  onComplete,
}) => {
  const gameKind: MinigameKind =
    island.islandIndex % 3 === 0
      ? 'chest'
      : island.islandIndex % 3 === 1
        ? 'helm'
        : 'compass';

  const [reward, setReward] = useState<IslandMinigameReward | null>(null);
  const [selectedChest, setSelectedChest] = useState<number | null>(null);

  // Helm wave timing state (0..100 needle)
  const [needlePos, setNeedlePos] = useState(15);
  const [helmStopped, setHelmStopped] = useState(false);

  // Compass target state
  const [targetDir] = useState(
    () => COMPASS_DIRS[Math.floor(Math.random() * COMPASS_DIRS.length)]
  );
  const [compassPick, setCompassPick] = useState<string | null>(null);

  useEffect(() => {
    if (gameKind !== 'helm' || helmStopped || reward) return;
    let pos = 10;
    let dir = 1;
    const id = window.setInterval(() => {
      pos += dir * 6;
      if (pos >= 94) {
        pos = 94;
        dir = -1;
      } else if (pos <= 6) {
        pos = 6;
        dir = 1;
      }
      setNeedlePos(pos);
    }, 45);
    return () => window.clearInterval(id);
  }, [gameKind, helmStopped, reward]);

  const grantIslandLoot = (bonusPoints: number, favorDebuff: boolean) => {
    playChestRewardFx();
    const rolled = rollIslandRewardPowerup(
      gamificationEnabled,
      enabledPowerups,
      favorDebuff
    );
    setReward({
      powerupId: rolled,
      bonusPoints,
      islandName: island.name,
    });
  };

  const handlePickChest = (chestIdx: number) => {
    if (reward) return;
    playPopClickFx();
    setSelectedChest(chestIdx);
    const pointsPool = [75, 100, 150];
    const bonus = pointsPool[Math.floor(Math.random() * pointsPool.length)];
    grantIslandLoot(bonus, chestIdx === 1 || Math.random() < 0.35);
  };

  const handleStopHelm = () => {
    if (helmStopped || reward) return;
    playPopClickFx();
    setHelmStopped(true);
    const inSweetSpot = needlePos >= 36 && needlePos <= 64;
    grantIslandLoot(inSweetSpot ? 150 : 60, inSweetSpot);
  };

  const handlePickCompass = (dirId: string) => {
    if (reward) return;
    playPopClickFx();
    setCompassPick(dirId);
    const matched = dirId === targetDir.id;
    grantIslandLoot(matched ? 125 : 50, matched);
  };

  const rewardSpec =
    reward && reward.powerupId ? POWERUP_CATALOG[reward.powerupId] : null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="island-minigame-title"
      className="fixed inset-0 bg-slate-950/85 backdrop-blur-sm z-50 flex items-center justify-center p-4"
    >
      <div className="bg-[#131C31] border border-amber-400/40 rounded-2xl p-6 sm:p-7 max-w-md w-full shadow-2xl text-center">
        <div className="w-12 h-12 rounded-2xl bg-sky-400/15 border border-sky-400/35 text-sky-300 flex items-center justify-center mx-auto mb-3 anim-ship-bob">
          <Anchor className="w-6 h-6" />
        </div>

        <div className="text-[11px] font-mono-num font-extrabold uppercase tracking-wider text-amber-300 mb-1">
          Berlabuh di Pulau {island.islandNumber} · Checkpoint #{island.questionNumber}
        </div>
        <h3
          id="island-minigame-title"
          className="text-xl font-extrabold text-white mb-1"
        >
          {island.name}
        </h3>

        {!reward ? (
          <div className="mt-4">
            {gameKind === 'chest' && (
              <>
                <p className="text-xs text-slate-300 mb-4 leading-relaxed">
                  Awak kapal menemukan 3 peti peninggalan pelaut! Pilih{' '}
                  <strong className="text-amber-300">1 peti harta karun</strong>{' '}
                  {gamificationEnabled &&
                  (!enabledPowerups || enabledPowerups.length > 0)
                    ? 'untuk mendapatkan item aktif & bonus poin pelayaran.'
                    : 'untuk mendapatkan bonus poin pelayaran!'}
                </p>
                <div className="grid grid-cols-3 gap-3">
                  {[0, 1, 2].map((idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handlePickChest(idx)}
                      className={`arcade-btn rounded-xl p-4 border flex flex-col items-center gap-2 cursor-pointer ${
                        selectedChest === idx
                          ? 'bg-amber-400/20 border-amber-400 text-amber-300'
                          : 'bg-[#0B1120] hover:bg-slate-800 border-[#23304C] text-amber-300'
                      }`}
                    >
                      <Gem className="w-7 h-7" />
                      <span className="text-xs font-extrabold text-white">
                        Peti #{idx + 1}
                      </span>
                    </button>
                  ))}
                </div>
              </>
            )}

            {gameKind === 'helm' && (
              <>
                <p className="text-xs text-slate-300 mb-4 leading-relaxed">
                  Ombak besar menerjang teluk! Hentikan jarum kemudi di{' '}
                  <strong className="text-emerald-300">zona emas tengah</strong>{' '}
                  untuk meraih jarahan terbaik.
                </p>
                <div className="bg-[#0B1120] border border-[#23304C] rounded-xl p-4 mb-4">
                  <div className="relative h-6 rounded-full bg-slate-800 overflow-hidden border border-[#23304C]">
                    <div
                      className="absolute inset-y-0 bg-emerald-400/35 border-x border-emerald-400"
                      style={{ left: '36%', width: '28%' }}
                    />
                    <div
                      className="absolute top-0 bottom-0 w-2 rounded-full bg-amber-400 shadow"
                      style={{ left: `calc(${needlePos}% - 4px)` }}
                    />
                  </div>
                  <div className="flex items-center justify-between text-[10px] text-slate-400 mt-2 font-mono-num">
                    <span>Ombak Kiri</span>
                    <span className="text-emerald-300 font-bold">Zona Emas</span>
                    <span>Ombak Kanan</span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleStopHelm}
                  className="arcade-btn-amber w-full bg-amber-400 hover:bg-amber-300 text-slate-950 font-extrabold py-3 rounded-xl inline-flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Waves className="w-4 h-4" /> Tahan Kemudi Sekarang!
                </button>
              </>
            )}

            {gameKind === 'compass' && (
              <>
                <p className="text-xs text-slate-300 mb-3 leading-relaxed">
                  Kompas pulau menunjukkan angin mengarah ke{' '}
                  <strong className="text-amber-300 text-sm">
                    {targetDir.label}
                  </strong>
                  ! Pilih arah kompas yang sesuai untuk membuka suplai kapal.
                </p>
                <div className="grid grid-cols-2 gap-2.5">
                  {COMPASS_DIRS.map((dir) => (
                    <button
                      key={dir.id}
                      type="button"
                      onClick={() => handlePickCompass(dir.id)}
                      className={`arcade-btn rounded-xl p-3.5 border flex items-center justify-center gap-2 text-xs font-extrabold cursor-pointer ${
                        compassPick === dir.id
                          ? 'bg-amber-400 text-slate-950 border-amber-300'
                          : 'bg-[#0B1120] hover:bg-slate-800 border-[#23304C] text-white'
                      }`}
                    >
                      <Navigation className="w-4 h-4 text-sky-400" />
                      <span>{dir.label}</span>
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        ) : (
          <div className="mt-4 space-y-4">
            <div className="bg-[#0B1120] border border-amber-400/40 rounded-xl p-4 text-left">
              <div className="flex items-center justify-between gap-2 mb-2">
                <span className="inline-flex items-center gap-1.5 text-xs font-extrabold text-amber-300">
                  {reward.powerupId === 'TORNADO' ? (
                    <Tornado className="w-4 h-4 text-fuchsia-400" />
                  ) : (
                    <Sparkles className="w-4 h-4 text-amber-300" />
                  )}
                  {rewardSpec
                    ? `Hadiah Pulau: ${rewardSpec.name}`
                    : 'Hadiah Pulau: Harta Karun Ekspedisi'}
                </span>
                <span className="font-mono-num text-xs font-extrabold text-emerald-400">
                  +{reward.bonusPoints} Poin
                </span>
              </div>
              {rewardSpec ? (
                <>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    {rewardSpec.desc}
                  </p>
                  <div className="mt-2 text-[11px] font-semibold text-slate-400">
                    Kategori:{' '}
                    <span
                      className={
                        rewardSpec.kind === 'buff'
                          ? 'text-emerald-400'
                          : 'text-sky-400'
                      }
                    >
                      {rewardSpec.kind === 'buff'
                        ? 'Buff (Keuntungan)'
                        : 'Debuff (Ganggu Lawan)'}
                    </span>
                  </div>
                </>
              ) : (
                <p className="text-xs text-slate-300 leading-relaxed">
                  Ekspedisi pulau berhasil! Bonus poin langsung ditambahkan ke
                  skor pelayaranmu.
                </p>
              )}
            </div>

            <button
              type="button"
              onClick={() => {
                playPopClickFx();
                onComplete(reward);
              }}
              className="arcade-btn-amber w-full bg-amber-400 hover:bg-amber-300 text-slate-950 font-extrabold py-3.5 rounded-xl inline-flex items-center justify-center gap-2 cursor-pointer"
            >
              <Compass className="w-4 h-4" /> Lanjutkan Pelayaran
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
