import type { TimerState } from '../../shared/types.ts';
import { uk } from '../i18n/uk.ts';
import { formatClock, useCountdown } from '../lib/useCountdown.ts';
import { PauseIcon } from './icons.tsx';

const R = 44;
const C = 2 * Math.PI * R;

/** Big ring timer: cream ring melts clockwise; coral + pulse ≤10 s; dashed when paused; sun when done. */
export function TimerRing({ timer, size = 200 }: { timer: TimerState | null; size?: number }) {
  const cd = useCountdown(timer);
  if (!cd) return null;
  const label = cd.paused
    ? `${uk.timer.paused}, ${formatClock(cd.seconds)}`
    : cd.done
      ? uk.timer.up
      : `Залишилось ${formatClock(cd.seconds)}`;
  const font = size * 0.23;
  return (
    <div
      role="timer"
      aria-label={label}
      className={`relative flex-none ${cd.urgent ? 'animate-pulse-timer' : ''}`}
      style={{ width: size, height: size }}
    >
      <svg width={size} height={size} viewBox="0 0 100 100" aria-hidden="true">
        {cd.done ? (
          <circle
            cx="50"
            cy="50"
            r={R}
            fill="var(--color-sun)"
            stroke="var(--color-sun-shade)"
            strokeWidth="8"
          />
        ) : cd.paused ? (
          <circle
            cx="50"
            cy="50"
            r={R}
            fill="none"
            stroke="var(--color-fog)"
            strokeWidth="5"
            strokeDasharray="4 7"
          />
        ) : (
          <>
            <circle cx="50" cy="50" r={R} fill="none" stroke="var(--color-edge)" strokeWidth="8" />
            <circle
              cx="50"
              cy="50"
              r={R}
              fill="none"
              stroke={cd.urgent ? 'var(--color-coral)' : 'var(--color-cream)'}
              strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray={C}
              strokeDashoffset={C * (1 - cd.fraction)}
              transform="rotate(-90 50 50)"
              style={{ transition: 'stroke-dashoffset 200ms linear, stroke 240ms' }}
            />
          </>
        )}
      </svg>
      <span
        aria-hidden="true"
        className="absolute inset-0 flex flex-col items-center justify-center font-display font-extrabold tabular"
      >
        {cd.done ? (
          <span className="font-black text-ink" style={{ fontSize: font * 1.05 }}>
            {uk.timer.up}
          </span>
        ) : cd.paused ? (
          <span className="flex flex-col items-center text-fog" style={{ gap: size * 0.03 }}>
            <PauseIcon size={size * 0.18} />
            <span className="font-bold" style={{ fontSize: font * 0.65 }}>
              {formatClock(cd.seconds)}
            </span>
            <span
              className="font-sans font-extrabold tracking-[0.12em]"
              style={{ fontSize: Math.max(11, size * 0.065) }}
            >
              ПАУЗА
            </span>
          </span>
        ) : (
          <span className={cd.urgent ? 'text-coral' : ''} style={{ fontSize: font }}>
            {formatClock(cd.seconds)}
          </span>
        )}
      </span>
    </div>
  );
}

/** Compact pill timer for phones and the host header. */
export function TimerPill({ timer, large = false }: { timer: TimerState | null; large?: boolean }) {
  const cd = useCountdown(timer);
  if (!cd) return null;
  const h = large ? 'h-14 text-2xl' : 'h-11 text-lg';
  const ring = large ? 34 : 28;
  if (cd.done) {
    return (
      <span
        role="timer"
        className={`inline-flex items-center rounded-full bg-sun px-[18px] font-display font-extrabold text-ink ${h}`}
      >
        {uk.timer.up}
      </span>
    );
  }
  if (cd.paused) {
    return (
      <span
        role="timer"
        aria-label={`${uk.timer.paused}, ${formatClock(cd.seconds)}`}
        className={`inline-flex items-center gap-2 rounded-full border-2 border-dashed border-fog pr-4 pl-3 font-display font-bold text-fog ${h}`}
      >
        <PauseIcon size={20} />
        <span className="tabular">{formatClock(cd.seconds)}</span>
      </span>
    );
  }
  return (
    <span
      role="timer"
      aria-label={`Залишилось ${formatClock(cd.seconds)}`}
      className={`inline-flex items-center gap-2.5 rounded-full pr-4 pl-2 font-display font-bold transition-colors duration-200 ${h} ${
        cd.urgent ? 'animate-pulse-timer bg-coral text-ink' : 'bg-velvet text-cream'
      }`}
    >
      <svg width={ring} height={ring} viewBox="0 0 100 100" aria-hidden="true">
        <circle
          cx="50"
          cy="50"
          r="40"
          fill="none"
          stroke={cd.urgent ? 'rgba(26,18,6,.25)' : 'var(--color-edge)'}
          strokeWidth="16"
        />
        <circle
          cx="50"
          cy="50"
          r="40"
          fill="none"
          stroke={cd.urgent ? 'var(--color-ink)' : 'var(--color-cream)'}
          strokeWidth="16"
          strokeDasharray={2 * Math.PI * 40}
          strokeDashoffset={2 * Math.PI * 40 * (1 - cd.fraction)}
          transform="rotate(-90 50 50)"
        />
      </svg>
      <span className="tabular">{formatClock(cd.seconds)}</span>
    </span>
  );
}
