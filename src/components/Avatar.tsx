import type { CSSProperties } from 'react';
import { AVATARS, type PublicPlayer } from '../../shared/types.ts';
import { uk } from '../i18n/uk.ts';
import { CheckIcon, OfflineIcon, XIcon } from './icons.tsx';

export function Avatar({
  avatar,
  size = 36,
  dim = false,
  ring,
  className = '',
  style,
}: {
  avatar: number;
  size?: number;
  dim?: boolean;
  /** colour of the separating ring when avatars overlap */
  ring?: string;
  className?: string;
  style?: CSSProperties;
}) {
  const a = AVATARS[avatar] ?? AVATARS[0];
  return (
    <span
      aria-hidden="true"
      className={`inline-flex flex-none items-center justify-center rounded-full font-emoji leading-none ${className}`}
      style={{
        width: size,
        height: size,
        fontSize: size * 0.56,
        background: dim ? 'var(--color-edge)' : a.color,
        filter: dim ? 'grayscale(1)' : undefined,
        opacity: dim ? 0.6 : undefined,
        boxShadow: ring ? `0 0 0 ${Math.max(3, size / 14)}px ${ring}` : undefined,
        ...style,
      }}
    >
      {a.emoji}
    </span>
  );
}

export type ChipState = 'idle' | 'typing' | 'done';

/** Player chip: avatar + name; done = ✓ answered/voted, typing = dots, offline = dashed. */
export function PlayerChip({
  player,
  state = 'idle',
  size = 'md',
  doneLabel = 'готово',
  onKick,
}: {
  player: PublicPlayer;
  state?: ChipState;
  size?: 'md' | 'lg' | 'xl';
  doneLabel?: string;
  onKick?: () => void;
}) {
  const dims = {
    md: { h: 48, av: 36, text: 'text-[17px]' },
    lg: { h: 64, av: 50, text: 'text-2xl' },
    xl: { h: 80, av: 64, text: 'text-[28px]' },
  }[size];
  const offline = !player.connected;
  const base = 'inline-flex items-center gap-2.5 rounded-full font-extrabold transition-colors duration-200';
  const look = offline
    ? 'border-2 border-dashed border-edge bg-dusk text-fog'
    : state === 'done'
      ? 'bg-velvet shadow-[inset_0_0_0_2px_var(--color-sun)]'
      : state === 'typing'
        ? 'border-2 border-edge bg-dusk'
        : 'bg-velvet';
  return (
    <span
      className={`${base} ${look} ${dims.text}`}
      style={{ height: dims.h, paddingLeft: 6, paddingRight: onKick ? 6 : state === 'done' ? 8 : 18 }}
    >
      <Avatar avatar={player.avatar} size={dims.av} dim={offline} />
      <span className="truncate">{player.name}</span>
      {offline && (
        <span className="flex items-center gap-1.5 text-sm font-bold">
          <OfflineIcon size={18} />
          <span className={size === 'md' ? '' : 'sr-only'}>{uk.offline}</span>
        </span>
      )}
      {!offline && state === 'typing' && (
        <span aria-label="пише" className="flex gap-1">
          {[0, 0.2, 0.4].map((d) => (
            <span
              key={d}
              className="size-1.5 animate-dots rounded-full bg-fog"
              style={{ animationDelay: `${d}s` }}
            />
          ))}
        </span>
      )}
      {!offline && state === 'done' && (
        <span
          role="img"
          aria-label={doneLabel}
          className="flex flex-none animate-pop items-center justify-center rounded-full bg-sun text-ink"
          style={{ width: dims.av * 0.78, height: dims.av * 0.78 }}
        >
          <CheckIcon size={dims.av * 0.45} />
        </span>
      )}
      {onKick && (
        <button
          type="button"
          onClick={onKick}
          aria-label={uk.host.kick(player.name)}
          className="ml-3 flex size-9 flex-none items-center justify-center rounded-[10px] bg-dusk text-fog hover:bg-night hover:text-coral"
        >
          <XIcon size={16} />
        </button>
      )}
    </span>
  );
}

/** Voters' avatars stacked like stickers; 5+ shows three and a counter. */
export function VoteStack({
  voterIds,
  players,
  size = 32,
  ring = 'var(--color-velvet)',
  animate = false,
}: {
  voterIds: string[];
  players: Map<string, PublicPlayer>;
  size?: number;
  ring?: string;
  animate?: boolean;
}) {
  const names = voterIds.map((id) => players.get(id)?.name ?? uk.leftGame);
  const visible = voterIds.length >= 5 ? voterIds.slice(0, 3) : voterIds;
  const extra = voterIds.length - visible.length;
  const tilts = [-6, 4, -3, 5];
  return (
    <span role="img" aria-label={`Голоси: ${names.join(', ')}`} className="flex flex-none">
      {visible.map((id, i) => {
        const p = players.get(id);
        return (
          <Avatar
            key={id}
            avatar={p?.avatar ?? 0}
            dim={!p}
            size={size}
            ring={ring}
            className={animate ? 'animate-drop' : ''}
            style={
              {
                marginLeft: i ? -size / 4 : 0,
                '--tilt': `${size >= 48 ? tilts[i % 4] : 0}deg`,
                transform: size >= 48 ? `rotate(${tilts[i % 4]}deg)` : undefined,
                animationDelay: animate ? `${i * 160}ms` : undefined,
              } as CSSProperties
            }
          />
        );
      })}
      {extra > 0 && (
        <span
          className="flex flex-none items-center justify-center rounded-full bg-cream font-display font-extrabold text-ink"
          style={{
            width: size,
            height: size,
            marginLeft: -size / 4,
            fontSize: size * 0.32,
            boxShadow: `0 0 0 ${Math.max(3, size / 14)}px ${ring}`,
          }}
        >
          +{extra}
        </span>
      )}
    </span>
  );
}
