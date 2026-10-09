import { ICONS, type IconName } from '../assets/icons';
import { useTheme } from '../theme';
import './Icon.css';

/**
 * Renders one of the screens' own Figma exports.
 *
 * Replaces the earlier AssetSlot, which reserved empty space because
 * `download_assets` hands back www.figma.com URLs this environment cannot fetch.
 * The assets came out through the plugin API instead, so nothing here is a
 * substitute or a redraw — each file is the instance's own export, carrying the
 * colour the design applies at that call site.
 *
 * No width/height prop on purpose: each asset renders at the intrinsic size in its
 * own root attributes. Forcing a different size at a call site distorts the glyph,
 * and three of these are not square (cart 19x18, battery 28x13, wifi 18x13).
 */
export function Icon({ name, className }: { name: IconName; className?: string }) {
  const icon = ICONS[name];
  const theme = useTheme();
  return (
    <img
      className={className ? `icon ${className}` : 'icon'}
      src={theme === 'dark' && icon.dark ? icon.dark : icon.src}
      width={icon.width}
      height={icon.height}
      alt=""
      draggable={false}
    />
  );
}

export type { IconName };
