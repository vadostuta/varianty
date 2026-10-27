export type Phase =
  | 'IDLE' // no game yet: host is on the setup screen
  | 'LOBBY'
  | 'WRITING'
  | 'REVEAL'
  | 'VOTING'
  | 'RESULTS'
  | 'SCOREBOARD'
  | 'ROUND_END'
  | 'GAME_END';

export const ROUNDS = 2;
export const QUESTIONS_PER_ROUND = 5;
export const MAX_PLAYERS = 10;
export const MAX_ANSWER_LEN = 80;
export const MAX_NAME_LEN = 16;

export interface Settings {
  writingSeconds: number;
  votingSeconds: number;
  pointsCorrect: number;
  pointsFooled: number;
  /** taken from anyone who votes for the host's lie */
  pointsLie: number;
}

export const DEFAULT_SETTINGS: Settings = {
  writingSeconds: 60,
  votingSeconds: 30,
  pointsCorrect: 2,
  pointsFooled: 1,
  pointsLie: 2,
};

export interface PresetQuestion {
  question: string;
  correctAnswer: string;
  /** the host's own fake; voting for it costs settings.pointsLie */
  lieAnswer: string;
  /** optional; shown only to the host, for when players ask "why?" */
  explanation?: string;
}

export interface Preset {
  id: string;
  name: string;
  updatedAt: number;
  /** ROUNDS × QUESTIONS_PER_ROUND */
  rounds: PresetQuestion[][];
}

export type Theme = 'base' | 'halloween';
/** What the host picked; 'auto' follows the calendar. */
export type ThemeChoice = Theme | 'auto';

/** Halloween runs from 15 October to 3 November (local time), inclusive. */
export function seasonalTheme(date: Date): Theme {
  const m = date.getMonth();
  const d = date.getDate();
  return (m === 9 && d >= 15) || (m === 10 && d <= 3) ? 'halloween' : 'base';
}

export function resolveTheme(choice: ThemeChoice, date: Date): Theme {
  return choice === 'auto' ? seasonalTheme(date) : choice;
}

/** Card.authorId of the host's lie. Player ids are UUIDs, so it can't clash. */
export const HOST_LIE = 'host-lie';

/** Player colour + avatar slot; index into AVATARS. */
export interface Avatar {
  emoji: string;
  color: string;
  colorName: string;
}

export const AVATARS: Avatar[] = [
  { emoji: '🦊', color: '#FF8A3D', colorName: 'Помаранч' },
  { emoji: '🐻', color: '#5AB0FF', colorName: 'Небо' },
  { emoji: '🐸', color: '#9BE15D', colorName: 'Лайм' },
  { emoji: '🦉', color: '#B48CFF', colorName: 'Бузок' },
  { emoji: '🐙', color: '#FF6FB5', colorName: 'Фуксія' },
  { emoji: '🦄', color: '#3DD6D0', colorName: 'Бірюза' },
  { emoji: '🐱', color: '#E8C39E', colorName: 'Пісок' },
  { emoji: '🐼', color: '#8C9BFF', colorName: 'Індиго' },
  { emoji: '🐧', color: '#E05A7A', colorName: 'Вишня' },
  { emoji: '🐢', color: '#FFB199', colorName: 'Персик' },
];

export interface Player {
  id: string;
  token: string;
  name: string;
  avatar: number;
  score: number;
  connected: boolean;
  /** cumulative stats for the end-of-game titles */
  timesFooledOthers: number;
  correctGuesses: number;
}

export interface Card {
  id: string;
  letter: string;
  text: string;
  /** null = the host's correct answer, HOST_LIE = the host's lie, otherwise a player id */
  authorId: string | null;
}

export interface PlayerResult {
  delta: number;
  guessedCorrect: boolean;
  /** voted for the host's lie */
  fellForLie: boolean;
  /** ids of players who voted for this player's card */
  fooled: string[];
  answered: boolean;
  voted: boolean;
}

export interface ResultStep {
  cardId: string;
  stage: 'voters' | 'author';
}

export interface TimerState {
  /** epoch ms when the running timer ends */
  endsAt: number | null;
  /** remaining ms while paused */
  pausedRemainingMs: number | null;
  durationMs: number;
}

export interface GameState {
  phase: Phase;
  presetId: string | null;
  presetName: string;
  questions: PresetQuestion[][];
  settings: Settings;
  players: Player[];
  /** 0-based */
  round: number;
  /** 0-based within the round */
  qIndex: number;
  /** playerId → answer text (current question) */
  answers: Record<string, string>;
  /** shuffled once per question when writing ends */
  cards: Card[];
  /** playerId → cardId */
  votes: Record<string, string>;
  /** RESULTS reveal sequence and how many steps are shown */
  resultSteps: ResultStep[];
  resultsShown: number;
  /** computed when voting ends, applied to scores on SCOREBOARD */
  results: Record<string, PlayerResult>;
  timer: TimerState | null;
  /** increments for every question; used to seed the shuffle */
  seq: number;
  /** random per question; keeps the card order unpredictable */
  shuffleSeed: number;
  /** survives new games and cancels; every screen follows it */
  theme: ThemeChoice;
}

// ───────────── Views sent to clients ─────────────

export interface PublicPlayer {
  id: string;
  name: string;
  avatar: number;
  score: number;
  connected: boolean;
  answered: boolean;
  voted: boolean;
  timesFooledOthers: number;
  correctGuesses: number;
}

export interface ViewCard {
  id: string;
  letter: string;
  text: string;
  /** present once revealed (or always for the host after writing) */
  revealed?: 'voters' | 'author';
  voters?: string[];
  /** undefined = hidden, null = correct answer, HOST_LIE = host's lie, string = author player id */
  authorId?: string | null;
}

export type Role = 'host' | 'screen' | 'player';

export interface View {
  role: Role;
  serverNow: number;
  phase: Phase;
  presetName: string;
  settings: Settings;
  round: number;
  qIndex: number;
  question: string | null;
  players: PublicPlayer[];
  timer: TimerState | null;
  cards: ViewCard[];
  results: {
    total: number;
    shown: number;
    /** card that the current/next step is about */
    focusCardId: string | null;
    focusStage: 'pending' | 'voters' | 'author' | null;
  } | null;
  /** SCOREBOARD and later: last question's deltas */
  deltas: Record<string, number> | null;
  joinUrl: string;
  host?: {
    presetId: string | null;
    correctAnswer: string | null;
    lieAnswer: string | null;
    explanation: string | null;
    answers: { playerId: string; text: string }[];
    /** what the next "Далі" press reveals in RESULTS */
    nextStep: ResultStep | null;
    hasNextQuestion: boolean;
  };
  me?: {
    id: string;
    answer: string | null;
    voteCardId: string | null;
    ownCardId: string | null;
    result: PlayerResult | null;
    rank: number;
  };
}
