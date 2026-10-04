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
  qty, onChange, max,
}: { qty: number; onChange: (next: number) => void; max: number }) {
  return (
    <div className="qtyField">
      <button
        type="button"
        className="qtyField__step"
        onClick={() => onChange(qty - 1)}
        aria-label="Decrease quantity"
      >
        <Icon name="minus" />
      </button>
      <span className="qtyField__value">
        <span>{qty}</span>
        <span>ea</span>
      </span>
      <button
        type="button"
        className="qtyField__step"
        onClick={() => onChange(qty + 1)}
        // Stock is the real ceiling: a till cannot sell more than the shelf holds,
        // and the catalogue is the only thing that knows the count.
        disabled={qty >= max}
        aria-label="Increase quantity"
      >
        <Icon name="plus" />
      </button>
    </div>
  );
}
