import { Icon } from './Icon';
import './QtyInputField.css';

/**
 * Stepper from the Cart line item. 319 instances across the board, so it is built
 * once here rather than inline.
 *
 * The design's six rows disagree with each other: five use gap 4 with
 * `Color/border/default` and the label "ea", the sixth uses gap 8 with
 * `Color/border/input` and "each". The five-row majority is built; logged as #30.
 */
export function QtyInputField({
  count, unit, onChange, max, min = 0,
}: {
  count: number;
  /** The unit's abbreviation — "ea", "pck" — so a line in packs reads as packs. */
  unit: string;
  onChange: (next: number) => void;
  max: number;
  /** 0 in the Cart, where stepping to zero removes the line; 1 inside an editing
      sheet, where a draft must never reach zero or below. */
  min?: number;
}) {
  return (
    <div className="qtyField">
      <button
        type="button"
        className="qtyField__step"
        onClick={() => onChange(count - 1)}
        disabled={count <= min}
        aria-label="Decrease quantity"
      >
        <Icon name="minus" />
      </button>
      <span className="qtyField__value">
        <span>{count}</span>
        <span>{unit}</span>
      </span>
      <button
        type="button"
        className="qtyField__step"
        onClick={() => onChange(count + 1)}
        // Stock is the real ceiling: a till cannot sell more than the shelf holds,
        // and the catalogue is the only thing that knows the count.
        disabled={count >= max}
        aria-label="Increase quantity"
      >
        <Icon name="plus" />
      </button>
    </div>
  );
}
