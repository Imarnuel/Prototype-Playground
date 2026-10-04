import './BottomScrim.css';

/**
 * The gradient-and-blur scrim docked to the bottom of a screen.
 *
 * Figma node: `88:8152` (Sales Point, 272 tall), `88:8238` (Cart, 206). Read from
 * the file itself rather than from generated code, because the generated code does
 * not say which kind of blur it is — and that is the whole problem:
 *
 *   effects: [{ type: 'BACKGROUND_BLUR', radius: 16 }]
 *   fill:    linear gradient, stops at 0 / 0.28365 / 1, alpha 0 -> 0.9 -> 1
 *
 * A Figma BACKGROUND_BLUR is modulated by the layer's own alpha: where the fill is
 * transparent there is no blur, so the blur fades in exactly as the white does. CSS
 * `backdrop-filter` has no such behaviour — it blurs the element's whole box evenly,
 * which puts a hard horizontal seam across the content at the scrim's top edge.
 * Measured on the unmasked version: 75.4% of image detail disappeared across one row.
 *
 * So the blur lives on its own layer and is masked by the same alpha ramp as the
 * fill. The two stop lists are deliberately identical — if one changes, change both.
 */
const STOPS = '33.537%, 58.748%, 122.42%'; // the fill's stops after its gradientTransform

export function BottomScrim({ height }: { height: number }) {
  return (
    <div className="bottomScrim" style={{ height }} aria-hidden="true">
      <div className="bottomScrim__blur" />
    </div>
  );
}

/** Exported only so a test can assert the two ramps have not drifted apart. */
export const BOTTOM_SCRIM_STOPS = STOPS;
