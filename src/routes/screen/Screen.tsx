import { useEffect, useLayoutEffect, useMemo, useState, type CSSProperties, type ReactNode } from 'react';
import type { PublicPlayer, View, ViewCard } from '../../../shared/types.ts';
import { Avatar, PlayerChip } from '../../components/Avatar.tsx';
import { AnswerCard } from '../../components/AnswerCard.tsx';
import { rankPlayers, ScoreTable } from '../../components/ScoreTable.tsx';
import { TimerRing } from '../../components/Timer.tsx';
import { Logo, Progress, QRBlock } from '../../components/misc.tsx';
import { OfflineIcon, PauseIcon } from '../../components/icons.tsx';
import { CANDY_COLORS, Candy, CandyBag, Ghost, Pumpkin, Spooky, TvDecor } from '../../components/decor.tsx';
import { useTheme } from '../../lib/theme.ts';
import { points, uk } from '../../i18n/uk.ts';
import { useConnected, useGameView, useRole } from '../../lib/useGame.ts';
import { Results } from './Results.tsx';
import { Vinyl } from '../../components/Vinyl.tsx';
import { useMusic } from '../../lib/music.ts';
import { useScreenMusic } from '../../lib/screenMusic.ts';

const W = 1920;
const H = 1080;

/** Fixed 1920×1080 canvas scaled to fit any TV/projector, letterboxed on Night. */
function Stage({ children }: { children: ReactNode }) {
  const [scale, setScale] = useState(1);
  useLayoutEffect(() => {
    const fit = () => setScale(Math.min(window.innerWidth / W, window.innerHeight / H));
    fit();
    window.addEventListener('resize', fit);
    return () => window.removeEventListener('resize', fit);
  }, []);
  return (
    <div className="fixed inset-0 overflow-hidden bg-night">
      <div
        className="absolute top-1/2 left-1/2 overflow-hidden"
        style={{ width: W, height: H, transform: `translate(-50%, -50%) scale(${scale})` }}
      >
        {children}
      </div>
    </div>
  );
}

export function Screen() {
  useRole('screen');
  const view = useGameView();
  const connected = useConnected();

  useEffect(() => {
    document.title = 'Варіанти · Екран';
  }, []);

  return (
    <Stage>
      <TvDecor view={view} />
      {view ? <Phase view={view} /> : <Splash />}
      {view?.timer?.pausedRemainingMs != null && <PausedOverlay />}
      <MusicBadge />
      {!connected && (
        <div className="absolute top-8 right-8 flex items-center gap-3 rounded-full border-2 border-dashed border-fog bg-dusk px-6 py-3 text-2xl font-extrabold text-fog">
          <OfflineIcon size={28} /> {uk.play.reconnecting}
        </div>
      )}
    </Stage>
  );
}

/** The TV plays the host's music; a record in the corner spins while it does. */
function MusicBadge() {
  const status = useScreenMusic();
  const music = useMusic();
  if (!music?.on) return null;
  const blocked = status === 'blocked';
  return (
    <div className="absolute right-8 bottom-4 z-50 flex animate-fade items-center gap-5">
      {blocked && (
        <span className="animate-pulse-timer rounded-full bg-sun px-7 py-3 text-[26px] font-extrabold text-ink shadow-[0_6px_0_var(--color-sun-shade)]">
          {uk.music.tapToPlay}
        </span>
      )}
      <Vinyl size={72} playing={status === 'playing'} className={status === 'playing' ? '' : 'opacity-60'} />
    </div>
  );
}

function Splash() {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-8">
      <Logo size={160} />
    </div>
  );
}

function Phase({ view }: { view: View }) {
  switch (view.phase) {
    case 'IDLE':
    case 'LOBBY':
      return <Lobby view={view} />;
    case 'WRITING':
      return <Writing view={view} />;
    case 'REVEAL':
    case 'VOTING':
      return <CardsGrid view={view} />;
    case 'RESULTS':
      return <Results view={view} />;
    case 'SCOREBOARD':
      return <Scoreboard view={view} />;
    case 'ROUND_END':
      return <RoundEnd view={view} />;
    case 'GAME_END':
      return <GameEnd view={view} />;
  }
}

export function TvFrame({ view, children, right }: { view: View; children: ReactNode; right?: ReactNode }) {
  return (
    <div className="flex h-full flex-col gap-10 px-24 pt-16 pb-20">
      <header className="flex items-start justify-between gap-12">
        <Progress round={view.round} qIndex={view.qIndex} scale={1.85} />
        {right}
      </header>
      {children}
    </div>
  );
}

// ───────────────────────── T1 Lobby ─────────────────────────

function Lobby({ view }: { view: View }) {
  return (
    <div className="grid h-full grid-cols-[minmax(0,1fr)_620px] gap-20 px-24 py-20">
      <div className="flex min-w-0 flex-col gap-14">
        <div className="flex flex-col gap-6">
          <Logo size={176} />
          <p className="text-[40px] font-bold">{uk.tagline}</p>
        </div>
        <div className="flex flex-col gap-6">
          <span className="text-[28px] font-extrabold tracking-[0.1em] text-fog uppercase">
            {uk.players(view.players.length)}
          </span>
          {view.players.length ? (
            <ul className="flex flex-wrap gap-5">
              {view.players.map((p, i) => (
                <li key={p.id} className="animate-pop">
                  <span className="lobby-float block" style={{ animationDelay: `${(i % 5) * 0.3}s` }}>
                    <PlayerChip player={p} size="xl" />
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-[32px] font-bold text-fog">{uk.screen.noPlayersYet}</p>
          )}
        </div>
        {view.phase === 'IDLE' && (
          <p className="mt-auto flex items-center gap-4 text-[28px] font-bold text-fog">
            <Dots /> {uk.screen.waitingHost}
          </p>
        )}
      </div>
      <div className="relative flex flex-col items-center justify-center gap-8 rounded-tv bg-dusk p-12">
        <span className="font-display text-[44px] font-extrabold">{uk.screen.joinHere}</span>
        <QRBlock url={view.joinUrl} size={460} vertical big />
        <Spooky>
          <Pumpkin width={128} className="absolute top-[560px] left-[24px] -rotate-12" />
        </Spooky>
      </div>
    </div>
  );
}

function Dots() {
  return (
    <span className="flex gap-2" aria-hidden="true">
      {[0, 0.2, 0.4].map((d) => (
        <span
          key={d}
          className="size-3 animate-dots rounded-full bg-fog"
          style={{ animationDelay: `${d}s` }}
        />
      ))}
    </span>
  );
}

// ───────────────────────── T2 Question + writing ─────────────────────────

function Writing({ view }: { view: View }) {
  return (
    <TvFrame view={view}>
      <div className="grid flex-1 grid-cols-[minmax(0,1fr)_380px] items-center gap-20">
        <h1 className="animate-rise font-display text-[72px] leading-[1.18] font-semibold text-balance">
          {view.question}
        </h1>
        <div className="relative isolate">
          <Spooky>
            <Ghost
              width={150}
              className="absolute -right-[70px] -bottom-[40px] -z-10"
              style={{ animation: 'vpeek 3.4s ease-in-out infinite' }}
            />
          </Spooky>
          <TimerRing timer={view.timer} size={380} />
        </div>
      </div>
      <StatusRow players={view.players} field="answered" label={uk.answered} doneLabel="є відповідь" />
    </TvFrame>
  );
}

function StatusRow({
  players,
  field,
  label,
  doneLabel,
}: {
  players: PublicPlayer[];
  field: 'answered' | 'voted';
  label: (n: number, total: number) => string;
  doneLabel: string;
}) {
  const n = players.filter((p) => p[field]).length;
  return (
    <div className="flex flex-col gap-5">
      <span className="text-[26px] font-extrabold tracking-[0.1em] text-fog uppercase">
        {label(n, players.length)}
      </span>
      <ul className="flex flex-wrap gap-4">
        {players.map((p) => (
          <li key={p.id}>
            <PlayerChip
              player={p}
              size="lg"
              state={p[field] ? 'done' : field === 'answered' ? 'typing' : 'idle'}
              doneLabel={doneLabel}
            />
          </li>
        ))}
      </ul>
    </div>
  );
}

// ───────────────────────── T3 Reveal / T4 Voting ─────────────────────────

function CardsGrid({ view }: { view: View }) {
  const players = useMemo(() => new Map(view.players.map((p) => [p.id, p])), [view.players]);
  const voting = view.phase === 'VOTING';
  const cols = view.cards.length > 6 ? 3 : 2;
  const compact = view.cards.length > 8;
  return (
    <TvFrame
      view={view}
      right={
        voting ? (
          <TimerRing timer={view.timer} size={210} />
        ) : (
          <span className="rounded-full bg-sun px-10 py-5 font-display text-[44px] font-extrabold text-ink shadow-[0_8px_0_var(--color-sun-shade)]">
            {uk.screen.discuss}
          </span>
        )
      }
    >
      <h1 className="-mt-4 font-display text-[48px] leading-[1.2] font-semibold text-balance">
        {view.question}
      </h1>
      <ul
        className="grid flex-1 content-start gap-6"
        style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}
      >
        {view.cards.map((c, i) => (
          <li key={c.id} className="animate-rise" style={{ animationDelay: `${i * 70}ms` }}>
            <TvCard card={c} players={players} compact={compact} />
          </li>
        ))}
      </ul>
      {voting && (
        <StatusRow players={view.players} field="voted" label={uk.voted} doneLabel="проголосовано" />
      )}
    </TvFrame>
  );
}

function TvCard({
  card,
  players,
  compact,
}: {
  card: ViewCard;
  players: Map<string, PublicPlayer>;
  compact: boolean;
}) {
  if (!compact) return <AnswerCard card={card} players={players} scale="tv" />;
  return (
    <div className="flex min-h-[104px] items-center gap-5 rounded-tv bg-velvet px-6 py-4 shadow-[0_8px_0_rgba(0,0,0,.35)]">
      <span className="flex size-14 flex-none items-center justify-center rounded-[16px] bg-edge font-display text-2xl font-extrabold">
        {card.letter}
      </span>
      <span className="text-[32px] leading-tight font-bold">{card.text}</span>
    </div>
  );
}

// ───────────────────────── T6 Scoreboard ─────────────────────────

function Scoreboard({ view }: { view: View }) {
  return (
    <TvFrame
      view={view}
      right={
        <h1 className="flex items-center gap-7 font-logo text-[88px] leading-none font-extrabold">
          <CandyBag />
          {uk.screen.scoreboard}
        </h1>
      }
    >
      <div className="mx-auto w-full max-w-[1400px]">
        <ScoreTable players={view.players} deltas={view.deltas} scale="tv" />
      </div>
    </TvFrame>
  );
}

// ───────────────────────── T7 Round end ─────────────────────────

function RoundEnd({ view }: { view: View }) {
  return (
    <div className="flex h-full flex-col gap-12 px-24 py-16">
      <header className="flex items-end justify-between">
        <h1 className="animate-pop font-logo text-[88px] leading-none font-extrabold">
          {uk.screen.roundOver(view.round)}
        </h1>
        <span className="rounded-full border-4 border-dashed border-sun px-10 py-4 font-display text-[40px] font-bold text-sun">
          {uk.screen.round2Soon}
        </span>
      </header>
      <div className="mx-auto w-full max-w-[1400px]">
        <ScoreTable players={view.players} deltas={view.deltas} scale="tv" />
      </div>
    </div>
  );
}

// ───────────────────────── T8 Game end ─────────────────────────

function GameEnd({ view }: { view: View }) {
  const ranked = rankPlayers(view.players);
  const podium = ranked.slice(0, 3);
  // classic podium order: 2nd, 1st, 3rd
  const order = [podium[1], podium[0], podium[2]].filter(Boolean);
  const heights: Record<number, number> = { 1: 300, 2: 220, 3: 160 };
  const liar = topBy(view.players, 'timesFooledOthers');
  const sage = topBy(view.players, 'correctGuesses');

  return (
    <div className="relative flex h-full flex-col px-24 pt-14 pb-16">
      <Confetti />
      <header className="relative flex items-center justify-between">
        <Logo size={96} />
        <h1 className="font-logo text-[88px] leading-none font-extrabold">{uk.screen.gameOver}</h1>
      </header>
      <div className="relative mt-6 grid flex-1 grid-cols-[minmax(0,1fr)_560px] gap-16">
        <div className="flex items-end justify-center gap-8">
          {order.map(({ player, place }) => (
            <div
              key={player.id}
              className="flex w-[300px] animate-rise flex-col items-center gap-4"
              style={{ animationDelay: `${(4 - place) * 400}ms` }}
            >
              <Avatar
                avatar={player.avatar}
                size={place === 1 ? 168 : 128}
                className="shadow-[0_8px_0_rgba(0,0,0,.35)]"
              />
              <span className="max-w-full truncate text-[40px] font-extrabold">{player.name}</span>
              <div
                className={`flex w-full flex-col items-center gap-1 rounded-t-tv pt-6 ${place === 1 ? 'bg-sun text-ink' : 'bg-velvet'}`}
                style={{ height: heights[place] }}
              >
                <span className="font-display text-[72px] leading-none font-black">{place}</span>
                <span className="font-display text-[30px] font-bold">{points(player.score)}</span>
              </div>
            </div>
          ))}
        </div>
        <div className="flex flex-col gap-6">
          {[
            liar && {
              title: uk.screen.titleLiar,
              hint: uk.screen.titleLiarHint(liar.timesFooledOthers),
              p: liar,
              icon: '😈',
            },
            sage && {
              title: uk.screen.titleSage,
              hint: uk.screen.titleSageHint(sage.correctGuesses),
              p: sage,
              icon: '🧠',
            },
          ]
            .filter((x): x is NonNullable<typeof x> => !!x)
            .map((t, i) => (
              <div
                key={t.title}
                className="flex animate-rise items-center gap-6 rounded-tv bg-dusk p-7"
                style={{ animationDelay: `${1600 + i * 300}ms` }}
              >
                <span className="relative">
                  <Avatar avatar={t.p.avatar} size={88} />
                  <span className="absolute -right-3 -bottom-2 font-emoji text-[40px]" aria-hidden="true">
                    {t.icon}
                  </span>
                </span>
                <span className="flex flex-col gap-1">
                  <span className="text-[22px] font-extrabold tracking-[0.1em] text-sun uppercase">
                    {t.title}
                  </span>
                  <span className="text-[36px] font-extrabold">{t.p.name}</span>
                  <span className="text-[22px] text-fog">{t.hint}</span>
                </span>
              </div>
            ))}
          {ranked.length > 3 && (
            <div className="mt-auto">
              <ScoreTable players={view.players} skip={3} limit={7} scale="phone" animate={false} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function topBy(players: PublicPlayer[], key: 'timesFooledOthers' | 'correctGuesses'): PublicPlayer | null {
  const best = [...players].sort((a, b) => b[key] - a[key])[0];
  return best && best[key] > 0 ? best : null;
}

function Confetti() {
  const candies = useTheme() === 'halloween';
  const pieces = useMemo(
    () =>
      Array.from({ length: 90 }, (_, i) => ({
        left: Math.random() * 100,
        delay: Math.random() * 4,
        dur: 4 + Math.random() * 4,
        color: ['#FF8A3D', '#5AB0FF', '#9BE15D', '#B48CFF', '#FF6FB5', '#3DD6D0', '#FFC83D'][i % 7],
        candy: CANDY_COLORS[i % CANDY_COLORS.length],
        w: 10 + Math.random() * 14,
        rot: Math.random() * 360,
      })),
    [],
  );
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 overflow-hidden motion-reduce:hidden"
    >
      <style>{`@keyframes vfall{from{transform:translateY(-60px) rotate(0)}to{transform:translateY(1160px) rotate(720deg)}}`}</style>
      {pieces.map((p, i) =>
        candies ? (
          // fewer, bigger pieces: a candy shower rather than confetti
          i % 2 === 0 && (
            <Candy
              key={i}
              width={p.w * 2.6}
              color={p.candy[0]}
              dark={p.candy[1]}
              className="absolute top-0"
              style={
                {
                  left: `${p.left}%`,
                  animation: `vcandy ${p.dur * 1.2}s linear ${p.delay}s infinite`,
                  transform: `rotate(${p.rot}deg)`,
                } as CSSProperties
              }
            />
          )
        ) : (
          <span
            key={i}
            className="absolute top-0 rounded-[3px]"
            style={{
              left: `${p.left}%`,
              width: p.w,
              height: p.w * 0.45,
              background: p.color,
              transform: `rotate(${p.rot}deg)`,
              animation: `vfall ${p.dur}s linear ${p.delay}s infinite`,
              opacity: 0.9,
            }}
          />
        ),
      )}
    </div>
  );
}

// ───────────────────────── T9 Paused ─────────────────────────

function PausedOverlay() {
  return (
    <div className="absolute inset-0 z-40 flex animate-fade flex-col items-center justify-center gap-8 bg-night/80 backdrop-blur-sm">
      <span className="flex size-[220px] items-center justify-center rounded-full border-[6px] border-dashed border-fog text-fog">
        <PauseIcon size={110} />
      </span>
      <span className="font-logo text-[120px] leading-none font-extrabold">{uk.screen.paused}</span>
      {uk.screen.pausedHint && <span className="text-[40px] font-bold text-fog">{uk.screen.pausedHint}</span>}
    </div>
  );
}
