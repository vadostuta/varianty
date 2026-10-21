import type { Preset, Settings, View } from './types.ts';

export type Ack<T = object> = (res: ({ ok: true } & T) | { ok: false; error: string }) => void;

export type HostAction =
  | { type: 'createGame'; presetId: string; settings: Settings }
  | { type: 'startGame' }
  | { type: 'pause' }
  | { type: 'resume' }
  | { type: 'addTime'; seconds: number }
  | { type: 'finishPhase' }
  | { type: 'startVoting' }
  | { type: 'next' }
  | { type: 'kick'; playerId: string }
  | { type: 'abort' }
  | { type: 'newGame' };

export interface ClientToServer {
  hello: (role: 'host' | 'screen') => void;
  'player:join': (
    p: { name: string; avatar: number | null },
    ack: Ack<{ playerId: string; token: string }>,
  ) => void;
  'player:resume': (p: { playerId: string; token: string }, ack: Ack) => void;
  'player:answer': (text: string, ack: Ack) => void;
  'player:vote': (cardId: string, ack: Ack) => void;
  'host:action': (a: HostAction, ack: Ack) => void;
  'presets:list': (ack: Ack<{ presets: Preset[] }>) => void;
  'presets:save': (p: Preset, ack: Ack<{ preset: Preset }>) => void;
  'presets:delete': (id: string, ack: Ack) => void;
}

export interface ServerToClient {
  state: (v: View) => void;
  kicked: (reason: 'kicked' | 'aborted') => void;
  /** lobby avatars still free, for the join screen */
  freeAvatars: (avatars: number[]) => void;
}
