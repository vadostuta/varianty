import type { GameState } from '../shared/types.ts';

/**
 * Server-authoritative phase timer: keeps one setTimeout armed for the running
 * timer's endsAt and calls onEnd when it fires. Call sync() after every state change.
 */
export function createPhaseTimer(onEnd: () => void) {
  let handle: NodeJS.Timeout | null = null;
  let armedFor: number | null = null;

  return {
    sync(state: GameState) {
      const endsAt = state.timer?.endsAt ?? null;
      if (endsAt === armedFor) return;
      if (handle) clearTimeout(handle);
      handle = null;
      armedFor = endsAt;
      if (endsAt !== null) {
        handle = setTimeout(
          () => {
            handle = null;
            armedFor = null;
            onEnd();
          },
          Math.max(0, endsAt - Date.now()),
        );
      }
    },
  };
}
