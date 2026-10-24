import { useSyncExternalStore } from 'react';
import { AVATARS, seasonalTheme, type Theme } from '../../shared/types.ts';
import { setCopy } from '../i18n/uk.ts';
import { getSocket } from './socket.ts';

const KEY = 'varianty:theme';

/** Browser chrome colour and favicon tile/letter per theme. */
const CHROME: Record<Theme, { bg: string; letter: string }> = {
  base: { bg: '#17111F', letter: '#FFC83D' },
  halloween: { bg: '#140E22', letter: '#FF8A1F' },
};

/** Same slot and colour as the base set (AVATARS), only the picture changes. */
const HALLOWEEN_AVATARS = [
  { emoji: '🎃', name: 'Гарбуз' },
  { emoji: '🦇', name: 'Кажан' },
  { emoji: '👻', name: 'Привид' },
  { emoji: '🦉', name: 'Сова' },
  { emoji: '🧙', name: 'Чаклун' },
  { emoji: '🍬', name: 'Цукерка' },
  { emoji: '🕷️', name: 'Павук' },
  { emoji: '🌙', name: 'Місяць' },
  { emoji: '🐺', name: 'Вовк' },
  { emoji: '🍭', name: 'Льодяник' },
];

export function avatarLook(i: number, theme: Theme): { emoji: string; color: string; label: string } {
  const a = AVATARS[i] ?? AVATARS[0];
  if (theme === 'halloween') {
    const h = HALLOWEEN_AVATARS[i] ?? HALLOWEEN_AVATARS[0];
    return { emoji: h.emoji, color: a.color, label: h.name };
  }
  return { emoji: a.emoji, color: a.color, label: a.colorName };
}

/** Last theme the server told us, so a reload doesn't flash the other one. */
function cached(): Theme {
  try {
    const t = localStorage.getItem(KEY);
    if (t === 'base' || t === 'halloween') return t;
  } catch {
    /* private mode */
  }
  return seasonalTheme(new Date());
}

let current: Theme = cached();
const listeners = new Set<() => void>();

function apply(theme: Theme) {
  current = theme;
  setCopy(theme);
  const root = document.documentElement;
  root.dataset.theme = theme;
  const c = CHROME[theme];
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', c.bg);
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><rect width='100' height='100' rx='24' fill='${c.bg}'/><text x='50' y='72' font-size='64' text-anchor='middle' font-family='Arial Black,sans-serif' font-weight='900' fill='${c.letter}'>В</text></svg>`;
  document
    .querySelector('link[rel="icon"]')
    ?.setAttribute('href', `data:image/svg+xml,${encodeURIComponent(svg)}`);
  try {
    localStorage.setItem(KEY, theme);
  } catch {
    /* not important */
  }
  listeners.forEach((l) => l());
}

apply(current);

let wired = false;
function wire() {
  if (wired) return;
  wired = true;
  getSocket().on('theme', (t) => {
    if (t !== current && (t === 'base' || t === 'halloween')) apply(t);
  });
}

function subscribe(fn: () => void) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

/** The theme the server picked for this party; every screen follows it. */
export function useTheme(): Theme {
  wire();
  return useSyncExternalStore(subscribe, () => current);
}
