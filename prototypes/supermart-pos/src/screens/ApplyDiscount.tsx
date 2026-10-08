import { useRef, useState } from 'react';
import { BottomSheet } from '../components/BottomSheet';
import { DiscountInput, parseDiscount } from '../components/DiscountInput';
import { FieldError } from '../components/FieldError';
import { formatPrice, type Discount } from '../data/catalogue';
import './ApplyDiscount.css';

/**
 * Apply discount — `88:15757` (empty), `88:15849` (10%) and `88:15941` (₦10): one
 * sheet in three states. A draft like Item details: the check commits, the close
 * discards. It opens on the order's current discount, and an empty field commits as
 * "no discount", which is how one is removed. Validation messages are not designed.
 *
 * `baseMinor` is what the lines come to after their own discounts — what an order
 * discount is taken from — so an amount past it is refused here, not clamped silently.
 */
export function ApplyDiscount({
  open, current, baseMinor, onClose, onCommit, handoff = false,
}: {
  open: boolean;
  current?: Discount;
  baseMinor: number;
  onClose: () => void;
  /** Swapping with another sheet: see BottomSheet `handoff`. */
  handoff?: boolean;
  onCommit: (discount: Discount | undefined) => void;
}) {
  const [kind, setKind] = useState<Discount['kind']>(current?.kind ?? 'percent');
  const [text, setText] = useState(
    !current ? '' : current.kind === 'percent' ? String(current.percent) : String(current.minor / 100),
  );
  const input = useRef<HTMLInputElement>(null);

  const discount = parseDiscount(kind, text);
  const error = discount === null
    ? (kind === 'percent' ? 'Enter a percentage from 0 to 100' : 'Enter a whole Naira amount')
    : discount?.kind === 'amount' && discount.minor > baseMinor ? `More than the order's ${formatPrice(baseMinor)}` : null;

  return (
    <BottomSheet handoff={handoff}
      open={open}
      title="Apply discount"
      onClose={onClose}
      closeLabel="Discard discount"
      dismissOnBlanket={false}
      confirm={{ label: 'Apply discount', onPress: () => { if (!error) onCommit(discount ?? undefined); } }}
      className="applyDiscount"
      // The sheet's only job is typing a number, so it opens with the caret in it.
      initialFocus={input}
    >
      <div>
        <DiscountInput kind={kind} value={text} onKindChange={setKind} onValueChange={setText}
          invalid={!!error} inputRef={input} variant="order" />
        <FieldError message={error} />
      </div>
    </BottomSheet>
  );
}
