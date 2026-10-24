const GROOVES = [45, 41, 37, 33, 29, 25];

/** A record that spins while `playing`; `arm` adds a tonearm that swings onto it. */
export function Vinyl({
  size = 72,
  playing,
  arm = false,
  className = '',
}: {
  size?: number;
  playing: boolean;
  arm?: boolean;
  className?: string;
}) {
  return (
    <span
      aria-hidden="true"
      className={`relative inline-block flex-none ${className}`}
      style={{ width: size, height: size }}
    >
      <svg viewBox="0 0 100 100" width={size} height={size} className="block overflow-visible">
        <defs>
          <linearGradient id="vinyl-sheen" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#fff" stopOpacity="0" />
            <stop offset="0.5" stopColor="#fff" stopOpacity="0.16" />
            <stop offset="1" stopColor="#fff" stopOpacity="0" />
          </linearGradient>
        </defs>
        <circle cx="50" cy="50" r="49" fill="var(--color-edge)" />
        <g className={`vinyl-spin ${playing ? '' : 'is-paused'}`}>
          <circle cx="50" cy="50" r="48" fill="var(--color-pit)" />
          {GROOVES.map((r) => (
            <circle
              key={r}
              cx="50"
              cy="50"
              r={r}
              fill="none"
              stroke="#fff"
              strokeOpacity="0.07"
              strokeWidth="0.8"
            />
          ))}
          <circle cx="50" cy="50" r="17" fill="var(--color-sun)" />
          <circle
            cx="50"
            cy="50"
            r="13"
            fill="none"
            stroke="var(--color-ink)"
            strokeOpacity="0.25"
            strokeWidth="1"
          />
          {/* off-centre print on the label, so the spin is visible */}
          <rect x="43" y="39" width="14" height="2.6" rx="1.3" fill="var(--color-ink)" fillOpacity="0.55" />
          <rect x="45.5" y="58" width="9" height="2.2" rx="1.1" fill="var(--color-ink)" fillOpacity="0.35" />
          <circle cx="50" cy="50" r="2.4" fill="var(--color-night)" />
        </g>
        {/* the light stays put while the record turns under it */}
        <path
          d="M50 50 L18 14 A48 48 0 0 1 36 4 Z M50 50 L82 86 A48 48 0 0 1 64 96 Z"
          fill="url(#vinyl-sheen)"
        />
        {arm && (
          <g
            className="transition-transform duration-700 ease-out"
            style={{
              transformBox: 'view-box',
              transformOrigin: '92px 8px',
              transform: `rotate(${playing ? 0 : -30}deg)`,
            }}
          >
            <path
              d="M92 8 L84 46 L71 62"
              fill="none"
              stroke="var(--color-fog)"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <rect
              x="65"
              y="59"
              width="9"
              height="6"
              rx="1.5"
              transform="rotate(-50 70 62)"
              fill="var(--color-cream)"
            />
            <circle
              cx="92"
              cy="8"
              r="7"
              fill="var(--color-velvet)"
              stroke="var(--color-edge)"
              strokeWidth="2"
            />
            <circle cx="92" cy="8" r="2.5" fill="var(--color-fog)" />
          </g>
        )}
      </svg>
    </span>
  );
}
