import { useEffect, useRef, useState } from 'react';
import type { PublicPlayer } from '../../shared/types.ts';
import { signed } from '../i18n/uk.ts';
import { Avatar } from './Avatar.tsx';
import { CrownIcon } from './icons.tsx';
import { PointsIcon } from './decor.tsx';

/** Counts from `from` to `to` after `delay` ms. */
function useCountUp(from: number, to: number, delay: number, duration = 700) {
  const [value, setValue] = useState(from);
  const raf = useRef(0);
  useEffect(() => {
    setValue(from);
    if (from === to) return;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const t = setTimeout(() => {
      if (reduce) return setValue(to);
      const start = performance.now();
      const step = (now: number) => {
        const k = Math.min(1, (now - start) / duration);
        setValue(Math.round(from + (to - from) * (1 - (1 - k) ** 3)));
        if (k < 1) raf.current = requestAnimationFrame(step);
      };
      raf.current = requestAnimationFrame(step);
    }, delay);
    return () => {
      clearTimeout(t);
      cancelAnimationFrame(raf.current);
    };
  }, [from, to, delay, duration]);
  return value;
}

export function rankPlayers(players: PublicPlayer[]): { player: PublicPlayer; place: number }[] {
  const sorted = [...players].sort((a, b) => b.score - a.score || a.name.localeCompare(b.name, 'uk'));
  return sorted.map((player) => ({ player, place: 1 + sorted.filter((p) => p.score > player.score).length }));
}

type Scale = 'tv' | 'phone' | 'host';

const S: Record<
  Scale,
  { row: string; cols: string; place: string; av: number; name: string; delta: string; total: string }
> = {
  tv: {
    row: 'h-[92px] px-7 rounded-tv',
    cols: '64px 72px minmax(0,1fr) 120px 120px',
    place: 'text-4xl',
    av: 64,
    name: 'text-[30px]',
    delta: 'h-12 px-4 text-2xl',
    total: 'text-[40px]',
  },
  phone: {
    row: 'h-16 px-4 rounded-phone',
    cols: '32px 44px minmax(0,1fr) 56px 48px',
    place: 'text-xl',
    av: 40,
    name: 'text-lg',
    delta: 'h-8 px-2.5 text-sm',
    total: 'text-2xl',
  },
  host: {
    row: 'h-14 px-3 rounded-host',
    cols: '24px 36px minmax(0,1fr) 44px 40px',
    place: 'text-lg',
    av: 36,
    name: 'text-base',
    delta: 'h-8 px-2.5 text-sm',
    total: 'text-xl',
  },
};

/**
 * Ranked score table. With deltas, each row animates: the +delta chip flies in from the right,
 * then the total counts up. Leader gets a sun frame and a crown.
 */
export function ScoreTable({
  players,
  deltas,
  scale = 'tv',
  meId,
  animate = true,
  limit,
  skip = 0,
}: {
  players: PublicPlayer[];
  deltas?: Record<string, number> | null;
  scale?: Scale;
  meId?: string;
  animate?: boolean;
  limit?: number;
  /** rows to leave out at the top (already shown on a podium); places stay real */
  skip?: number;
}) {
  const ranked = rankPlayers(players).slice(skip, limit);
  return (
    <ol className="flex flex-col gap-3">
      {ranked.map(({ player, place }, i) => (
        <ScoreRow
          key={player.id}
          player={player}
          place={place}
          delta={deltas?.[player.id]}
          scale={scale}
          me={player.id === meId}
          delay={animate ? 300 + (ranked.length - i) * 120 : 0}
          animate={animate}
        />
      ))}
    </ol>
  );
}

function ScoreRow({
  player,
  place,
  delta,
  scale,
  me,
  delay,
  animate,
}: {
  player: PublicPlayer;
  place: number;
  delta: number | undefined;
  scale: Scale;
  me: boolean;
  delay: number;
  animate: boolean;
}) {
  const s = S[scale];
  const d = delta ?? 0;
  const total = useCountUp(animate ? player.score - d : player.score, player.score, delay + 350);
  const leader = place === 1 && player.score > 0;
  const frame = leader
    ? 'bg-velvet shadow-[inset_0_0_0_3px_var(--color-sun)]'
    : me
      ? 'bg-velvet shadow-[inset_0_0_0_2px_var(--color-fog)]'
      : 'bg-dusk';
  return (
    <li
      className={`grid items-center gap-2.5 sm:gap-3.5 ${s.row} ${frame} ${animate ? 'animate-rise' : ''}`}
      style={{ gridTemplateColumns: s.cols, animationDelay: animate ? `${delay - 300}ms` : undefined }}
    >
      <span className={`font-display font-extrabold ${s.place} ${leader ? 'text-sun' : 'text-fog'}`}>
        {place}
      </span>
      <Avatar avatar={player.avatar} size={s.av} dim={!player.connected} />
      <span className={`flex min-w-0 items-center gap-2 font-extrabold ${s.name}`}>
        <span className="truncate">{player.name}</span>
        {leader && <CrownIcon size={scale === 'tv' ? 32 : 20} label="лідер" />}
      </span>
      {delta === undefined ? (
        <span />
      ) : d > 0 ? (
        <span
          className={`flex items-center gap-1 justify-self-end rounded-full bg-sun font-display font-extrabold text-ink ${s.delta} ${animate ? 'animate-pop' : ''}`}
          style={{ animationDelay: animate ? `${delay}ms` : undefined }}
        >
          {scale === 'tv' && <PointsIcon size={16} />}
          {signed(d)}
        </span>
      ) : (
        <span
          className={`flex items-center justify-self-end rounded-full border-2 border-edge font-display font-bold text-fog ${s.delta}`}
        >
          0
        </span>
      )}
      <span className={`justify-self-end font-display font-extrabold tabular ${s.total}`}>{total}</span>
    </li>
  );
}
