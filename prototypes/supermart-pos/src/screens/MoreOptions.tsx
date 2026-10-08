import { BottomSheet } from '../components/BottomSheet';
import { Icon, type IconName } from '../components/Icon';
import './MoreOptions.css';

export type MoreOption = 'customer' | 'discount' | 'clear' | 'queued';

/**
 * More options — the Cart's ••• menu, `88:15543` in "Applying discount to an order".
 *
 * Deviations, each logged in BUILD-PLAN:
 * - Every row carries a trailing check at opacity 0. Not built: an invisible mark on
 *   a menu row says nothing, and none of these rows is a selection.
 * - The header's check Button Icon is at opacity 0 too, as on Select customer (#43).
 * - Clear cart, the only row in its group, has the divider that separates rows
 *   elsewhere in the menu. Dropped: a line under the last row divides nothing.
 * - The groups are drawn 345 wide in a 349 body, 16 from the left and 20 from the
 *   right. They fill the body, 16 each side.
 * - "Add a customer" keeps its label when one is attached, and swaps them.
 */
const GROUPS: readonly (readonly { id: MoreOption; icon: IconName; label: string }[])[] = [
  [
    { id: 'customer', icon: 'user-02-brand', label: 'Add a customer' },
    { id: 'discount', icon: 'percent-03', label: 'Apply discount' },
  ],
  [{ id: 'clear', icon: 'trash-01', label: 'Clear cart' }],
  [{ id: 'queued', icon: 'list', label: 'Queued orders' }],
];

export function MoreOptions({
  open, onClose, onChoose, handoff = false,
}: {
  open: boolean;
  onClose: () => void;
  /** Swapping with another sheet: see BottomSheet `handoff`. */
  handoff?: boolean;
  onChoose: (option: MoreOption) => void;
}) {
  return (
    <BottomSheet handoff={handoff} open={open} title="More options" onClose={onClose} closeLabel="Close more options" className="moreOptions">
      {GROUPS.map((group, g) => (
        <div key={g} className="moreOptions__group">
          {group.map((row) => (
            <button key={row.id} type="button" className="moreOptions__row" data-option={row.id}
              onClick={() => onChoose(row.id)}>
              <Icon name={row.icon} />
              <span className="moreOptions__label">{row.label}</span>
            </button>
          ))}
        </div>
      ))}
    </BottomSheet>
  );
}
