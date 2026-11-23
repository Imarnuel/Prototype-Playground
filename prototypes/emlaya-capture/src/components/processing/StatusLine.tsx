import { useLayoutEffect, useRef, useState } from 'react';
import type { ProcessingLine } from '../../data/processingLines';
import { tokenMs } from '../../tokens/read';
import { Icon } from '../ui';

/** `still`: the first line, which arrives with the whole status, not as a swap. */
type Mounted = { line: ProcessingLine; phase: 'still' | 'in' | 'out' };

type StatusLineProps = {
  line: ProcessingLine;
  /** Every line this status can show: the group is as wide as the widest, so the spinner never moves. */
  lines: readonly ProcessingLine[];
  /** The frame's CircleNotch, left of the line. */
  spinner: string;
  /** B: each line's emoji, right of the text (user request). */
  emoji: boolean;
  /** The whole status leaves: the loader is done with it. */
  leaving: boolean;
};

/**
 * One status line, moved the way the reference moves it (measured frame by frame, MOTION.md):
 * - the first line arrives with the spinner, fading in from a slight blur;
 * - a swap is a vertical roll with no blur: the old line fades as it slides up, and the
 *   new one rises from just below, starting once the old one is down to a third. Slower than
 *   the reference's ~120ms, at the user's request (tokens.gaps.css);
 * - the spinner holds still throughout, and the text stays anchored to it.
 */
export function StatusLine({ line, lines, spinner, emoji, leaving }: StatusLineProps) {
  const [mounted, setMounted] = useState<Mounted[]>([{ line, phase: 'still' }]);
  // Read on the status itself: B slows the swap by re-mapping the tokens on its loader.
  const self = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    setMounted((prev) => {
      if (prev.some((m) => m.line.key === line.key && m.phase !== 'out')) return prev;
      return [...prev.map((m) => ({ ...m, phase: 'out' as const })), { line, phase: 'in' }];
    });
  }, [line]);

  useLayoutEffect(() => {
    if (!mounted.some((m) => m.phase === 'out')) return;
    const t = window.setTimeout(
      () => setMounted((prev) => prev.filter((m) => m.phase !== 'out')),
      tokenMs('--processing-line-out', self.current ?? undefined),
    );
    return () => window.clearTimeout(t);
  }, [mounted]);

  const row = (l: ProcessingLine) => (
    <>
      <span className="status__text ts-label-base">
        {l.text}
      </span>
      {/* Outside the text span: the shimmer paints the text with background-clip, which
          would turn a colour emoji transparent. Decorative: the words carry the meaning. */}
      {emoji && (
        <span className="status__emoji" aria-hidden="true">
          {l.emoji}
        </span>
      )}
    </>
  );

  return (
    <div ref={self} className="status" data-leaving={leaving} role="status" aria-live="polite">
      <Icon src={spinner} size={24} className="status__spinner" />
      <div className="status__stack">
        {/* Sizes the stack to the widest line; never seen, never read. */}
        <div className="status__sizer" aria-hidden="true">
          {lines.map((l) => (
            <div key={l.key} className="status__row">{row(l)}</div>
          ))}
        </div>
        {mounted.map(({ line: l, phase }) => (
          // A swap is read once: only the incoming line is in the accessibility tree.
          <div key={l.key} className="status__item status__row" data-phase={phase} aria-hidden={phase === 'out'}>
            {row(l)}
          </div>
        ))}
      </div>
    </div>
  );
}
