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

/**
 * Product photos, resolved through the bundler.
 *
 * They were requested as `/products/<file>`, which Vite serves only out of a `public/`
 * directory — and there is none; the pipeline writes to `assets/products/`. So every
 * card asked for a URL that could not resolve, and the 42 products whose photo has not
 * been shot rendered a broken-image glyph on top of the neutral fill instead of the
 * fill alone. Measured in a production build: 42 broken <img>.
 *
 * A glob makes absence a build-time fact rather than a runtime 404 — a name with no
 * file is simply not in the map, so the card falls back without a failed request.
 * The pattern is relative: `import.meta.glob` does not resolve path aliases
 * (CLAUDE.md "Figma -> code").
 */
const PHOTOS = import.meta.glob('../../assets/products/*.webp', {
  eager: true, query: '?url', import: 'default',
}) as Record<string, string>;

/**
 * Drawn stand-ins, one per product, generated from the catalogue by
 * scripts/gen-packshots.mjs. They are NOT photography and are not presented as it.
 * The Figma file has four real-brand stock photos reused across the whole section,
 * which is the placeholder set this study replaced — see the study's CLAUDE.md.
 *
 * A real photo always wins: drop one into assets/products/ and that product stops
 * using its packshot, with nothing to delete and no per-product switch to flip.
 */
const PACKSHOTS = import.meta.glob('../../assets/packshots/*.svg', {
  eager: true, query: '?url', import: 'default',
}) as Record<string, string>;

const imageFor = (p: Product) =>
  (p.image ? PHOTOS[`../../assets/products/${p.image}`] : undefined)
  ?? PACKSHOTS[`../../assets/packshots/${p.id}.svg`];

export function ProductCard({ product, onPress }: { product: Product; onPress: (p: Product) => void }) {
  const reducedMotion = useReducedMotion();

  const photo = imageFor(product);

  return (
    <button
      type="button"
      className="productCard"
      onClick={() => onPress(product)}
      style={{ ['--press-duration' as string]: `${duration(DURATION.instant, reducedMotion)}ms`, ['--press-scale' as string]: String(PRESS_SCALE) }}
    >
      <span className="productCard__image">
        {photo ? (
          <img className="productCard__img" src={photo} alt="" />
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
