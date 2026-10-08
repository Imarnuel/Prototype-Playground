import { useCallback, useEffect, useState } from 'react';
import { Icon } from '../components/Icon';
import { ProductCard } from '../components/ProductCard';
import { FilterBar, SearchBar, TabBar, ViewCartButton } from '../components/SalesPointChrome';
import { BottomScrim } from '../components/BottomScrim';
import { fetchProducts, type ProductFilter } from '../api/pos';
import { CATEGORY_ORDER, fullName, type Product } from '../data/catalogue';
import { ListMessage } from '../components/ListMessage';
import { ScanButton } from '../components/ScanButton';
import './SalesPoint.css';

/**
 * Sales Point — Figma `88:8079`.
 *
 * Filter chips are DERIVED from the catalogue's categories, not transcribed from the
 * frame. The frame's own chips read "All, Alcohol, Energy drinks, Soft drinks, Soft
 * drinks" — placeholder labels with one duplicated, and they do not match the
 * catalogue. One source of truth per concept (root agreement §4).
 */
const FILTERS: readonly ProductFilter[] = ['All', ...CATEGORY_ORDER];

type Load =
  | { status: 'loading' }
  | { status: 'error'; error: Error }
  | { status: 'ready'; products: readonly Product[] };

type SalesPointProps = {
  forceState?: 'loading' | 'error' | 'empty';
  /** Comes from the shared cart — this screen does not keep its own copy. */
  cartCount: number;
  /** Bumped on New sale: the grid replays its entrance for the next customer. */
  freshSale?: number;
  onAddProduct: (p: Product) => void;
  onViewCart: () => void;
  /** The green scan button, `88:19369`: opens the scanner. */
  onScan: () => void;
};

export function SalesPoint({ forceState, cartCount, freshSale = 0, onAddProduct, onViewCart, onScan }: SalesPointProps) {
  const [filter, setFilter] = useState<ProductFilter>('All');
  const [query, setQuery] = useState('');
  const [load, setLoad] = useState<Load>({ status: 'loading' });

  const run = useCallback(() => {
    let live = true;
    setLoad({ status: 'loading' });
    fetchProducts(filter)
      .then((products) => { if (live) setLoad({ status: 'ready', products }); })
      .catch((error: Error) => { if (live) setLoad({ status: 'error', error }); });
    return () => { live = false; };
  }, [filter]);

  useEffect(() => run(), [run]);

  const matches = (p: Product) =>
    query.trim() === '' || fullName(p).toLowerCase().includes(query.trim().toLowerCase());

  // forceState is a presentation lever, not a second source of truth: it overrides
  // what is rendered, never what was fetched.
  const state: Load = forceState === 'loading' ? { status: 'loading' }
    : forceState === 'error' ? { status: 'error', error: new Error('products failed') }
    : forceState === 'empty' ? { status: 'ready', products: [] }
    : load;
  const visible = state.status === 'ready' ? state.products.filter(matches) : [];

  return (
    <div className="salesPoint">
      <header className="salesPoint__header">
        <div className="salesPoint__headerRow">
          <h1 className="salesPoint__title">Sales Point</h1>
          <button type="button" className="salesPoint__overflow" onClick={onViewCart} aria-label="More options">
            <Icon name="dots-horizontal" />
          </button>
        </div>
        <div className="salesPoint__searchAndFilters">
          <SearchBar
            value={query}
            onChange={setQuery}
            onClearFilters={() => { setFilter('All'); setQuery(''); }}
          />
          <FilterBar filters={FILTERS} active={filter} onSelect={setFilter} />
        </div>
      </header>

      <main className="salesPoint__scroll">
        {state.status === 'loading' && (
          <div className="productGrid" aria-busy="true">
            {Array.from({ length: 6 }, (_, i) => (
              <div key={i} className="productCardSkeleton" />
            ))}
          </div>
        )}

        {state.status === 'error' && (
          <ListMessage title="Couldn’t load products" body={state.error.message} onRetry={run} />
        )}

        {state.status === 'ready' && visible.length === 0 && (
          <ListMessage title="No products"
            body={query.trim() ? `Nothing matches “${query.trim()}”.` : 'This category is empty.'} />
        )}

        {state.status === 'ready' && visible.length > 0 && (
          // Re-keyed on New sale, so the cards rise again — as the receipt lifts away.
          <div className="productGrid" key={freshSale} data-fresh={freshSale > 0 ? 'on' : undefined}>
            {visible.map((p, i) => (
              <ProductCard key={p.id} product={p} onPress={onAddProduct} index={i} />
            ))}
          </div>
        )}
      </main>

      <BottomScrim height={272} />
      <ScanButton className="salesPoint__scan" onPress={onScan} />
      <ViewCartButton count={cartCount} onPress={onViewCart} />
      <TabBar onNavigate={() => {}} />
    </div>
  );
}
