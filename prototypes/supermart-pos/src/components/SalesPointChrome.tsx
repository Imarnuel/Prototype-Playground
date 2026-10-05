import { DURATION, EASING, duration, useReducedMotion } from '@playground/shared';
import { Icon } from './Icon';
import type { ProductFilter } from '../api/pos';
import './SalesPointChrome.css';

export function SearchBar({
  value, onChange, onClearFilters,
}: { value: string; onChange: (v: string) => void; onClearFilters: () => void }) {
  return (
    <div className="searchBar">
      <div className="textField">
        <Icon name="search-sm" />
        <input
          className="textField__input"
          value={value}
          placeholder="Search"
          // The design shows no visible label, and a placeholder is not an accessible
          // name — it disappears the moment anything is typed.
          aria-label="Search products"
          onChange={(e) => onChange(e.target.value)}
        />
      </div>
      {/* The design names this icon node `chevron-down` but renders the filter-lines
          asset. The asset is what ships; the node name is wrong upstream.

          Band 4 designs no filter sheet, so this resets the category chip and the
          search instead of opening one — a real action in the icon's own domain
          rather than a control that does nothing. Logged as #51.

          It needs an explicit name: it is the only icon-only control here without
          visible text, and the icons are decorative (`alt=""`), so nothing else
          would name it. */}
      <button
        type="button"
        className="filterButton"
        onClick={onClearFilters}
        aria-label="Clear filters"
      >
        <Icon name="filter-lines" />
      </button>
    </div>
  );
}

export function FilterBar({
  filters, active, onSelect,
}: { filters: readonly ProductFilter[]; active: ProductFilter; onSelect: (f: ProductFilter) => void }) {
  const reducedMotion = useReducedMotion();
  return (
    /* The wrapper is what bleeds to the screen edge and carries the design's fade;
       the inner element is the scroller. One element cannot be both: a fade inside
       an overflow-x container scrolls away with the chips. */
    <div className="filterBarWrap">
      <div className="filterBar">
        {filters.map((f) => (
          <button
            key={f}
            type="button"
            className="filterChip"
            data-active={f === active ? 'on' : 'off'}
            onClick={() => onSelect(f)}
            style={{ transitionDuration: `${duration(DURATION.fast, reducedMotion)}ms`, transitionTimingFunction: EASING.inOut }}
          >
            {f}
          </button>
        ))}
      </div>
    </div>
  );
}

export function TabBar({ onNavigate }: { onNavigate: (tab: string) => void }) {
  return (
    <div className="tabBar">
      <div className="tabBar__nav">
        <button type="button" className="tabBar__item" onClick={() => onNavigate('Dashboard')}>
          <Icon name="grid-01" />
          {/* text/default here and text/secondary on "More" — both unselected. The
              design is inconsistent between its own two inactive tabs; followed
              exactly rather than normalised. Logged as inconsistency #23. */}
          <span className="tabBar__label" style={{ color: 'var(--color-text-default)' }}>Dashboard</span>
        </button>
        <button type="button" className="tabBar__item" data-active="on" onClick={() => onNavigate('Sales Point')}>
          <Icon name="cart" />
          <span className="tabBar__label" style={{ color: 'var(--color-text-selected)' }}>Sales Point</span>
        </button>
        <button type="button" className="tabBar__item" onClick={() => onNavigate('More')}>
          <Icon name="menu-01" />
          <span className="tabBar__label" style={{ color: 'var(--color-text-secondary)' }}>More</span>
        </button>
      </div>
    </div>
  );
}

export function ViewCartButton({ count, onPress }: { count: number; onPress: () => void }) {
  return (
    <button type="button" className="viewCart" onClick={onPress}>
      {/* Node is named `plus` upstream but renders shopping-cart-01. */}
      <Icon name="shopping-cart-01" />
      <span className="viewCart__label">View cart{count > 0 ? ` (${count})` : ''}</span>
    </button>
  );
}
