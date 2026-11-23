import { useLayoutEffect, useRef, useState } from 'react';
import type { ProcessingLine } from '../../data/processingLines';
import { tokenMs } from '../../tokens/read';
import { Icon } from '../ui';

type Mounted = { line: ProcessingLine; phase: 'in' | 'out' };

type StatusLineProps = {
  line: ProcessingLine;
  /** `bare`: the reference, a spinner and a line straight on the veil (A). `pill`: the frame's own pill, an icon per line (B). */
  look: 'bare' | 'pill';
  /** A only: the frame's CircleNotch beside the line. */
  spinner?: string;
  /** The whole line leaves: the loader is done with it. */
  leaving: boolean;
};

/**
 * One status line, swapped the way the reference swaps it: the outgoing line blurs and
 * fades up while the incoming one sharpens in beneath it, overlapping (~150ms at 30fps).
 * Both stay mounted through the swap, so neither cuts. Lines anchor left inside a stack
 * that eases to each line's width, so the group re-centres smoothly instead of jumping,
 * and B's pill hugs it.
 */
export function StatusLine({ line, look, spinner, leaving }: StatusLineProps) {
  const [mounted, setMounted] = useState<Mounted[]>([{ line, phase: 'in' }]);
  const [width, setWidth] = useState<number | null>(null);
  const incoming = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    setMounted((prev) => {
      if (prev.some((m) => m.line.key === line.key && m.phase === 'in')) return prev;
      return [...prev.map((m) => ({ ...m, phase: 'out' as const })), { line, phase: 'in' }];
    });
  }, [line]);

  useLayoutEffect(() => {
    if (!mounted.some((m) => m.phase === 'out')) return;
    const t = window.setTimeout(
      () => setMounted((prev) => prev.filter((m) => m.phase === 'in')),
      tokenMs('--motion-duration-fast'),
    );
    return () => window.clearTimeout(t);
  }, [mounted]);

  // Measured before paint, so the width starts moving on the swap's own frame.
  useLayoutEffect(() => {
    if (incoming.current) setWidth(incoming.current.offsetWidth);
  }, [mounted]);

  return (
    <div className={`status status--${look}`} data-leaving={leaving} role="status" aria-live="polite">
      {spinner && <Icon src={spinner} size={24} className="status__spinner" />}
      <div className="status__stack" style={width === null ? undefined : { width }}>
        {mounted.map(({ line: l, phase }) => (
          <div
            key={l.key}
            ref={phase === 'in' ? incoming : undefined}
            className="status__item"
            data-phase={phase}
            // A swap is read once: only the incoming line is in the accessibility tree.
            aria-hidden={phase === 'out'}
          >
            {look === 'pill' && (
              <span className="status__icon" data-idle={l.idle} aria-hidden="true">
                {/* A mask, not an <img>: the library's glyphs are #343330, and this slot
                    is iconBrand, as the frame's CircleNotch in the same pill is. */}
                <span className="status__glyph" style={{ maskImage: `url("${l.icon}")`, WebkitMaskImage: `url("${l.icon}")` }} />
              </span>
            )}
            <span className="status__text ts-label-base" data-shimmer={!l.still}>
              {l.text}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
