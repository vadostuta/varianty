import { useMemo, useState, type ReactNode } from 'react';
import type { HostAction } from '../../../shared/events.ts';
import type { PublicPlayer, View, ViewCard } from '../../../shared/types.ts';
import { Avatar, PlayerChip, VoteStack } from '../../components/Avatar.tsx';
import { Button } from '../../components/Button.tsx';
import { ScoreTable } from '../../components/ScoreTable.tsx';
import { TimerRing } from '../../components/Timer.tsx';
import { ConfirmDialog, Label, Progress, QRBlock } from '../../components/misc.tsx';
import { CheckIcon, LockIcon, PauseIcon, PlayIcon } from '../../components/icons.tsx';
import { uk } from '../../i18n/uk.ts';
import { getSocket, request } from '../../lib/socket.ts';
import { useCountdown } from '../../lib/useCountdown.ts';
import { MusicPanel } from './MusicPanel.tsx';
import { useScreenUrl } from '../../lib/screenUrl.ts';

function useHostAction() {
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const run = async (a: HostAction) => {
    setBusy(true);
    setError('');
    const res = await request((ack) => getSocket().emit('host:action', a, ack));
    setBusy(false);
    if (!res.ok) setError(res.error);
  };
  return { run, error, busy };
}

/** H2–H7: dense live controller. One primary action per state; destructive actions are secondary. */
export function HostControl({ view }: { view: View }) {
  const { run, error, busy } = useHostAction();
  const [confirmCancel, setConfirmCancel] = useState(false);
  const [kickTarget, setKickTarget] = useState<PublicPlayer | null>(null);
  const [musicError, setMusicError] = useState('');
  const screenUrl = useScreenUrl();
  const players = useMemo(() => new Map(view.players.map((p) => [p.id, p])), [view.players]);
  const inQuestion = !['LOBBY', 'ROUND_END', 'GAME_END'].includes(view.phase);

  return (
    <div className="flex min-h-dvh flex-col">
      <header className="sticky top-0 z-10 flex flex-wrap items-center gap-x-6 gap-y-3 border-b-2 border-edge bg-night/95 px-4 py-3 backdrop-blur sm:px-8">
        <span className="font-display text-2xl font-bold">{uk.phase[view.phase]}</span>
        {view.phase !== 'LOBBY' && (
          <Progress round={view.round} qIndex={view.qIndex} scale={0.85} showLabel={false} />
        )}
        <span className="text-sm font-bold text-fog">{view.presetName}</span>
        <span className="ml-auto flex items-center gap-4">
          <a
            href={screenUrl}
            target="_blank"
            rel="noreferrer"
            className="hidden text-sm font-extrabold text-sun hover:text-sun-hover sm:inline"
          >
            {uk.host.openScreen} ↗
          </a>
          <Button size="host" variant="danger" onClick={() => setConfirmCancel(true)}>
            {uk.host.cancelGame}
          </Button>
        </span>
      </header>

      <main className="mx-auto grid w-full max-w-[1440px] flex-1 gap-8 px-4 py-6 sm:px-8 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="flex min-w-0 flex-col gap-6">
          {inQuestion && <QuestionPanel view={view} />}
          <PhasePanel view={view} players={players} />
        </div>
        <aside className="flex flex-col gap-6 lg:sticky lg:top-24 lg:self-start">
          <ActionPanel view={view} run={run} busy={busy} error={error} />
          <PlayersPanel view={view} onKick={setKickTarget} />
          <MusicPanel compact onError={setMusicError} />
          {musicError && (
            <p role="alert" className="-mt-3 text-sm font-bold text-coral">
              {musicError}
            </p>
          )}
        </aside>
      </main>

      <ConfirmDialog
        open={confirmCancel}
        title={uk.host.cancelTitle}
        body={uk.host.cancelBody}
        cancelLabel={uk.host.cancelNo}
        confirmLabel={uk.host.cancelYes}
        onCancel={() => setConfirmCancel(false)}
        onConfirm={() => {
          setConfirmCancel(false);
          void run({ type: 'abort' });
        }}
      />
      <ConfirmDialog
        open={!!kickTarget}
        title={kickTarget ? `${uk.host.kick(kickTarget.name)}?` : ''}
        body="Гравець зникне з гри разом зі своїм рахунком. Повернутися зможе як новий гравець."
        cancelLabel={uk.host.cancelNo}
        confirmLabel="Вилучити"
        onCancel={() => setKickTarget(null)}
        onConfirm={() => {
          if (kickTarget) void run({ type: 'kick', playerId: kickTarget.id });
          setKickTarget(null);
        }}
      />
    </div>
  );
}

function Panel({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <section className={`flex flex-col gap-4 rounded-tv bg-dusk p-5 sm:p-6 ${className}`}>{children}</section>
  );
}

function QuestionPanel({ view }: { view: View }) {
  return (
    <Panel>
      <span className="text-xs font-extrabold tracking-[0.1em] text-fog uppercase">
        {uk.progress(view.round, view.qIndex)}
      </span>
      <h1 className="text-[22px] leading-snug font-extrabold">{view.question}</h1>
      <div className="flex items-start gap-3 rounded-host border-2 border-dashed border-sun/60 bg-ember px-4 py-3">
        <LockIcon size={18} className="mt-0.5 flex-none text-sun" />
        <div className="flex flex-col gap-0.5">
          <span className="text-xs font-extrabold tracking-[0.1em] text-sun uppercase">
            {uk.host.correctAnswer} · {uk.host.hostOnly}
          </span>
          <span className="text-lg font-extrabold">{view.host?.correctAnswer}</span>
          {view.host?.explanation && (
            <div className="mt-2 flex flex-col gap-0.5 border-t border-sun/30 pt-2">
              <span className="text-xs font-extrabold tracking-[0.1em] text-sun uppercase">
                {uk.host.explanation}
              </span>
              <p className="text-[15px] leading-snug font-semibold whitespace-pre-line text-cream/90">
                {view.host.explanation}
              </p>
            </div>
          )}
        </div>
      </div>
    </Panel>
  );
}

function PhasePanel({ view, players }: { view: View; players: Map<string, PublicPlayer> }) {
  switch (view.phase) {
    case 'LOBBY':
      return (
        <Panel className="items-start">
          <h1 className="font-display text-2xl font-bold">{uk.host.lobbyTitle}</h1>
          <QRBlock url={view.joinUrl} size={200} />
        </Panel>
      );
    case 'WRITING':
      return (
        <Panel>
          <Label>{uk.host.incoming}</Label>
          {view.host?.answers.length ? (
            <ul className="flex flex-col gap-2">
              {view.host.answers.map((a) => {
                const p = players.get(a.playerId);
                return (
                  <li
                    key={a.playerId}
                    className="flex animate-rise items-center gap-3 rounded-host bg-velvet px-3 py-2.5"
                  >
                    {p && <Avatar avatar={p.avatar} size={32} />}
                    <span className="w-24 flex-none truncate text-sm font-extrabold text-fog">{p?.name}</span>
                    <span className="font-bold">{a.text}</span>
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="text-fog">{uk.host.noAnswersYet}</p>
          )}
        </Panel>
      );
    case 'REVEAL':
    case 'VOTING':
    case 'RESULTS':
    case 'SCOREBOARD':
      return (
        <Panel>
          {view.phase === 'SCOREBOARD' ? (
            <>
              <Label>{uk.phase.SCOREBOARD}</Label>
              <ScoreTable players={view.players} deltas={view.deltas} scale="host" animate={false} />
              <Label className="mt-2">Картки</Label>
            </>
          ) : (
            <Label>
              {view.phase === 'REVEAL' ? 'Картки в порядку показу (автори видно лише тобі)' : 'Картки'}
            </Label>
          )}
          <ul className="flex flex-col gap-2">
            {view.cards.map((c) => (
              <HostCardRow
                key={c.id}
                card={c}
                players={players}
                showVotes={view.phase !== 'REVEAL'}
                focused={view.results?.focusCardId === c.id}
              />
            ))}
          </ul>
        </Panel>
      );
    case 'ROUND_END':
    case 'GAME_END':
      return (
        <Panel>
          <Label>{view.phase === 'GAME_END' ? uk.screen.gameOver : uk.screen.roundOver(view.round)}</Label>
          <ScoreTable players={view.players} deltas={view.deltas} scale="host" animate={false} />
        </Panel>
      );
    default:
      return null;
  }
}

function HostCardRow({
  card,
  players,
  showVotes,
  focused,
}: {
  card: ViewCard;
  players: Map<string, PublicPlayer>;
  showVotes: boolean;
  focused: boolean;
}) {
  const author = card.authorId ? players.get(card.authorId) : undefined;
  const correct = card.authorId === null;
  return (
    <li
      className={`flex items-center gap-3 rounded-host px-3 py-2.5 ${correct ? 'bg-truth text-on-truth' : 'bg-velvet'} ${
        focused ? 'outline-3 outline-offset-2 outline-sun' : ''
      }`}
    >
      <span
        className={`flex size-8 flex-none items-center justify-center rounded-[10px] font-display text-sm font-extrabold ${correct ? 'bg-on-truth text-truth' : 'bg-edge'}`}
      >
        {card.letter}
      </span>
      <span className="min-w-0 flex-1 font-bold">{card.text}</span>
      {card.revealed && (
        <span className="text-xs font-extrabold tracking-wide uppercase opacity-70">
          {card.revealed === 'author' ? 'показано' : 'голоси'}
        </span>
      )}
      {showVotes && card.voters && card.voters.length > 0 && (
        <VoteStack
          voterIds={card.voters}
          players={players}
          size={26}
          ring={correct ? 'var(--color-truth)' : 'var(--color-velvet)'}
        />
      )}
      <span className="flex w-28 flex-none items-center justify-end gap-2 text-sm font-extrabold">
        {correct ? (
          <>
            <CheckIcon size={16} /> {uk.correctAnswer.split(' ')[0]}
          </>
        ) : author ? (
          <>
            <span className="truncate">{author.name}</span>
            <Avatar avatar={author.avatar} size={26} />
          </>
        ) : (
          <span className="text-fog">{uk.leftGame}</span>
        )}
      </span>
    </li>
  );
}

function ActionPanel({
  view,
  run,
  busy,
  error,
}: {
  view: View;
  run: (a: HostAction) => Promise<void>;
  busy: boolean;
  error: string;
}) {
  const cd = useCountdown(view.timer);
  const timed = view.phase === 'WRITING' || view.phase === 'VOTING';
  const enough = view.players.length >= 2;

  let primary: ReactNode = null;
  let note: ReactNode = null;
  switch (view.phase) {
    case 'LOBBY':
      primary = (
        <Button className="w-full" disabled={!enough || busy} onClick={() => void run({ type: 'startGame' })}>
          {uk.host.start}
        </Button>
      );
      if (!enough) note = uk.host.needPlayers;
      break;
    case 'WRITING':
    case 'VOTING':
      primary = (
        <Button className="w-full" disabled={busy} onClick={() => void run({ type: 'finishPhase' })}>
          {uk.host.finishNow}
        </Button>
      );
      break;
    case 'REVEAL':
      primary = (
        <Button className="w-full" disabled={busy} onClick={() => void run({ type: 'startVoting' })}>
          {uk.host.startVoting}
        </Button>
      );
      break;
    case 'RESULTS': {
      const r = view.results!;
      const next = view.host?.nextStep;
      const card = next ? view.cards.find((c) => c.id === next.cardId) : undefined;
      const revealed = view.cards.filter((c) => c.revealed).length;
      // the card the next press is about
      const k = card ? revealed + (card.revealed ? 0 : 1) : view.cards.length;
      note = (
        <div className="flex flex-col gap-1.5">
          <span className="font-extrabold">{uk.screen.cardOf(k, view.cards.length)}</span>
          <span className="text-fog">
            {uk.host.nextPreview}:{' '}
            <b className="text-cream">
              {!next || !card
                ? uk.host.previewScores
                : next.stage === 'voters'
                  ? uk.host.previewVoters(card.letter)
                  : card.authorId === null
                    ? uk.host.previewCorrect(card.letter)
                    : uk.host.previewAuthor(card.letter)}
            </b>
          </span>
          <StepDots total={r.total} shown={r.shown} />
        </div>
      );
      primary = (
        <Button variant="next" className="w-full" disabled={busy} onClick={() => void run({ type: 'next' })}>
          {uk.host.next}
          <PlayIcon />
        </Button>
      );
      break;
    }
    case 'SCOREBOARD': {
      const lastInRound = view.qIndex === 4;
      const label = !lastInRound
        ? uk.host.nextQuestion
        : view.round === 0
          ? uk.host.toRoundEnd
          : uk.host.toFinal;
      primary = (
        <Button className="w-full" disabled={busy} onClick={() => void run({ type: 'next' })}>
          {label}
        </Button>
      );
      break;
    }
    case 'ROUND_END':
      primary = (
        <Button className="w-full" disabled={busy} onClick={() => void run({ type: 'next' })}>
          {uk.host.startRound2}
        </Button>
      );
      break;
    case 'GAME_END':
      primary = (
        <Button className="w-full" disabled={busy} onClick={() => void run({ type: 'newGame' })}>
          {uk.host.newGame}
        </Button>
      );
      break;
  }

  return (
    <Panel>
      {timed && (
        <div className="flex items-center gap-5">
          <TimerRing timer={view.timer} size={132} />
          <div className="flex flex-col gap-2">
            <Button
              size="host"
              variant="secondary"
              disabled={busy || cd?.done}
              onClick={() => void run({ type: cd?.paused ? 'resume' : 'pause' })}
            >
              {cd?.paused ? <PlayIcon size={16} /> : <PauseIcon />}
              {cd?.paused ? uk.host.resume : uk.host.pause}
            </Button>
            <Button
              size="host"
              variant="secondary"
              disabled={busy}
              onClick={() => void run({ type: 'addTime', seconds: 15 })}
            >
              {uk.host.addTime}
            </Button>
          </div>
        </div>
      )}
      {note && <div className="text-[15px]">{note}</div>}
      {primary}
      {error && (
        <p role="alert" className="text-sm font-bold text-coral">
          {error}
        </p>
      )}
    </Panel>
  );
}

function StepDots({ total, shown }: { total: number; shown: number }) {
  return (
    <div className="flex flex-wrap gap-1.5" aria-hidden="true">
      {Array.from({ length: total }, (_, i) => (
        <span
          key={i}
          className={`h-2 w-5 rounded-full ${i < shown ? 'bg-cream' : i === shown ? 'bg-sun' : 'bg-edge'}`}
        />
      ))}
    </div>
  );
}

function PlayersPanel({ view, onKick }: { view: View; onKick: (p: PublicPlayer) => void }) {
  const field = view.phase === 'WRITING' ? 'answered' : view.phase === 'VOTING' ? 'voted' : null;
  const count = field ? view.players.filter((p) => p[field]).length : 0;
  return (
    <Panel>
      <Label>
        {field === 'answered'
          ? uk.answered(count, view.players.length)
          : field === 'voted'
            ? uk.voted(count, view.players.length)
            : uk.players(view.players.length)}
      </Label>
      <ul className="flex flex-col gap-2">
        {view.players.map((p) => (
          <li key={p.id} className="flex items-center justify-between gap-2">
            <PlayerChip player={p} state={field ? (p[field] ? 'done' : 'idle') : 'idle'} />
            <span className="flex items-center gap-2">
              {view.phase !== 'LOBBY' && <span className="font-display font-bold tabular">{p.score}</span>}
              <button
                type="button"
                onClick={() => onKick(p)}
                aria-label={uk.host.kick(p.name)}
                className="flex size-10 items-center justify-center rounded-xl border-2 border-edge text-fog hover:border-coral hover:text-coral"
              >
                ✕
              </button>
            </span>
          </li>
        ))}
      </ul>
    </Panel>
  );
}
