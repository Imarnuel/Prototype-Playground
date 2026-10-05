import cellular from './assets/cellular-connection.svg';
import wifi from './assets/wifi.svg';
import battery from './assets/battery.svg';

/**
 * iOS status bar — device chrome, not app content.
 *
 * Every frame in the Figma file carries its own status-bar instance, because a Figma
 * frame is the screen and a designer has to paste one in for the screen to read. The
 * platform does not work that way: the system draws the status bar once, above the
 * app, and a presented sheet slides under it. Mirroring the file's composition put a
 * copy in each screen, which during the cart transition showed TWO clocks on screen
 * at once — one at y=0 and a second travelling up from y=686. Measured, not guessed.
 *
 * So it lives here with the Dynamic Island, rendered once by DeviceFrame.
 *
 * `aria-hidden`: on a real device this is system UI and is not in the app's
 * accessibility tree. A screen reader should not announce the app's own clock.
 *
 * Height is the device's real safe-area inset (59), NOT the design's 50 — an agreed
 * deviation recorded in the study's BUILD-PLAN. At 50 the header clears the Dynamic
 * Island by 2.33px; at 59 it clears by 11.33px.
 *
 * Width is the screen's 393, not the 402 the design's component uses. 89 of that
 * board's 95 status bars are a 402pt (iPhone 16 Pro) component dropped on a 393pt
 * frame, overhanging both edges; the other 6 are 393 and are the correct ones.
 */
export function StatusBar() {
  return (
    <div className="statusBar" aria-hidden="true">
      <div className="statusBar__row">
        <div className="statusBar__time">9:41</div>
        {/* Holds the gap the Dynamic Island occupies. 124 wide in the design against
            the island's own 125 — close enough that the 1px is not worth deviating. */}
        <div className="statusBar__islandSpacer" />
        <div className="statusBar__levels">
          <img src={cellular} width={20} height={13} alt="" draggable={false} />
          <img src={wifi} width={18} height={13} alt="" draggable={false} />
          <img src={battery} width={28} height={13} alt="" draggable={false} />
        </div>
      </div>
    </div>
  );
}
