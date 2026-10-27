import { HOST_LIE, type Card, type PlayerResult, type ResultStep, type Settings } from '../shared/types.ts';

/**
 * Scores one question. Cards are identified by id, never by text: only the host's card
 * (authorId === null) is correct, even if a player typed the same words. Voting for the host's
 * lie (authorId === HOST_LIE) costs pointsLie.
 */
export function computeResults(
  playerIds: string[],
  cards: Card[],
  votes: Record<string, string>,
  settings: Settings,
): Record<string, PlayerResult> {
  const cardById = new Map(cards.map((c) => [c.id, c]));
  const out: Record<string, PlayerResult> = {};
  for (const pid of playerIds) {
    const ownCard = cards.find((c) => c.authorId === pid);
    const voteCard = votes[pid] ? cardById.get(votes[pid]) : undefined;
    const guessedCorrect = !!voteCard && voteCard.authorId === null;
    const fellForLie = !!voteCard && voteCard.authorId === HOST_LIE;
    const fooled = ownCard
      ? Object.entries(votes)
          .filter(([voter, cardId]) => cardId === ownCard.id && voter !== pid)
          .map(([voter]) => voter)
      : [];
    out[pid] = {
      delta:
        (guessedCorrect ? settings.pointsCorrect : 0) +
        fooled.length * settings.pointsFooled -
        (fellForLie ? settings.pointsLie : 0),
      guessedCorrect,
      fellForLie,
      fooled,
      answered: !!ownCard,
      voted: !!voteCard,
    };
  }
  return out;
}

export function votersOf(cardId: string, votes: Record<string, string>): string[] {
  return Object.entries(votes)
    .filter(([, c]) => c === cardId)
    .map(([voter]) => voter);
}

/**
 * Reveal order for the results screen: fakes nobody believed first (one step each),
 * then fakes by ascending vote count (voters, then author), then the host's lie, and the
 * correct card last.
 */
export function buildResultSteps(cards: Card[], votes: Record<string, string>): ResultStep[] {
  const count = (c: Card) => votersOf(c.id, votes).length;
  const fakes = cards.filter((c) => c.authorId !== null && c.authorId !== HOST_LIE);
  const lie = cards.find((c) => c.authorId === HOST_LIE);
  const correct = cards.find((c) => c.authorId === null);
  const ordered = [...fakes].sort((a, b) => count(a) - count(b));
  if (lie) ordered.push(lie);
  if (correct) ordered.push(correct);
  const steps: ResultStep[] = [];
  for (const c of ordered) {
    if (count(c) > 0) steps.push({ cardId: c.id, stage: 'voters' });
    steps.push({ cardId: c.id, stage: 'author' });
  }
  return steps;
}
