import { useSyncExternalStore } from 'react';
import type { MusicSettings, MusicView } from '../../shared/music.ts';
import { getSocket, request } from './socket.ts';

let latest: MusicView | null = null;
const listeners = new Set<() => void>();

function subscribe(fn: () => void) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

let wired = false;
function wire() {
  if (wired) return;
  wired = true;
  getSocket().on('music', (m) => {
    latest = m;
    listeners.forEach((l) => l());
  });
}

export function getMusic(): MusicView | null {
  wire();
  return latest;
}

export function onMusic(fn: () => void): () => void {
  wire();
  return subscribe(fn);
}

/** Host and screens only; the server sends it after `hello`. */
export function useMusic(): MusicView | null {
  wire();
  return useSyncExternalStore(subscribe, () => latest);
}

export function setMusic(music: Partial<MusicSettings>) {
  return request((ack) => getSocket().emit('host:action', { type: 'setMusic', music }, ack));
}
