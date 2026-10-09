import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { DURATION, EASING, PRESS_SCALE, SPRING } from '@playground/shared';
import { App } from './App';
import './theme';
import './index.css';
import './motion.css';
import './theme-dark.css';

/* The project's one set of motion constants, handed to CSS as custom properties so
   stylesheets transition on the same values the components use. Reduced motion is
   applied in motion.css, which zeroes the durations. */
const root = document.documentElement.style;
for (const [k, v] of Object.entries(DURATION)) root.setProperty(`--motion-${k}`, `${v}ms`);
for (const [k, v] of Object.entries(EASING)) root.setProperty(`--ease-${k}`, v);
root.setProperty('--press-scale', String(PRESS_SCALE));
root.setProperty('--motion-spring', `${SPRING.duration}ms`);
root.setProperty('--ease-spring', SPRING.easing);

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
