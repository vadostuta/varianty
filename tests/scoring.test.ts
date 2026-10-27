import { describe, expect, it } from 'vitest';
import { DEFAULT_SETTINGS, HOST_LIE, type Card } from '../shared/types.ts';
import { buildResultSteps, computeResults } from '../server/scoring.ts';

const cards: Card[] = [
  { id: 'c0', letter: 'А', text: 'Прикладати до голови мертву мишу', authorId: null },
  { id: 'c1', letter: 'Б', text: 'Пити вино з полином', authorId: 'olia' },
  { id: 'c2', letter: 'В', text: 'Слухати дзвони', authorId: 'andrii' },
  // same words as the correct answer, but it's still a player's card
  { id: 'c3', letter: 'Г', text: 'Прикладати до голови мертву мишу', authorId: 'maria' },
  { id: 'c4', letter: 'Ґ', text: 'Пити відвар із павутиння', authorId: HOST_LIE },
];
const players = ['olia', 'taras', 'maria', 'andrii', 'iryna', 'bohdan'];

describe('computeResults', () => {
  const votes = { taras: 'c0', iryna: 'c0', maria: 'c1', bohdan: 'c1', olia: 'c2', andrii: 'c3' };
  const r = computeResults(players, cards, votes, DEFAULT_SETTINGS);

  it('gives +2 for voting for the correct card', () => {
    expect(r.taras).toMatchObject({ delta: 2, guessedCorrect: true, fooled: [] });
    expect(r.iryna.delta).toBe(2);
  });

  it('gives +1 per vote to the author of a fake card', () => {
    expect(r.olia).toMatchObject({ delta: 2, guessedCorrect: false });
    expect([...r.olia.fooled].sort()).toEqual(['bohdan', 'maria']);
    expect(r.andrii.fooled).toEqual(['olia']);
  });

  it('treats identical text to the correct answer as a player card', () => {
    expect(r.andrii).toMatchObject({ guessedCorrect: false });
    expect(r.maria.fooled).toEqual(['andrii']);
    expect(r.maria.delta).toBe(1);
  });

  it('combines correct guess and fooled votes', () => {
    const r2 = computeResults(players, cards, { olia: 'c0', taras: 'c1' }, DEFAULT_SETTINGS);
    expect(r2.olia.delta).toBe(3);
  });

  it('gives nothing for no answer and no vote', () => {
    expect(r.bohdan).toMatchObject({ delta: 0, answered: false, voted: true });
    const r2 = computeResults(players, cards, {}, DEFAULT_SETTINGS);
    expect(r2.taras).toMatchObject({ delta: 0, answered: false, voted: false });
  });

  it('ignores a self vote', () => {
    const r2 = computeResults(players, cards, { olia: 'c1' }, DEFAULT_SETTINGS);
    expect(r2.olia.delta).toBe(0);
  });

  it('uses the configured point values', () => {
    const r2 = computeResults(players, cards, votes, {
      ...DEFAULT_SETTINGS,
      pointsCorrect: 5,
      pointsFooled: 3,
    });
    expect(r2.taras.delta).toBe(5);
    expect(r2.olia.delta).toBe(6);
  });

  it('takes pointsLie from a voter who believed the host lie', () => {
    const r2 = computeResults(players, cards, { taras: 'c4', iryna: 'c0', olia: 'c4' }, DEFAULT_SETTINGS);
    expect(r2.taras).toMatchObject({ delta: -2, fellForLie: true, guessedCorrect: false });
    expect(r2.iryna).toMatchObject({ delta: 2, fellForLie: false });
    const r3 = computeResults(players, cards, { taras: 'c4' }, { ...DEFAULT_SETTINGS, pointsLie: 5 });
    expect(r3.taras.delta).toBe(-5);
  });

  it('combines fooled votes with the lie penalty', () => {
    const r2 = computeResults(players, cards, { olia: 'c4', taras: 'c1', maria: 'c1' }, DEFAULT_SETTINGS);
    expect(r2.olia.delta).toBe(0);
  });
});

describe('buildResultSteps', () => {
  it('reveals unvoted fakes first, then by votes, then the host lie, and the correct card last', () => {
    const steps = buildResultSteps(cards, { taras: 'c0', maria: 'c1', bohdan: 'c1', olia: 'c2' });
    expect(steps).toEqual([
      { cardId: 'c3', stage: 'author' },
      { cardId: 'c2', stage: 'voters' },
      { cardId: 'c2', stage: 'author' },
      { cardId: 'c1', stage: 'voters' },
      { cardId: 'c1', stage: 'author' },
      { cardId: 'c4', stage: 'author' },
      { cardId: 'c0', stage: 'voters' },
      { cardId: 'c0', stage: 'author' },
    ]);
  });

  it('shows who believed the host lie before revealing it', () => {
    const steps = buildResultSteps(cards, { taras: 'c4' });
    expect(steps.slice(-3)).toEqual([
      { cardId: 'c4', stage: 'voters' },
      { cardId: 'c4', stage: 'author' },
      { cardId: 'c0', stage: 'author' },
    ]);
  });
});
