import {
  AVATARS,
  DEFAULT_SETTINGS,
  MAX_ANSWER_LEN,
  MAX_NAME_LEN,
  MAX_PLAYERS,
  QUESTIONS_PER_ROUND,
  ROUNDS,
  type Card,
  type GameState,
  type Preset,
  type Settings,
  type ThemeChoice,
} from '../shared/types.ts';
import { buildResultSteps, computeResults } from './scoring.ts';

export class GameError extends Error {}

export type GameAction =
  | { type: 'createGame'; preset: Preset; settings: Settings }
  | { type: 'startGame' }
  | { type: 'pause' }
  | { type: 'resume' }
  | { type: 'addTime'; seconds: number }
  | { type: 'finishPhase' }
  | { type: 'startVoting' }
  | { type: 'next' }
  | { type: 'kick'; playerId: string }
  | { type: 'abort' }
  | { type: 'newGame' }
  | { type: 'setTheme'; theme: ThemeChoice }
  | { type: 'join'; id: string; token: string; name: string; avatar: number | null }
  | { type: 'setConnected'; playerId: string; connected: boolean }
  | { type: 'answer'; playerId: string; text: string }
  | { type: 'vote'; playerId: string; cardId: string }
  | { type: 'timerEnd' };

/** Once everyone has voted, the voting timer is cut to this many ms. */
export const ALL_VOTED_GRACE_MS = 3000;

export function initialState(): GameState {
  return {
    phase: 'IDLE',
    presetId: null,
    presetName: '',
    questions: [],
    settings: { ...DEFAULT_SETTINGS },
    players: [],
    round: 0,
    qIndex: 0,
    answers: {},
    cards: [],
    votes: {},
    resultSteps: [],
    resultsShown: 0,
    results: {},
    timer: null,
    seq: 0,
    shuffleSeed: 0,
    theme: 'auto',
  };
}

export function normalizeAnswer(text: string): string {
  return text.replace(/\s+/g, ' ').trim().slice(0, MAX_ANSWER_LEN).trim();
}

export function remainingMs(state: GameState, now: number): number | null {
  const t = state.timer;
  if (!t) return null;
  if (t.pausedRemainingMs !== null) return t.pausedRemainingMs;
  return t.endsAt === null ? null : Math.max(0, t.endsAt - now);
}

export function reduce(
  state: GameState,
  action: GameAction,
  now: number,
  random: () => number = Math.random,
): GameState {
  const s = structuredClone(state);
  const need = (...phases: GameState['phase'][]) => {
    if (!phases.includes(s.phase)) throw new GameError('Ця дія зараз недоступна');
  };

  switch (action.type) {
    case 'createGame': {
      need('IDLE');
      validatePreset(action.preset);
      s.presetId = action.preset.id;
      s.presetName = action.preset.name;
      s.questions = structuredClone(action.preset.rounds);
      s.settings = sanitizeSettings(action.settings);
      s.phase = 'LOBBY';
      for (const p of s.players) resetPlayer(p);
      return s;
    }
    case 'startGame': {
      need('LOBBY');
      if (s.players.length < 2) throw new GameError('Потрібно щонайменше 2 гравці');
      s.round = 0;
      s.qIndex = 0;
      return startQuestion(s, now, random);
    }
    case 'pause': {
      const t = s.timer;
      if (!t || t.endsAt === null) throw new GameError('Таймер не запущено');
      t.pausedRemainingMs = Math.max(0, t.endsAt - now);
      t.endsAt = null;
      return s;
    }
    case 'resume': {
      const t = s.timer;
      if (!t || t.pausedRemainingMs === null) throw new GameError('Таймер не на паузі');
      t.endsAt = now + t.pausedRemainingMs;
      t.pausedRemainingMs = null;
      return s;
    }
    case 'addTime': {
      const t = s.timer;
      if (!t) throw new GameError('Таймер не запущено');
      const ms = Math.max(1, Math.min(600, action.seconds)) * 1000;
      if (t.endsAt !== null) t.endsAt = Math.max(t.endsAt, now) + ms;
      else if (t.pausedRemainingMs !== null) t.pausedRemainingMs += ms;
      t.durationMs = Math.max(t.durationMs, remainingMs(s, now) ?? 0);
      return s;
    }
    case 'timerEnd': {
      const rem = remainingMs(s, now);
      if (rem === null || s.timer?.endsAt === null || rem > 50) return state;
      return endTimedPhase(s);
    }
    case 'finishPhase': {
      need('WRITING', 'VOTING');
      return endTimedPhase(s);
    }
    case 'startVoting': {
      need('REVEAL');
      return startVoting(s, now);
    }
    case 'next': {
      switch (s.phase) {
        case 'LOBBY':
          return reduce(state, { type: 'startGame' }, now, random);
        case 'REVEAL':
          return startVoting(s, now);
        case 'RESULTS':
          if (s.resultsShown < s.resultSteps.length) {
            s.resultsShown++;
            return s;
          }
          return applyScores(s);
        case 'SCOREBOARD':
          if (s.qIndex < QUESTIONS_PER_ROUND - 1) {
            s.qIndex++;
            return startQuestion(s, now, random);
          }
          s.phase = s.round < ROUNDS - 1 ? 'ROUND_END' : 'GAME_END';
          return s;
        case 'ROUND_END':
          s.round++;
          s.qIndex = 0;
          return startQuestion(s, now, random);
        default:
          throw new GameError('Ця дія зараз недоступна');
      }
    }
    case 'kick': {
      if (!s.players.some((p) => p.id === action.playerId)) throw new GameError('Гравця не знайдено');
      s.players = s.players.filter((p) => p.id !== action.playerId);
      delete s.answers[action.playerId];
      delete s.votes[action.playerId];
      return s;
    }
    case 'abort': {
      return { ...initialState(), theme: s.theme };
    }
    case 'newGame': {
      need('GAME_END', 'LOBBY');
      const players = s.players;
      for (const p of players) resetPlayer(p);
      return { ...initialState(), players, settings: s.settings, presetId: s.presetId, theme: s.theme };
    }
    case 'setTheme': {
      if (!['auto', 'base', 'halloween'].includes(action.theme)) throw new GameError('Невідома тема');
      s.theme = action.theme;
      return s;
    }
    case 'join': {
      const name = action.name.replace(/\s+/g, ' ').trim().slice(0, MAX_NAME_LEN);
      if (!name) throw new GameError('Введи ім’я');
      if (s.players.length >= MAX_PLAYERS) throw new GameError('Гра заповнена: максимум 10 гравців');
      if (s.players.some((p) => p.name.toLocaleLowerCase('uk') === name.toLocaleLowerCase('uk')))
        throw new GameError('Таке ім’я вже є — додай літеру чи емодзі');
      const taken = new Set(s.players.map((p) => p.avatar));
      let avatar = action.avatar;
      if (avatar === null || taken.has(avatar) || avatar < 0 || avatar >= AVATARS.length) {
        avatar = AVATARS.findIndex((_, i) => !taken.has(i));
      }
      s.players.push({
        id: action.id,
        token: action.token,
        name,
        avatar,
        score: 0,
        connected: true,
        timesFooledOthers: 0,
        correctGuesses: 0,
      });
      return s;
    }
    case 'setConnected': {
      const p = s.players.find((x) => x.id === action.playerId);
      if (!p || p.connected === action.connected) return state;
      p.connected = action.connected;
      return s;
    }
    case 'answer': {
      need('WRITING');
      if (!s.players.some((p) => p.id === action.playerId)) throw new GameError('Тебе немає в грі');
      if (remainingMs(s, now) === 0) throw new GameError('Час вийшов');
      const text = normalizeAnswer(action.text);
      if (text) s.answers[action.playerId] = text;
      else delete s.answers[action.playerId];
      return s;
    }
    case 'vote': {
      need('VOTING');
      if (!s.players.some((p) => p.id === action.playerId)) throw new GameError('Тебе немає в грі');
      if (remainingMs(s, now) === 0) throw new GameError('Час вийшов');
      const card = s.cards.find((c) => c.id === action.cardId);
      if (!card) throw new GameError('Такої відповіді немає');
      if (card.authorId === action.playerId) throw new GameError('За свою відповідь голосувати не можна');
      s.votes[action.playerId] = card.id;
      const everyoneVoted = s.players.filter((p) => p.connected).every((p) => s.votes[p.id]);
      const t = s.timer;
      if (everyoneVoted && t && t.endsAt !== null && t.endsAt - now > ALL_VOTED_GRACE_MS) {
        t.endsAt = now + ALL_VOTED_GRACE_MS;
      }
      return s;
    }
  }
}

function resetPlayer(p: GameState['players'][number]) {
  p.score = 0;
  p.timesFooledOthers = 0;
  p.correctGuesses = 0;
}

function startQuestion(s: GameState, now: number, random: () => number): GameState {
  s.phase = 'WRITING';
  s.seq++;
  s.shuffleSeed = Math.floor(random() * 2 ** 32);
  s.answers = {};
  s.cards = [];
  s.votes = {};
  s.results = {};
  s.resultSteps = [];
  s.resultsShown = 0;
  const ms = s.settings.writingSeconds * 1000;
  s.timer = { endsAt: now + ms, pausedRemainingMs: null, durationMs: ms };
  return s;
}

function startVoting(s: GameState, now: number): GameState {
  s.phase = 'VOTING';
  s.votes = {};
  const ms = s.settings.votingSeconds * 1000;
  s.timer = { endsAt: now + ms, pausedRemainingMs: null, durationMs: ms };
  return s;
}

function endTimedPhase(s: GameState): GameState {
  s.timer = null;
  if (s.phase === 'WRITING') {
    s.cards = buildCards(s);
    s.phase = 'REVEAL';
    return s;
  }
  if (s.phase === 'VOTING') {
    s.results = computeResults(
      s.players.map((p) => p.id),
      s.cards,
      s.votes,
      s.settings,
    );
    s.resultSteps = buildResultSteps(s.cards, s.votes);
    s.resultsShown = 0;
    s.phase = 'RESULTS';
    return s;
  }
  return s;
}

function applyScores(s: GameState): GameState {
  for (const p of s.players) {
    const r = s.results[p.id];
    if (!r) continue;
    p.score += r.delta;
    p.timesFooledOthers += r.fooled.length;
    if (r.guessedCorrect) p.correctGuesses++;
  }
  s.resultsShown = s.resultSteps.length;
  s.phase = 'SCOREBOARD';
  return s;
}

const LETTERS = 'АБВГДЕЄЖЗИІКЛМН';

export function buildCards(s: GameState): Card[] {
  const q = s.questions[s.round][s.qIndex];
  const cards: Omit<Card, 'id' | 'letter'>[] = [{ text: q.correctAnswer.trim(), authorId: null }];
  for (const p of s.players) {
    const text = s.answers[p.id];
    if (text) cards.push({ text, authorId: p.id });
  }
  const rand = mulberry32(hashSeed(`${s.shuffleSeed}:${s.seq}`));
  for (let i = cards.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [cards[i], cards[j]] = [cards[j], cards[i]];
  }
  // ids are assigned after the shuffle so they say nothing about the author
  return cards.map((c, i) => ({ ...c, id: `q${s.seq}-${i}`, letter: LETTERS[i] }));
}

export function validatePreset(p: Preset): void {
  if (!p.name.trim()) throw new GameError('Дай набору назву');
  if (p.rounds.length !== ROUNDS) throw new GameError('Потрібно 2 раунди');
  for (const r of p.rounds) {
    if (r.length !== QUESTIONS_PER_ROUND) throw new GameError('Потрібно по 5 питань у раунді');
    for (const q of r) {
      if (!q.question.trim() || !q.correctAnswer.trim())
        throw new GameError('Заповни всі питання й правильні відповіді');
    }
  }
}

export function sanitizeSettings(x: Settings): Settings {
  const int = (v: unknown, lo: number, hi: number, d: number) => {
    const n = Math.round(Number(v));
    return Number.isFinite(n) ? Math.min(hi, Math.max(lo, n)) : d;
  };
  return {
    writingSeconds: int(x.writingSeconds, 10, 600, DEFAULT_SETTINGS.writingSeconds),
    votingSeconds: int(x.votingSeconds, 10, 600, DEFAULT_SETTINGS.votingSeconds),
    pointsCorrect: int(x.pointsCorrect, 0, 10, DEFAULT_SETTINGS.pointsCorrect),
    pointsFooled: int(x.pointsFooled, 0, 10, DEFAULT_SETTINGS.pointsFooled),
  };
}

function hashSeed(str: string): number {
  let h = 1779033703 ^ str.length;
  for (let i = 0; i < str.length; i++) {
    h = Math.imul(h ^ str.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  return h >>> 0;
}

function mulberry32(a: number) {
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
