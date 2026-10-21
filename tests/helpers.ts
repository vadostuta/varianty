import { DEFAULT_SETTINGS, type GameState, type Preset } from '../shared/types.ts';
import { initialState, reduce, type GameAction } from '../server/game.ts';

export const preset: Preset = {
  id: 'p',
  name: 'Тест',
  updatedAt: 0,
  rounds: [0, 1].map((r) =>
    [0, 1, 2, 3, 4].map((q) => ({ question: `Питання ${r}.${q}`, correctAnswer: `Правда ${r}.${q}` })),
  ),
};

/** A small driver around the pure reducer with a controllable clock. */
export function makeGame(playerNames = ['Оля', 'Тарас', 'Марія']) {
  let now = 1_000_000;
  let state: GameState = initialState();
  const act = (a: GameAction) => (state = reduce(state, a, now, () => 0.42));
  act({ type: 'createGame', preset, settings: DEFAULT_SETTINGS });
  playerNames.forEach((name, i) => act({ type: 'join', id: `p${i}`, token: `t${i}`, name, avatar: null }));
  return {
    get state() {
      return state;
    },
    act,
    advance(ms: number) {
      now += ms;
    },
    get now() {
      return now;
    },
    cardOf(playerId: string | null) {
      const c = state.cards.find((x) => x.authorId === playerId);
      if (!c) throw new Error(`no card for ${playerId}`);
      return c.id;
    },
  };
}
