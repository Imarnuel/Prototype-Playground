import { useEffect, useState } from 'react';
import { DURATION, duration } from '@playground/shared';
import { GlowShader, type GlowPalette } from '../components/GlowShader';
import { StatusLine, type StatusLineItem } from '../components/StatusLine';
import { DONE_LINE, FAILED_LINE, LINES } from '../data/lines';
import type { Run } from '../state/run';
import { ReviewDetails } from './ReviewDetails';
import circleNotch from '../assets/icons/circle-notch.svg';

export type Variant = 'a' | 'b';

type ExtractionScreenProps = {
  variant: Variant;
  run: Run;
  palette: GlowPalette;
  reducedMotion: boolean;
  onBack: () => void;
  onRetake: () => void;
};

/**
 * Review details (4653:68091) with the extraction loader over it.
 *
 * A follows the reference: the line sits bare on the veil beside the frame's spinner,
 * the shader glow rises from the bottom edge, and the result lands as a bloom.
 * B keeps the frame's own pill and puts an icon on every line instead of the spinner;
 * the result lands as a check. Both read the same run, lines and veil.
 */
export function ExtractionScreen({ variant, run, palette, reducedMotion, onBack, onRetake }: ExtractionScreenProps) {
  const { phase } = run;
  const loading = phase === 'extracting' || phase === 'resolving' || phase === 'failed';

  // The loader stays mounted through its own exit, then leaves the tree (CLAUDE.md §5).
  const [loaderMounted, setLoaderMounted] = useState(loading);
  useEffect(() => {
    if (loading) {
      setLoaderMounted(true);
      return;
    }
    const t = window.setTimeout(() => setLoaderMounted(false), duration(DURATION.slow, reducedMotion));
    return () => window.clearTimeout(t);
  }, [loading, reducedMotion]);

  const line: StatusLineItem =
    phase === 'failed'
      ? FAILED_LINE[variant]
      : phase === 'resolving' && variant === 'b'
        ? DONE_LINE
        : phase === 'ready' && variant === 'b'
          ? DONE_LINE
          : LINES[run.line][variant];

  return (
    <div className="screen" data-phase={phase} data-variant={variant}>
      <ReviewDetails
        receipt={phase === 'resolving' || phase === 'ready' ? run.receipt : null}
        revealed={phase === 'ready'}
        onBack={onBack}
        reducedMotion={reducedMotion}
      />

      <div className="veil" data-on={loading ? 'on' : 'off'} />

      {variant === 'a' && loaderMounted && (
        <div className="glowLayer" data-fade={phase === 'ready' ? 'on' : 'off'}>
          <GlowShader
            on={phase === 'extracting'}
            /* Held through `ready`: the bloom fades out as a layer, it never sinks back. */
            bloom={phase === 'resolving' || phase === 'ready'}
            palette={palette}
            reducedMotion={reducedMotion}
          />
        </div>
      )}

      {loaderMounted && (
        <div className="loader">
          <div className="loader__column">
            <StatusLine
              line={line}
              look={variant === 'a' ? 'bare' : 'pill'}
              spinner={variant === 'a' && phase !== 'failed' ? circleNotch : undefined}
              leaving={!loading}
              reducedMotion={reducedMotion}
            />
            {phase === 'failed' && (
              /* NEEDS DESIGN: Unable to process (RP-04) has no frame. Minimal and honest:
                 the required words, what to do, and the one action. Retake replays the
                 run, as there is no camera in this prototype. */
              <div className="failed">
                <p className="failed__hint">The photo could not be read. Retake it with the whole receipt in frame.</p>
                <button type="button" className="failed__retake" onClick={onRetake}>
                  Retake
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
