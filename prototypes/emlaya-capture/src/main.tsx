import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { DURATION, EASING, PRESS_SCALE } from '@playground/shared';
import '@fontsource/geist/400.css';
import '@fontsource/geist/500.css';
import '@fontsource/geist/600.css';
import '@fontsource/zalando-sans-semiexpanded/600.css';
import './tokens/tokens.css';
import './tokens/tokens.gaps.css';
import './index.css';
import { App } from './App';

/* The project's one set of motion constants (shared/src/motion.ts), published as the
   motion tokens every stylesheet and script reads. Not a second set: the Figma file
   defines no motion, so these ARE the --motion-duration-* / --motion-ease-* tokens.
   Reduced motion is honoured where each is consumed, not by rewriting them here. */
const root = document.documentElement.style;
for (const [k, v] of Object.entries(DURATION)) root.setProperty(`--motion-duration-${k}`, `${v}ms`);
for (const [k, v] of Object.entries(EASING)) root.setProperty(`--motion-ease-${k}`, v);
root.setProperty('--motion-press-scale', String(PRESS_SCALE));

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
