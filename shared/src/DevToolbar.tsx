import { useEffect, useRef, useState } from 'react';
import { DURATION, EASING, SHEET_SPRING, duration as motionDuration } from './motion';
import { useReducedMotion } from './useReducedMotion';
import { failNextRequest, getControls, setLatencyScale } from './mockApi';

export type DevToolbarItem = {
  label: string;
  /** Groups render as sections, so screens and states stay separable at a glance. */
  group?: string;
  onSelect: () => void;
};

type DevToolbarProps = {
  items: DevToolbarItem[];
  /**
   * Off by default, per CLAUDE.md:61. A prototype opts in explicitly — usually
   * from a URL flag — so a presentation build never ships the toolbar by accident.
   */
  enabled?: boolean;
};

/** `?dev=1` in the URL. Convenience for the opt-in above; still not a default. */
export function devFlagEnabled(): boolean {
  if (typeof window === 'undefined') return false;
  return new URLSearchParams(window.location.search).get('dev') === '1';
}

export function DevToolbar({ items, enabled = false }: DevToolbarProps) {
  const [open, setOpen] = useState(false);
  // `open` drives intent; `mounted` keeps the panel in the tree through its exit.
  // Unmounting on `if (!open) return null` would cut the exit (CLAUDE.md:53).
  const [mounted, setMounted] = useState(false);
  const reducedMotion = useReducedMotion();
  const exitTimer = useRef<number>();

  useEffect(() => {
    if (open) {
      setMounted(true);
      return;
    }
    if (!mounted) return;
    const ms = motionDuration(SHEET_SPRING.exitDuration, reducedMotion);
    exitTimer.current = window.setTimeout(() => setMounted(false), ms);
    return () => window.clearTimeout(exitTimer.current);
  }, [open, mounted, reducedMotion]);

  if (!enabled) return null;

  const enterMs = motionDuration(SHEET_SPRING.duration, reducedMotion);
  const exitMs = motionDuration(SHEET_SPRING.exitDuration, reducedMotion);
  const groups = [...new Set(items.map((item) => item.group ?? 'Screens'))];

  return (
    <div className="devbar">
      <button
        type="button"
        className="devbar__handle"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        style={{ transitionDuration: `${motionDuration(DURATION.instant, reducedMotion)}ms` }}
      >
        {open ? 'Close' : 'Dev'}
      </button>

      {mounted && (
        <div
          className="devbar__panel"
          data-open={open ? 'on' : 'off'}
          style={{
            transitionDuration: `${open ? enterMs : exitMs}ms`,
            transitionTimingFunction: open ? SHEET_SPRING.easing : SHEET_SPRING.exitEasing,
          }}
        >
          {groups.map((group) => (
            <section key={group} className="devbar__group">
              <h2 className="devbar__groupTitle">{group}</h2>
              <div className="devbar__items">
                {items
                  .filter((item) => (item.group ?? 'Screens') === group)
                  .map((item) => (
                    <button
                      key={item.label}
                      type="button"
                      className="devbar__item"
                      onClick={() => {
                        item.onSelect();
                        setOpen(false);
                      }}
                    >
                      {item.label}
                    </button>
                  ))}
              </div>
            </section>
          ))}

          <section className="devbar__group">
            <h2 className="devbar__groupTitle">Mock API</h2>
            <div className="devbar__items">
              <button type="button" className="devbar__item" onClick={() => failNextRequest()}>
                Fail next request
              </button>
              <button
                type="button"
                className="devbar__item"
                onClick={() => setLatencyScale(getControls().latencyScale === 0 ? 1 : 0)}
              >
                Toggle latency
              </button>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}

/** Exported so a prototype can reuse the toolbar's own easing for its panels. */
export const DEV_TOOLBAR_EASING = EASING;
