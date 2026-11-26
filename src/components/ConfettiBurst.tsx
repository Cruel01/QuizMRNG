import React from 'react';

const PIECES = [
  { left: '6%', delay: '0s', color: 'bg-amber-400', size: 'w-2 h-3' },
  { left: '14%', delay: '0.25s', color: 'bg-emerald-400', size: 'w-2.5 h-2.5 rounded-full' },
  { left: '22%', delay: '0.1s', color: 'bg-sky-400', size: 'w-2 h-3' },
  { left: '31%', delay: '0.35s', color: 'bg-rose-400', size: 'w-2 h-2.5' },
  { left: '42%', delay: '0.15s', color: 'bg-amber-300', size: 'w-2.5 h-2.5 rounded-full' },
  { left: '53%', delay: '0.4s', color: 'bg-emerald-300', size: 'w-2 h-3' },
  { left: '64%', delay: '0.08s', color: 'bg-fuchsia-400', size: 'w-2 h-2.5' },
  { left: '74%', delay: '0.3s', color: 'bg-sky-300', size: 'w-2.5 h-2.5 rounded-full' },
  { left: '84%', delay: '0.18s', color: 'bg-amber-400', size: 'w-2 h-3' },
  { left: '92%', delay: '0.42s', color: 'bg-emerald-400', size: 'w-2 h-2.5' },
];

export const ConfettiBurst: React.FC<{ active: boolean }> = ({ active }) => {
  if (!active) return null;
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-x-0 top-0 h-28 overflow-hidden"
    >
      {PIECES.map((p, idx) => (
        <span
          key={idx}
          className={`absolute top-0 rounded-sm anim-confetti ${p.color} ${p.size}`}
          style={{ left: p.left, animationDelay: p.delay }}
        />
      ))}
    </div>
  );
};
