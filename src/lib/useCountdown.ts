import { useEffect, useState } from 'react';
import type { TimerState } from '../../shared/types.ts';
import { serverNow } from './useGame.ts';

export interface Countdown {
  remainingMs: number;
  seconds: number;
  /** 0..1 of the duration left */
  fraction: number;
  paused: boolean;
  urgent: boolean;
  done: boolean;
}

export function readCountdown(timer: TimerState | null): Countdown | null {
  if (!timer) return null;
  const paused = timer.pausedRemainingMs !== null;
  const remainingMs = paused ? timer.pausedRemainingMs! : Math.max(0, (timer.endsAt ?? 0) - serverNow());
  const seconds = Math.ceil(remainingMs / 1000);
  return {
    remainingMs,
    seconds,
    fraction: timer.durationMs > 0 ? Math.min(1, remainingMs / timer.durationMs) : 0,
    paused,
    urgent: !paused && seconds <= 10 && remainingMs > 0,
    done: remainingMs <= 0,
  };
}

/** Re-renders a few times per second while a timer runs. */
export function useCountdown(timer: TimerState | null): Countdown | null {
  const [, tick] = useState(0);
  const running = !!timer && timer.endsAt !== null;
  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => tick((n) => n + 1), 200);
    return () => clearInterval(id);
  }, [running]);
  return readCountdown(timer);
}

export function formatClock(seconds: number): string {
  const s = Math.max(0, seconds);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}
