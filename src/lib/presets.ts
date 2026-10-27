import { QUESTIONS_PER_ROUND, ROUNDS, type Preset } from '../../shared/types.ts';
import { getSocket, request } from './socket.ts';

export async function fetchPresets(): Promise<Preset[]> {
  const res = await request<{ presets: Preset[] }>((ack) => getSocket().emit('presets:list', ack));
  if (!res.ok) throw new Error(res.error);
  return res.presets;
}

/** Number of empty question/answer/lie fields (0 = ready to play). */
export function missingFields(p: Preset): number {
  let n = 0;
  for (let r = 0; r < ROUNDS; r++) {
    for (let q = 0; q < QUESTIONS_PER_ROUND; q++) {
      const item = p.rounds[r]?.[q];
      if (!item?.question.trim()) n++;
      if (!item?.correctAnswer.trim()) n++;
      if (!item?.lieAnswer?.trim()) n++;
    }
  }
  return n;
}

export function emptyPreset(): Preset {
  return {
    id: '',
    name: '',
    updatedAt: 0,
    rounds: Array.from({ length: ROUNDS }, () =>
      Array.from({ length: QUESTIONS_PER_ROUND }, () => ({
        question: '',
        correctAnswer: '',
        lieAnswer: '',
        explanation: '',
      })),
    ),
  };
}
