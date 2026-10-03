import './AssetSlot.css';

/**
 * Reserves space for an icon that could not be downloaded from Figma.
 *
 * This environment's network policy denies www.figma.com, so `download_assets`
 * returns URLs that cannot be fetched. The root agreement forbids substituting a
 * similar-looking icon or redrawing one by hand, so the space is held at the exact
 * design size and left empty rather than filled with a guess.
 *
 * See src/assets/icons/MANIFEST.md for the file each slot is waiting for. Replace
 * this component with the real <img> once the assets land — do not "fix" it by
 * drawing something here.
 */
export function AssetSlot({ name, width, height }: { name: string; width: number; height: number }) {
  return (
    <span
      className="assetSlot"
      style={{ width, height }}
      data-asset-pending={name}
      role="img"
      aria-label={`${name} (icon pending)`}
    />
  );
}

/** Every slot the Sales Point screen is waiting on, for the dev toolbar readout. */
export const PENDING_ICONS = [
  'cellular-connection', 'wifi', 'battery', 'dots-horizontal', 'search-sm',
  'filter-lines', 'ellipse-79', 'grid-01', 'cart', 'menu-01', 'shopping-cart-01',
] as const;
