import type { CSSProperties, ReactNode } from 'react';
import type { View } from '../../shared/types.ts';
import { useTheme } from '../lib/theme.ts';
import { CheckIcon } from './icons.tsx';

/**
 * Halloween decor. Shapes come from haloween-theme.html ("Декор"). Rule of thumb from the guide:
 * no more than 3–4 pieces per screen, only at the edges and behind the content.
 */

type Art = { className?: string; style?: CSSProperties };

/** Renders its children only in the Halloween theme. */
export function Spooky({ children }: { children: ReactNode }) {
  return useTheme() === 'halloween' ? <>{children}</> : null;
}

const BAT =
  'M28 7 L30 1 L32 5 L34 1 L36 7 C42 3 54 2 63 8 C58 10 55 15 55 21 C51 17 47 17 44 20 C42 17 39 17 36 19 C35 23 33 25 32 27 C31 25 29 23 28 19 C25 17 22 17 20 20 C17 17 13 17 9 21 C9 15 6 10 1 8 C10 2 22 3 28 7 Z';
const GHOST = 'M8 66 V30 a22 22 0 0 1 44 0 V66 l-7.3 -6 -7.3 6 -7.4 -6 -7.3 6 -7.4 -6 Z';
const MASK =
  'M4 10 C16 2 30 6 40 12 C50 6 64 2 76 10 C78 22 70 34 56 34 C48 34 44 28 40 24 C36 28 32 34 24 34 C10 34 2 22 4 10 Z M15 19 a9 6 0 1 0 18 0 a9 6 0 1 0 -18 0 Z M47 19 a9 6 0 1 0 18 0 a9 6 0 1 0 -18 0 Z';
const WRAPPER = 'M24 17 L6 5 L9 17 L6 29 Z M46 17 L64 5 L61 17 L64 29 Z';

export function Moon({ size = 180, className, style }: Art & { size?: number }) {
  return (
    <div
      aria-hidden="true"
      className={`rounded-full ${className ?? ''}`}
      style={{
        width: size,
        height: size,
        boxShadow: `0 0 0 ${size * 0.12}px rgb(255 231 168 / .07), 0 0 0 ${size * 0.27}px rgb(255 231 168 / .035)`,
        ...style,
      }}
    >
      <svg width={size} height={size} viewBox="0 0 100 100">
        <circle cx="50" cy="50" r="48" fill="#FFE7A8" />
        <circle cx="34" cy="36" r="8" fill="#F2D68A" />
        <circle cx="63" cy="62" r="11" fill="#F2D68A" />
        <circle cx="62" cy="28" r="5" fill="#F2D68A" />
      </svg>
    </div>
  );
}

export function Bat({
  width = 110,
  fill = '#3D2F5E',
  eyes = true,
  className,
  style,
}: Art & { width?: number; fill?: string; eyes?: boolean }) {
  return (
    <svg
      aria-hidden="true"
      width={width}
      height={(width * 30) / 64}
      viewBox="0 0 64 30"
      className={className}
      style={style}
    >
      <path fill={fill} d={BAT} />
      {eyes && (
        <>
          <circle cx="30.5" cy="10" r="1.1" fill="#FF8A1F" />
          <circle cx="33.5" cy="10" r="1.1" fill="#FF8A1F" />
        </>
      )}
    </svg>
  );
}

export function Ghost({ width = 72, className, style }: Art & { width?: number }) {
  return (
    <svg
      aria-hidden="true"
      width={width}
      height={(width * 70) / 60}
      viewBox="0 0 60 70"
      className={className}
      style={style}
    >
      <path fill="#F6F1FF" d={GHOST} />
      <ellipse cx="22" cy="30" rx="3" ry="4.5" fill="#1A1030" />
      <ellipse cx="38" cy="30" rx="3" ry="4.5" fill="#1A1030" />
      <ellipse cx="30" cy="41" rx="3" ry="3.5" fill="#1A1030" />
      <circle cx="15" cy="38" r="3" fill="#FF9EC4" />
      <circle cx="45" cy="38" r="3" fill="#FF9EC4" />
    </svg>
  );
}

export function Pumpkin({ width = 94, className, style }: Art & { width?: number }) {
  return (
    <svg
      aria-hidden="true"
      width={width}
      height={(width * 70) / 80}
      viewBox="0 0 80 70"
      className={className}
      style={style}
    >
      <path d="M38 16 C38 9 42 5 47 4" fill="none" stroke="#6FBF3A" strokeWidth="5" strokeLinecap="round" />
      <ellipse cx="26" cy="42" rx="20" ry="24" fill="#D9680B" />
      <ellipse cx="54" cy="42" rx="20" ry="24" fill="#D9680B" />
      <ellipse cx="40" cy="42" rx="19" ry="26" fill="#FF8A1F" />
      <path d="M25 38 L30.5 30 L36 38 Z M44 38 L49.5 30 L55 38 Z" fill="#3A1A06" />
      <path d="M27 47 Q40 60 53 47 Q47 52 40 52 Q33 52 27 47 Z" fill="#3A1A06" />
    </svg>
  );
}

/** Corner cobweb; `flip` mirrors it for the top-right corner. */
export function Web({
  size = 190,
  flip = false,
  opacity = 0.28,
  className = '',
}: {
  size?: number;
  flip?: boolean;
  opacity?: number;
  className?: string;
}) {
  return (
    <svg
      aria-hidden="true"
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      stroke="#B5A8D6"
      strokeWidth="1.2"
      strokeLinecap="round"
      className={`absolute top-0 ${flip ? 'right-0 -scale-x-100' : 'left-0'} ${className}`}
      style={{ opacity }}
    >
      <path d="M0 0 L100 0 M0 0 L92.4 38.3 M0 0 L70.7 70.7 M0 0 L38.3 92.4 M0 0 L0 100" />
      <path d="M30 0 Q25 5 27.7 11.5 Q22 15 21.2 21.2 Q15 22 11.5 27.7 Q5 25 0 30" />
      <path d="M60 0 Q50 10 55.4 23 Q44 30 42.4 42.4 Q30 44 23 55.4 Q10 50 0 60" />
      <path d="M90 0 Q75 15 83.1 34.4 Q66 45 63.6 63.6 Q45 66 34.4 83.1 Q15 75 0 90" />
    </svg>
  );
}

/** A spider hanging on a thread of `drop` px, swinging gently. */
export function Spider({ drop = 262, className, style }: Art & { drop?: number }) {
  const y = drop;
  return (
    <svg
      aria-hidden="true"
      width="40"
      height={y + 38}
      viewBox={`0 0 40 ${y + 38}`}
      className={className}
      style={{ transformOrigin: '20px 0', animation: 'vswing 4s ease-in-out infinite', ...style }}
    >
      <path d={`M20 0 V${y}`} stroke="#B5A8D6" strokeWidth="1.4" opacity="0.5" />
      <g stroke="#6D5A9C" strokeWidth="2.5" strokeLinecap="round" fill="none">
        <path
          d={`M13 ${y + 14} Q5 ${y + 8} 3 ${y + 2} M12 ${y + 20} Q4 ${y + 20} 1 ${y + 16} M13 ${y + 25} Q5 ${y + 30} 3 ${y + 36} M27 ${y + 14} Q35 ${y + 8} 37 ${y + 2} M28 ${y + 20} Q36 ${y + 20} 39 ${y + 16} M27 ${y + 25} Q35 ${y + 30} 37 ${y + 36}`}
        />
      </g>
      <circle cx="20" cy={y + 22} r="9" fill="#6D5A9C" />
      <circle cx="20" cy={y + 10} r="5.5" fill="#6D5A9C" />
      <circle cx="18" cy={y + 9} r="1.3" fill="#F6F1FF" />
      <circle cx="22" cy={y + 9} r="1.3" fill="#F6F1FF" />
    </svg>
  );
}

export function Mask({ width = 100, className, style }: Art & { width?: number }) {
  return (
    <svg
      aria-hidden="true"
      width={width}
      height={width / 2}
      viewBox="0 0 80 40"
      className={className}
      style={style}
    >
      <path fillRule="evenodd" fill="#B48CFF" d={MASK} />
      <path
        d="M4 10 C2 4 0 2 -4 0 M76 10 C78 4 80 2 84 0"
        stroke="#B48CFF"
        strokeWidth="2"
        fill="none"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function Candy({
  width = 56,
  color = '#FF5C8A',
  dark = '#E0436F',
  className,
  style,
}: Art & { width?: number; color?: string; dark?: string }) {
  return (
    <svg
      aria-hidden="true"
      width={width}
      height={(width * 34) / 70}
      viewBox="0 0 70 34"
      className={className}
      style={style}
    >
      <path d={WRAPPER} fill={dark} />
      <circle cx="35" cy="17" r="13" fill={color} />
    </svg>
  );
}

export const CANDY_COLORS: [string, string][] = [
  ['#FF5C8A', '#E0436F'],
  ['#FF8A1F', '#C2560A'],
  ['#9BEA5A', '#6FBF3A'],
  ['#B48CFF', '#8E6BFF'],
  ['#5AB0FF', '#3A8EDC'],
  ['#F6F1FF', '#B5A8D6'],
];

/** Points are candies at Halloween: a small candy in the text colour before the number. */
export function PointsIcon({ size = 18 }: { size?: number }) {
  if (useTheme() !== 'halloween') return null;
  return (
    <svg aria-hidden="true" width={size * 2} height={size} viewBox="0 0 70 34" className="flex-none">
      <path d={WRAPPER} fill="currentColor" />
      <circle cx="35" cy="17" r="13" fill="currentColor" />
    </svg>
  );
}

/** Seal on the correct answer: a tick in the base theme, a ghost at Halloween. */
export function TruthSeal({ size }: { size: number }) {
  if (useTheme() !== 'halloween') return <CheckIcon size={size} />;
  return (
    <svg aria-hidden="true" width={size} height={(size * 70) / 60} viewBox="0 0 60 70">
      <path fill="currentColor" d={GHOST} />
      <ellipse cx="22" cy="31" rx="4" ry="5.5" fill="var(--color-on-truth)" />
      <ellipse cx="38" cy="31" rx="4" ry="5.5" fill="var(--color-on-truth)" />
    </svg>
  );
}

export function CandyBag({ width = 104 }: { width?: number }) {
  if (useTheme() !== 'halloween') return null;
  return (
    <svg
      aria-hidden="true"
      width={width}
      height={(width * 74) / 80}
      viewBox="0 0 80 74"
      className="flex-none"
    >
      <path d="M16 22 Q40 -6 64 22" fill="none" stroke="#3D2F5E" strokeWidth="5" strokeLinecap="round" />
      <ellipse cx="40" cy="46" rx="34" ry="26" fill="#FF8A1F" />
      <ellipse cx="40" cy="24" rx="28" ry="6" fill="#C2560A" />
      <path d="M24 44 L29.5 36 L35 44 Z M45 44 L50.5 36 L56 44 Z" fill="#3A1A06" />
      <path d="M26 52 Q40 64 54 52 Q47 57 40 57 Q33 57 26 52 Z" fill="#3A1A06" />
      <circle cx="30" cy="20" r="6" fill="#FF5C8A" />
      <circle cx="46" cy="18" r="6" fill="#9BEA5A" />
      <circle cx="38" cy="15" r="5" fill="#B48CFF" />
    </svg>
  );
}

function Star({ x, y, size, o }: { x: number; y: number; size: number; o: number }) {
  return (
    <svg
      aria-hidden="true"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      className="absolute"
      style={{ left: x, top: y, opacity: o }}
    >
      <path fill="#FFE7A8" d="M12 2 L14 10 L22 12 L14 14 L12 22 L10 14 L2 12 L10 10 Z" />
    </svg>
  );
}

const STARS = [
  [180, 40, 18, 0.7],
  [420, 300, 12, 0.5],
  [760, 26, 14, 0.6],
  [940, 330, 10, 0.45],
  [1020, 120, 16, 0.55],
  [1180, 290, 12, 0.5],
  [600, 980, 12, 0.35],
  [1110, 560, 10, 0.4],
] as const;

const GHOSTS = [
  { x: 24, y: 330, w: 110, r: -10, o: 0.85, t: 3.2 },
  { x: 1790, y: 260, w: 96, r: 8, o: 0.8, t: 3.8 },
  { x: 1700, y: 900, w: 64, r: -6, o: 0.55, t: 2.8 },
  { x: 140, y: 880, w: 60, r: 10, o: 0.5, t: 3.4 },
];

/** Background decor for the 1920×1080 TV stage; sits behind the content. */
export function TvDecor({ view }: { view: View | null }) {
  const theme = useTheme();
  if (theme !== 'halloween') return null;
  const wrap = (children: ReactNode) => (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
      {children}
    </div>
  );
  const fog = (
    <>
      <div className="absolute -bottom-[140px] -left-[200px] h-[260px] w-[1100px] rounded-full bg-fog/6" />
      <div className="absolute right-[-180px] -bottom-[160px] h-[250px] w-[1300px] rounded-full bg-fog/5" />
    </>
  );

  switch (view?.phase ?? 'IDLE') {
    case 'IDLE':
    case 'LOBBY':
      return wrap(
        <>
          {STARS.map(([x, y, size, o]) => (
            <Star key={`${x}-${y}`} x={x} y={y} size={size} o={o} />
          ))}
          <Web opacity={0.3} />
          <Moon size={200} className="absolute top-6 right-10" />
          <Bat
            width={120}
            fill="#0D0918"
            className="absolute top-[240px] right-[250px]"
            style={{ animation: 'vflap 2.2s ease-in-out infinite' }}
          />
          <Bat
            width={70}
            eyes={false}
            className="absolute top-[40px] right-[330px]"
            style={{ animation: 'vflap 2.6s .4s ease-in-out infinite' }}
          />
          {fog}
        </>,
      );
    case 'WRITING':
      return wrap(
        <>
          <div className="absolute top-[40px] right-[-120px] h-[900px] w-[900px] rounded-full bg-dusk" />
          <Spider drop={200} className="absolute top-0 right-[560px]" />
          {fog}
        </>,
      );
    case 'REVEAL':
    case 'VOTING':
      return wrap(
        <>
          <Web flip />
          <Bat
            width={80}
            className="absolute top-[30px] left-[900px]"
            style={{ animation: 'vflap 2.4s ease-in-out infinite' }}
          />
        </>,
      );
    case 'RESULTS': {
      const r = view?.results;
      const focus = view?.cards.find((c) => c.id === r?.focusCardId);
      const truthOut = r?.focusStage === 'author' && focus?.authorId === null;
      return wrap(
        <>
          <Web />
          {truthOut &&
            GHOSTS.map((g) => (
              <Ghost
                key={g.x}
                width={g.w}
                className="absolute animate-fade"
                style={
                  {
                    left: g.x,
                    top: g.y,
                    opacity: g.o,
                    '--r': `${g.r}deg`,
                    animation: `vfloat ${g.t}s ease-in-out infinite`,
                  } as CSSProperties
                }
              />
            ))}
          {fog}
        </>,
      );
    }
    case 'SCOREBOARD':
    case 'ROUND_END':
      return wrap(
        <>
          <Web flip />
          <Bat
            width={96}
            className="absolute top-[56px] left-[640px]"
            style={{ animation: 'vflap 2.4s ease-in-out infinite' }}
          />
          {fog}
        </>,
      );
    case 'GAME_END':
      return wrap(
        <Ghost
          width={120}
          className="absolute top-[300px] left-[24px]"
          style={{ '--r': '-8deg', animation: 'vfloat 3.4s ease-in-out infinite' } as CSSProperties}
        />,
      );
  }
}

/** Corner decor for phone screens, pinned to the viewport; the parent must be `isolate`. */
export function PhoneDecor({ bat = false }: { bat?: boolean }) {
  if (useTheme() !== 'halloween') return null;
  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      <Web size={120} flip opacity={0.35} />
      {bat && <Bat width={64} className="absolute top-[116px] right-[26px] rotate-[10deg] opacity-90" />}
      <div className="absolute bottom-[60px] -left-[60px] h-[90px] w-[300px] rounded-full bg-fog/7" />
    </div>
  );
}
