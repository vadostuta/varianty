/** Background music: long YouTube ambience mixes, each looped on the TV screen. */
export interface Station {
  id: string;
  videoId: string;
  title: string;
  hint: string;
}

export const STATIONS: Station[] = [
  { id: 'hallows', videoId: 'coTMbGB2cfM', title: 'Осінній плейлист', hint: 'Музика на Гелловін · 3 год' },
  {
    id: 'haunted-house',
    videoId: '0A0wonUYU6s',
    title: 'Будинок з привидами',
    hint: 'Скубі-Ду: грім, дощ і вітер · 3 год',
  },
  { id: 'camping', videoId: 'oZMXQSC2l7c', title: 'Нічний табір', hint: 'Скубі-Ду: багаття й гроза · 2 год' },
  {
    id: 'mystery-machine',
    videoId: 'VmQHc2MxhPY',
    title: 'Фургон таємниць',
    hint: 'Скубі-Ду: ліс, дощ і мотор',
  },
];

export function stationOf(id: string): Station {
  return STATIONS.find((s) => s.id === id) ?? STATIONS[0];
}

export interface MusicSettings {
  on: boolean;
  stationId: string;
  /** 0–100, YouTube player volume */
  volume: number;
}

export const DEFAULT_MUSIC: MusicSettings = { on: false, stationId: STATIONS[0].id, volume: 40 };

/** What a TV screen's player is doing; `blocked` = the browser wants a click before playing sound. */
export type ScreenMusicStatus = 'idle' | 'loading' | 'playing' | 'blocked' | 'error';

export interface MusicView extends MusicSettings {
  /** summed over every open screen; `noScreen` when no TV is connected */
  status: ScreenMusicStatus | 'noScreen';
}
