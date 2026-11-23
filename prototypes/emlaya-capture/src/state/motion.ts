import { createContext, useContext } from 'react';
import { useReducedMotion as useSystemReducedMotion } from '@playground/shared';

/** Dev-toolbar override: preview the reduced-motion path without changing OS settings. */
export const ForceReducedMotion = createContext(false);

/** Live prefers-reduced-motion, OR the presenter's override. */
export function useReducedMotion(): boolean {
  const system = useSystemReducedMotion();
  const forced = useContext(ForceReducedMotion);
  return system || forced;
}
