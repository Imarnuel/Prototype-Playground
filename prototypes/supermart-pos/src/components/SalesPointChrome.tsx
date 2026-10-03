import { DURATION, EASING, duration, useReducedMotion } from '@playground/shared';
import { AssetSlot } from './AssetSlot';
import type { ProductFilter } from '../api/pos';
import './SalesPointChrome.css';

export function SearchBar({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div className="searchBar">
      <div className="textField">
        <AssetSlot name="search-sm" width={20} height={20} />
        <input
          className="textField__input"
          value={value}
          placeholder="Search"
          onChange={(e) => onChange(e.target.value)}
        />
      </div>
      {/* The design names this icon node `chevron-down` but renders the filter-lines
          asset. The asset is what ships; the node name is wrong upstream. */}
      <button type="button" className="filterButton" onClick={() => onChange('')}>
        <AssetSlot name="filter-lines" width={16} height={16} />
      </button>
    </div>
  );
}

export function FilterBar({
  filters, active, onSelect,
}: { filters: readonly ProductFilter[]; active: ProductFilter; onSelect: (f: ProductFilter) => void }) {
  const reducedMotion = useReducedMotion();
  return (
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
  );
}

export function TabBar({ onNavigate }: { onNavigate: (tab: string) => void }) {
  return (
    <div className="tabBar">
      <div className="tabBar__nav">
        <button type="button" className="tabBar__item" onClick={() => onNavigate('Dashboard')}>
          <AssetSlot name="grid-01" width={20} height={20} />
          {/* text/default here and text/secondary on "More" — both unselected. The
              design is inconsistent between its own two inactive tabs; followed
              exactly rather than normalised. Logged as inconsistency #23. */}
          <span className="tabBar__label" style={{ color: 'var(--color-text-default)' }}>Dashboard</span>
        </button>
        <button type="button" className="tabBar__item" data-active="on" onClick={() => onNavigate('Sales Point')}>
          <AssetSlot name="cart" width={20} height={17.896} />
          <span className="tabBar__label" style={{ color: 'var(--color-text-selected)' }}>Sales Point</span>
        </button>
        <button type="button" className="tabBar__item" onClick={() => onNavigate('More')}>
          <AssetSlot name="menu-01" width={20} height={20} />
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
      <AssetSlot name="shopping-cart-01" width={16} height={16} />
      <span className="viewCart__label">View cart{count > 0 ? ` (${count})` : ''}</span>
    </button>
  );
}
