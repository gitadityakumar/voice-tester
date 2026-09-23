import React from 'react';

export interface LiveMicIconProps extends React.SVGProps<SVGSVGElement> {
  size?: number | string;
  primaryColor?: string;
  accentColor?: string;
  showWaves?: boolean;
  animate?: boolean;
  isLive?: boolean;
}

export const LiveMicIcon: React.FC<LiveMicIconProps> = ({
  size = 44,
  primaryColor = 'currentColor',
  accentColor = '#10B981',
  showWaves = true,
  animate = true,
  className = '',
  ...props
}) => {
  return (
    <svg
      viewBox="0 0 100 100"
      width={size}
      height={size}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`overflow-visible select-none ${className}`}
      {...props}
    >
      <style>{`
        @keyframes soundWaveRipple {
          0%, 100% {
            opacity: 0.25;
            transform: translateY(1.5px) scale(0.97);
          }
          50% {
            opacity: 1;
            transform: translateY(-1.5px) scale(1.03);
          }
        }
        .sound-wave-1 {
          transform-origin: 50px 25px;
          animation: ${animate ? 'soundWaveRipple 1.5s ease-in-out infinite' : 'none'};
        }
        .sound-wave-2 {
          transform-origin: 50px 18px;
          animation: ${animate ? 'soundWaveRipple 1.5s ease-in-out 0.25s infinite' : 'none'};
        }
        .sound-wave-3 {
          transform-origin: 50px 11px;
          animation: ${animate ? 'soundWaveRipple 1.5s ease-in-out 0.5s infinite' : 'none'};
        }
      `}</style>

      {/* Animating Curved Sound Waves Just Above Microphone */}
      {showWaves && (
        <g stroke={accentColor} strokeWidth="3.5" strokeLinecap="round" fill="none">
          {/* Inner curve */}
          <path d="M 41 27 A 11 7 0 0 1 59 27" className="sound-wave-1" />
          {/* Middle curve */}
          <path d="M 34 20 A 19 11 0 0 1 66 20" className="sound-wave-2" />
          {/* Outer curve */}
          <path d="M 27 13 A 27 15 0 0 1 73 13" className="sound-wave-3" />
        </g>
      )}

      {/* Microphone Capsule */}
      <rect
        x="38"
        y="33"
        width="24"
        height="37"
        rx="12"
        stroke={primaryColor}
        strokeWidth="5"
        className="fill-white dark:fill-neutral-900"
      />

      {/* Capsule Midline Divider */}
      <path d="M 38 50 H 62" stroke={primaryColor} strokeWidth="4" strokeLinecap="round" />

      {/* Microphone Cradle */}
      <path
        d="M 30 50 V 55 C 30 67 39 74 50 74 C 61 74 70 67 70 55 V 50"
        stroke={primaryColor}
        strokeWidth="5"
        strokeLinecap="round"
      />

      {/* Vertical Neck */}
      <path d="M 50 74 V 84" stroke={primaryColor} strokeWidth="5" strokeLinecap="round" />

      {/* Stand Base */}
      <rect
        x="33"
        y="84"
        width="34"
        height="8"
        rx="4"
        stroke={primaryColor}
        strokeWidth="5"
        className="fill-white dark:fill-neutral-900"
      />
    </svg>
  );
};
