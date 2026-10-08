import type { Ref } from 'react';
import { parsePercent, parseWholeNaira, type Discount } from '../data/catalogue';
import './DetailField.css';
import './DiscountInput.css';

/**
 * The Discount text field and its %/₦ switch: Item details `88:9556`/`88:9559` and
 * Apply discount `88:15761`/`88:15762`. The value is the raw text typed; the caller
 * parses it, so each sheet can say what is wrong in its own terms.
 *
 * The unchosen option is Color/text/subtlest. One state of Apply discount (`88:15949`)
 * draws it in Color/text/subtle instead, against every other state on the board, so
 * subtlest is used throughout.
 */
export function DiscountInput({
  kind, value, onKindChange, onValueChange, invalid, placeholder = '', inputRef, variant,
}: {
  kind: Discount['kind'];
  value: string;
  onKindChange: (kind: Discount['kind']) => void;
  onValueChange: (value: string) => void;
  invalid: boolean;
  placeholder?: string;
  inputRef?: Ref<HTMLInputElement>;
  /** `order` is Apply discount's switch type; Item details' is the default. */
  variant?: 'order';
}) {
  return (
    <div className={variant ? `discountInput discountInput--${variant}` : 'discountInput'}>
      <label className="detailField">
        <span className="detailField__label">Discount</span>
        <span className="detailField__row">
          {kind === 'amount' && <span aria-hidden="true">₦</span>}
          <span className="detailField__grow" data-value={value || placeholder}>
            <input ref={inputRef} inputMode="numeric" value={value} placeholder={placeholder}
              onChange={(e) => onValueChange(e.target.value)} aria-invalid={invalid} />
          </span>
          {kind === 'percent' && <span aria-hidden="true">%</span>}
        </span>
      </label>
      <div className="segmented" role="radiogroup" aria-label="Discount type" data-kind={kind}>
        {/* The chosen option's fill, as one element that slides between them. */}
        <span className="segmented__indicator" aria-hidden="true" />
        {(['percent', 'amount'] as const).map((k) => (
          <button key={k} type="button" role="radio" aria-checked={kind === k}
            aria-label={k === 'percent' ? 'Percent' : 'Naira amount'}
            className="segmented__option"
            // Switching clears the number: "15" means something else in the other unit.
            onClick={() => { if (k !== kind) { onKindChange(k); onValueChange(''); } }}>
            {k === 'percent' ? '%' : '₦'}
          </button>
        ))}
      </div>
    </div>
  );
}

/** What a Discount field's text means: no discount, a discount, or not valid (null). */
export function parseDiscount(kind: Discount['kind'], text: string): Discount | undefined | null {
  if (text === '') return undefined;
  if (kind === 'percent') {
    const percent = parsePercent(text);
    return percent === null ? null : { kind, percent };
  }
  const minor = parseWholeNaira(text);
  return minor === null ? null : { kind, minor };
}
