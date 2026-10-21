import { readFileSync } from 'node:fs';
import path from 'node:path';
import type { GameState } from '../shared/types.ts';
import { DATA_DIR, writeJsonAtomic } from './presets.ts';

const FILE = path.join(DATA_DIR, 'game-state.json');

export function restoreState(): GameState | null {
  try {
    return JSON.parse(readFileSync(FILE, 'utf8')) as GameState;
  } catch {
    return null;
  }
}

let pending: GameState | null = null;
let writing = false;

/** Snapshots the latest state; writes are serialized and coalesced. */
export function snapshotState(state: GameState): void {
  pending = state;
  if (!writing) void flush();
}

async function flush() {
  writing = true;
  while (pending) {
    const s = pending;
    pending = null;
    try {
      await writeJsonAtomic(FILE, s);
    } catch (err) {
      console.error('Не вдалося зберегти стан гри:', err);
    }
  }
  writing = false;
}
