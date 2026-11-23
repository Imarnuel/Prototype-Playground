/**
 * The success acknowledgement shown at every milestone. Its first use is "Receipt
 * saved" (9502:21212); the brief makes it one reusable component so later milestones
 * (a linked payment, a closed Shopping Note) reuse the choreography, not copy it.
 *
 * `children` carries the optional insight card (9502:21308). The brief's signature is
 * `title body icon primaryAction`; the card is part of the frame, so it is a slot.
 */
import { Fragment, useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import close from '../../assets/figma/x.svg';
import { Button, HeaderButton, inert } from '../ui';
import { usePresence } from '../../state/usePresence';
import { useReducedMotion } from '../../state/motion';
import { tokenMs } from '../../tokens/read';
import { Confetti } from './Confetti';
import { Rays } from './Rays';
import './MilestoneCelebration.css';

export type MilestoneCelebrationProps = {
  open: boolean;
  title: string;
  body: string;
  icon: ReactNode;
  primaryAction: { label: string; onPress: () => void };
  /** The top-left close. The frame gives it no destination of its own: it does what Done does. */
  onClose?: () => void;
  /** Called once the exit has finished and the layer is gone. */
  onExited?: () => void;
  children?: ReactNode;
};

export function MilestoneCelebration({ open, title, body, icon, primaryAction, onClose, onExited, children }: MilestoneCelebrationProps) {
  const reduced = useReducedMotion();
  const exitMs = tokenMs('--motion-duration-celebration-exit');
  const { mounted, state } = usePresence(open, exitMs);
  const [landed, setLanded] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const wasMounted = useRef(false);

  useEffect(() => {
    if (mounted) wasMounted.current = true;
    else if (wasMounted.current) {
      wasMounted.current = false;
      onExited?.();
    }
  }, [mounted, onExited]);

  useEffect(() => {
    if (!open) setLanded(false);
  }, [open]);

  // Focus moves into the dialog without scrolling the device (CLAUDE.md, focus trap).
  useEffect(() => {
    if (state === 'open') titleRef.current?.focus({ preventScroll: true });
  }, [state]);

  // Confetti: first burst at its token delay, never under reduced motion.
  useEffect(() => {
    if (!mounted || !open || reduced || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const confetti = new Confetti(canvas);
    const t = window.setTimeout(() => confetti.start(), tokenMs('--motion-delay-celebration-confetti'));
    (window as unknown as { __confetti?: Confetti }).__confetti = confetti;
    return () => {
      window.clearTimeout(t);
      confetti.stop();
    };
  }, [mounted, open, reduced]);

  if (!mounted) return null;

  const dismiss = onClose ?? primaryAction.onPress;
  return (
    <section
      className="celebration"
      data-state={state}
      data-theme="light"
      role="dialog"
      aria-modal="true"
      aria-labelledby="celebration-title"
    >
      <div className="celebration__backdrop" />
      <Rays still={reduced} />
      <canvas ref={canvasRef} className="celebration__confetti" aria-hidden="true" />

      <HeaderButton flat className="celebration__close" icon={close} label="Close" onClick={dismiss} {...inert(!landed)} />

      <div className="celebration__content">
        {/* Two boxes, one motion each, so no animation overwrites another's transform:
            the outer box travels (centre → slot, on an arc); the inner one pops and spins
            (individual `scale` and `rotate`). No squash, stretch or bounce — the user's
            call. The rings are its shock waves. */}
        <div className="celebration__badge">
          <span className="celebration__ring" aria-hidden="true" />
          <span className="celebration__ring celebration__ring--late" aria-hidden="true" />
          <div className="celebration__badgePop">{icon}</div>
        </div>
        <div className="celebration__copy">
          <h2 id="celebration-title" ref={titleRef} tabIndex={-1} className="celebration__title ts-display-d2">
            {title.split(' ').map((word, i) => (
              // The space sits between the masks: inside an inline-block it collapses.
              <Fragment key={i}>
                {i > 0 && ' '}
                <span className="celebration__word" style={{ '--w': i } as CSSProperties}>
                  <span className="celebration__wordInner">{word}</span>
                </span>
              </Fragment>
            ))}
          </h2>
          <p className="celebration__body ts-body-base">{body}</p>
        </div>
        {children && <div className="celebration__card">{children}</div>}
      </div>

      <div
        className="celebration__cta"
        // The CTA takes taps only once it has landed (brief): until then it is inert.
        onAnimationEnd={(e) => {
          if (e.target === e.currentTarget && state !== 'exit') setLanded(true);
        }}
        {...inert(!landed || state === 'exit')}
      >
        <Button hierarchy="secondary" onClick={primaryAction.onPress}>{primaryAction.label}</Button>
      </div>
    </section>
  );
}

/**
 * The "Receipt saved" badge (9502:21221, bxs:check-circle) with its check drawn on.
 *
 * The export is one green path with the check cut out over a white disc. To draw the
 * check, the same path is kept on top and a white stroke is drawn underneath the cut-out,
 * over a green disc — so at rest the badge is the export, and on entry the white runs
 * along the check. The stroke is the cut-out's centreline: 17.48,35 → 28,45.5 → 49,24.5,
 * 7 wide (the cut-out's measured width), mitred to the cut-out's outer corner.
 */
export function CheckBadge() {
  return (
    <svg className="checkBadge" viewBox="0 0 70 70" aria-hidden="true">
      <circle cx="35" cy="35" r="35" fill="var(--gap-color-badge)" />
      <polyline
        className="checkBadge__stroke"
        points="17.48,35 28,45.5 49,24.5"
        fill="none"
        stroke="var(--color-white)"
        strokeWidth="7"
        strokeLinejoin="miter"
        strokeLinecap="butt"
        pathLength={1}
      />
      <path
        d="M35 0C15.701 0 0 15.701 0 35C0 54.299 15.701 70 35 70C54.299 70 70 54.299 70 35C70 15.701 54.299 0 35 0ZM28.0035 50.4455L15.008 37.478L19.95 32.522L27.9965 40.5545L46.5255 22.0255L51.4745 26.9745L28.0035 50.4455Z"
        fill="var(--gap-color-badge)"
      />
    </svg>
  );
}

/** 9502:21308 — the milestone insight: an icon and two lines. */
export function MilestoneCard({ icon, headline, detail }: { icon: string; headline: ReactNode; detail: ReactNode }) {
  return (
    <div className="milestoneCard">
      <img className="milestoneCard__icon" src={icon} alt="" />
      <div className="milestoneCard__text">
        <p className="milestoneCard__headline ts-label-large">{headline}</p>
        <p className="milestoneCard__detail ts-body-base">{detail}</p>
      </div>
    </div>
  );
}
