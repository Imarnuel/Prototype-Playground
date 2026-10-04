import { AssetSlot } from './AssetSlot';
import './CloseButton.css';

/**
 * Title-bar dismiss action. Named here because Figma never named it: it appears 77
 * times across the board as the default "Frame 4908", always 40x40 at the leading
 * edge of a title bar, always wrapping a 20x20 `x-close`. An x-close, not a chevron,
 * so these screens dismiss rather than navigate back.
 *
 * NOTE: the instance's inner layer is named `chevron-left` in design context while
 * metadata and the component description both say `x-close`, and the exported asset
 * is x-close. Two sources against one, so x-close is what it is.
 */
export function CloseButton({ onPress, label = 'Close' }: { onPress: () => void; label?: string }) {
  return (
    <button type="button" className="closeButton" onClick={onPress} aria-label={label}>
      <AssetSlot name="x-close" width={20} height={20} />
    </button>
  );
}
