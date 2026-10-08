import { useEffect, useState } from 'react';
import { Icon } from '../components/Icon';
import { PRODUCTS } from '../data/catalogue';
import { productImage } from '../data/productImage';
import { usePresented } from '../hooks/usePresented';
import { ean13Modules, type ScanTarget } from '../state/scan';
import './Scanner.css';

/**
 * The scanner's camera — band `214:26054`, the black upper part of `88:19506` and its
 * siblings. The Order Preview docked under it is the Cart itself (`Cart` mode
 * "docked"), not a copy.
 *
 * The camera is simulated (the designer's call). What is in front of it is DRAWN
 * from the catalogue rather than photographed (also the designer's call): the frames'
 * camera shots are a drinks carton and a Sprite bottle, which a clothing store never
 * scans. A barcode is the product's real EAN-13, encoded; a tag carries its brand and
 * name. The photo behind is the product's own, blurred, standing in for the item
 * filling the lens.
 */
export function Scanner({ target, onClose, onHoldUp, hint = false }: {
  /** What is in front of the camera, or nothing. */
  target: ScanTarget | null;
  onClose: () => void;
  /** Present only in a demo: a tap on the camera holds up the next item. */
  onHoldUp?: () => void;
  /** The prototype's own affordance, not designed: says how to scan in a demo. */
  hint?: boolean;
}) {
  /* The item keeps rendering through its exit, so it fades out of view rather than
     cutting to black. */
  const { mounted, entered } = usePresented(target !== null);
  const [shown, setShown] = useState(target);
  useEffect(() => { if (target) setShown(target); }, [target]);

  return (
    <div className="scanner">
      {mounted && shown && <Scene target={shown} entered={entered} />}

      <button type="button" className="scanner__camera" onClick={onHoldUp} disabled={!onHoldUp || target !== null}
        aria-label="Hold up the next item to the camera" tabIndex={onHoldUp ? 0 : -1} />

      {/* `88:19536`: Frame 4908 (the board's close button) under the file's DARK
          variable mode, set explicitly on the node — Color/container/neutral/default
          resolves to #2C2D30 and its x-close is #CFD0D3. The app carries no dark
          tokens (#103), so the two resolved values are written as they render. */}
      <button type="button" className="scanner__close" onClick={onClose} aria-label="Close scanner">
        <Icon name="x-close-camera" />
      </button>

      <div className="scanner__frame" aria-hidden="true">
        <span className="scanner__corner" data-at="tl" />
        <span className="scanner__corner" data-at="tr" />
        <span className="scanner__corner" data-at="bl" />
        <span className="scanner__corner" data-at="br" />
        <span className="scanner__line"><Icon name="scan-line" /></span>
        {hint && <span className="scanner__hint" data-hidden={target ? 'on' : 'off'}>Tap to scan the next item</span>}
      </div>

      <p className="visuallyHidden" role="status">{target ? 'Reading…' : ''}</p>
    </div>
  );
}

function Scene({ target, entered }: { target: ScanTarget; entered: boolean }) {
  const product = PRODUCTS.find((p) => p.id === target.productId);
  const photo = product ? productImage(product) : undefined;
  return (
    <div className="scanScene" data-open={entered ? 'on' : 'off'} aria-hidden="true">
      {photo && <img className="scanScene__photo" src={photo} alt="" />}
      {target.kind === 'barcode' ? <BarcodeLabel code={target.code} /> : <Tag lines={target.lines} />}
    </div>
  );
}

/** EAN-13 in its standard form: the 95 modules at 2px, guards dropped below the
    digits, the first digit outside the left guard. */
function BarcodeLabel({ code }: { code: string }) {
  const modules = ean13Modules(code);
  const guard = new Set([0, 1, 2, 45, 46, 47, 48, 49, 92, 93, 94]);
  const X = 2, LEFT = 14, H = 60;
  return (
    <div className="scanLabel">
      <svg width={LEFT + 95 * X + 6} height={H + 22} viewBox={`0 0 ${LEFT + 95 * X + 6} ${H + 22}`}>
        {[...modules].map((m, i) => (m === '1'
          ? <rect key={i} x={LEFT + i * X} y={0} width={X} height={guard.has(i) ? H + 10 : H} />
          : null))}
        <text x={2} y={H + 18}>{code[0]}</text>
        <text x={LEFT + 3 * X + 2} y={H + 18} textLength={42 * X - 4}>{code.slice(1, 7)}</text>
        <text x={LEFT + 50 * X + 2} y={H + 18} textLength={42 * X - 4}>{code.slice(7)}</text>
      </svg>
    </div>
  );
}

function Tag({ lines }: { lines: readonly string[] }) {
  return (
    <div className="scanTag">
      <span className="scanTag__hole" />
      <span className="scanTag__brand">{lines[0]}</span>
      {lines.slice(1).map((l) => <span key={l} className="scanTag__line">{l}</span>)}
    </div>
  );
}
