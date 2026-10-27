import { describe, expect, it } from 'vitest';
import { ALL_VOTED_GRACE_MS, initialState, normalizeAnswer, reduce } from '../server/game.ts';
import { buildView } from '../server/views.ts';
import { makeGame, preset } from './helpers.ts';
import { DEFAULT_SETTINGS, HOST_LIE, resolveTheme, seasonalTheme } from '../shared/types.ts';

const W = DEFAULT_SETTINGS.writingSeconds * 1000;
const V = DEFAULT_SETTINGS.votingSeconds * 1000;

function playToVoting() {
  const g = makeGame();
  g.act({ type: 'startGame' });
  g.act({ type: 'answer', playerId: 'p0', text: '  Пити вино   з полином ' });
  g.act({ type: 'answer', playerId: 'p1', text: 'Слухати дзвони' });
  g.advance(W);
  g.act({ type: 'timerEnd' });
  g.act({ type: 'startVoting' });
  return g;
}

describe('lobby', () => {
  it('needs at least two players to start', () => {
    const g = makeGame(['Оля']);
    expect(() => g.act({ type: 'startGame' })).toThrow('2 гравці');
  });

  it('rejects duplicate names and assigns distinct avatars', () => {
    const g = makeGame();
    expect(() => g.act({ type: 'join', id: 'x', token: 'x', name: ' оля ', avatar: null })).toThrow();
    expect(new Set(g.state.players.map((p) => p.avatar)).size).toBe(3);
  });

  it('refuses an incomplete preset', () => {
    const bad = structuredClone(preset);
    bad.rounds[1][4].correctAnswer = ' ';
    expect(() =>
      reduce(initialState(), { type: 'createGame', preset: bad, settings: DEFAULT_SETTINGS }, 0),
    ).toThrow();
  });

  it('refuses a preset without the host lie', () => {
    const bad = structuredClone(preset);
    bad.rounds[0][2].lieAnswer = '';
    expect(() =>
      reduce(initialState(), { type: 'createGame', preset: bad, settings: DEFAULT_SETTINGS }, 0),
    ).toThrow('брехню');
  });
});

describe('writing', () => {
  it('normalises answers: trim, collapse spaces, 80 chars, empty removes', () => {
    expect(normalizeAnswer('  a   b ')).toBe('a b');
    expect(normalizeAnswer('я'.repeat(100))).toHaveLength(80);
    const g = makeGame();
    g.act({ type: 'startGame' });
    g.act({ type: 'answer', playerId: 'p0', text: 'Щось' });
    g.act({ type: 'answer', playerId: 'p0', text: '   ' });
    expect(g.state.answers.p0).toBeUndefined();
  });

  it('ignores an early timerEnd and advances when the timer runs out', () => {
    const g = makeGame();
    g.act({ type: 'startGame' });
    expect(g.state.phase).toBe('WRITING');
    g.advance(W - 1000);
    g.act({ type: 'timerEnd' });
    expect(g.state.phase).toBe('WRITING');
    g.advance(1000);
    g.act({ type: 'timerEnd' });
    expect(g.state.phase).toBe('REVEAL');
    expect(g.state.timer).toBeNull();
  });

  it('pause keeps remaining time, resume restarts it, +15s extends it', () => {
    const g = makeGame();
    g.act({ type: 'startGame' });
    g.advance(10_000);
    g.act({ type: 'pause' });
    expect(g.state.timer).toMatchObject({ endsAt: null, pausedRemainingMs: W - 10_000 });
    g.advance(60_000);
    g.act({ type: 'timerEnd' });
    expect(g.state.phase).toBe('WRITING');
    g.act({ type: 'addTime', seconds: 15 });
    expect(g.state.timer?.pausedRemainingMs).toBe(W - 10_000 + 15_000);
    g.act({ type: 'resume' });
    expect(g.state.timer?.endsAt).toBe(g.now + W + 5_000);
  });

  it('builds one card per answer plus the correct one and the lie, no answer = no card', () => {
    const g = playToVoting();
    expect(g.state.cards).toHaveLength(4);
    expect(g.state.cards.filter((c) => c.authorId === null)).toHaveLength(1);
    expect(g.state.cards.find((c) => c.authorId === HOST_LIE)?.text).toBe('Брехня 0.0');
    expect(g.state.cards.find((c) => c.authorId === 'p0')?.text).toBe('Пити вино з полином');
    expect(g.state.cards.map((c) => c.letter)).toEqual(['А', 'Б', 'В', 'Г']);
  });
});

describe('voting', () => {
  it('forbids self votes and lets a vote change', () => {
    const g = playToVoting();
    expect(() => g.act({ type: 'vote', playerId: 'p0', cardId: g.cardOf('p0') })).toThrow('свою');
    g.act({ type: 'vote', playerId: 'p0', cardId: g.cardOf('p1') });
    g.act({ type: 'vote', playerId: 'p0', cardId: g.cardOf(null) });
    expect(g.state.votes.p0).toBe(g.cardOf(null));
  });

  it('cuts the timer to a short grace period once everyone has voted', () => {
    const g = playToVoting();
    g.act({ type: 'vote', playerId: 'p0', cardId: g.cardOf(null) });
    g.act({ type: 'vote', playerId: 'p1', cardId: g.cardOf('p0') });
    expect(g.state.timer?.endsAt).toBe(g.now + V);
    g.act({ type: 'vote', playerId: 'p2', cardId: g.cardOf('p0') });
    expect(g.state.timer?.endsAt).toBe(g.now + ALL_VOTED_GRACE_MS);
  });

  it('runs results step by step, then applies scores on the scoreboard', () => {
    const g = playToVoting();
    g.act({ type: 'vote', playerId: 'p0', cardId: g.cardOf(null) });
    g.act({ type: 'vote', playerId: 'p1', cardId: g.cardOf('p0') });
    g.act({ type: 'vote', playerId: 'p2', cardId: g.cardOf('p0') });
    g.act({ type: 'finishPhase' });
    expect(g.state.phase).toBe('RESULTS');
    // p1's card: no votes (1 step); p0's card: voters + author; lie: no votes (1 step);
    // correct: voters + author
    expect(g.state.resultSteps).toHaveLength(6);
    for (let i = 0; i < 6; i++) g.act({ type: 'next' });
    expect(g.state.phase).toBe('RESULTS');
    expect(g.state.players.every((p) => p.score === 0)).toBe(true);
    g.act({ type: 'next' });
    expect(g.state.phase).toBe('SCOREBOARD');
    const score = Object.fromEntries(g.state.players.map((p) => [p.id, p.score]));
    expect(score).toEqual({ p0: 4, p1: 0, p2: 0 });
    expect(g.state.players[0]).toMatchObject({ timesFooledOthers: 2, correctGuesses: 1 });
  });

  it('takes points from whoever votes for the host lie', () => {
    const g = playToVoting();
    g.act({ type: 'vote', playerId: 'p0', cardId: g.cardOf(HOST_LIE) });
    g.act({ type: 'vote', playerId: 'p1', cardId: g.cardOf(null) });
    g.act({ type: 'finishPhase' });
    const lieSteps = g.state.resultSteps.filter((s) => s.cardId === g.cardOf(HOST_LIE));
    expect(lieSteps.map((s) => s.stage)).toEqual(['voters', 'author']);
    while (g.state.phase === 'RESULTS') g.act({ type: 'next' });
    const score = Object.fromEntries(g.state.players.map((p) => [p.id, p.score]));
    expect(score).toEqual({ p0: -2, p1: 2, p2: 0 });
    expect(g.state.results.p0).toMatchObject({ fellForLie: true, guessedCorrect: false });
  });
});

describe('privacy', () => {
  it('hides authors and the correct answer from screen and players until revealed', () => {
    const g = playToVoting();
    const opts = { now: g.now, joinUrl: '' };
    const screen = buildView(g.state, 'screen', opts);
    expect(screen.cards.every((c) => c.authorId === undefined && c.voters === undefined)).toBe(true);
    expect(screen.host).toBeUndefined();
    const player = buildView(g.state, 'player', { ...opts, playerId: 'p0' });
    expect(player.me?.ownCardId).toBe(g.cardOf('p0'));
    expect(player.cards.every((c) => c.authorId === undefined)).toBe(true);
    const host = buildView(g.state, 'host', opts);
    expect(host.host?.correctAnswer).toBe('Правда 0.0');
    expect(host.host?.lieAnswer).toBe('Брехня 0.0');
    expect(host.cards.some((c) => c.authorId === HOST_LIE)).toBe(true);
    expect(screen.cards.some((c) => c.authorId === HOST_LIE)).toBe(false);
    expect(player.cards.some((c) => c.authorId === HOST_LIE)).toBe(false);
    expect(host.cards.some((c) => c.authorId === null)).toBe(true);
    expect(JSON.stringify(screen)).not.toContain('"t0"');
  });

  it('shows the explanation to the host only', () => {
    const g = playToVoting();
    g.state.questions[0][0].explanation = 'Бо так';
    const opts = { now: g.now, joinUrl: '' };
    expect(buildView(g.state, 'host', opts).host?.explanation).toBe('Бо так');
    expect(JSON.stringify(buildView(g.state, 'screen', opts))).not.toContain('Бо так');
    expect(JSON.stringify(buildView(g.state, 'player', { ...opts, playerId: 'p0' }))).not.toContain('Бо так');
  });

  it('reveals a card only after its step', () => {
    const g = playToVoting();
    g.act({ type: 'vote', playerId: 'p1', cardId: g.cardOf('p0') });
    g.act({ type: 'finishPhase' });
    const view = () => buildView(g.state, 'screen', { now: g.now, joinUrl: '' });
    const first = g.state.resultSteps[0];
    expect(view().results).toMatchObject({ shown: 0, focusCardId: first.cardId, focusStage: 'pending' });
    g.act({ type: 'next' });
    const c = view().cards.find((x) => x.id === first.cardId)!;
    expect(c.revealed).toBe(first.stage);
    const correct = view().cards.find((x) => x.id === g.cardOf(null))!;
    expect(correct.authorId).toBeUndefined();
  });
});

describe('game flow', () => {
  it('goes through 2 rounds × 5 questions to the final', () => {
    const g = makeGame();
    g.act({ type: 'startGame' });
    const phases: string[] = [];
    for (let i = 0; i < 10; i++) {
      g.act({ type: 'finishPhase' });
      g.act({ type: 'startVoting' });
      g.act({ type: 'finishPhase' });
      while (g.state.phase === 'RESULTS') g.act({ type: 'next' });
      g.act({ type: 'next' });
      phases.push(g.state.phase);
      if (g.state.phase === 'ROUND_END') g.act({ type: 'next' });
    }
    expect(phases).toEqual([
      ...Array(4).fill('WRITING'),
      'ROUND_END',
      ...Array(4).fill('WRITING'),
      'GAME_END',
    ]);
  });

  it('kicking a player removes their answer and vote', () => {
    const g = playToVoting();
    g.act({ type: 'vote', playerId: 'p1', cardId: g.cardOf(null) });
    g.act({ type: 'kick', playerId: 'p1' });
    expect(g.state.players.map((p) => p.id)).toEqual(['p0', 'p2']);
    expect(g.state.votes.p1).toBeUndefined();
  });
});

describe('theme', () => {
  it('follows the calendar on auto: 15 Oct – 3 Nov is Halloween', () => {
    expect(seasonalTheme(new Date(2026, 9, 14))).toBe('base');
    expect(seasonalTheme(new Date(2026, 9, 15))).toBe('halloween');
    expect(seasonalTheme(new Date(2026, 10, 3, 23, 59))).toBe('halloween');
    expect(seasonalTheme(new Date(2026, 10, 4))).toBe('base');
    expect(resolveTheme('base', new Date(2026, 9, 31))).toBe('base');
  });

  it('can be switched in any phase and survives a new game and a cancel', () => {
    const g = playToVoting();
    g.act({ type: 'setTheme', theme: 'halloween' });
    expect(g.state.theme).toBe('halloween');
    g.act({ type: 'abort' });
    expect(g.state.theme).toBe('halloween');
    g.act({ type: 'createGame', preset, settings: DEFAULT_SETTINGS });
    g.act({ type: 'newGame' });
    expect(g.state.theme).toBe('halloween');
    expect(() => g.act({ type: 'setTheme', theme: 'xmas' as 'base' })).toThrow();
  });
});
