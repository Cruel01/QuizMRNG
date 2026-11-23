import React from 'react';

interface IconProps {
  className?: string;
}

/**
 * Custom animated Hourglass SVG: smoothly flips 180deg while sand grains drop.
 */
export const SpinningHourglassIcon: React.FC<
  IconProps & { fast?: boolean }
> = ({ className = 'w-6 h-6', fast = false }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    aria-hidden="true"
    className={`${className} anim-hourglass-flip`}
    style={fast ? { animationDuration: '1.3s' } : undefined}
  >
    <path
      d="M6 3h12M6 21h12"
      stroke="currentColor"
      strokeWidth="2.1"
      strokeLinecap="round"
    />
    <path
      d="M7.5 3v3.8c0 2.1 1.6 3.7 3.7 4.7l.8.5.8-.5c2.1-1 3.7-2.6 3.7-4.7V3"
      stroke="currentColor"
      strokeWidth="1.9"
      strokeLinejoin="round"
    />
    <path
      d="M7.5 21v-3.8c0-2.1 1.6-3.7 3.7-4.7l.8-.5.8.5c2.1 1 3.7 2.6 3.7 4.7V21"
      stroke="currentColor"
      strokeWidth="1.9"
      strokeLinejoin="round"
    />
    {/* Upper sand */}
    <path
      d="M9.3 6.2h5.4c-.3 1.4-1.4 2.5-2.7 3.1-1.3-.6-2.4-1.7-2.7-3.1Z"
      fill="currentColor"
      fillOpacity="0.45"
    />
    {/* Falling sand grain */}
    <circle cx="12" cy="13.5" r="0.95" fill="currentColor" className="anim-sand-drop" />
    {/* Lower sand mound */}
    <path
      d="M8.8 19.5c.8-1.4 2-2.2 3.2-2.2s2.4.8 3.2 2.2H8.8Z"
      fill="currentColor"
      fillOpacity="0.85"
    />
  </svg>
);

/**
 * Custom live radar / broadcast signal SVG for Waiting Room.
 */
export const LiveRadarIcon: React.FC<IconProps> = ({
  className = 'w-8 h-8',
}) => (
  <svg viewBox="0 0 32 32" fill="none" aria-hidden="true" className={className}>
    <circle
      cx="16"
      cy="16"
      r="10"
      stroke="currentColor"
      strokeWidth="1.6"
      className="anim-radar-ping"
    />
    <circle
      cx="16"
      cy="16"
      r="10"
      stroke="currentColor"
      strokeWidth="1.6"
      className="anim-radar-ping"
      style={{ animationDelay: '1.1s' }}
    />
    <circle cx="16" cy="16" r="4.5" fill="currentColor" />
    <path
      d="M9.5 11.2a8 8 0 0 0 0 9.6M22.5 11.2a8 8 0 0 1 0 9.6"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    />
  </svg>
);

/**
 * Expressive dynamic Streak Flame SVG whose dance intensifies with higher streaks.
 */
export const AnimatedFlameIcon: React.FC<
  IconProps & { active?: boolean }
> = ({ className = 'w-4 h-4', active = false }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    aria-hidden="true"
    className={`${className} ${active ? 'anim-flame-dance' : ''}`}
  >
    <path
      d="M12.3 2.5c.5 2.7-.8 4.4-2.1 5.9-1.1 1.3-2.2 2.6-2.2 4.6 0 2.5 1.8 4.5 4.2 4.8-1.1-.9-1.5-2.1-1.2-3.4.3-1.1 1.1-1.9 1.9-2.8.8 1.1 1.9 2 1.9 3.6 0 .9-.3 1.7-.9 2.3 2.4-.5 4.1-2.6 4.1-5.2 0-3.3-2.3-5.9-5.7-9.8Z"
      fill="currentColor"
      fillOpacity={active ? '0.95' : '0.65'}
    />
    <path
      d="M12.2 21.2c3.8 0 6.8-2.9 6.8-6.9 0-3.6-2.4-6.7-6.3-11-.2 2.4-1.4 3.9-2.6 5.3-1.2 1.4-2.3 2.8-2.3 5 0 4.3 2.2 7.6 4.4 7.6Z"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinejoin="round"
    />
  </svg>
);

/**
 * Floating Nusantara Compass / Globe-Star emblem for Wawasan Nusantara.
 */
export const NusantaraCompassIcon: React.FC<IconProps> = ({
  className = 'w-5 h-5',
}) => (
  <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className={className}>
    <circle
      cx="12"
      cy="12"
      r="9"
      stroke="currentColor"
      strokeWidth="1.8"
    />
    <path
      d="M15.8 8.2l-2.2 5.4-5.4 2.2 2.2-5.4 5.4-2.2Z"
      fill="currentColor"
      fillOpacity="0.25"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinejoin="round"
    />
    <circle cx="12" cy="12" r="1.1" fill="currentColor" />
  </svg>
);

/**
 * Custom gleaming Trophy with animated star glint for #1 / Results.
 */
export const GleamingTrophyIcon: React.FC<IconProps> = ({
  className = 'w-5 h-5',
}) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    aria-hidden="true"
    className={`${className} anim-float-gentle`}
  >
    <path
      d="M7 4h10v5a5 5 0 0 1-10 0V4Z"
      fill="currentColor"
      fillOpacity="0.22"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinejoin="round"
    />
    <path
      d="M7 5.5H4.5a1.5 1.5 0 0 0-1.5 1.5v1a3 3 0 0 0 3 3h1.2M17 5.5h2.5A1.5 1.5 0 0 1 21 7v1a3 3 0 0 1-3 3h-1.2"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
    />
    <path
      d="M12 14v4M8.5 20h7"
      stroke="currentColor"
      strokeWidth="1.9"
      strokeLinecap="round"
    />
  </svg>
);
