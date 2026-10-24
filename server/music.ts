import { STATIONS, type MusicSettings, type MusicView, type ScreenMusicStatus } from '../shared/music.ts';
import { GameError } from './game.ts';

const STATUSES: ScreenMusicStatus[] = ['idle', 'loading', 'playing', 'blocked', 'error'];

export function isScreenMusicStatus(s: unknown): s is ScreenMusicStatus {
  return STATUSES.includes(s as ScreenMusicStatus);
}

/** Applies a host's change; unknown stations are refused, volume is clamped. */
export function applyMusic(m: MusicSettings, patch: Partial<MusicSettings>): MusicSettings {
  const next = { ...m };
  if (patch.on !== undefined) next.on = !!patch.on;
  if (patch.stationId !== undefined) {
    if (!STATIONS.some((s) => s.id === patch.stationId)) throw new GameError('Невідома музика');
    next.stationId = patch.stationId;
  }
  if (patch.volume !== undefined) {
    const v = Number(patch.volume);
    if (!Number.isFinite(v)) throw new GameError('Невідома гучність');
    next.volume = Math.min(100, Math.max(0, Math.round(v)));
  }
  return next;
}

/** One status for the host out of every open screen: any one playing is enough. */
export function musicView(m: MusicSettings, screens: (ScreenMusicStatus | undefined)[]): MusicView {
  if (!screens.length) return { ...m, status: 'noScreen' };
  const st = screens.map((s) => s ?? 'loading');
  const status = (['playing', 'blocked', 'loading', 'error'] as const).find((s) => st.includes(s)) ?? 'idle';
  return { ...m, status };
}
