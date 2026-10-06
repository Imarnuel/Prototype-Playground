import { AnimatedText } from './AnimatedText';
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
  count, unit, onChange, max, min = 0, onValuePress,
}: {
  count: number;
  /** The unit's abbreviation — "ea", "pck" — so a line in packs reads as packs. */
  unit: string;
  onChange: (next: number) => void;
  max: number;
  /** 0 in the Cart, where stepping to zero removes the line; 1 inside an editing
      sheet, where a draft must never reach zero or below. */
  min?: number;
  /** Opens the Quantity sheet. The design never says what opens it; the value is the
      one part of the field that does nothing else, so it is the entry point —
      interpreted, BUILD-PLAN #76. */
  onValuePress?: () => void;
}) {
  const value = (
    <>
      <AnimatedText value={String(count)} />
      <span>{unit}</span>
    </>
  );
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
      {onValuePress ? (
        <button
          type="button"
          className="qtyField__value"
          onClick={onValuePress}
          aria-label={`Quantity ${count} ${unit}. Change quantity or unit`}
        >
          {value}
        </button>
      ) : (
        <span className="qtyField__value">{value}</span>
      )}
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
