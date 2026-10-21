import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { AVATARS, type PublicPlayer, type View } from '../../../shared/types.ts';
import { Avatar, PlayerChip } from '../../components/Avatar.tsx';
import { AnswerCard } from '../../components/AnswerCard.tsx';
import { Button } from '../../components/Button.tsx';
import { ScoreTable } from '../../components/ScoreTable.tsx';
import { TimerPill } from '../../components/Timer.tsx';
import { AnswerInput, Centered, Label, Logo, StatusToast } from '../../components/misc.tsx';
import { CheckIcon, OfflineIcon, PencilIcon } from '../../components/icons.tsx';
import { points, signed, uk } from '../../i18n/uk.ts';
import { getSocket, request } from '../../lib/socket.ts';
import { useConnected, useGameView } from '../../lib/useGame.ts';
import { useCountdown } from '../../lib/useCountdown.ts';

const SESSION_KEY = 'varianty:session';

type Session = { playerId: string; token: string };

function loadSession(): Session | null {
  try {
    return JSON.parse(localStorage.getItem(SESSION_KEY) ?? 'null');
  } catch {
    return null;
  }
}
function saveSession(s: Session | null) {
  try {
    if (s) localStorage.setItem(SESSION_KEY, JSON.stringify(s));
    else localStorage.removeItem(SESSION_KEY);
  } catch {
    /* private mode: the seat just won't survive a reload */
  }
}

type Status = 'resuming' | 'join' | 'in' | 'kicked' | 'aborted';

export function Play() {
  const view = useGameView();
  const connected = useConnected();
  const [status, setStatus] = useState<Status>(() => (loadSession() ? 'resuming' : 'join'));

  // resume the saved seat on every (re)connect
  useEffect(() => {
    const socket = getSocket();
    const resume = async () => {
      const s = loadSession();
      if (!s) return setStatus((st) => (st === 'kicked' || st === 'aborted' ? st : 'join'));
      const res = await request((ack) => socket.emit('player:resume', s, ack));
      if (res.ok) setStatus('in');
      else {
        saveSession(null);
        setStatus('join');
      }
    };
    const onKicked = (reason: 'kicked' | 'aborted') => {
      saveSession(null);
      setStatus(reason);
    };
    if (socket.connected) void resume();
    socket.on('connect', resume);
    socket.on('kicked', onKicked);
    return () => {
      socket.off('connect', resume);
      socket.off('kicked', onKicked);
    };
  }, []);

  if (status === 'kicked' || status === 'aborted') {
    return (
      <Centered>
        <span className="font-emoji text-6xl" aria-hidden="true">
          {status === 'kicked' ? '👋' : '🛑'}
        </span>
        <h1 className="font-display text-[28px] font-bold">
          {status === 'kicked' ? uk.play.kicked : uk.play.aborted}
        </h1>
        <Button onClick={() => setStatus('join')}>{uk.play.rejoin}</Button>
      </Centered>
    );
  }

  if (status === 'join') return <Join onJoined={() => setStatus('in')} />;

  if (!view || view.role !== 'player' || !view.me || status === 'resuming') {
    return <Reconnecting />;
  }

  return (
    <>
      <PlayerGame view={view} />
      {!connected && <Reconnecting overlay />}
    </>
  );
}

function Reconnecting({ overlay = false }: { overlay?: boolean }) {
  return (
    <Centered className={overlay ? 'fixed inset-0 z-50 bg-night/90 backdrop-blur-sm' : ''}>
      <span className="flex size-20 items-center justify-center rounded-full border-2 border-dashed border-fog text-fog">
        <OfflineIcon size={36} />
      </span>
      <h1 className="font-display text-2xl font-bold">{uk.play.reconnecting}</h1>
      <p className="max-w-xs text-fog">{uk.play.reconnectingHint}</p>
    </Centered>
  );
}

// ───────────────────────── P1 Join ─────────────────────────

function Join({ onJoined }: { onJoined: () => void }) {
  const [name, setName] = useState('');
  const [free, setFree] = useState<number[]>(AVATARS.map((_, i) => i));
  const [avatar, setAvatar] = useState<number | null>(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const socket = getSocket();
    const onFree = (list: number[]) => setFree(list);
    socket.on('freeAvatars', onFree);
    return () => {
      socket.off('freeAvatars', onFree);
    };
  }, []);

  const chosen = avatar !== null && free.includes(avatar) ? avatar : null;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || busy) return;
    setBusy(true);
    setError('');
    const res = await request<{ playerId: string; token: string }>((ack) =>
      getSocket().emit('player:join', { name, avatar: chosen }, ack),
    );
    setBusy(false);
    if (!res.ok) return setError(res.error);
    saveSession({ playerId: res.playerId, token: res.token });
    onJoined();
  }

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col gap-8 px-5 pt-14 pb-8">
      <div className="flex flex-col items-center gap-3 text-center">
        <Logo size={56} />
        <p className="font-bold text-fog">{uk.tagline}</p>
      </div>
      <form onSubmit={submit} className="flex flex-1 flex-col gap-6">
        <div className="flex flex-col gap-2">
          <Label htmlFor="name">{uk.play.nameLabel}</Label>
          <input
            id="name"
            value={name}
            maxLength={16}
            autoComplete="nickname"
            enterKeyHint="go"
            onChange={(e) => setName(e.target.value)}
            placeholder={uk.play.namePlaceholder}
            className="h-14 rounded-phone border-2 border-edge bg-velvet px-4 text-xl font-extrabold text-cream outline-none placeholder:font-bold placeholder:text-fog/70 focus:border-sun focus:shadow-[0_0_0_4px_rgba(255,200,61,.2)]"
          />
        </div>
        <fieldset className="flex flex-col gap-3">
          <legend className="mb-3 text-[13px] font-extrabold tracking-[0.1em] text-fog uppercase">
            {uk.play.avatarLabel}
          </legend>
          <div className="grid grid-cols-5 gap-3">
            {AVATARS.map((a, i) => {
              const taken = !free.includes(i);
              const on = chosen === i;
              return (
                <button
                  key={i}
                  type="button"
                  disabled={taken}
                  aria-pressed={on}
                  aria-label={`${a.emoji} ${a.colorName}${taken ? ', зайнято' : ''}`}
                  onClick={() => setAvatar(on ? null : i)}
                  className={`relative flex aspect-square items-center justify-center rounded-full transition ${
                    on ? 'scale-105 shadow-[0_0_0_4px_var(--color-night),0_0_0_7px_var(--color-sun)]' : ''
                  } ${taken ? 'opacity-30' : ''}`}
                >
                  <Avatar avatar={i} size={56} dim={taken} />
                  {on && (
                    <span className="absolute -right-1 -bottom-1 flex size-6 items-center justify-center rounded-full bg-sun text-ink">
                      <CheckIcon size={14} />
                    </span>
                  )}
                </button>
              );
            })}
          </div>
          <p className="text-sm text-fog">Не обереш — призначимо автоматично.</p>
        </fieldset>
        {error && (
          <p role="alert" className="font-bold text-coral">
            {error}
          </p>
        )}
        <Button type="submit" disabled={!name.trim() || busy} className="mt-auto w-full">
          {uk.play.join}
        </Button>
      </form>
    </main>
  );
}

// ───────────────────────── In-game shell ─────────────────────────

function usePlayersMap(view: View) {
  return useMemo(() => new Map(view.players.map((p) => [p.id, p])), [view.players]);
}

function Shell({
  view,
  me,
  children,
  timer = false,
}: {
  view: View;
  me: PublicPlayer;
  children: ReactNode;
  timer?: boolean;
}) {
  const inGame = !['IDLE', 'LOBBY'].includes(view.phase);
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-xl flex-col gap-5 px-4 pt-4 pb-8 sm:px-6">
      <header className="flex items-center gap-3">
        <PlayerChip player={me} />
        <span className="ml-auto flex items-center gap-2">
          {inGame && (
            <span
              className="font-display text-lg font-bold tabular"
              aria-label={`Рахунок: ${points(me.score)}`}
            >
              {me.score}
            </span>
          )}
          {timer && <TimerPill timer={view.timer} />}
        </span>
      </header>
      {inGame && view.phase !== 'GAME_END' && view.phase !== 'ROUND_END' && (
        <span className="text-[13px] font-extrabold tracking-[0.1em] text-fog uppercase">
          {uk.progress(view.round, view.qIndex)}
        </span>
      )}
      {children}
    </main>
  );
}

function PlayerGame({ view }: { view: View }) {
  const me = view.players.find((p) => p.id === view.me!.id);
  if (!me) return <Reconnecting />;
  switch (view.phase) {
    case 'IDLE':
    case 'LOBBY':
      return <Lobby view={view} me={me} />;
    case 'WRITING':
      return <Write view={view} me={me} />;
    case 'REVEAL':
      return <Reveal view={view} me={me} />;
    case 'VOTING':
      return <Vote view={view} me={me} />;
    case 'RESULTS':
      return (
        <Shell view={view} me={me}>
          <Centered className="min-h-0 flex-1">
            <span className="animate-pop font-emoji text-7xl" aria-hidden="true">
              📺
            </span>
            <h1 className="font-display text-[28px] font-bold">{uk.play.lookAtScreen}</h1>
            <p className="text-fog">{uk.play.lookHint}</p>
          </Centered>
        </Shell>
      );
    case 'SCOREBOARD':
      return <MyResult view={view} me={me} />;
    case 'ROUND_END':
    case 'GAME_END':
      return <Final view={view} me={me} />;
  }
}

// ───────────────────────── P2 Lobby ─────────────────────────

function Lobby({ view, me }: { view: View; me: PublicPlayer }) {
  return (
    <Shell view={view} me={me}>
      <section className="flex flex-col items-center gap-4 py-6 text-center">
        <Avatar avatar={me.avatar} size={112} className="animate-pop shadow-[0_8px_0_rgba(0,0,0,.35)]" />
        <h1 className="font-display text-[28px] font-bold">{uk.play.youAre}</h1>
        <p className="flex items-center gap-2 text-fog">
          <span className="flex gap-1" aria-hidden="true">
            {[0, 0.2, 0.4].map((d) => (
              <span
                key={d}
                className="size-1.5 animate-dots rounded-full bg-fog"
                style={{ animationDelay: `${d}s` }}
              />
            ))}
          </span>
          {view.phase === 'IDLE' ? uk.play.waitingHost : uk.play.waitingStart}
        </p>
      </section>
      <section className="flex flex-col gap-3">
        <Label>{uk.players(view.players.length)}</Label>
        <ul className="flex flex-wrap gap-2.5">
          {view.players.map((p) => (
            <li key={p.id} className="animate-pop">
              <PlayerChip player={p} />
            </li>
          ))}
        </ul>
      </section>
    </Shell>
  );
}

// ───────────────────────── P3 / P4 Write ─────────────────────────

function Write({ view, me }: { view: View; me: PublicPlayer }) {
  const saved = view.me!.answer;
  const [draft, setDraft] = useState(saved ?? '');
  const [editing, setEditing] = useState(saved === null);
  const [error, setError] = useState('');
  const cd = useCountdown(view.timer);
  const answered = view.players.filter((p) => p.answered).length;

  // a new question resets the form
  const key = `${view.round}:${view.qIndex}`;
  const [seenKey, setSeenKey] = useState(key);
  if (seenKey !== key) {
    setSeenKey(key);
    setDraft(view.me!.answer ?? '');
    setEditing(view.me!.answer === null);
  }

  async function send() {
    setError('');
    const res = await request((ack) => getSocket().emit('player:answer', draft, ack));
    if (!res.ok) return setError(res.error);
    setEditing(!draft.trim());
  }

  const timeUp = cd?.done ?? false;

  return (
    <Shell view={view} me={me} timer>
      <h1 className="text-[22px] leading-[1.3] font-extrabold">{view.question}</h1>
      {timeUp && !saved ? (
        <TooLate />
      ) : editing && !timeUp ? (
        <form
          className="flex flex-col gap-4"
          onSubmit={(e) => {
            e.preventDefault();
            void send();
          }}
        >
          <AnswerInput value={draft} onChange={setDraft} label={uk.play.answerLabel} autoFocus />
          {error && (
            <p role="alert" className="font-bold text-coral">
              {error}
            </p>
          )}
          <Button type="submit" disabled={!draft.trim()} className="w-full">
            {uk.play.send}
          </Button>
        </form>
      ) : (
        <div className="flex flex-col gap-4">
          <div className="rounded-phone bg-velvet px-4 py-4 shadow-[0_6px_0_rgba(0,0,0,.35)]">
            <Label>{uk.play.answerLabel}</Label>
            <p className="mt-1 text-[19px] leading-snug font-bold">{saved}</p>
          </div>
          {!timeUp && (
            <>
              <StatusToast title={uk.play.sent} hint={uk.play.canChange} />
              <Button variant="secondary" onClick={() => setEditing(true)} className="w-full">
                <PencilIcon />
                {uk.play.change}
              </Button>
            </>
          )}
        </div>
      )}
      <p className="mt-auto pt-4 text-center font-bold text-fog">
        {uk.answered(answered, view.players.length)}
      </p>
    </Shell>
  );
}

function TooLate() {
  return (
    <div className="flex flex-col items-center gap-2 rounded-phone border-2 border-dashed border-edge px-5 py-8 text-center">
      <h2 className="font-display text-2xl font-bold">{uk.play.tooLate}</h2>
      <p className="text-fog">{uk.play.tooLateHint}</p>
    </div>
  );
}

// ───────────────────────── P5 Reveal ─────────────────────────

function Reveal({ view, me }: { view: View; me: PublicPlayer }) {
  const players = usePlayersMap(view);
  const ownId = view.me!.ownCardId;
  return (
    <Shell view={view} me={me}>
      <div className="flex flex-col gap-1">
        <h1 className="font-display text-[28px] font-bold">{uk.play.discuss}</h1>
        <p className="text-fog">{uk.play.discussHint}</p>
      </div>
      <p className="text-lg leading-snug font-extrabold">{view.question}</p>
      {!ownId && <TooLate />}
      <ul className="flex flex-col gap-3">
        {view.cards.map((c) => (
          <li key={c.id}>
            <AnswerCard card={c} players={players} own={c.id === ownId} />
          </li>
        ))}
      </ul>
    </Shell>
  );
}

// ───────────────────────── P6 Vote ─────────────────────────

function Vote({ view, me }: { view: View; me: PublicPlayer }) {
  const players = usePlayersMap(view);
  const myVote = view.me!.voteCardId;
  const [pending, setPending] = useState<string | null>(null);
  const [error, setError] = useState('');
  const cd = useCountdown(view.timer);
  const voted = view.players.filter((p) => p.voted).length;
  const options = view.cards.filter((c) => c.id !== view.me!.ownCardId);
  const selected = pending ?? myVote;

  async function vote(cardId: string) {
    if (cd?.done) return;
    setPending(cardId);
    setError('');
    const res = await request((ack) => getSocket().emit('player:vote', cardId, ack));
    setPending(null);
    if (!res.ok) setError(res.error);
  }

  return (
    <Shell view={view} me={me} timer>
      <div className="flex flex-col gap-1">
        <h1 className="font-display text-[28px] font-bold">{uk.play.vote}</h1>
        <p className="text-fog">{uk.play.voteHint}</p>
      </div>
      <p className="text-lg leading-snug font-extrabold">{view.question}</p>
      <ul className="flex flex-col gap-3.5">
        {options.map((c) => (
          <li key={c.id}>
            <AnswerCard
              card={c}
              players={players}
              selectable
              selected={selected === c.id}
              onSelect={() => void vote(c.id)}
            />
          </li>
        ))}
      </ul>
      {error && (
        <p role="alert" className="font-bold text-coral">
          {error}
        </p>
      )}
      <div className="mt-auto flex flex-col items-center gap-3 pt-2">
        {myVote ? (
          <StatusToast title={uk.play.voteAccepted} hint={uk.play.canChange} />
        ) : (
          <p className="rounded-full bg-dusk px-4 py-2 text-center font-bold text-fog">{uk.play.noVoteYet}</p>
        )}
        <p className="text-sm font-bold text-fog">{uk.voted(voted, view.players.length)}</p>
      </div>
    </Shell>
  );
}

// ───────────────────────── P8 Result for this question ─────────────────────────

function MyResult({ view, me }: { view: View; me: PublicPlayer }) {
  const players = usePlayersMap(view);
  const r = view.me!.result;
  const s = view.settings;
  return (
    <Shell view={view} me={me}>
      <section className="flex flex-col items-center gap-2 py-4 text-center">
        <Label>{uk.play.thisQuestion}</Label>
        <span
          className={`animate-pop font-display text-7xl font-extrabold ${r && r.delta > 0 ? 'text-sun' : 'text-fog'}`}
        >
          {signed(r?.delta ?? 0)}
        </span>
      </section>

      <ul className="flex flex-col gap-3">
        <li
          className={`flex items-center gap-3.5 rounded-phone px-4 py-4 ${r?.guessedCorrect ? 'bg-sun text-ink' : 'bg-dusk'}`}
        >
          <span
            aria-hidden="true"
            className={`flex size-10 flex-none items-center justify-center rounded-full font-emoji text-xl ${r?.guessedCorrect ? 'bg-ink text-sun' : 'bg-edge'}`}
          >
            {r?.guessedCorrect ? <CheckIcon size={20} /> : r?.voted ? '🙈' : '🤐'}
          </span>
          <span className="flex-1 text-lg font-extrabold">
            {r?.guessedCorrect ? uk.play.guessedTitle : r?.voted ? uk.play.missed : uk.play.noVote}
          </span>
          {r?.guessedCorrect && (
            <span className="font-display text-xl font-extrabold">+{s.pointsCorrect}</span>
          )}
        </li>

        <li className="flex flex-col gap-3 rounded-phone bg-dusk px-4 py-4">
          <div className="flex items-center gap-3.5">
            <span
              aria-hidden="true"
              className="flex size-10 flex-none items-center justify-center rounded-full bg-edge font-emoji text-xl"
            >
              {r?.fooled.length ? '😈' : r?.answered ? '😶' : '✏️'}
            </span>
            <span className="flex-1 text-lg font-extrabold">
              {!r?.answered
                ? uk.play.noAnswerSent
                : r.fooled.length
                  ? uk.play.fooledTitle
                  : uk.play.fooledNone}
            </span>
            {!!r?.fooled.length && (
              <span className="font-display text-xl font-extrabold text-sun">
                +{r.fooled.length * s.pointsFooled}
              </span>
            )}
          </div>
          {!!r?.fooled.length && (
            <ul className="flex flex-wrap gap-2">
              {r.fooled.map((id) => {
                const p = players.get(id);
                return p ? (
                  <li key={id} className="animate-pop">
                    <PlayerChip player={p} />
                  </li>
                ) : null;
              })}
            </ul>
          )}
        </li>
      </ul>

      <section className="mt-2 flex items-center justify-between rounded-phone bg-velvet px-5 py-4">
        <span className="flex flex-col">
          <Label>{uk.play.total}</Label>
          <span className="font-display text-3xl font-extrabold tabular">{me.score}</span>
        </span>
        <span className="font-display text-2xl font-extrabold text-sun">{uk.play.place(view.me!.rank)}</span>
      </section>
    </Shell>
  );
}

// ───────────────────────── P9 Round end / Game end ─────────────────────────

function Final({ view, me }: { view: View; me: PublicPlayer }) {
  const gameOver = view.phase === 'GAME_END';
  const rank = view.me!.rank;
  const medal = ['🥇', '🥈', '🥉'][rank - 1];
  return (
    <Shell view={view} me={me}>
      <section className="flex flex-col items-center gap-3 py-4 text-center">
        <Label>{gameOver ? uk.play.gameOver : uk.play.roundOver(view.round)}</Label>
        <span className="animate-pop font-emoji text-7xl" aria-hidden="true">
          {medal ?? '🎉'}
        </span>
        <h1 className="font-display text-[32px] font-extrabold">{uk.play.place(rank)}</h1>
        <p className="font-display text-xl font-bold text-sun">{points(me.score)}</p>
      </section>
      <ul className="flex flex-col gap-2.5">
        <li className="flex items-center gap-3 rounded-phone bg-dusk px-4 py-3.5 font-bold">
          <span aria-hidden="true" className="font-emoji text-2xl">
            😈
          </span>
          {uk.play.statFooled(me.timesFooledOthers)}
        </li>
        <li className="flex items-center gap-3 rounded-phone bg-dusk px-4 py-3.5 font-bold">
          <span aria-hidden="true" className="font-emoji text-2xl">
            🧠
          </span>
          {uk.play.statCorrect(me.correctGuesses)}
        </li>
      </ul>
      <ScoreTable players={view.players} scale="phone" meId={me.id} animate={false} />
      {!gameOver && <p className="text-center font-bold text-fog">{uk.play.nextRoundSoon}</p>}
    </Shell>
  );
}
