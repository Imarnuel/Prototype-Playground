import { BottomSheet } from '../components/BottomSheet';
import { formatPrice, unitFor, type Product } from '../data/catalogue';
import { productImage } from '../data/productImage';
import type { TextResult } from '../state/scan';
import './ScanMatches.css';

/**
 * "Which product?" — `88:19899`, over the scanner when scanned text matches more than
 * one product. One read, a list to pick from; a pick adds that product. A single
 * match never comes here: it is added straight away.
 */
export function ScanMatches({ open, result, onClose, onChoose }: {
  open: boolean;
  /** Kept by the caller through the exit, so the sheet leaves with what it showed. */
  result: TextResult | null;
  onClose: () => void;
  onChoose: (product: Product) => void;
}) {
  const matches = result?.matches ?? [];
  return (
    <BottomSheet open={open} title="Which product?" onClose={onClose} closeLabel="Close, keep scanning"
      className="scanMatches" subtitle={`${matches.length} matches for scanned text`}>
      <div className="scanMatches__detected">
        <span>Detected text:</span>
        <span className="scanMatches__badge">{result?.detected}</span>
      </div>
      <ul className="scanMatches__list">
        {matches.map(({ product, best }) => {
          const photo = productImage(product);
          return (
            <li key={product.id}>
              <button type="button" className="scanMatches__row" onClick={() => onChoose(product)}>
                <span className="scanMatches__lead">
                  <span className="scanMatches__image">
                    {photo && <img src={photo} alt="" />}
                    <span className="scanMatches__scrim" />
                  </span>
                  <span className="scanMatches__text">
                    <span className="scanMatches__name">{product.name}</span>
                    <span className="scanMatches__meta">
                      <span>{product.stock} {unitFor(product, 'each').abbrev} left</span>
                      {best && <span className="scanMatches__best">Best match</span>}
                    </span>
                  </span>
                </span>
                <span className="scanMatches__price">{formatPrice(product.priceMinor)}</span>
              </button>
            </li>
          );
        })}
      </ul>
    </BottomSheet>
  );
}
