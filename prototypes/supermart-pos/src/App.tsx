import { useEffect, useRef, useState } from 'react';
import {
  DeviceFrame, DevToolbar, SHEET_SPRING, devFlagEnabled, duration, useReducedMotion,
  type DevToolbarItem,
} from '@playground/shared';
import { SalesPoint } from './screens/SalesPoint';
import { Cart } from './screens/Cart';
import { PENDING_ICONS } from './components/AssetSlot';
import { PRODUCTS } from './data/catalogue';
import { addToCart, removeLine, setQty, type CartLine } from './state/cart';
import './App.css';

type Forced = 'loading' | 'error' | 'empty' | undefined;

export function App() {
  const [forced, setForced] = useState<Forced>(undefined);
  const [resetNonce, setResetNonce] = useState(0);
  const [lines, setLines] = useState<readonly CartLine[]>([]);

  // `cartOpen` is intent; `cartMounted` keeps the sheet in the tree through its exit.
  // Unmounting on `if (!open) return null` would cut the exit — a bug, not a style
  // (root agreement §5).
  const [cartOpen, setCartOpen] = useState(false);
  const [cartMounted, setCartMounted] = useState(false);
  const reducedMotion = useReducedMotion();
  const exitTimer = useRef<number>();

  useEffect(() => {
    if (cartOpen) {
      setCartMounted(true);
      return;
    }
    if (!cartMounted) return;
    const ms = duration(SHEET_SPRING.exitDuration, reducedMotion);
    exitTimer.current = window.setTimeout(() => setCartMounted(false), ms);
    return () => window.clearTimeout(exitTimer.current);
  }, [cartOpen, cartMounted, reducedMotion]);

  const items: DevToolbarItem[] = [
    {
      label: 'Sales point',
      group: 'Screens',
      onSelect: () => { setForced(undefined); setCartOpen(false); setResetNonce((n) => n + 1); },
    },
    { label: 'Cart (Order Preview)', group: 'Screens', onSelect: () => setCartOpen(true) },
    { label: 'Loading (skeleton)', group: 'States', onSelect: () => { setCartOpen(false); setForced('loading'); } },
    { label: 'Empty', group: 'States', onSelect: () => { setCartOpen(false); setForced('empty'); } },
    { label: 'Error', group: 'States', onSelect: () => { setCartOpen(false); setForced('error'); } },
    {
      label: 'Cart: empty',
      group: 'States',
      onSelect: () => { setLines([]); setCartOpen(true); },
    },
    {
      label: 'Cart: fill with 4 lines',
      group: 'States',
      onSelect: () => {
        // Drawn from the catalogue, so the lines, totals and stock ceilings are real.
        const picks = ['bev-cola', 'noo-multipack', 'cok-oil', 'bev-malt']
          .map((id) => PRODUCTS.find((p) => p.id === id)!);
        setLines(picks.reduce<readonly CartLine[]>((acc, p) => addToCart(acc, p), []));
        setCartOpen(true);
      },
    },
    {
      label: `${PENDING_ICONS.length} icons pending`,
      group: 'Assets',
      onSelect: () => console.info('Awaiting from Figma:', PENDING_ICONS.join(', ')),
    },
  ];

  const enterMs = duration(SHEET_SPRING.duration, reducedMotion);
  const exitMs = duration(SHEET_SPRING.exitDuration, reducedMotion);

  return (
    <>
      <DeviceFrame>
        <SalesPoint
          key={resetNonce}
          forceState={forced}
          cartCount={lines.length}
          onAddProduct={(p) => setLines((l) => addToCart(l, p))}
          onViewCart={() => setCartOpen(true)}
        />

        {cartMounted && (
          <div
            className="sheet"
            data-open={cartOpen ? 'on' : 'off'}
            style={{
              transitionDuration: `${cartOpen ? enterMs : exitMs}ms`,
              transitionTimingFunction: cartOpen ? SHEET_SPRING.easing : SHEET_SPRING.exitEasing,
            }}
          >
            <Cart
              lines={lines}
              onClose={() => setCartOpen(false)}
              onQtyChange={(id, qty) => setLines((l) => setQty(l, id, qty))}
              onRemove={(id) => setLines((l) => removeLine(l, id))}
              onCheckout={() => setCartOpen(false)}
              onQueue={() => { setLines([]); setCartOpen(false); }}
              onAddCustomer={() => {}}
              onClearAll={() => setLines([])}
            />
          </div>
        )}
      </DeviceFrame>

      <DevToolbar items={items} enabled={devFlagEnabled()} />
    </>
  );
}
