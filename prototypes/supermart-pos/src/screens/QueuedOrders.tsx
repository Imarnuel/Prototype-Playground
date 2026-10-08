import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { DURATION, duration, useReducedMotion } from '@playground/shared';
import { deleteQueued, fetchQueue, recallQueued, restoreQueued, type NewQueuedOrder } from '../api/pos';
import { BottomSheet } from '../components/BottomSheet';
import { EmptyState } from '../components/EmptyState';
import { Icon } from '../components/Icon';
import { ListMessage } from '../components/ListMessage';
import { formatPrice } from '../data/catalogue';
import { usePresented } from '../hooks/usePresented';
import { formatQueuedAt, queuedItemNames, queuedTotal, type QueuedOrder } from '../state/queue';
import type { ToastAction, ToastTone } from '../components/Toast';
import './QueuedOrders.css';

type Load =
  | { status: 'loading' }
  | { status: 'error' }
  | { status: 'ready'; orders: readonly QueuedOrder[] };

export type RecallResult = { recalled: QueuedOrder; parked?: QueuedOrder };

/**
 * Queued orders — band `170:8988`: empty `88:16251`, the list with a row's menu open
 * `88:16280`, and an order chosen `88:16427`. Reached from More options.
 *
 * Deviations, each logged in BUILD-PLAN:
 * - The frames draw this sheet full-bleed (x 0, 393 wide) where every other sheet sits
 *   inset; it is inset like the rest, so its cards are 345 wide, not 361.
 * - The five drawn orders share one set of items, one total and one minute; the list
 *   is the store's real queue instead (`state/queue.ts`).
 * - The card's receipt number (`#S1324…`) is a hidden layer in every card. Not built:
 *   a queued order has not been paid, so it has no receipt yet.
 * - Loading and failure are undesigned: skeleton cards, and the Sales Point's message.
 */
export function QueuedOrders({
  open, opening = 0, onClose, current, onRecalled, onToast, forceState, handoff = false,
}: {
  open: boolean;
  /** Bumped on every request to show the sheet, so asking again while it is up reloads. */
  opening?: number;
  onClose: () => void;
  /** The sale in the Cart, if any: recalling over it queues it first. */
  current?: NewQueuedOrder;
  onRecalled: (result: RecallResult) => void;
  onToast: (message: string, tone: ToastTone, action?: ToastAction) => void;
  /** Dev toolbar: hold the list in a state without waiting on the mock API. */
  forceState?: 'loading' | 'error';
  handoff?: boolean;
}) {
  const reducedMotion = useReducedMotion();
  const [load, setLoad] = useState<Load>({ status: 'loading' });
  const [chosen, setChosen] = useState<string | null>(null);
  const [menuFor, setMenuFor] = useState<string | null>(null);
  const [leaving, setLeaving] = useState<string | null>(null);
  const [recalling, setRecalling] = useState(false);
  const generation = useRef(0);

  const run = () => {
    const mine = ++generation.current;
    setLoad({ status: 'loading' });
    fetchQueue()
      .then((orders) => { if (mine === generation.current) setLoad({ status: 'ready', orders }); })
      .catch(() => { if (mine === generation.current) setLoad({ status: 'error' }); });
  };

  // Every opening reads the queue afresh: another till may have changed it.
  useEffect(() => {
    if (!open) return;
    setChosen(null); setMenuFor(null); setRecalling(false);
    run();
  }, [open, opening]); // eslint-disable-line react-hooks/exhaustive-deps

  const shown: Load = forceState === 'loading' ? { status: 'loading' }
    : forceState === 'error' ? { status: 'error' } : load;
  const orders = shown.status === 'ready' ? shown.orders : [];
  const setOrders = (f: (o: readonly QueuedOrder[]) => readonly QueuedOrder[]) =>
    setLoad((l) => (l.status === 'ready' ? { status: 'ready', orders: f(l.orders) } : l));

  /* The designer's call: delete at once, with Undo — the same pattern as Clear cart.
     The card collapses first, then leaves the list; a failed delete puts it back. */
  const remove = (order: QueuedOrder) => {
    setMenuFor(null);
    if (chosen === order.id) setChosen(null);
    setLeaving(order.id);
    window.setTimeout(() => {
      setLeaving(null);
      setOrders((o) => o.filter((x) => x.id !== order.id));
    }, duration(DURATION.base, reducedMotion));
    deleteQueued(order.id).then(() => {
      onToast('Queued order deleted', 'notice', {
        label: 'Undo',
        onPress: () => {
          restoreQueued(order).then(() => {
            setOrders((o) => [...o.filter((x) => x.id !== order.id), order]
              .sort((a, b) => b.queuedAt.getTime() - a.queuedAt.getTime()));
          }).catch(() => onToast('Couldn’t restore the order. Try again.', 'notice'));
        },
      });
    }).catch(() => {
      run();
      onToast('Couldn’t delete the order. Try again.', 'notice');
    });
  };

  const recall = () => {
    if (!chosen) return;
    setRecalling(true);
    recallQueued(chosen, current)
      .then(onRecalled)
      .catch(() => { setRecalling(false); onToast('Couldn’t recall the order. Try again.', 'notice'); });
  };

  const hasList = shown.status === 'ready' && orders.length > 0;

  return (
    <BottomSheet
      handoff={handoff}
      open={open}
      title="Queued orders"
      onClose={onClose}
      closeLabel="Close queued orders"
      className={`queuedOrders${hasList ? ' queuedOrders--list' : ''}`}
      footer={hasList ? (
        <button type="button" className="recallButton" data-busy={recalling ? 'on' : 'off'}
          disabled={!chosen || recalling} aria-busy={recalling} onClick={recall}>
          <span className="recallButton__label" aria-hidden={recalling}>Recall order</span>
          <span className="buttonSpinner recallButton__spinner" aria-hidden="true" />
          {recalling && <span className="visuallyHidden">Recalling…</span>}
        </button>
      ) : undefined}
    >
      {shown.status === 'loading' && (
        <div className="queueList" aria-busy="true" aria-label="Loading queued orders">
          {[0, 1, 2].map((i) => <div key={i} className="queueCardSkeleton" />)}
        </div>
      )}

      {shown.status === 'error' && (
        <ListMessage title="Couldn’t load queued orders" body="Check the connection and try again." onRetry={run} />
      )}

      {shown.status === 'ready' && orders.length === 0 && (
        <EmptyState className="queueEmpty" icon="layout-alt-02" title="No queued orders yet"
          body="Queue an order from the sales point to continue it later." />
      )}

      {hasList && (
        <ul className="queueList" role="radiogroup" aria-label="Queued orders">
          {orders.map((order) => (
            <QueueCard
              key={order.id}
              order={order}
              chosen={chosen === order.id}
              leaving={leaving === order.id}
              menuOpen={menuFor === order.id}
              onChoose={() => { setChosen(order.id); setMenuFor(null); }}
              onMenu={() => setMenuFor((m) => (m === order.id ? null : order.id))}
              onCloseMenu={() => setMenuFor(null)}
              onDelete={() => remove(order)}
            />
          ))}
        </ul>
      )}
    </BottomSheet>
  );
}

/** One queued order: `88:16283`, and `88:16430` chosen. */
function QueueCard({ order, chosen, leaving, menuOpen, onChoose, onMenu, onCloseMenu, onDelete }: {
  order: QueuedOrder; chosen: boolean; leaving: boolean; menuOpen: boolean;
  onChoose: () => void; onMenu: () => void; onCloseMenu: () => void; onDelete: () => void;
}) {
  const names = queuedItemNames(order);
  const who = order.customer?.name ?? 'Walk-in customer';
  const dots = useRef<HTMLButtonElement>(null);
  return (
    <li className="queueList__item" data-leaving={leaving || undefined}>
      <div className="queueList__clip">
        <div className="queueCard" data-chosen={chosen ? 'on' : 'off'}>
          {/* The whole card chooses the order; the ••• beside it is its own control. */}
          <button type="button" className="queueCard__choose" role="radio" aria-checked={chosen} onClick={onChoose}
            aria-label={`${who}, ${names.join(', ')}, ${formatPrice(queuedTotal(order))}, queued ${formatQueuedAt(order.queuedAt)}`}>
            <span className="queueCard__top">
              <span className="queueCard__summary">
                <span className="queueCard__name">{who}</span>
                <span className="queueCard__items">
                  {names.map((n, i) => (
                    <span key={i}>{i > 0 && <span className="queueCard__dot" />}{n}</span>
                  ))}
                </span>
              </span>
              <span className="queueCard__total">{formatPrice(queuedTotal(order))}</span>
            </span>
            <span className="queueCard__time">
              <Icon name="clock" />
              <span className="queueCard__timeText">{formatQueuedAt(order.queuedAt)}</span>
            </span>
          </button>
          <button ref={dots} type="button" className="queueCard__more" aria-label={`Options for ${who}'s order`}
            aria-haspopup="menu" aria-expanded={menuOpen} onClick={onMenu}>
            <Icon name="dots-horizontal-24" />
          </button>
        </div>
      </div>
      <RowMenu open={menuOpen} anchor={dots} onClose={onCloseMenu} onDelete={onDelete} />
    </li>
  );
}

/**
 * The row's Dropdown menu, `88:16379`: 196 wide, its top 2 above the ••• button's
 * bottom and its right 7 in from the card's — where the frame puts it. It opens
 * upward instead when the list's scroll area would cut it off.
 */
function RowMenu({ open, anchor, onClose, onDelete }: {
  open: boolean; anchor: React.RefObject<HTMLButtonElement>; onClose: () => void; onDelete: () => void;
}) {
  const { mounted, entered } = usePresented(open);
  const menu = useRef<HTMLDivElement>(null);
  const [up, setUp] = useState(false);

  useLayoutEffect(() => {
    if (!mounted || !menu.current) return;
    const scroller = menu.current.closest('.modalBody');
    if (!scroller) return;
    setUp(menu.current.getBoundingClientRect().bottom > scroller.getBoundingClientRect().bottom);
  }, [mounted]);

  // The menu mounts a render after `open` (usePresented), so focus waits for it.
  useEffect(() => {
    if (open && mounted) menu.current?.querySelector<HTMLElement>('[role="menuitem"]')?.focus({ preventScroll: true });
  }, [open, mounted]);

  useEffect(() => {
    if (!open) return undefined;
    const outside = (e: PointerEvent) => {
      const t = e.target as Node;
      if (!menu.current?.contains(t) && !anchor.current?.contains(t)) onClose();
    };
    const key = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      e.stopPropagation();
      onClose();
      anchor.current?.focus({ preventScroll: true });
    };
    document.addEventListener('pointerdown', outside, true);
    document.addEventListener('keydown', key, true);
    return () => {
      document.removeEventListener('pointerdown', outside, true);
      document.removeEventListener('keydown', key, true);
    };
  }, [open, anchor, onClose]);

  if (!mounted) return null;
  return (
    <div ref={menu} className="rowMenu" role="menu" data-open={entered ? 'on' : 'off'} data-up={up ? 'on' : 'off'}>
      <button type="button" className="rowMenu__item" role="menuitem" onClick={onDelete}>
        <Icon name="trash-03-danger" />
        <span className="rowMenu__label">Delete</span>
      </button>
    </div>
  );
}
