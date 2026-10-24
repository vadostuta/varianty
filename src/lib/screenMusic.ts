import { useEffect, useSyncExternalStore } from 'react';
import { stationOf, type MusicView, type ScreenMusicStatus } from '../../shared/music.ts';
import { getMusic, onMusic } from './music.ts';
import { getSocket } from './socket.ts';

// The bits of the YouTube IFrame API we use (https://developers.google.com/youtube/iframe_api_reference)
interface YTPlayer {
  playVideo(): void;
  pauseVideo(): void;
  loadVideoById(videoId: string): void;
  seekTo(seconds: number, allowSeekAhead: boolean): void;
  setVolume(volume: number): void;
  getPlayerState(): number;
  getCurrentTime(): number;
  getVideoLoadedFraction(): number;
  getVideoData(): { video_id?: string; title?: string };
}
interface YTApi {
  Player: new (
    el: HTMLElement,
    opts: {
      width: number;
      height: number;
      videoId: string;
      playerVars: Record<string, string | number>;
      events: {
        onReady: () => void;
        onStateChange: (e: { data: number }) => void;
        onError: (e: { data: number }) => void;
      };
    },
  ) => YTPlayer;
}
declare global {
  interface Window {
    YT?: YTApi;
    onYouTubeIframeAPIReady?: () => void;
  }
}

const ENDED = 0;
const PLAYING = 1;
const PAUSED = 2;
/** after asking to play: still silent by then means the browser wants a click first */
const BLOCK_CHECK_MS = 3000;
/** once the page has had its click, silence this long is YouTube refusing, not the browser */
const STUCK_CHECK_MS = 10000;

// TEMP debug: filter the console by "[music]"
const STATE_NAMES: Record<number, string> = {
  [-1]: 'UNSTARTED',
  0: 'ENDED',
  1: 'PLAYING',
  2: 'PAUSED',
  3: 'BUFFERING',
  5: 'CUED',
};
const t0 = Date.now();
function debug(...args: unknown[]) {
  console.info(`[music] +${((Date.now() - t0) / 1000).toFixed(1)}s`, ...args);
}
function describe(p: YTPlayer) {
  if (typeof p.getVideoData !== 'function') return { state: 'player not ready' };
  const d = p.getVideoData();
  return {
    state: STATE_NAMES[p.getPlayerState()] ?? p.getPlayerState(),
    video: d.video_id,
    title: d.title,
    time: p.getCurrentTime().toFixed(1),
    loaded: p.getVideoLoadedFraction().toFixed(4),
    clicked: navigator.userActivation?.hasBeenActive,
  };
}
debug('page', navigator.userAgent);

let api: Promise<YTApi> | null = null;
function loadApi(): Promise<YTApi> {
  api ??= new Promise((resolve, reject) => {
    if (window.YT?.Player) return resolve(window.YT);
    const prev = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      debug('YouTube API ready');
      prev?.();
      resolve(window.YT!);
    };
    debug('loading YouTube API script');
    const tag = document.createElement('script');
    tag.src = 'https://www.youtube.com/iframe_api';
    tag.onerror = () => {
      api = null;
      tag.remove();
      debug('YouTube API script FAILED to load (blocked by an extension or network?)');
      reject(new Error('YouTube недоступний'));
    };
    document.head.appendChild(tag);
  });
  return api;
}

// One player per page, outside React: it outlives StrictMode remounts and phase changes.
let attached = 0;
let player: Promise<YTPlayer> | null = null;
let loadedVideo: string | null = null;
let blockTimer: ReturnType<typeof setTimeout> | undefined;
let status: ScreenMusicStatus = 'idle';
const listeners = new Set<() => void>();

function report(s: ScreenMusicStatus) {
  if (s === status) return;
  debug(`status ${status} → ${s}`);
  status = s;
  getSocket().emit('music:status', s);
  listeners.forEach((l) => l());
}

function wanted(): MusicView | null {
  const m = getMusic();
  return attached > 0 && m?.on ? m : null;
}

function createPlayer(YT: YTApi, videoId: string): Promise<YTPlayer> {
  return new Promise((resolve) => {
    // YouTube needs a real, laid-out iframe; this one is just invisible
    const box = document.createElement('div');
    box.setAttribute('aria-hidden', 'true');
    box.style.cssText =
      'position:fixed;left:0;bottom:0;width:200px;height:200px;opacity:0;pointer-events:none;z-index:-1';
    const slot = document.createElement('div');
    box.appendChild(slot);
    document.body.appendChild(box);
    loadedVideo = videoId;
    debug('creating player with', videoId);
    const p = new YT.Player(slot, {
      width: 200,
      height: 200,
      videoId,
      playerVars: { controls: 0, disablekb: 1, fs: 0, playsinline: 1, rel: 0, origin: location.origin },
      events: {
        onReady: () => {
          debug('player ready', describe(p));
          resolve(p);
        },
        onStateChange: (e) => onState(p, e.data),
        onError: (e) => {
          // 2 bad id, 5 html5 player, 100 removed/private, 101/150 embedding refused by the owner
          console.warn('[music] YouTube ERROR', e.data, loadedVideo);
          clearTimeout(blockTimer);
          report('error');
        },
      },
    });
  });
}

function onState(p: YTPlayer, state: number) {
  debug('state →', STATE_NAMES[state] ?? state, describe(p));
  const m = wanted();
  if (state === PLAYING) {
    clearTimeout(blockTimer);
    if (m) report('playing');
    else p.pauseVideo();
  } else if (state === ENDED && m) {
    // a station is one long mix: loop it
    p.seekTo(0, true);
    p.playVideo();
  } else if (state === PAUSED && m && status === 'playing') {
    // paused by the browser, not by us
    report('blocked');
  }
}

function armBlockCheck(p: YTPlayer) {
  clearTimeout(blockTimer);
  // Chrome/Edge/Firefox know whether the page was clicked; without that API assume it wasn't
  const clicked = navigator.userActivation?.hasBeenActive ?? false;
  debug(`check in ${clicked ? STUCK_CHECK_MS : BLOCK_CHECK_MS}ms`, { clicked });
  blockTimer = setTimeout(
    () => {
      debug('check fired', describe(p));
      if (!wanted() || p.getPlayerState() === PLAYING) return;
      if (!clicked) return report('blocked');
      console.warn('[music] YouTube will not start', loadedVideo, 'state', p.getPlayerState());
      report('error');
    },
    clicked ? STUCK_CHECK_MS : BLOCK_CHECK_MS,
  );
}

function sync() {
  const m = wanted();
  debug('sync', m ? { station: m.stationId, volume: m.volume } : 'not wanted (off or no screen)', {
    attached,
    status,
  });
  if (!m) {
    clearTimeout(blockTimer);
    void player?.then((p) => p.pauseVideo());
    report('idle');
    return;
  }
  if (status === 'idle' || status === 'error') report('loading');
  const videoId = stationOf(m.stationId).videoId;
  player ??= loadApi().then((YT) => createPlayer(YT, videoId));
  player.then(
    (p) => {
      const now = wanted();
      if (!now) return;
      p.setVolume(now.volume);
      const vid = stationOf(now.stationId).videoId;
      if (vid !== loadedVideo) {
        debug('switching video', loadedVideo, '→', vid);
        loadedVideo = vid;
        // before loading: the old video's pause must not read as the browser blocking us
        report('loading');
        p.loadVideoById(vid);
        armBlockCheck(p);
      } else if (p.getPlayerState() !== PLAYING) {
        debug('playVideo()', describe(p));
        p.playVideo();
        armBlockCheck(p);
      }
    },
    (err) => {
      debug('player could not be created', err);
      player = null;
      report('error');
    },
  );
}

/** Any click or key on the TV page counts as the gesture browsers want before playing sound. */
function unlock(e: Event) {
  if (!wanted() || status === 'playing') return;
  debug('unlock on', e.type, { status, hasPlayer: !!player });
  void player?.then((p) => {
    p.playVideo();
    armBlockCheck(p);
  });
}

let wired = false;
function wire() {
  if (wired) return;
  wired = true;
  // a reconnected socket is a new one to the server
  getSocket().on('connect', () => getSocket().emit('music:status', status));
}

/** Makes this page the one that plays the host's music while mounted (the TV screen). */
export function useScreenMusic(): ScreenMusicStatus {
  useEffect(() => {
    wire();
    attached++;
    // the server echoes every status we report; only a change of what to play should re-sync
    let last = '';
    const off = onMusic(() => {
      const m = getMusic();
      const key = m ? `${m.on}|${m.stationId}|${m.volume}` : '';
      if (key === last) return;
      last = key;
      sync();
    });
    document.addEventListener('pointerdown', unlock);
    document.addEventListener('keydown', unlock);
    sync();
    return () => {
      attached--;
      off();
      document.removeEventListener('pointerdown', unlock);
      document.removeEventListener('keydown', unlock);
      sync();
    };
  }, []);
  return useSyncExternalStore(
    (fn) => {
      listeners.add(fn);
      return () => listeners.delete(fn);
    },
    () => status,
  );
}
