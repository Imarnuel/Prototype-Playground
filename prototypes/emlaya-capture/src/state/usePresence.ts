import { useEffect, useState } from 'react';

export type PresenceState = 'enter' | 'open' | 'exit';

/**
 * Keeps a layer mounted through its exit (CLAUDE.md §5: `if (!open) return null` has no
 * exit animation). `enter` is painted for one frame so the transition has a start.
 */
export function usePresence(open: boolean, exitMs: number): { mounted: boolean; state: PresenceState } {
  const [mounted, setMounted] = useState(open);
  const [state, setState] = useState<PresenceState>(open ? 'open' : 'exit');

  useEffect(() => {
    if (open) {
      setMounted(true);
      setState('enter');
      // Two frames: one to commit the `enter` styles, one to start from them.
      let id = requestAnimationFrame(() => {
        id = requestAnimationFrame(() => setState('open'));
      });
      return () => cancelAnimationFrame(id);
    }
    setState('exit');
    const t = window.setTimeout(() => setMounted(false), exitMs);
    return () => window.clearTimeout(t);
  }, [open, exitMs]);

  return { mounted, state };
}
