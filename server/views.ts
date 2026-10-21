import type { GameState, PublicPlayer, Role, View, ViewCard } from '../shared/types.ts';
import { votersOf } from './scoring.ts';

const AFTER_RESULTS = new Set(['SCOREBOARD', 'ROUND_END', 'GAME_END']);

/**
 * Role projection of the game state. Authors and the correct flag stay out of the
 * screen/player payloads until the host reveals them card by card in RESULTS.
 */
export function buildView(
  s: GameState,
  role: Role,
  opts: { now: number; joinUrl: string; playerId?: string },
): View {
  const isHost = role === 'host';
  const inQuestion = !['IDLE', 'LOBBY'].includes(s.phase);
  const q = inQuestion ? s.questions[s.round]?.[s.qIndex] : undefined;

  const players: PublicPlayer[] = s.players.map((p) => ({
    id: p.id,
    name: p.name,
    avatar: p.avatar,
    score: p.score,
    connected: p.connected,
    answered: s.phase === 'WRITING' ? !!s.answers[p.id] : s.cards.some((c) => c.authorId === p.id),
    voted: !!s.votes[p.id],
    timesFooledOthers: p.timesFooledOthers,
    correctGuesses: p.correctGuesses,
  }));

  // how far each card has been revealed to the room
  const level = new Map<string, 'voters' | 'author'>();
  if (s.phase === 'RESULTS') {
    for (const step of s.resultSteps.slice(0, s.resultsShown)) level.set(step.cardId, step.stage);
  } else if (AFTER_RESULTS.has(s.phase)) {
    for (const c of s.cards) level.set(c.id, 'author');
  }

  const cards: ViewCard[] = s.cards.map((c) => {
    const card: ViewCard = { id: c.id, letter: c.letter, text: c.text };
    const lv = level.get(c.id);
    if (lv) card.revealed = lv;
    if (isHost || lv) card.voters = votersOf(c.id, s.votes);
    if (isHost || lv === 'author') card.authorId = c.authorId;
    return card;
  });

  let results: View['results'] = null;
  if (s.phase === 'RESULTS') {
    const steps = s.resultSteps;
    const shown = s.resultsShown;
    const last = shown > 0 ? steps[shown - 1] : null;
    results = {
      total: steps.length,
      shown,
      focusCardId: last ? last.cardId : (steps[0]?.cardId ?? null),
      focusStage: last ? last.stage : steps.length ? 'pending' : null,
    };
  }

  const view: View = {
    role,
    serverNow: opts.now,
    phase: s.phase,
    presetName: s.presetName,
    settings: s.settings,
    round: s.round,
    qIndex: s.qIndex,
    question: q?.question ?? null,
    players,
    timer: s.timer,
    cards,
    results,
    deltas: AFTER_RESULTS.has(s.phase)
      ? Object.fromEntries(Object.entries(s.results).map(([id, r]) => [id, r.delta]))
      : null,
    joinUrl: opts.joinUrl,
  };

  if (isHost) {
    view.host = {
      presetId: s.presetId,
      correctAnswer: q?.correctAnswer ?? null,
      explanation: q?.explanation || null,
      answers: s.players
        .filter((p) => s.answers[p.id])
        .map((p) => ({ playerId: p.id, text: s.answers[p.id] })),
      nextStep: s.phase === 'RESULTS' ? (s.resultSteps[s.resultsShown] ?? null) : null,
      hasNextQuestion: !(
        s.round === s.questions.length - 1 && s.qIndex === (s.questions.at(-1)?.length ?? 0) - 1
      ),
    };
  }

  if (role === 'player' && opts.playerId) {
    const pid = opts.playerId;
    const own = s.cards.find((c) => c.authorId === pid);
    view.me = {
      id: pid,
      answer: s.phase === 'WRITING' ? (s.answers[pid] ?? null) : (own?.text ?? null),
      voteCardId: s.votes[pid] ?? null,
      ownCardId: own?.id ?? null,
      result: AFTER_RESULTS.has(s.phase) ? (s.results[pid] ?? null) : null,
      rank: rankOf(s, pid),
    };
  }
  return view;
}

/** Competition ranking: equal scores share a place (1, 1, 3). */
export function rankOf(s: GameState, playerId: string): number {
  const me = s.players.find((p) => p.id === playerId);
  if (!me) return 0;
  return 1 + s.players.filter((p) => p.score > me.score).length;
}
