import { AnimatedText } from '../components/AnimatedText';
import { useRef, useState } from 'react';
import { BottomSheet } from '../components/BottomSheet';
import { QtyInputField } from '../components/QtyInputField';
import {
  formatPrice, lineDiscountMinor, lineGrossMinor, maxCount, parsePercent, parseWholeNaira,
  unitFor, unitPriceMinor, type Discount,
} from '../data/catalogue';
import { productImage } from '../data/productImage';
import { productFor, type CartLine, type LineEdits } from '../state/cart';
import './LineDetails.css';

/**
 * Item details — `88:9439`. A draft over one cart line, like the Quantity sheet:
 * the header check commits, the close discards.
 *
 * The frame titles this sheet "Select customer", copied from the sheet it was built
 * from; it is "Item details" here. Its "Regular" subtitle is shown as the product's
 * size. Validation messages are not designed.
 */
export function LineDetails({
  open, line, onClose, onCommit,
}: {
  open: boolean;
  line: CartLine;
  onClose: () => void;
  onCommit: (edits: LineEdits) => void;
}) {
  const product = productFor(line);
  const unit = unitFor(product, line.unitId);
  const listPrice = unitPriceMinor({ product, unitId: line.unitId });

  const [count, setCount] = useState(line.count);
  const [price, setPrice] = useState(line.priceOverrideMinor === undefined ? '' : String(line.priceOverrideMinor / 100));
  const [kind, setKind] = useState<Discount['kind']>(line.discount?.kind ?? 'percent');
  const [off, setOff] = useState(
    !line.discount ? '' : line.discount.kind === 'percent' ? String(line.discount.percent) : String(line.discount.minor / 100),
  );
  const [note, setNote] = useState(line.note ?? '');

  // Empty means "no override" / "no discount"; anything else must parse strictly.
  const priceMinor = price === '' ? undefined : parseWholeNaira(price) ?? null;
  const discount: Discount | undefined | null = off === '' ? undefined
    : kind === 'percent'
      ? (parsePercent(off) === null ? null : { kind, percent: parsePercent(off)! })
      : (parseWholeNaira(off) === null ? null : { kind, minor: parseWholeNaira(off)! });

  const draft = { product, unitId: line.unitId, count, priceOverrideMinor: priceMinor ?? undefined };
  const gross = lineGrossMinor(draft);
  const priceError = priceMinor === null ? 'Enter a whole Naira amount' : null;
  const discountError = discount === null
    ? (kind === 'percent' ? 'Enter a percentage from 0 to 100' : 'Enter a whole Naira amount')
    : discount?.kind === 'amount' && discount.minor > gross ? `More than the line's ${formatPrice(gross)}` : null;
  const valid = !priceError && !discountError;
  const net = gross - (discount ? lineDiscountMinor({ ...draft, discount }) : 0);

  const commit = () => {
    if (!valid) return;
    onCommit({ count, priceOverrideMinor: priceMinor ?? undefined, discount: discount ?? undefined, note: note.trim() || undefined });
  };

  return (
    <BottomSheet
      open={open}
      title="Item details"
      onClose={onClose}
      closeLabel="Discard changes"
      dismissOnBlanket={false}
      confirm={{ label: 'Save item details', onPress: commit }}
      className="lineDetails"
    >
      <div className="lineDetails__item">
        <div className="lineDetails__product">
          <span className="lineDetails__image">
            {productImage(product) && <img src={productImage(product)} alt="" />}
          </span>
          <div className="lineDetails__text">
            <span className="lineDetails__name">{product.name}</span>
            <span className="lineDetails__sub">
              <span>{product.size}</span>
              {/* What the line will cost once saved: the draft's net. */}
              <strong><AnimatedText value={formatPrice(net)} /></strong>
            </span>
          </div>
        </div>
        <div className="lineDetails__qty">
          <QtyInputField count={count} unit={unit.abbrev} min={1} max={maxCount(product, line.unitId)} onChange={setCount} />
          <span className="lineDetails__unitPrice">
            {formatPrice(priceMinor ?? listPrice)}/{unit.abbrev}
          </span>
        </div>
      </div>

      <hr className="lineDetails__divider" />

      <div className="lineDetails__fields">
        <label className="detailField">
          <span className="detailField__label">Set price</span>
          <span className="detailField__row">
            <span aria-hidden="true">₦</span>
            <input inputMode="numeric" value={price} placeholder={String(listPrice / 100)}
              onChange={(e) => setPrice(e.target.value)} aria-invalid={!!priceError} />
          </span>
        </label>
        <FieldError message={priceError} />

        <div className="lineDetails__discount">
          <label className="detailField">
            <span className="detailField__label">Discount</span>
            <span className="detailField__row">
              {kind === 'amount' && <span aria-hidden="true">₦</span>}
              <input inputMode="numeric" value={off} placeholder="0"
                onChange={(e) => setOff(e.target.value)} aria-invalid={!!discountError} />
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
                onClick={() => { if (k !== kind) { setKind(k); setOff(''); } }}>
                {k === 'percent' ? '%' : '₦'}
              </button>
            ))}
          </div>
        </div>
        <FieldError message={discountError} />

        <label className="detailField detailField--tall">
          <span className="detailField__label">Description</span>
          <textarea value={note} placeholder="Add a note" onChange={(e) => setNote(e.target.value)} rows={3} />
        </label>
      </div>
    </BottomSheet>
  );
}

/** A validation message that opens and closes rather than popping. It stays mounted,
    holding its last text through the close, and takes no space while shut. */
function FieldError({ message }: { message: string | null }) {
  const last = useRef(message);
  if (message) last.current = message;
  return (
    <div className="fieldError" data-open={message ? 'on' : 'off'}>
      <div className="fieldError__clip">
        <p className="detailField__error" role={message ? 'alert' : undefined}>{last.current}</p>
      </div>
    </div>
  );
}
