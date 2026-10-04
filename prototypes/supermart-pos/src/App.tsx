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

  // Three states, not two, because a CSS transition needs a rendered starting frame.
  //   cartOpen    — intent
  //   cartMounted — in the tree, so the EXIT has something to animate
  //   cartEntered — drives data-open, flipped one frame AFTER mount so the ENTRY has
  //                 something to animate from
  // Mounting straight into the open state skips the transition entirely: measured
  // translateY 0.0 at every frame, an instant cut (root agreement §5).
  const [cartOpen, setCartOpen] = useState(false);
  const [cartMounted, setCartMounted] = useState(false);
  const [cartEntered, setCartEntered] = useState(false);
  const reducedMotion = useReducedMotion();
  const exitTimer = useRef<number>();
  const enterFrame = useRef<number>();

  useEffect(() => {
    if (cartOpen) {
      setCartMounted(true);
      // Two frames: the first commits the closed state to the compositor, the second
      // flips it. One is not reliably enough — React can batch the mount and the flip
      // into the same paint, which is the instant cut all over again.
      enterFrame.current = requestAnimationFrame(() => {
        enterFrame.current = requestAnimationFrame(() => setCartEntered(true));
      });
      return () => cancelAnimationFrame(enterFrame.current!);
    }
    setCartEntered(false);
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
            data-open={cartEntered ? 'on' : 'off'}
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
