import { useEffect, useRef, useState } from 'react';
import { SHEET_SPRING, duration, useReducedMotion } from '@playground/shared';

/**
 * Drives a presented surface's lifecycle so both its entrance and its exit animate.
 *
 * Two booleans are not enough:
 *   - unmounting the moment intent goes false cuts the EXIT;
 *   - mounting straight into the open state cuts the ENTRANCE, because a CSS
 *     transition needs a rendered starting frame to move from.
 *
 * So `mounted` keeps it in the tree through the exit, and `entered` is flipped two
 * animation frames after mount. Two, not one: React can batch the mount and the flip
 * into a single paint, which is the instant cut again. `npm run motion:sample` guards
 * both directions.
 */
export function usePresented(open: boolean): { mounted: boolean; entered: boolean } {
  const [mounted, setMounted] = useState(false);
  const [entered, setEntered] = useState(false);
  const reducedMotion = useReducedMotion();
  const exitTimer = useRef<number>();
  const enterFrame = useRef<number>();

  useEffect(() => {
    if (open) {
      setMounted(true);
      enterFrame.current = requestAnimationFrame(() => {
        enterFrame.current = requestAnimationFrame(() => setEntered(true));
      });
      return () => cancelAnimationFrame(enterFrame.current!);
    }
    setEntered(false);
    if (!mounted) return;
    const ms = duration(SHEET_SPRING.exitDuration, reducedMotion);
    exitTimer.current = window.setTimeout(() => setMounted(false), ms);
    return () => window.clearTimeout(exitTimer.current);
  }, [open, mounted, reducedMotion]);

  return { mounted, entered };
}
