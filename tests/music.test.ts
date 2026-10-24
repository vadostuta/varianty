import { describe, expect, it } from 'vitest';
import { DEFAULT_MUSIC, STATIONS } from '../shared/music.ts';
import { applyMusic, musicView } from '../server/music.ts';

describe('applyMusic', () => {
  it('switches on and picks a station', () => {
    const m = applyMusic(DEFAULT_MUSIC, { on: true, stationId: STATIONS[2].id });
    expect(m).toEqual({ ...DEFAULT_MUSIC, on: true, stationId: STATIONS[2].id });
  });

  it('refuses an unknown station', () => {
    expect(() => applyMusic(DEFAULT_MUSIC, { stationId: 'nope' })).toThrow();
  });

  it('clamps the volume', () => {
    expect(applyMusic(DEFAULT_MUSIC, { volume: 140 }).volume).toBe(100);
    expect(applyMusic(DEFAULT_MUSIC, { volume: -3 }).volume).toBe(0);
    expect(() => applyMusic(DEFAULT_MUSIC, { volume: NaN })).toThrow();
  });
});

describe('musicView', () => {
  it('says when no TV is open', () => {
    expect(musicView(DEFAULT_MUSIC, []).status).toBe('noScreen');
  });

  it('is playing if any screen plays', () => {
    expect(musicView(DEFAULT_MUSIC, ['blocked', 'playing']).status).toBe('playing');
    expect(musicView(DEFAULT_MUSIC, ['idle', 'blocked']).status).toBe('blocked');
    expect(musicView(DEFAULT_MUSIC, [undefined]).status).toBe('loading');
    expect(musicView(DEFAULT_MUSIC, ['idle']).status).toBe('idle');
  });
});
