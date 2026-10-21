import { useEffect, useState, useSyncExternalStore } from 'react';
import type { View } from '../../shared/types.ts';
import { getSocket } from './socket.ts';

let latest: View | null = null;
let clockOffset = 0;
const listeners = new Set<() => void>();

function subscribe(fn: () => void) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

let wired = false;
function wire() {
  if (wired) return;
  wired = true;
  getSocket().on('state', (v) => {
    clockOffset = v.serverNow - Date.now();
    latest = v;
    listeners.forEach((l) => l());
  });
}

/** Latest role-filtered state from the server. */
export function useGameView(): View | null {
  wire();
  return useSyncExternalStore(subscribe, () => latest);
}

/** Server time estimate: local clock corrected by the offset from the last state. */
export function serverNow(): number {
  return Date.now() + clockOffset;
}

export function useConnected(): boolean {
  const socket = getSocket();
  const [connected, setConnected] = useState(socket.connected);
  useEffect(() => {
    const on = () => setConnected(true);
    const off = () => setConnected(false);
    socket.on('connect', on);
    socket.on('disconnect', off);
    setConnected(socket.connected);
    return () => {
      socket.off('connect', on);
      socket.off('disconnect', off);
    };
  }, [socket]);
  return connected;
}

/** Announces host/screen role now and after every reconnect. */
export function useRole(role: 'host' | 'screen') {
  useEffect(() => {
    const socket = getSocket();
    const hello = () => socket.emit('hello', role);
    if (socket.connected) hello();
    socket.on('connect', hello);
    return () => {
      socket.off('connect', hello);
    };
  }, [role]);
}
