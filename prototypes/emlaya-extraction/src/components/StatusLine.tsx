import { useLayoutEffect, useRef, useState, type CSSProperties } from 'react';
import { DURATION, duration } from '@playground/shared';

export type Idle = 'spin' | 'bob' | 'search' | 'wiggle' | 'pulse' | 'none';

export type StatusLineItem = {
  /** Identity: a new key is a new line, and gets the swap. */
  key: string;
  text: string;
  /** B only. An exported library icon, drawn as a mask so it takes the brand tint. */
  icon?: string;
  /** The icon's small idle motion while its line holds. */
  idle?: Idle;
  /** `still` lines (done, Unable to process) carry no shimmer: nothing is in progress. */
  still?: boolean;
};

type Mounted = { item: StatusLineItem; phase: 'in' | 'out' };

type StatusLineProps = {
  line: StatusLineItem;
  /** `bare`: the reference, a spinner and a line straight on the veil. `pill`: B. */
  look: 'bare' | 'pill';
  /** A only: the spinner beside the line. */
  spinner?: string;
  /** The whole line leaves: the loader is done with it. */
  leaving?: boolean;
  reducedMotion: boolean;
};

/**
 * One status line, swapped the way the reference swaps it: the outgoing line blurs and
 * fades up while the incoming one sharpens in beneath it, overlapping (measured at
 * ~150ms of overlap, 30fps). Both stay mounted through the swap, so neither cuts.
 *
 * The group eases to each line's width rather than snapping; the pill (B) clips the
 * outgoing line while it narrows.
 */
export function StatusLine({ line, look, spinner, leaving = false, reducedMotion }: StatusLineProps) {
  const [mounted, setMounted] = useState<Mounted[]>([{ item: line, phase: 'in' }]);
  const [width, setWidth] = useState<number | null>(null);
  const incoming = useRef<HTMLDivElement>(null);
  const exitMs = duration(DURATION.fast, reducedMotion);

  useLayoutEffect(() => {
    setMounted((prev) => {
      if (prev.some((m) => m.item.key === line.key && m.phase === 'in')) return prev;
      return [...prev.map((m) => ({ ...m, phase: 'out' as const })), { item: line, phase: 'in' }];
    });
  }, [line]);

  useLayoutEffect(() => {
    if (!mounted.some((m) => m.phase === 'out')) return;
    const t = window.setTimeout(() => setMounted((prev) => prev.filter((m) => m.phase === 'in')), exitMs);
    return () => window.clearTimeout(t);
  }, [mounted, exitMs]);

  // Measure the incoming line before paint, so the width starts moving on the swap's frame.
  useLayoutEffect(() => {
    if (incoming.current) setWidth(incoming.current.offsetWidth);
  }, [mounted]);

  const style = {
    '--status-in': `${duration(DURATION.base, reducedMotion)}ms`,
    '--status-out': `${exitMs}ms`,
  } as CSSProperties;

  return (
    <div
      className={`status status--${look}`}
      data-leaving={leaving ? 'on' : 'off'}
      style={style}
      role="status"
      aria-live="polite"
    >
      {look === 'bare' && spinner && (
        <span className="status__spinner" style={{ maskImage: `url("${spinner}")`, WebkitMaskImage: `url("${spinner}")` }} aria-hidden="true" />
      )}
      {/* Lines anchor left inside a stack that eases to the incoming line's width, so the
          group re-centres smoothly instead of jumping — and the pill hugs it. */}
      <div className="status__stack" style={width === null ? undefined : { width }}>
        {mounted.map(({ item, phase }) => (
          <div
            key={item.key}
            ref={phase === 'in' ? incoming : undefined}
            className="status__item"
            data-phase={phase}
            // A swap is read once: only the incoming line is in the accessibility tree.
            aria-hidden={phase === 'out'}
          >
            {item.icon && (
              <span className="status__icon" data-idle={item.idle ?? 'none'} aria-hidden="true">
                <span className="status__glyph" style={{ maskImage: `url("${item.icon}")`, WebkitMaskImage: `url("${item.icon}")` }} />
              </span>
            )}
            <span className="status__text" data-shimmer={item.still ? 'off' : 'on'}>
              {item.text}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
