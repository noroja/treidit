import React from 'react';

export const KineticMark: React.FC<{ className?: string }> = ({ className = 'h-6 w-6' }) => (
  <svg viewBox="0 0 32 32" className={className} aria-hidden="true">
    <path d="M7 4h6.2v9.1L21.6 4H29l-9.7 10.6L29.6 28H22l-7-10.1-1.8 1.9V28H7V4Z" fill="currentColor" />
  </svg>
);

export const Wordmark: React.FC<{ compact?: boolean }> = ({ compact = false }) => (
  <span className="flex items-center gap-2.5">
    <span className="flex h-8 w-8 items-center justify-center rounded-[11px] bg-lime text-lime-ink">
      <KineticMark className="h-[18px] w-[18px]" />
    </span>
    <span className="leading-none">
      <span className="block text-[17px] font-bold tracking-[-0.04em] text-ink">KINETIC</span>
      {!compact && <span className="mt-1 block text-[12.5px] font-medium text-muted">Treino adaptativo</span>}
    </span>
  </span>
);
