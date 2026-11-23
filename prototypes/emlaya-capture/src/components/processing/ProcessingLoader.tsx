/**
 * The processing loader over Review's skeleton: 4653:68091, redesigned at the user's
 * request after a reference video ("spice up the animation and reduce the perception of
 * loading time"). RP-07: extraction is the moment the user decides whether to trust the
 * product, so the loader is clearly alive and says what it is doing.
 *
 * A follows the reference: the line bare on the veil beside the frame's spinner, a shader
 * glow rising from the bottom edge, and a bloom when the result lands.
 * B is calmer: the same spinner and line, an emoji right of each line, no shader, and
 * "Ready to review" to finish. (B first had the frame's pill and an icon in the spinner's
 * place; the user removed the pill and asked for emojis on the right instead.)
 * Both share the veil, the lines, the swap and the cadence (tokens.gaps.css, "Processing
 * loader").
 */
import { useEffect, useRef, useState } from 'react';
import circleNotch from '../../assets/figma/circle-notch.svg';
import { ALL_LINES, PROCESSING_LINES, READY_LINE } from '../../data/processingLines';
import { usePresence } from '../../state/usePresence';
import { tokenMs } from '../../tokens/read';
import { GlowShader, type GlowPalette } from './GlowShader';
import { StatusLine } from './StatusLine';
import './ProcessingLoader.css';

export type LoaderVariant = 'a' | 'b';

/** Where extraction is. `resolving`: the result is in, the loader is playing its finish. */
export type LoaderStatus = 'processing' | 'resolving' | 'ready' | 'error';

type ProcessingLoaderProps = {
  variant: LoaderVariant;
  status: LoaderStatus;
  palette: GlowPalette;
  reduced: boolean;
  /** The finish has played: the fields can arrive. */
  onSettled: () => void;
};

export function ProcessingLoader({ variant, status, palette, reduced, onSettled }: ProcessingLoaderProps) {
  const live = status === 'processing' || status === 'resolving';
  const [veilOn, setVeilOn] = useState(false);
  const [started, setStarted] = useState(false);
  const [line, setLine] = useState(0);
  const [finishing, setFinishing] = useState(false);
  const startedRef = useRef(false);
  const shownAt = useRef(0);
  const cadence = useRef<number[]>([]);
  const settled = useRef(onSettled);
  settled.current = onSettled;

  // The veil needs one painted frame without blur, or its transition has no start.
  useEffect(() => {
    let id = requestAnimationFrame(() => {
      id = requestAnimationFrame(() => setVeilOn(true));
    });
    return () => cancelAnimationFrame(id);
  }, []);

  // The cadence: the first line once the veil has blurred the skeleton, then one line per
  // dwell, holding on the last for as long as extraction runs.
  useEffect(() => {
    const timers = cadence.current;
    const show = (i: number) => {
      startedRef.current = true;
      shownAt.current = performance.now();
      setStarted(true);
      setLine(i);
    };
    const first = tokenMs('--processing-delay-veil') + tokenMs('--processing-duration-veil');
    const dwell = tokenMs('--processing-line-dwell');
    PROCESSING_LINES.forEach((_, i) => timers.push(window.setTimeout(() => show(i), first + i * dwell)));
    return () => {
      timers.forEach((t) => window.clearTimeout(t));
      timers.length = 0;
    };
  }, []);

  // The result is in. Stop the cadence (a line swapped in now would be cut at once), let
  // the current line be read, play the finish, then hand over to the fields.
  useEffect(() => {
    if (status !== 'resolving') return;
    cadence.current.forEach((t) => window.clearTimeout(t));
    cadence.current.length = 0;
    if (!startedRef.current) {
      startedRef.current = true;
      shownAt.current = performance.now();
      setStarted(true);
    }
    const wait = Math.max(0, tokenMs('--processing-min-readable') - (performance.now() - shownAt.current));
    let done = 0;
    const finish = window.setTimeout(() => {
      setFinishing(true);
      done = window.setTimeout(() => settled.current(), tokenMs('--processing-resolve'));
    }, wait);
    return () => {
      window.clearTimeout(finish);
      window.clearTimeout(done);
    };
  }, [status]);

  // The line and glow stay mounted through their exit, then leave the tree: the shader
  // holds its bloom while it fades, so it must stop drawing once it has.
  const exitMs = tokenMs('--motion-duration-slow');
  const parts = usePresence(live, exitMs);

  const current = variant === 'b' && finishing ? READY_LINE : PROCESSING_LINES[line];
  // A's line clears into the bloom, as the reference's does; B's holds "Ready to review".
  const leaving = !live || (variant === 'a' && finishing);

  return (
    <div className="processing" data-variant={variant} data-status={status} data-finishing={finishing}>
      <div className="processing__veil" data-on={veilOn && live} />

      {variant === 'a' && parts.mounted && (
        <div className="processing__glow" data-fade={!live}>
          <GlowShader on={started && live} bloom={finishing || status === 'ready'} palette={palette} reduced={reduced} />
        </div>
      )}

      <div className="processing__centre">
        {started && parts.mounted && (
          <StatusLine
            line={current}
            lines={variant === 'a' ? PROCESSING_LINES : ALL_LINES}
            spinner={circleNotch}
            emoji={variant === 'b'}
            leaving={leaving}
          />
        )}
      </div>
    </div>
  );
}
