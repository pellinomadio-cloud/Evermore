import React from 'react';

interface GpayLogoProps {
  size?: 'sm' | 'md' | 'lg';
  iconOnly?: boolean;
  lightText?: boolean;
}

export const GpayLogo: React.FC<GpayLogoProps> = ({
  size = 'md',
  iconOnly = false,
  lightText = false,
}) => {
  const dimensions = {
    sm: 'w-7 h-7 rounded-lg',
    md: 'w-9 h-9 rounded-xl',
    lg: 'w-11 h-11 rounded-xl',
  }[size];

  const letterSize = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-lg',
  }[size];

  const microLabelSize = {
    sm: 'text-[4.5px]',
    md: 'text-[5.5px]',
    lg: 'text-[6.5px]',
  }[size];

  const wordmarkSize = {
    sm: 'text-base',
    md: 'text-lg',
    lg: 'text-xl',
  }[size];

  return (
    <div className="inline-flex items-center gap-2 select-none shrink-0">
      {/* Glossy Purple & White Emblem for EverMore */}
      <div
        className={`${dimensions} relative flex flex-col items-center justify-center overflow-hidden bg-gradient-to-b from-[#a855f7] via-[#7c3aed] to-[#4c1d95] shadow-[0_3px_10px_rgba(124,58,237,0.3)] border border-[#c084fc]/50 shrink-0`}
      >
        <div className="absolute -top-1/2 -left-1/4 w-[150%] h-full rounded-full bg-gradient-to-b from-white/35 to-transparent pointer-events-none" />

        <div className="relative z-10 flex flex-col items-center justify-center leading-none">
          <div className="relative flex items-center justify-center">
            <span
              className={`${letterSize} font-black tracking-tighter text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.35)] italic`}
            >
              E
            </span>
            <span
              className={`font-extrabold text-[#e9d5ff] -ml-0.5 ${
                size === 'lg' ? 'text-xs' : 'text-[9px]'
              } drop-shadow-[0_1px_2px_rgba(0,0,0,0.35)]`}
            >
              M
            </span>
          </div>
          <span
            className={`${microLabelSize} font-bold tracking-tight text-white/95 mt-0.5`}
          >
            EverMore
          </span>
        </div>
      </div>

      {!iconOnly && (
        <span
          className={`${wordmarkSize} font-extrabold tracking-tight whitespace-nowrap ${
            lightText ? 'text-white' : 'text-[#1e1b4b] dark:text-white'
          }`}
        >
          Ever<span className="text-[#7c3aed] dark:text-[#a855f7]">More</span>
        </span>
      )}
    </div>
  );
};
