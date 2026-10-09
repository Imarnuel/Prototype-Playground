import { useCallback, useEffect, useRef, useState } from 'react';
import {
  DURATION, DeviceFrame, DevToolbar, SHEET_SPRING, devFlagEnabled, duration, failNextRequest, useReducedMotion,
  type DevToolbarItem,
} from '@playground/shared';
import { SalesPoint } from './screens/SalesPoint';
import { Cart } from './screens/Cart';
import { SelectCustomer } from './screens/SelectCustomer';
import { QuantitySheet } from './screens/QuantitySheet';
import { LineDetails } from './screens/LineDetails';
import { MoreOptions, type MoreOption } from './screens/MoreOptions';
import { ApplyDiscount } from './screens/ApplyDiscount';
import { QueuedOrders, type RecallResult } from './screens/QueuedOrders';
import { Checkout, type CheckoutDraft } from './screens/Checkout';
import { SelectBank, SelectPaymentMethod } from './screens/PaymentPickers';
import { Receipt, TransactionSuccess } from './screens/SaleComplete';
import { Scanner } from './screens/Scanner';
import { ScanMatches } from './screens/ScanMatches';
import { METHODS, methodLabel, paysIntoAccount, type AccountMethod } from './data/payments';
import { lookupBarcode, matchScannedText, queueOrder, setQueueForDemo, submitPayment } from './api/pos';
import { SCAN_SEQUENCE, UNKNOWN_BARCODE, UNKNOWN_TAG, barcodeOf, tagOf, type ScanTarget, type TextResult } from './state/scan';
import { receiptText, type Receipt as ReceiptRecord } from './state/sale';
import { PRODUCTS, maxCount, parseWholeNaira, unitFor, type Discount, type Product } from './data/catalogue';
import { CUSTOMERS, type Customer } from './data/customers';
import { ErrorBoundary } from './components/ErrorBoundary';
import { Toast, type ToastAction, type ToastTone, type ToastVariant } from './components/Toast';
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
  const [toast, setToast] = useState<{ open: boolean; message: string; tone: ToastTone; variant?: ToastVariant; shown: number; action?: ToastAction }>(
    { open: false, message: '', tone: 'success', shown: 0 },
  );
  const showToast = (message: string, tone: ToastTone = 'success', action?: ToastAction, variant?: ToastVariant) =>
    setToast((t) => ({ open: true, message, tone, variant, shown: t.shown + 1, action }));
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
  /* Checkout. The draft outlives the sheet: the method and bank pickers replace it on
     screen and hand back to it, as the frames draw them (alone over the Cart). */
  const [checkout, setCheckout] = useState<CheckoutDraft & { opening: number }>(
    { method: 'cash', bankId: 'access', amount: '', opening: 0 },
  );
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [paymentPicker, setPaymentPicker] = useState<'method' | 'bank' | null>(null);
  /* Bank transfer or POS, picked but not yet given an account: Select bank follows at
     once (the designer's call), and the method only lands with the bank. Closing Select
     bank cancels, leaving Checkout as it was. */
  const [pendingMethod, setPendingMethod] = useState<AccountMethod | null>(null);
  const [paying, setPaying] = useState(false);
  /* Queued orders (band `170:8988`). The queue itself lives behind the mock API; the
     App only knows whether its sheet is up, and whether the Cart is being queued. */
  const [queuedOpen, setQueuedOpen] = useState(false);
  const [queuedOpening, setQueuedOpening] = useState(0);
  const openQueued = () => { setQueuedOpen(true); setQueuedOpening((n) => n + 1); };
  const [queueing, setQueueing] = useState(false);
  const [queueForce, setQueueForce] = useState<'loading' | 'error'>();
  // Bumped on New sale: the grid replays its entrance, a fresh start for the next customer.
  const [freshSale, setFreshSale] = useState(0);
  // From Pay: the wait on the confirmation screen, success, then the receipt. `hold`
  // keeps the screen up for a presenter instead of moving on by itself. `closed` keeps
  // the record through the receipt's exit, so it fades rather than cuts; `failed`
  // through the screen's retreat into the Pay button.
  const [sale, setSale] = useState<{
    receipt?: ReceiptRecord; stage: 'processing' | 'success' | 'receipt' | 'closed' | 'failed'; hold: boolean;
    /** Where Transaction success grows from: the Pay button, on the screen. */
    origin?: { x: number; y: number };
  } | null>(null);
  const sequence = useRef(0);
  /* Asks the Cart to clear itself, so the lines leave through its own exit whichever
     control asked — the title-bar trash or More options. */
  const [clearRequest, setClearRequest] = useState(0);
  const reducedMotion = useReducedMotion();
  const enterMs = duration(SHEET_SPRING.duration, reducedMotion);
  const exitMs = duration(SHEET_SPRING.exitDuration, reducedMotion);

  /* Scanning, band `214:26054`. The scanner is the Cart presented DOCKED under a
     camera: the Sales Point's scan button opens it (`88:19293` → `88:19506`), and so
     does the empty Cart's (`88:19449`), which undocks back into the Cart on close.
     Expand grows the docked Cart into the full one (`88:19119`). */
  const [scanning, setScanning] = useState(false);
  const scanFrom = useRef<'salesPoint' | 'cart'>('salesPoint');
  /* Where the Sales Point's scan button is, while the scanner it opened into is up:
     the camera grows from it and shrinks back into it (App.css). Cleared once the
     tray expands into the Cart, which then closes like any Cart. */
  const [scanEntry, setScanEntry] = useState<{ x: number; y: number; reach: number } | null>(null);
  const { mounted: cameraMounted, entered: cameraEntered } = usePresented(scanning);
  /* What is in front of the camera; one item at a time. A ref as well, so a second
     tap while one is being read is refused without waiting for a render. */
  const [inView, setInView] = useState<ScanTarget | null>(null);
  const reading = useRef(false);
  const scanStep = useRef(0);
  const [matchSheet, setMatchSheet] = useState<TextResult | null>(null);
  const [matchesOpen, setMatchesOpen] = useState(false);
  const demoAffordances = devFlagEnabled() || import.meta.env.VITE_SHOWCASE === '1';
  // Async results add against the Cart as it stands when they land, not when asked.
  const linesRef = useRef(lines);
  linesRef.current = lines;

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

  const orderTotal = () => totals(lines, orderDiscount).total;
  /* Queue order, `88:16031` → `88:15953`: the sale is parked, the Cart closes on the
     Sales Point and the pill toast confirms. The Cart empties only once it has gone,
     so it never shows its empty state on the way out. A failure keeps the sale. */
  const queueCurrent = () => {
    setQueueing(true);
    queueOrder({ lines, customer, orderDiscount }).then(() => {
      setCartOpen(false);
      showToast('Order has been queued', 'success', undefined, 'pill');
      window.setTimeout(() => {
        setLines([]); setOrderDiscount(undefined); setCustomer(null); setQueueing(false);
      }, exitMs);
    }).catch(() => {
      setQueueing(false);
      showToast('Couldn’t queue the order. Try again.', 'notice');
    });
  };
  /* Recall, `88:16427` → `88:16115`: the order comes back into the Cart underneath. */
  const recalled = ({ recalled: order, parked }: RecallResult) => {
    setLines(order.lines); setCustomer(order.customer); setOrderDiscount(order.orderDiscount);
    setQueuedOpen(false);
    setCartOpen(true);
    if (parked) showToast('Your previous order was queued', 'success', undefined, 'pill');
  };
  const openCheckout = (draft?: Partial<CheckoutDraft>) => {
    setCheckout((c) => ({
      method: 'cash', bankId: 'access', amount: String(orderTotal() / 100), ...draft, opening: c.opening + 1,
    }));
    setPaymentPicker(null); setPendingMethod(null);
    setPaying(false);
    setCheckoutOpen(true);
  };
  /* One sheet hands over to the next — Checkout to a picker and back, More options to
     what it opens — as one motion over a backdrop that holds still (BottomSheet
     `handoff`). The flag outlives the outgoing sheet's exit, then clears so a plain
     close of the sheet left behind dims the screen back as usual. */
  const [handoff, setHandoff] = useState(false);
  const handoffTimer = useRef<number>();
  const swapSheets = (closeNow: () => void, openNext: () => void) => {
    setHandoff(true);
    closeNow();
    openNext();
    window.clearTimeout(handoffTimer.current);
    handoffTimer.current = window.setTimeout(() => setHandoff(false), exitMs + 50);
  };
  /* After Pay (none of it designed; the frames are stills). The designer's call: the
     confirmation screen takes over at once, from the Pay button, and the wait happens
     there — its loader becomes the success mark. Checkout and the Cart stay under it
     until the payment lands, so a failure can draw the screen back into the button
     and leave the draft exactly where it was. The loader is held for at least `slow`
     — the reveal and a beat of spin — so a fast answer still reads as a wait that
     resolved; no longer (the designer: "the loading is too long"). */
  const pay = () => {
    setPaying(true);
    const button = document.querySelector('.payButton')?.getBoundingClientRect();
    const screen = document.querySelector('.device__screen')?.getBoundingClientRect();
    const origin = button && screen
      ? { x: button.left - screen.left + button.width / 2, y: button.top - screen.top + button.height / 2 }
      : undefined;
    setSale({ stage: 'processing', hold: false, origin });
    const started = performance.now();
    const settle = (then: () => void) => window.setTimeout(then,
      Math.max(0, duration(DURATION.slow, reducedMotion) - (performance.now() - started)));
    const tenderedMinor = parseWholeNaira(checkout.amount)!;
    submitPayment({
      lines, orderDiscount, customer, at: new Date(), sequence: sequence.current + 1,
      tender: checkout.method === 'cash'
        ? { method: 'cash', tenderedMinor }
        : { method: checkout.method, bankId: checkout.bankId, tenderedMinor },
    }).then((receipt) => {
      sequence.current += 1;
      settle(() => {
        setSale((s) => (s ? { ...s, receipt, stage: 'success' } : s));
        setCheckoutOpen(false); setCartOpen(false);
      });
    }).catch(() => settle(() => {
      setSale((s) => (s ? { ...s, stage: 'failed' } : s));
      setPaying(false);
      // Not designed: the payment did not go through, and the draft is kept.
      showToast('Payment failed. Try again.', 'notice');
    }));
  };
  // The success screen gives way to the receipt on its own, unless held.
  useEffect(() => {
    if (!sale || sale.stage !== 'success' || sale.hold) return undefined;
    // A beat, not a wait (the designer: "too long"): the moment settles ~0.5s after
    // mount, and this leaves it on screen long enough to read.
    const t = setTimeout(() => setSale((s) => (s ? { ...s, stage: 'receipt' } : s)), 1200);
    return () => clearTimeout(t);
  }, [sale]);
  /* New sale and the receipt's close both end the sale: the order is paid, so there
     is nothing to go back to. The Sales Point is underneath, ready. */
  const newSale = () => {
    setLines([]); setOrderDiscount(undefined); setCustomer(null);
    setCartOpen(false); setTotalOpen(false); setCheckoutOpen(false); setPaymentPicker(null); setPendingMethod(null);
    setSale((s) => (s ? { ...s, stage: 'closed' } : s));
    setPaying(false);
    setFreshSale((n) => n + 1);
  };
  const shareReceipt = async (receipt: ReceiptRecord) => {
    const text = receiptText(receipt);
    try {
      if (navigator.share) { await navigator.share({ title: `Receipt ${receipt.number}`, text }); return; }
      await navigator.clipboard.writeText(text);
      showToast('Receipt copied');
    } catch (e) {
      // Closing the share sheet is a choice, not a failure.
      if ((e as Error).name !== 'AbortError') showToast('Could not share the receipt', 'notice');
    }
  };

  /* A tap the shelf can't supply returns the same lines from `addToCart`. Saying why
     beats a tap that silently does nothing. The copy is not from the design, which
     draws no stock-limit message. */
  /** Adds one, or says why not. One rule for a tap on the grid and a scan alike. */
  const tryAdd = (product: Product): string | null => {
    const current = linesRef.current;
    const next = addToCart(current, product);
    if (next !== current) { linesRef.current = next; setLines(next); return null; }
    const line = current.find((l) => l.productId === product.id);
    if (!line) return 'Out of stock';
    // In the line's own unit, written the way the stepper writes it: "18 pck".
    return `Only ${maxCount(product, line.unitId)} ${unitFor(product, line.unitId).abbrev} left`;
  };
  const addProduct = (product: Product) => {
    const refusal = tryAdd(product);
    if (refusal) showToast(refusal, 'notice');
  };

  const openScanner = (from: 'salesPoint' | 'cart') => {
    scanFrom.current = from;
    const button = from === 'salesPoint' ? document.querySelector('.salesPoint__scan')?.getBoundingClientRect() : undefined;
    const screen = document.querySelector('.device__screen')?.getBoundingClientRect();
    if (button && screen) {
      const x = button.left - screen.left + button.width / 2, y = button.top - screen.top + button.height / 2;
      const reach = Math.ceil(Math.max(Math.hypot(x, y), Math.hypot(screen.width - x, y), Math.hypot(x, screen.height - y), Math.hypot(screen.width - x, screen.height - y)));
      setScanEntry({ x, y, reach });
    } else setScanEntry(null);
    setTotalOpen(false);
    setScanning(true);
    setCartOpen(true);
  };
  /* The scanner's X: back to whatever opened it. From the Sales Point the whole
     presentation goes down; from the Cart, the Cart grows back over the camera. */
  /* Closing into the scan button, the camera's black stays at the top of the screen
     for the first part of the collapse: the status bar stays white until it leaves. */
  const [holdLight, setHoldLight] = useState(false);
  const closeScanner = () => {
    if (scanFrom.current === 'cart') { setScanning(false); return; }
    if (scanEntry) {
      setHoldLight(true);
      window.setTimeout(() => setHoldLight(false), duration(DURATION.fast, reducedMotion));
    }
    setCartOpen(false);
  };
  /* However the Cart goes — the scanner's X, Queue order, a payment — the scanner goes
     with it, once the exit has run: the next View cart opens the Cart, not a camera. */
  useEffect(() => {
    if (cartOpen) return undefined;
    const t = window.setTimeout(() => { setScanning(false); setScanEntry(null); setInView(null); reading.current = false; }, exitMs);
    return () => window.clearTimeout(t);
  }, [cartOpen, exitMs]);
  /* The item leaves the lens a beat after its result, so the toast and the item it
     names are on screen together (`88:19938`), then the camera is dark again (`88:19584`). */
  const releaseItem = () => {
    window.setTimeout(() => { setInView(null); reading.current = false; }, duration(DURATION.slow, reducedMotion));
  };
  const addScanned = (product: Product) => {
    const refusal = tryAdd(product);
    showToast(refusal ?? `${product.name} added to cart`, refusal ? 'notice' : 'success', undefined, 'banner');
    releaseItem();
  };
  /* Not designed: a read that matches nothing, and a lookup that fails. Both say so
     in the scanner's banner and let the next scan go ahead. */
  const scanRefused = (message: string) => { showToast(message, 'notice', undefined, 'banner'); releaseItem(); };
  /* Holds an item up to the camera. It comes into view, is read for at least `slow`
     (a read that lands sooner still reads as a read), then is looked up. */
  const holdUp = (target?: ScanTarget) => {
    if (reading.current) return;
    reading.current = true;
    const item = target ?? SCAN_SEQUENCE[scanStep.current++ % SCAN_SEQUENCE.length];
    setInView(item);
    const started = performance.now();
    const settle = <T,>(then: (v: T) => void) => (v: T) => window.setTimeout(() => then(v),
      Math.max(0, duration(DURATION.slow, reducedMotion) - (performance.now() - started)));
    const failed = settle(() => scanRefused('Couldn’t read that. Try again.'));
    if (item.kind === 'barcode') {
      lookupBarcode(item.code).then(settle((product: Product | null) => (product
        ? addScanned(product)
        : scanRefused(`No product has the barcode ${item.code}`)))).catch(failed);
      return;
    }
    matchScannedText(item.lines).then(settle((result: TextResult) => {
      if (result.matches.length === 0) { scanRefused(`No product matches “${result.detected}”`); return; }
      if (result.matches.length === 1) { addScanned(result.matches[0].product); return; }
      setMatchSheet(result); setMatchesOpen(true);
    })).catch(failed);
  };
  // Closing "Which product?" without a pick puts the item down: back to scanning.
  const closeMatches = () => { setMatchesOpen(false); setInView(null); reading.current = false; };

  const byId = (id: string) => PRODUCTS.find((p) => p.id === id)!;
  // Drawn from the catalogue, so the lines, totals and stock ceilings are real.
  const fourLines = () => ['acc-socks', 'tops-tee', 'btm-jeans', 'acc-beanie']
    .map((id) => PRODUCTS.find((p) => p.id === id)!)
    .reduce<readonly CartLine[]>((acc, p) => addToCart(acc, p), []);

  const resetScreens = () => {
    setForced(undefined); setCartOpen(false); setPickerOpen(false);
    setCustomer(null); setCustomers(CUSTOMERS); hideToast(); setTotalOpen(false); setQtyOpen(false); setDetailsOpen(false);
    setMenuOpen(false); setDiscountOpen(false); setOrderDiscount(undefined);
    setCheckoutOpen(false); setPaymentPicker(null); setPendingMethod(null); setSale(null);
    setQueuedOpen(false); setQueueForce(undefined); setQueueForDemo('seeded');
    setScanning(false); setInView(null); reading.current = false; setMatchesOpen(false);
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
    ...([
      ['Checkout: cash', 'Screens', {}],
      ['Checkout: cash with change', 'States', { amount: 'change' }],
      ['Checkout: Pay disabled', 'States', { amount: '' }],
      ['Checkout: bank transfer', 'States', { method: 'bank' }],
      ['Checkout: POS', 'States', { method: 'pos' }],
    ] as const).map(([label, group, draft]): DevToolbarItem => ({
      label, group,
      onSelect: () => {
        setLines(fourLines()); setOrderDiscount(undefined); setCartOpen(true);
        const total = totals(fourLines()).total / 100;
        const amount = 'amount' in draft ? (draft.amount === 'change' ? String(Math.ceil(total / 5000) * 5000) : '') : String(total);
        openCheckout({ ...('method' in draft ? { method: draft.method } : {}), amount });
      },
    })),
    /* Scanning, band `214:26054`. Every scan runs the real path: the item is held up,
       read through the mock API, and added by the same rule as a tap on the grid. The
       hold-up waits for the presentation to arrive, so the read is seen. */
    ...([
      ['Scanner', 'Screens', [], undefined],
      ['Scanner: with items', 'States', 'four', undefined],
      ['Scanner: scan a barcode', 'States', [], () => barcodeOf(byId('acc-socks'))],
      ['Scanner: scan a product name', 'States', [], () => tagOf(byId('tops-oxford'))],
      // Every brand sells three or more, so a brand tag never matches once; a label
      // with the name alone does.
      ['Scanner: name with one match', 'States', [], (): ScanTarget => ({ kind: 'text', lines: ['Canvas Tote'], productId: 'bag-tote' })],
      ['Scanner: unknown barcode', 'States', [], () => UNKNOWN_BARCODE],
      ['Scanner: name matches nothing', 'States', [], () => UNKNOWN_TAG],
      ['Scanner: past the stock', 'States', 'beanies', () => barcodeOf(byId('acc-beanie'))],
      ['Scanner: read fails', 'States', [], () => { failNextRequest(); return barcodeOf(byId('acc-socks')); }],
    ] as const).map(([label, group, fill, scan]): DevToolbarItem => ({
      label, group,
      onSelect: () => {
        setLines(fill === 'four' ? fourLines() : fill === 'beanies' ? [{ productId: 'acc-beanie', unitId: 'each', count: 3 }] : []);
        setOrderDiscount(undefined); setCustomer(null);
        openScanner('salesPoint');
        if (scan) window.setTimeout(() => holdUp(scan()), enterMs);
      },
    })),
    /* Queueing & recalling an order, band `170:8988`. Each opens the sheet over the
       Cart, as More options would; the queue is reseeded unless the entry says empty. */
    ...([
      ['Queued orders', 'Screens', 'seeded', undefined],
      ['Queued orders: empty', 'States', 'empty', undefined],
      ['Queued orders: loading', 'States', 'seeded', 'loading'],
    ] as const).map(([label, group, queue, force]): DevToolbarItem => ({
      label, group,
      onSelect: () => {
        setQueueForDemo(queue); setQueueForce(force);
        setCartOpen(true); setMenuOpen(false); openQueued();
      },
    })),
    {
      label: 'Queued orders: load fails',
      group: 'States',
      // The real path: the next request is the sheet's own fetch. Try again recovers.
      onSelect: () => {
        setQueueForDemo('seeded'); setQueueForce(undefined); failNextRequest();
        setCartOpen(true); setMenuOpen(false); openQueued();
      },
    },
    {
      label: 'More options: empty cart',
      group: 'States',
      onSelect: () => { setLines([]); setOrderDiscount(undefined); setCartOpen(true); setMenuOpen(true); },
    },
    {
      label: 'Queue order: fails',
      group: 'States',
      // A full Cart, the mock API armed: the next Queue order keeps the sale.
      onSelect: () => { setLines(fourLines()); setCartOpen(true); failNextRequest(); },
    },
    {
      label: 'Order has been queued: toast',
      group: 'States',
      // As `88:15953` draws it: the sale has gone, so the Sales Point has no cart bar.
      onSelect: () => {
        setLines([]); setOrderDiscount(undefined); setCustomer(null); setCartOpen(false);
        showToast('Order has been queued', 'success', undefined, 'pill');
      },
    },
    {
      label: 'Checkout: payment fails',
      group: 'States',
      // Arms the mock API, then opens a payable checkout: the next Pay fails.
      onSelect: () => { setLines(fourLines()); setCartOpen(true); failNextRequest(); openCheckout({ amount: String(totals(fourLines()).total / 100) }); },
    },
    ...([['Select payment method', 'method'], ['Select bank', 'bank']] as const).map(([label, which]): DevToolbarItem => ({
      label, group: 'Screens',
      onSelect: () => {
        setLines(fourLines()); setCartOpen(true);
        setCheckout((c) => ({ ...c, method: which === 'bank' ? 'bank' : 'cash', amount: String(totals(fourLines()).total / 100) }));
        setPaymentPicker(which);
      },
    })),
    {
      label: 'Processing payment',
      group: 'States',
      // The confirmation screen's wait, held: the payment never lands.
      onSelect: () => { setLines(fourLines()); setCartOpen(false); setSale({ stage: 'processing', hold: true }); },
    },
    ...([
      ['Transaction success', 'success', 'cash'],
      ['Receipt: cash', 'receipt', 'cash'],
      ['Receipt: bank transfer', 'receipt', 'bank'],
      ['Receipt: POS', 'receipt', 'pos'],
    ] as const).map(([label, stage, method]): DevToolbarItem => ({
      label, group: 'Screens',
      onSelect: async () => {
        // Through the real payment path, with no wait, so the receipt is the app's own.
        const fill = fourLines();
        setLines(fill); setCustomer(CUSTOMERS[0]); setCartOpen(true);
        const total = totals(fill).total;
        const receipt = await submitPayment({
          lines: fill, customer: CUSTOMERS[0], at: new Date(), sequence: sequence.current + 1,
          tender: method === 'cash' ? { method, tenderedMinor: Math.ceil(total / 500_000) * 500_000 } : { method, bankId: 'access', tenderedMinor: total },
        });
        sequence.current += 1;
        setSale({ receipt, stage, hold: stage === 'success' });
      },
    })),
  ];

  /* Each entry presents one state, whatever was showing before it: a sheet or toast
     left over from the last tap would stand in front of the state asked for. */
  const items = entries.map((entry): DevToolbarItem => ({
    ...entry,
    onSelect: () => {
      setMenuOpen(false); setDiscountOpen(false); setPickerOpen(false); setQtyOpen(false); setDetailsOpen(false);
      setTotalOpen(false); hideToast(); setCheckoutOpen(false); setPaymentPicker(null); setPendingMethod(null); setSale(null);
      setQueuedOpen(false); setMatchesOpen(false); setInView(null); reading.current = false; setScanning(false);
      entry.onSelect();
    },
  }));

  return (
    <>
      {/* White over the camera, as the scanner frames draw it (`88:19507`). */}
      <DeviceFrame statusBar={(scanning && cartOpen) || holdLight ? 'light' : 'dark'}>
        {/* A render failure most likely came from a cart line, so recovering also
            empties the cart rather than re-rendering the line that threw. */}
        <ErrorBoundary onReset={() => { setLines([]); resetScreens(); }}>
          <SalesPoint
            key={resetNonce}
            forceState={forced}
            cartCount={lines.length}
            freshSale={freshSale}
            onAddProduct={addProduct}
            onViewCart={() => setCartOpen(true)}
            onScan={() => openScanner('salesPoint')}
          />

          {cartMounted && (
            <div
              className="sheet"
              data-open={cartEntered ? 'on' : 'off'}
              data-entry={scanEntry ? 'button' : undefined}
              style={{
                transitionDuration: `${cartOpen ? enterMs : exitMs}ms`,
                transitionTimingFunction: cartOpen ? SHEET_SPRING.easing : SHEET_SPRING.exitEasing,
                ...(scanEntry ? { '--fx': `${scanEntry.x}px`, '--fy': `${scanEntry.y}px`, '--reach': `${scanEntry.reach}px` } : {}),
              } as React.CSSProperties}
            >
              {cameraMounted && (
                <div className="scanStage" data-open={cameraEntered ? 'on' : 'off'}>
                  <Scanner target={inView} onClose={closeScanner} onHoldUp={() => holdUp()} hint={demoAffordances} />
                </div>
              )}

              <Cart
                mode={scanning ? 'docked' : 'full'}
                onExpand={() => { setScanEntry(null); setScanning(false); }}
                onScan={() => openScanner('cart')}
                lines={lines}
                orderDiscount={orderDiscount}
                clearRequest={clearRequest}
                onClose={() => setCartOpen(false)}
                onQtyChange={(id, count) => setLines((l) => setCount(l, id, count))}
                onEditQuantity={(id) => openQuantity(lines.find((l) => l.productId === id)!)}
                onOpenDetails={(id) => openDetails(lines.find((l) => l.productId === id)!)}
                onRemove={(id) => setLines((l) => removeLine(l, id))}
                onCheckout={() => openCheckout()}
                onQueue={queueCurrent}
                queueing={queueing}
                onAddCustomer={() => setPickerOpen(true)}
                onMoreOptions={() => setMenuOpen(true)}
                onClearAll={clearCart}
                customer={customer}
                onRemoveCustomer={() => setCustomer(null)}
                totalOpen={totalOpen}
                onToggleTotal={() => setTotalOpen((o) => !o)}
              />

              <ScanMatches
                open={matchesOpen}
                result={matchSheet}
                onClose={closeMatches}
                onChoose={(product) => { setMatchesOpen(false); addScanned(product); }}
              />

              <SelectCustomer
                handoff={handoff}
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
                handoff={handoff}
                open={menuOpen}
                cartEmpty={lines.length === 0}
                onClose={() => setMenuOpen(false)}
                onChoose={(option: MoreOption) => {
                  // A row that opens another sheet hands over to it; the others just close.
                  if (option === 'customer') { swapSheets(() => setMenuOpen(false), () => setPickerOpen(true)); return; }
                  if (option === 'discount') { swapSheets(() => setMenuOpen(false), () => openDiscount(orderDiscount)); return; }
                  if (option === 'queued') { swapSheets(() => setMenuOpen(false), openQueued); return; }
                  setMenuOpen(false);
                  setClearRequest((n) => n + 1);
                }}
              />

              <QueuedOrders
                handoff={handoff}
                open={queuedOpen}
                opening={queuedOpening}
                onClose={() => setQueuedOpen(false)}
                current={lines.length > 0 ? { lines, customer, orderDiscount } : undefined}
                onRecalled={recalled}
                onToast={showToast}
                forceState={queueForce}
              />

              {discountSheet && (
                <ApplyDiscount
                  handoff={handoff}
                  key={discountSheet.opening}
                  open={discountOpen}
                  current={discountSheet.current}
                  baseMinor={(() => { const t = totals(lines); return t.subtotal - t.discount; })()}
                  onClose={() => setDiscountOpen(false)}
                  onCommit={(d) => { setOrderDiscount(d); setDiscountOpen(false); }}
                />
              )}

              <Checkout
                handoff={handoff}
                key={`checkout-${checkout.opening}`}
                open={checkoutOpen}
                totals={totals(lines, orderDiscount)}
                draft={checkout}
                onAmountChange={(amount) => setCheckout((c) => ({ ...c, amount }))}
                onPickMethod={() => swapSheets(() => setCheckoutOpen(false), () => setPaymentPicker('method'))}
                onPickBank={() => swapSheets(() => setCheckoutOpen(false), () => setPaymentPicker('bank'))}
                onClose={() => setCheckoutOpen(false)}
                onPay={pay}
                paying={paying}
              />

              <SelectPaymentMethod
                handoff={handoff}
                open={paymentPicker === 'method'}
                current={checkout.method}
                onClose={() => swapSheets(() => setPaymentPicker(null), () => setCheckoutOpen(true))}
                onChoose={(id) => {
                  const m = METHODS.find((x) => x.id === id)!;
                  // The designer's call: the three undesigned methods say so and change nothing.
                  if (!m.designed) { showToast(`${methodLabel(id)} is not designed yet`, 'notice'); return; }
                  // A method that pays into an account needs the account next: straight to Select bank.
                  if (paysIntoAccount(id)) {
                    setPendingMethod(id);
                    swapSheets(() => setPaymentPicker(null), () => setPaymentPicker('bank'));
                    return;
                  }
                  setCheckout((c) => ({ ...c, method: id as CheckoutDraft['method'] }));
                  swapSheets(() => setPaymentPicker(null), () => setCheckoutOpen(true));
                }}
              />

              <SelectBank
                handoff={handoff}
                key={`bank-${checkout.opening}`}
                open={paymentPicker === 'bank'}
                current={checkout.bankId}
                onClose={() => { setPendingMethod(null); swapSheets(() => setPaymentPicker(null), () => setCheckoutOpen(true)); }}
                onChoose={(bankId) => {
                  setCheckout((c) => ({ ...c, method: pendingMethod ?? c.method, bankId }));
                  setPendingMethod(null);
                  swapSheets(() => setPaymentPicker(null), () => setCheckoutOpen(true));
                }}
              />

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

          {sale && (
            <>
              <TransactionSuccess
                open={sale.stage === 'processing' || sale.stage === 'success'}
                status={sale.stage === 'processing' ? 'processing' : 'success'}
                retract={sale.stage === 'failed'}
                origin={sale.origin}
                onContinue={() => setSale((s) => (s ? { ...s, stage: 'receipt' } : s))}
              />
              {sale.receipt && <Receipt
                open={sale.stage === 'receipt'}
                receipt={sale.receipt}
                onNewSale={newSale}
                onShare={() => shareReceipt(sale.receipt!)}
                onPrint={() => window.print()}
              />}
            </>
          )}

          {/* Outside the Cart sheet, so it can confirm or refuse something on any
              screen — a product tapped on the Sales Point grid included. Last in the
              DOM so it paints above whatever is presented. */}
          <Toast
            open={toast.open}
            message={toast.message}
            tone={toast.tone}
            variant={toast.variant}
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
