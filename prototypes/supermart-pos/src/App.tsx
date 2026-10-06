import { useCallback, useState } from 'react';
import {
  DeviceFrame, DevToolbar, SHEET_SPRING, devFlagEnabled, duration, useReducedMotion,
  type DevToolbarItem,
} from '@playground/shared';
import { SalesPoint } from './screens/SalesPoint';
import { Cart } from './screens/Cart';
import { SelectCustomer } from './screens/SelectCustomer';
import { PRODUCTS, maxCount, unitFor, type Product } from './data/catalogue';
import { CUSTOMERS, type Customer } from './data/customers';
import { ErrorBoundary } from './components/ErrorBoundary';
import { Toast, type ToastTone } from './components/Toast';
import { usePresented } from './hooks/usePresented';
import { addToCart, removeLine, setCount, type CartLine } from './state/cart';
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
  /* The message outlives `open` on purpose: the exit fades the toast out, and clearing
     the text with it would fade an empty box. */
  const [toast, setToast] = useState<{ open: boolean; message: string; tone: ToastTone; shown: number }>(
    { open: false, message: '', tone: 'success', shown: 0 },
  );
  const showToast = (message: string, tone: ToastTone = 'success') =>
    setToast((t) => ({ open: true, message, tone, shown: t.shown + 1 }));
  const hideToast = useCallback(() => setToast((t) => ({ ...t, open: false })), []);
  const reducedMotion = useReducedMotion();

  /* A tap the shelf can't supply returns the same lines from `addToCart`. Saying why
     beats a tap that silently does nothing. The copy is not from the design, which
     draws no stock-limit message. */
  const addProduct = (product: Product) => {
    const next = addToCart(lines, product);
    if (next !== lines) { setLines(next); return; }
    const line = lines.find((l) => l.productId === product.id);
    if (!line) { showToast('Out of stock', 'notice'); return; }
    // In the line's own unit, written the way the stepper writes it: "18 pck".
    showToast(`Only ${maxCount(product, line.unitId)} ${unitFor(product, line.unitId).abbrev} left`, 'notice');
  };

  const resetScreens = () => {
    setForced(undefined); setCartOpen(false); setPickerOpen(false);
    setCustomer(null); setCustomers(CUSTOMERS); hideToast();
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
      // Through the real path, so it proves the clamp rather than forcing a toast.
      label: 'Sales point: out-of-stock tap',
      group: 'States',
      onSelect: () => { resetScreens(); addProduct(PRODUCTS.find((p) => p.stock === 0)!); },
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
        setPickerOpen(false); setCartOpen(true); hideToast();
      },
    },
    {
      label: 'Customer added: toast',
      group: 'States',
      onSelect: () => {
        setCustomers(CUSTOMERS); setCustomer(CUSTOMERS[0]);
        setPickerOpen(false); setCartOpen(true);
        showToast('Customer has been created');
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
            onAddProduct={addProduct}
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
                onQtyChange={(id, count) => setLines((l) => setCount(l, id, count))}
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
                  showToast('Customer has been created');
                }}
              />
            </div>
          )}

          {/* Outside the Cart sheet, so it can confirm or refuse something on any
              screen — a product tapped on the Sales Point grid included. Last in the
              DOM so it paints above whatever is presented. */}
          <Toast
            open={toast.open}
            message={toast.message}
            tone={toast.tone}
            shown={toast.shown}
            onDismiss={hideToast}
          />
        </ErrorBoundary>
      </DeviceFrame>

      {/* Off by default everywhere, per the root agreement. The showcase flag is
          set only for the hosted build, where there is no address bar to append
          `?dev=1` to and the toolbar is the only way to reach the other states. */}
      <DevToolbar items={items} enabled={devFlagEnabled() || import.meta.env.VITE_SHOWCASE === '1'} />
    </>
  );
}
