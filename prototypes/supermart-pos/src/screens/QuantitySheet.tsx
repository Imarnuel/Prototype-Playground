import { AnimatedText } from '../components/AnimatedText';
import { useEffect, useRef, useState, type KeyboardEvent } from 'react';
import { BottomSheet } from '../components/BottomSheet';
import { Icon } from '../components/Icon';
import { maxCount, parseCount, unitFor, type UnitId } from '../data/catalogue';
import { productFor, type CartLine } from '../state/cart';
import './QuantitySheet.css';

/**
 * Quantity sheet — `88:11532` resting, `88:11647` editing the count.
 *
 * A DRAFT over one cart line: nothing reaches the cart until the header's check, and
 * the close throws the draft away. The App remounts this (keyed per opening), so every
 * open starts from the line as it is now; and it renders from `line`, a snapshot taken
 * at open, so the exit animation never reads a line that has since changed.
 *
 * The blanket does not dismiss it: a stray tap must not throw edits away. Undesigned
 * either way — the frame only shows the sheet at rest.
 */
export function QuantitySheet({
  open, line, startEditing = false, onClose, onCommit,
}: {
  open: boolean;
  line: CartLine;
  /** Presents `88:11647` directly — for the dev toolbar. */
  startEditing?: boolean;
  onClose: () => void;
  onCommit: (unitId: UnitId, count: number) => void;
}) {
  const product = productFor(line);
  const [unitId, setUnitId] = useState<UnitId>(line.unitId);
  const [count, setCount] = useState(line.count);
  const [editing, setEditing] = useState(startEditing);
  const [typed, setTyped] = useState(String(line.count));
  const input = useRef<HTMLInputElement>(null);
  const valueButton = useRef<HTMLButtonElement>(null);
  /* Leaving editing by keyboard unmounts the focused input; without a destination the
     focus falls to <body>, outside the dialog, and the next Escape goes nowhere. */
  const refocusValue = useRef(false);

  const unit = unitFor(product, unitId);
  const each = product.units[0];
  const max = maxCount(product, unitId);

  /* preventScroll: the sheet is still travelling in from off-screen when this runs,
     and a plain focus() scrolls the device frame to reveal it (CLAUDE.md, "Focus and
     scroll"). */
  useEffect(() => {
    if (!editing) {
      if (refocusValue.current) valueButton.current?.focus({ preventScroll: true });
      refocusValue.current = false;
      return;
    }
    input.current?.focus({ preventScroll: true });
    input.current?.select();
  }, [editing]);

  /** A typed count is parsed strictly and held to what this unit can supply. Anything
      that is not a whole number of at least 1 leaves the count as it was. */
  const settle = (): number => {
    const n = parseCount(typed);
    const next = n === null ? count : Math.min(n, max);
    setCount(next);
    setTyped(String(next));
    setEditing(false);
    return next;
  };

  const onInputKey = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      // Without this, the same keypress lands on the count button that focus moves to,
      // and clicks it straight back into editing.
      e.preventDefault();
      refocusValue.current = true;
      settle();
    }
    // Escape leaves editing; it should not also close the sheet underneath.
    if (e.key === 'Escape') {
      e.stopPropagation();
      refocusValue.current = true;
      setTyped(String(count));
      setEditing(false);
    }
  };

  const step = (by: number) => {
    const next = Math.max(1, Math.min(count + by, max));
    setCount(next);
    setTyped(String(next));
  };

  const fits = (id: UnitId) => count <= maxCount(product, id);
  const choose = (id: UnitId) => { if (fits(id)) setUnitId(id); };

  /* A radiogroup moves with the arrow keys, skipping rows the shelf cannot supply. */
  const onListKey = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp') return;
    e.preventDefault();
    const usable = product.units.filter((u) => fits(u.id));
    const at = usable.findIndex((u) => u.id === unitId);
    const next = usable[(at + (e.key === 'ArrowDown' ? 1 : usable.length - 1)) % usable.length];
    setUnitId(next.id);
    e.currentTarget.querySelector<HTMLElement>(`[data-unit="${next.id}"]`)?.focus({ preventScroll: true });
  };

  return (
    <BottomSheet
      open={open}
      title="Quantity"
      onClose={onClose}
      closeLabel="Discard quantity changes"
      dismissOnBlanket={false}
      confirm={{ label: 'Save quantity', onPress: () => onCommit(unitId, editing ? settle() : count) }}
      className="quantitySheet"
      // Opening straight into typing (`88:11647`) puts the caret in the count.
      initialFocus={startEditing ? input : undefined}
    >
      {/* Frame 4980: the stepper card. */}
      <div className="qtyStepper">
        <button type="button" className="qtyStepper__step" onClick={() => step(-1)} disabled={count <= 1}
          aria-label="Decrease quantity">
          <Icon name="minus-lg" />
        </button>

        {editing ? (
          <label className="qtyStepper__value">
            <input
              ref={input}
              className="qtyStepper__input"
              value={typed}
              inputMode="numeric"
              pattern="[0-9]*"
              aria-label={`Quantity in ${unit.label}`}
              onChange={(e) => setTyped(e.target.value)}
              onBlur={settle}
              onKeyDown={onInputKey}
              // Sized to the digits, so the unit stays beside them as in `88:11735`.
              style={{ width: `${Math.max(typed.length, 1)}ch` }}
            />
            <span className="qtyStepper__unit" aria-hidden="true">{unit.abbrev}</span>
          </label>
        ) : (
          <button ref={valueButton} type="button" className="qtyStepper__value" onClick={() => setEditing(true)}
            aria-label={`${count} ${unit.abbrev}. Type a quantity`}>
            {/* One inline run, so the space between count and unit is a real space —
                inside the flex button two spans would drop it. */}
            <span>
              <AnimatedText className="qtyStepper__count" value={String(count)} />{' '}
              <span className="qtyStepper__unit">{unit.abbrev}</span>
            </span>
          </button>
        )}

        <button type="button" className="qtyStepper__step" onClick={() => step(1)} disabled={count >= max}
          aria-label="Increase quantity">
          <Icon name="plus-lg" />
        </button>
      </div>

      {/* Frame 4995. A product sold only singly has nothing to choose between. */}
      {product.units.length > 1 && (
        <section className="measurement" aria-labelledby="measurement-heading">
          <h3 id="measurement-heading" className="measurement__title">Measurement</h3>
          <div className="measurement__list" role="radiogroup" aria-labelledby="measurement-heading" onKeyDown={onListKey}>
            {product.units.map((u) => {
              const selected = u.id === unitId;
              const ok = fits(u.id);
              return (
                <button
                  key={u.id}
                  type="button"
                  role="radio"
                  data-unit={u.id}
                  className="measurement__row"
                  aria-checked={selected}
                  aria-disabled={!ok}
                  aria-describedby={ok ? undefined : 'measurement-short'}
                  tabIndex={selected ? 0 : -1}
                  onClick={() => choose(u.id)}
                >
                  <span className="measurement__label">{count} {u.label}</span>
                  <span className="measurement__each">{count * u.each} {each.abbrev}</span>
                  <span className="measurement__checkSlot" aria-hidden="true">
                    <Icon name="check-selected" className="measurement__check" />
                  </span>
                </button>
              );
            })}
          </div>
          {/* Read out on a row the shelf cannot supply. No visible copy is designed. */}
          <span id="measurement-short" className="visuallyHidden">Not enough in stock</span>
        </section>
      )}
    </BottomSheet>
  );
}
