import { PRESS_SCALE, duration, DURATION, useReducedMotion } from '@playground/shared';
import { LOW_STOCK_AT, formatPrice, type Product } from '../data/catalogue';
import { Icon } from './Icon';
import './ProductCard.css';

/**
 * Warning colour for a low stock count.
 *
 * OFF-TOKEN. The design hardcodes #a64907 on this one label and the published system
 * has no warning or orange token anywhere in its 57 semantic colours — so there is
 * nothing to map it to. Kept as the literal from the frame rather than substituted
 * with a token that means something else (root agreement: if a value has no token,
 * say so rather than inventing one). Needs a real token upstream.
 */
const LOW_STOCK_COLOR = '#a64907';

function stockColor(stock: number): string {
  if (stock === 0) return 'var(--color-text-danger)';
  if (stock <= LOW_STOCK_AT) return LOW_STOCK_COLOR;
  return 'var(--color-text-secondary)';
}

export function ProductCard({ product, onPress }: { product: Product; onPress: (p: Product) => void }) {
  const reducedMotion = useReducedMotion();

  return (
    <button
      type="button"
      className="productCard"
      onClick={() => onPress(product)}
      style={{ ['--press-duration' as string]: `${duration(DURATION.instant, reducedMotion)}ms`, ['--press-scale' as string]: String(PRESS_SCALE) }}
    >
      <span className="productCard__image">
        {product.image ? (
          <img className="productCard__img" src={`/products/${product.image}`} alt="" />
        ) : null}
        {/* The design puts this scrim on 5 of its 6 cards and omits it on the first.
            Applied to all of them here: the omission reads as an oversight, and an
            inconsistent scrim across one grid is more visibly wrong than either
            choice applied uniformly. Logged as inconsistency #22. */}
        <span className="productCard__scrim" />
      </span>

      <span className="productCard__info">
        {/* Clamped to two lines in a 172px card, and the longest real name still
            overflows that. `title` is the minimum way to reach the full value;
            a designed affordance would be better and is logged as #34. */}
        <span className="productCard__name" title={product.name}>{product.name}</span>
        <span className="productCard__details">
          <span className="productCard__price">{formatPrice(product.priceMinor)}</span>
          <Icon name="ellipse-79" />
          <span className="productCard__stock" style={{ color: stockColor(product.stock) }}>
            {product.stock} ea
          </span>
        </span>
      </span>
    </button>
  );
}
