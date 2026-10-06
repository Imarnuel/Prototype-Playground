import { useState } from 'react';
import {
  DeviceFrame, DevToolbar, SHEET_SPRING, devFlagEnabled, duration, useReducedMotion,
  type DevToolbarItem,
} from '@playground/shared';
import { SalesPoint } from './screens/SalesPoint';
import { Cart } from './screens/Cart';
import { SelectCustomer } from './screens/SelectCustomer';
import { PRODUCTS } from './data/catalogue';
import { CUSTOMERS, type Customer } from './data/customers';
import { ErrorBoundary } from './components/ErrorBoundary';
import { Toast } from './components/Toast';
import { usePresented } from './hooks/usePresented';
import { addToCart, removeLine, setQty, type CartLine } from './state/cart';
import './App.css';

type Forced = 'loading' | 'error' | 'empty' | undefined;

export function App() {
  const [forced, setForced] = useState<Forced>(undefined);
  const [resetNonce, setResetNonce] = useState(0);
  const [lines, setLines] = useState<readonly CartLine[]>([]);

  const [cartOpen, setCartOpen] = useState(false);
  // One hook owns presentation timing for every surface, so the entrance and exit
  // fixes live in one place rather than being re-derived per sheet.
  const { mounted: cartMounted, entered: cartEntered } = usePresented(cartOpen);

  const [pickerOpen, setPickerOpen] = useState(false);
  const [customers, setCustomers] = useState<readonly Customer[]>(CUSTOMERS);
  const [customer, setCustomer] = useState<Customer | null>(null);
  /* `88:8322` is `88:8243` plus one toast, so the toast is state on the Cart rather
     than a screen of its own. Its copy is the frame's. */
  const [toast, setToast] = useState<string | null>(null);
  const reducedMotion = useReducedMotion();

  const resetScreens = () => {
    setForced(undefined); setCartOpen(false); setPickerOpen(false);
    setCustomer(null); setCustomers(CUSTOMERS); setToast(null);
    setResetNonce((n) => n + 1);
  };

  const items: DevToolbarItem[] = [
    { label: 'Sales point', group: 'Screens', onSelect: resetScreens },
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
      label: 'Select customer',
      group: 'Screens',
      onSelect: () => { setCustomers(CUSTOMERS); setCartOpen(true); setPickerOpen(true); },
    },
    {
      label: 'Select customer: empty',
      group: 'States',
      onSelect: () => { setCustomers([]); setCartOpen(true); setPickerOpen(true); },
    },
    {
      label: 'Customer added',
      group: 'Screens',
      onSelect: () => {
        setCustomers(CUSTOMERS); setCustomer(CUSTOMERS[0]);
        setPickerOpen(false); setCartOpen(true); setToast(null);
      },
    },
    {
      label: 'Customer added: toast',
      group: 'States',
      onSelect: () => {
        setCustomers(CUSTOMERS); setCustomer(CUSTOMERS[0]);
        setPickerOpen(false); setCartOpen(true);
        setToast('Customer has been created');
      },
    },
  ];

  const enterMs = duration(SHEET_SPRING.duration, reducedMotion);
  const exitMs = duration(SHEET_SPRING.exitDuration, reducedMotion);

  return (
    <>
      <DeviceFrame>
        {/* A render failure most likely came from a cart line, so recovering also
            empties the cart rather than re-rendering the line that threw. */}
        <ErrorBoundary onReset={() => { setLines([]); resetScreens(); }}>
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
                onAddCustomer={() => setPickerOpen(true)}
                // "More options" is frame `88:15458`, not built yet.
                onMoreOptions={() => setPickerOpen(true)}
                onClearAll={() => setLines([])}
                customer={customer}
                onRemoveCustomer={() => setCustomer(null)}
              />

              <SelectCustomer
                open={pickerOpen}
                customers={customers}
                onClose={() => setPickerOpen(false)}
                onSelect={(c) => { setCustomer(c); setPickerOpen(false); }}
                // The add-customer FORM is not in this band; the sheet's own two
                // states are. Seeding the list is the honest stand-in so the empty
                // state has somewhere to go. Logged as #47.
                onAddCustomer={() => {
                  setCustomers(CUSTOMERS);
                  /* The frame's copy is "Customer has been created", which only fits
                     this path: the sheet's CTA stands in for the add-customer FORM that
                     band 4 never designs (#47). Selecting an existing customer raises
                     no toast, because nothing was created. */
                  setCustomer(CUSTOMERS[0]);
                  setPickerOpen(false);
                  setToast('Customer has been created');
                }}
              />
              <Toast
                open={toast !== null}
                message={toast ?? ''}
                onDismiss={() => setToast(null)}
              />
            </div>
          )}
        </ErrorBoundary>
      </DeviceFrame>

      {/* Off by default everywhere, per the root agreement. The showcase flag is
          set only for the hosted build, where there is no address bar to append
          `?dev=1` to and the toolbar is the only way to reach the other states. */}
      <DevToolbar items={items} enabled={devFlagEnabled() || import.meta.env.VITE_SHOWCASE === '1'} />
    </>
  );
}
