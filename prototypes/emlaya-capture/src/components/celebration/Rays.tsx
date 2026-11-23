/**
 * The rays behind the celebration. Figma (9502:21213) draws six white wedges at 20%;
 * the brief asks for a fuller field: 16 in two layers — 8 wide and soft, 8 narrow and
 * brighter, offset by half a step so the gaps fill — each tapering and fading along
 * its length, the layers turning slowly in opposite directions and breathing.
 * CORRECTIONS.md, "Rays".
 */
const STEP = 360 / 8;

export function Rays({ still }: { still: boolean }) {
  return (
    <div className="rays" data-still={still || undefined} aria-hidden="true">
      <div className="rays__layer rays__layer--wide">
        {Array.from({ length: 8 }, (_, i) => (
          <span key={i} className="ray ray--wide" style={{ rotate: `${i * STEP}deg` }} />
        ))}
      </div>
      <div className="rays__layer rays__layer--narrow">
        {Array.from({ length: 8 }, (_, i) => (
          <span key={i} className="ray ray--narrow" style={{ rotate: `${i * STEP + STEP / 2}deg` }} />
        ))}
      </div>
    </div>
  );
}
