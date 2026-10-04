import { Icon } from './Icon';
import './StatusBar.css';

/**
 * iOS status bar.
 *
 * Height is the device's real safe-area inset (59), NOT the design's 50 — an agreed
 * deviation recorded in BUILD-PLAN.md "Resolved deviations". At 50 the header clears
 * the Dynamic Island by 2.33px; at 59 it clears by 11.33px.
 *
 * Width is 393, not the 402 the design's component uses. 89 of the board's 95 status
 * bars are a 402pt (iPhone 16 Pro) component dropped on a 393pt frame, overhanging
 * both edges; the other 6 are 393 and are the correct ones.
 */
export function StatusBar() {
  return (
    <div className="statusBar">
      <div className="statusBar__row">
        <div className="statusBar__time">9:41</div>
        {/* Holds the gap the Dynamic Island occupies. 124 wide in the design against
            the island's own 125 — close enough that the 1px is not worth deviating. */}
        <div className="statusBar__islandSpacer" />
        <div className="statusBar__levels">
          <Icon name="cellular-connection" />
          <Icon name="wifi" />
          <Icon name="battery" />
        </div>
      </div>
    </div>
  );
}
