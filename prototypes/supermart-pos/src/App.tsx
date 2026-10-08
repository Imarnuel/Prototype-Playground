import { useCallback, useState } from 'react';
import {
  DeviceFrame, DevToolbar, SHEET_SPRING, devFlagEnabled, duration, useReducedMotion,
  type DevToolbarItem,
} from '@playground/shared';
import { SalesPoint } from './screens/SalesPoint';
import { Cart } from './screens/Cart';
import { SelectCustomer } from './screens/SelectCustomer';
import { QuantitySheet } from './screens/QuantitySheet';
import { LineDetails } from './screens/LineDetails';
import { MoreOptions, type MoreOption } from './screens/MoreOptions';
import { ApplyDiscount } from './screens/ApplyDiscount';
import { PRODUCTS, maxCount, unitFor, type Discount, type Product } from './data/catalogue';
import { CUSTOMERS, type Customer } from './data/customers';
import { ErrorBoundary } from './components/ErrorBoundary';
import { Toast, type ToastTone } from './components/Toast';
import { usePresented } from './hooks/usePresented';
import { addToCart, commitDetails, commitQuantity, removeLine, setCount, totals, type CartLine } from './state/cart';
import './App.css';

type Forced = 'loading' | 'error' | 'empty' | undefined;

export function App() {
  const [forced, setForced] = useState<Forced>(undefined);
  const [resetNonce, setResetNonce] = useState(0);
  const [lines, setLines] = useState<readonly CartLine[]>([]);
  // On the order, not on any line; see `orderTotals`.
  const [orderDiscount, setOrderDiscount] = useState<Discount | undefined>(undefined);

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
  type ToastAction = { label: string; onPress: () => void };
  const [toast, setToast] = useState<{ open: boolean; message: string; tone: ToastTone; shown: number; action?: ToastAction }>(
    { open: false, message: '', tone: 'success', shown: 0 },
  );
  const showToast = (message: string, tone: ToastTone = 'success', action?: ToastAction) =>
    setToast((t) => ({ open: true, message, tone, shown: t.shown + 1, action }));
  const hideToast = useCallback(() => setToast((t) => ({ ...t, open: false })), []);
  const [totalOpen, setTotalOpen] = useState(false);
  /* The line as it stood when the Quantity sheet opened. Kept after it closes, so the
     sheet's exit renders the same content it entered with; `opening` re-keys the sheet
     so every open starts a fresh draft. */
  const [qty, setQty] = useState<{ line: CartLine; opening: number; editing: boolean } | null>(null);
  const [qtyOpen, setQtyOpen] = useState(false);
  // Same pattern for Item details: a snapshot per opening, kept through the exit.
  const [details, setDetails] = useState<{ line: CartLine; opening: number } | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const openDetails = (line: CartLine) => {
    setDetails((d) => ({ line, opening: (d?.opening ?? 0) + 1 }));
    setDetailsOpen(true);
  };
  const openQuantity = (line: CartLine, editing = false) => {
    setQty((q) => ({ line, opening: (q?.opening ?? 0) + 1, editing }));
    setQtyOpen(true);
  };
  const [menuOpen, setMenuOpen] = useState(false);
  // Same snapshot-per-opening pattern: the sheet opens on the discount as it stands.
  const [discountSheet, setDiscountSheet] = useState<{ current?: Discount; opening: number } | null>(null);
  const [discountOpen, setDiscountOpen] = useState(false);
  const openDiscount = (current: Discount | undefined) => {
    setDiscountSheet((d) => ({ current, opening: (d?.opening ?? 0) + 1 }));
    setDiscountOpen(true);
  };
  /* Asks the Cart to clear itself, so the lines leave through its own exit whichever
     control asked — the title-bar trash or More options. */
  const [clearRequest, setClearRequest] = useState(0);
  const reducedMotion = useReducedMotion();
  const enterMs = duration(SHEET_SPRING.duration, reducedMotion);
  const exitMs = duration(SHEET_SPRING.exitDuration, reducedMotion);

  /* The user's call: clearing is immediate, with a way back (BUILD-PLAN #35). Undo
     restores the lines and the order's discount together. */
  const clearCart = () => {
    if (lines.length === 0 && !orderDiscount) return;
    const before = { lines, orderDiscount };
    setLines([]); setOrderDiscount(undefined);
    showToast('Cart cleared', 'notice', {
      label: 'Undo',
      onPress: () => { setLines(before.lines); setOrderDiscount(before.orderDiscount); hideToast(); },
    });
  };

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

  // Drawn from the catalogue, so the lines, totals and stock ceilings are real.
  const fourLines = () => ['acc-socks', 'tops-tee', 'btm-jeans', 'acc-beanie']
    .map((id) => PRODUCTS.find((p) => p.id === id)!)
    .reduce<readonly CartLine[]>((acc, p) => addToCart(acc, p), []);

  const resetScreens = () => {
    setForced(undefined); setCartOpen(false); setPickerOpen(false);
    setCustomer(null); setCustomers(CUSTOMERS); hideToast(); setTotalOpen(false); setQtyOpen(false); setDetailsOpen(false);
    setMenuOpen(false); setDiscountOpen(false); setOrderDiscount(undefined);
    setResetNonce((n) => n + 1);
  };

  const entries: DevToolbarItem[] = [
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
      onSelect: () => { setLines(fourLines()); setCartOpen(true); },
    },
    {
      label: 'Cart: total expanded',
      group: 'States',
      onSelect: () => {
        // A discounted line, so the breakdown's Discount row is on show too.
        setLines([
          { productId: 'acc-socks', unitId: 'each', count: 1, discount: { kind: 'percent', percent: 15 } },
          { productId: 'tops-tee', unitId: 'each', count: 2 },
        ]);
        setCartOpen(true); setTotalOpen(true);
      },
    },
    ...([
      ['Quantity sheet', 'acc-socks', 10, false],
      ['Quantity sheet: editing', 'acc-socks', 10, true],
      // 2 beanies is 2 each but 12 in packs of 6, past the 3 on the shelf.
      ['Quantity sheet: unit over stock', 'acc-beanie', 2, false],
    ] as const).map(([label, productId, count, editing]): DevToolbarItem => ({
      label,
      group: 'States',
      onSelect: () => {
        // The frame's own state: 10 single units, every pack size available.
        const line: CartLine = { productId, unitId: 'each', count };
        setLines([line, { productId: 'tops-tee', unitId: 'each', count: 2 }]);
        setCartOpen(true);
        openQuantity(line, editing);
      },
    })),
    ...([
      ['Item details', undefined],
      ['Item details: discount applied', { kind: 'percent', percent: 15 }],
    ] as const).map(([label, discount]): DevToolbarItem => ({
      label,
      group: 'States',
      onSelect: () => {
        const line: CartLine = { productId: 'acc-socks', unitId: 'each', count: 1, ...(discount ? { discount } : {}) };
        setLines([line, { productId: 'tops-tee', unitId: 'each', count: 2 }]);
        setCartOpen(true);
        openDetails(line);
      },
    })),
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
    ...([
      ['More options', 'Screens', undefined, 'menu'],
      ['Apply discount', 'Screens', undefined, 'sheet'],
      ['Apply discount: 10%', 'States', { kind: 'percent', percent: 10 }, 'sheet'],
      // The frame's own ₦10.
      ['Apply discount: ₦ amount', 'States', { kind: 'amount', minor: 1_000 }, 'sheet'],
      ['Cart: order discount applied', 'States', { kind: 'percent', percent: 10 }, 'total'],
      ['Clear cart: undo toast', 'States', undefined, 'clear'],
    ] as const).map(([label, group, discount, show]): DevToolbarItem => ({
      label,
      group,
      onSelect: () => {
        setLines(fourLines()); setOrderDiscount(show === 'total' ? discount : undefined);
        setCartOpen(true);
        if (show === 'menu') setMenuOpen(true);
        if (show === 'sheet') openDiscount(discount);
        if (show === 'total') setTotalOpen(true);
        // Through the real path, so the lines leave and the toast offers the undo.
        if (show === 'clear') setTimeout(() => setClearRequest((n) => n + 1), enterMs);
      },
    })),
  ];

  /* Each entry presents one state, whatever was showing before it: a sheet or toast
     left over from the last tap would stand in front of the state asked for. */
  const items = entries.map((entry): DevToolbarItem => ({
    ...entry,
    onSelect: () => {
      setMenuOpen(false); setDiscountOpen(false); setPickerOpen(false); setQtyOpen(false); setDetailsOpen(false);
      setTotalOpen(false); hideToast();
      entry.onSelect();
    },
  }));

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
                orderDiscount={orderDiscount}
                clearRequest={clearRequest}
                onClose={() => setCartOpen(false)}
                onQtyChange={(id, count) => setLines((l) => setCount(l, id, count))}
                onEditQuantity={(id) => openQuantity(lines.find((l) => l.productId === id)!)}
                onOpenDetails={(id) => openDetails(lines.find((l) => l.productId === id)!)}
                onRemove={(id) => setLines((l) => removeLine(l, id))}
                onCheckout={() => setCartOpen(false)}
                onQueue={() => { setLines([]); setOrderDiscount(undefined); setCartOpen(false); }}
                onAddCustomer={() => setPickerOpen(true)}
                onMoreOptions={() => setMenuOpen(true)}
                onClearAll={clearCart}
                customer={customer}
                onRemoveCustomer={() => setCustomer(null)}
                totalOpen={totalOpen}
                onToggleTotal={() => setTotalOpen((o) => !o)}
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

              {qty && (
                <QuantitySheet
                  key={qty.opening}
                  open={qtyOpen}
                  line={qty.line}
                  startEditing={qty.editing}
                  onClose={() => setQtyOpen(false)}
                  onCommit={(unitId, count) => {
                    setLines((l) => commitQuantity(l, qty.line.productId, unitId, count));
                    setQtyOpen(false);
                  }}
                />
              )}

              <MoreOptions
                open={menuOpen}
                onClose={() => setMenuOpen(false)}
                onChoose={(option: MoreOption) => {
                  /* One sheet at a time: the menu leaves first, then the next thing
                     arrives, rather than two sheets crossing on screen. */
                  setMenuOpen(false);
                  const next = {
                    customer: () => setPickerOpen(true),
                    discount: () => openDiscount(orderDiscount),
                    clear: () => setClearRequest((n) => n + 1),
                    // The user's call: Queued orders is designed later.
                    queued: () => showToast('Queued orders is not designed yet', 'notice'),
                  }[option];
                  setTimeout(next, exitMs);
                }}
              />

              {discountSheet && (
                <ApplyDiscount
                  key={discountSheet.opening}
                  open={discountOpen}
                  current={discountSheet.current}
                  baseMinor={(() => { const t = totals(lines); return t.subtotal - t.discount; })()}
                  onClose={() => setDiscountOpen(false)}
                  onCommit={(d) => { setOrderDiscount(d); setDiscountOpen(false); }}
                />
              )}

              {details && (
                <LineDetails
                  key={details.opening}
                  open={detailsOpen}
                  line={details.line}
                  onClose={() => setDetailsOpen(false)}
                  onCommit={(edits) => {
                    setLines((l) => commitDetails(l, details.line.productId, edits));
                    setDetailsOpen(false);
                  }}
                />
              )}
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
            action={toast.action}
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
