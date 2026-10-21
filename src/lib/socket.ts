import { io, type Socket } from 'socket.io-client';
import type { Ack, ClientToServer, ServerToClient } from '../../shared/events.ts';

export type GameSocket = Socket<ServerToClient, ClientToServer>;

let socket: GameSocket | null = null;

export function getSocket(): GameSocket {
  socket ??= io({ transports: ['websocket', 'polling'] });
  return socket;
}

type AckResult<T> = Parameters<Ack<T>>[0];

/** Emits an event with an ack and resolves with the server's reply (or a timeout error). */
export function request<T = object>(emit: (ack: Ack<T>) => void, timeoutMs = 8000): Promise<AckResult<T>> {
  return new Promise((resolve) => {
    const timer = setTimeout(() => resolve({ ok: false, error: 'Сервер не відповідає' }), timeoutMs);
    emit((res) => {
      clearTimeout(timer);
      resolve(res);
    });
  });
}
