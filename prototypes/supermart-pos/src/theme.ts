import { useSyncExternalStore } from 'react';

/**
 * Light or dark: the library's Semantic collection in its "Light" or "Dark" mode.
 * The colour tokens switch in CSS (`:root[data-theme='dark']`, generated); this is
 * only for what CSS cannot reach — an icon's file, the status bar's appearance.
 *
 * A presenting convenience, so it is remembered per viewer and nothing else; storage
 * can be missing (private window, blocked site data), and then it is just light.
 */
export type Theme = 'light' | 'dark';

const KEY = 'supermart-pos.theme';
const listeners = new Set<() => void>();
let current: Theme = 'light';

try {
  if (localStorage.getItem(KEY) === 'dark') current = 'dark';
} catch {
  /* light */
}
document.documentElement.dataset.theme = current;

export function setTheme(theme: Theme) {
  current = theme;
  document.documentElement.dataset.theme = theme;
  try {
    localStorage.setItem(KEY, theme);
  } catch {
    /* not remembered */
  }
  listeners.forEach((l) => l());
}

export function useTheme(): Theme {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    () => current,
  );
}
