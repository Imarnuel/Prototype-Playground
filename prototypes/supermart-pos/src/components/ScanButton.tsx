import { Icon } from './Icon';
import './ScanButton.css';

/**
 * The green scan button — "Button Icon", `88:19369` on the Sales Point and `88:19466`
 * on the empty Cart. Opens the scanner. Placement is the caller's: the two frames
 * put it in different places.
 */
export function ScanButton({ onPress, className }: { onPress: () => void; className?: string }) {
  return (
    <button type="button" className={className ? `scanButton ${className}` : 'scanButton'}
      onClick={onPress} aria-label="Scan barcode or text">
      <Icon name="scan" />
    </button>
  );
}
