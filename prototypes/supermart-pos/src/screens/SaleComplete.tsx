import { useEffect } from 'react';
import { DURATION, duration, useReducedMotion } from '@playground/shared';
import { CloseButton } from '../components/CloseButton';
import { Icon, type IconName } from '../components/Icon';
import { STORE } from '../data/store';
import { usePresented } from '../hooks/usePresented';
import type { Receipt as ReceiptRecord } from '../state/sale';
import './SaleComplete.css';

/**
 * Transaction success — `88:8723` — and the wait before it. Full screen; the caller
 * moves on to the receipt.
 *
 * Not designed — the frame is a still. The designer's call: confirming Pay goes
 * straight here, and the waiting happens here, not in the button. The screen opens as
 * a circle from the Pay button (`origin`) on a brand ring that spins while the payment
 * runs. When it lands, the ring stops where it is, sweeps closed in success green and
 * fills into the disc, the check draws and ends in a small burst of dots, a soft bloom
 * breathes out and the line changes — loading and success are one mark. A light
 * haptic tick lands with the burst. If the
 * payment fails, the circle draws back into the Pay button (`retract`). Reduced motion
 * shows each state settled. The check is the frame's own export (`check-success.svg`),
 * inlined so it can draw.
 */
export function TransactionSuccess({ open, status, retract = false, origin, onContinue }: {
  open: boolean;
  status: 'processing' | 'success';
  /** Leaving because the payment failed: the reveal runs backwards, into the button. */
  retract?: boolean;
  /** Where the screen grows from, on the 393x852 screen: the Pay button's centre. */
  origin?: { x: number; y: number };
  onContinue: () => void;
}) {
  const { mounted, entered } = usePresented(open);
  const reducedMotion = useReducedMotion();
  useEffect(() => {
    if (!open || status !== 'success') return undefined;
    // As the check's stroke completes (its delay plus its duration, from the CSS).
    const t = setTimeout(() => navigator.vibrate?.(12), duration(DURATION.instant + DURATION.fast + DURATION.fast, reducedMotion));
    return () => clearTimeout(t);
  }, [open, status, reducedMotion]);
  if (!mounted) return null;
  const o = origin ?? { x: 196.5, y: 782 };
  return (
    // Once paid, a tap anywhere moves on, so nobody waits on the timer.
    <div
      className="saleScreen saleSuccess"
      data-open={entered ? 'on' : 'off'}
      data-leaving={!open ? 'on' : 'off'}
      data-retract={retract ? 'on' : 'off'}
      data-status={status}
      style={{ '--ox': `${o.x}px`, '--oy': `${o.y}px` } as React.CSSProperties}
      onClick={status === 'success' ? onContinue : undefined}
      role="status"
      aria-busy={status === 'processing'}
    >
      <div className="saleSuccess__content">
        <span className="saleSuccess__mark">
          <span className="saleSuccess__halo" aria-hidden="true" />
          {/* The burst as the check lands: 8 dots, every 45° from 22.5°, alternating a
              long and a short throw. */}
          <span className="saleSuccess__burst" aria-hidden="true">
            {Array.from({ length: 8 }, (_, i) => (
              <i key={i} style={{ '--a': `${22.5 + i * 45}deg` } as React.CSSProperties} />
            ))}
          </span>
          <span className="saleSuccess__icon">
            <svg width="40" height="40" viewBox="0 0 40 40" fill="none" aria-hidden="true">
              <path d="M33.3332 10L14.9998 28.3333L6.6665 20" pathLength={1} stroke="white" strokeWidth="2.97658"
                strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </span>
          {/* The loader, 72 like the disc it becomes: a 4 stroke on r 34, so its outer
              edge is the disc's edge. Not designed; its stroke has no token. */}
          <svg className="saleSuccess__ring" width="72" height="72" viewBox="0 0 72 72" fill="none" aria-hidden="true">
            <circle cx="36" cy="36" r="34" pathLength={1} strokeWidth="4" strokeLinecap="round" />
          </svg>
        </span>
        <span className="saleSuccess__lines">
          <p className="saleSuccess__text saleSuccess__text--waiting" aria-hidden={status !== 'processing'}>Processing payment…</p>
          <p className="saleSuccess__text saleSuccess__text--done" aria-hidden={status !== 'success'}>Transaction success!</p>
        </span>
      </div>
    </div>
  );
}

const SOCIALS: readonly IconName[] = ['instagram', 'facebook', 'tiktok', 'twitter'];

/**
 * Receipt — `88:8735`. A scaled copy of a receipt component: every size is a round
 * number times 0.957, so it is built at those numbers and scaled once (`--r`).
 *
 * Deviations, each logged in BUILD-PLAN:
 * - Store identity is Freshvale's, invented (the designer's call); the frame's is
 *   Klakpad's. The logo is a placeholder monogram — Freshvale has none. Needs design.
 * - Every figure is computed: the frame's do not reconcile.
 * - The footnote and social block are drawn 435 wide in a 305 column; they fit it.
 * - Close and New sale both end the sale: once paid, there is no order to go back to.
 * - The frame's hidden "Close / print" row and per-line dates (opacity 0) are not built.
 *
 * Motion, not designed: the receipt feeds down out of the slot under the title bar
 * like paper from a till printer, the actions rise once it has, and on New sale it
 * lifts away as the screen fades.
 */
export function Receipt({
  open, receipt, onNewSale, onShare, onPrint,
}: {
  open: boolean;
  receipt: ReceiptRecord;
  onNewSale: () => void;
  onShare: () => void;
  onPrint: () => void;
}) {
  const { mounted, entered } = usePresented(open);
  if (!mounted) return null;
  const r = receipt;
  return (
    <div className="saleScreen receiptScreen" data-open={entered ? 'on' : 'off'} data-leaving={!open ? 'on' : 'off'}
      role="dialog" aria-label="Receipt">
      <header className="receiptScreen__bar">
        <CloseButton onPress={onNewSale} label="Close receipt" />
        <button type="button" className="receiptScreen__newSale" onClick={onNewSale}>New sale</button>
      </header>

      <div className="receiptScreen__scroll">
        <article className="receipt" aria-label={`Receipt ${r.number}`}>
          <div className="receipt__head">
            <div className="receipt__store">
              <span className="receipt__logo" aria-hidden="true">F</span>
              <div className="receipt__storeText">
                <p className="receipt__storeName">{STORE.name}</p>
                <p className="receipt__storeLine">{STORE.address}</p>
                <p className="receipt__storeLine">{STORE.phone}</p>
                <p className="receipt__storeLine">{STORE.email}</p>
              </div>
            </div>
            <p className="receipt__total">{r.total}</p>
          </div>

          <div className="receipt__body">
            <div className="receipt__sections">
              <dl className="receipt__block receipt__block--top">
                <Row label="Customer" value={r.customer} />
                <Row label="Transaction Date" value={r.date} />
                <Row label="Receipt No." value={r.number} />
                <Row label="Sales Person" value={r.salesPerson} />
              </dl>
              <div className="receipt__items">
                {r.lines.map((l, i) => (
                  <div key={i} className="receipt__item">
                    <div className="receipt__row receipt__row--strong">
                      <span>{l.title} <span className="receipt__at">@ {l.unitPrice}</span></span>
                      <span>{l.amount}</span>
                    </div>
                    {l.note && <div className="receipt__row"><span>{l.note}</span></div>}
                    {l.discount && <div className="receipt__row"><span>Discount</span><span>{l.discount}</span></div>}
                  </div>
                ))}
              </div>
              <dl className="receipt__block">
                <Row label="Sales Value" value={r.salesValue} />
                <Row label="VAT" value={r.vat} />
                <Row label="Discount" value={r.discount} />
              </dl>
              <dl className="receipt__block">
                <Row label="Total" value={r.total} />
                <Row label={r.paidBy} value={r.total} />
              </dl>
              <dl className="receipt__block">
                <Row label="Tendered" value={r.tendered} />
                <Row label="Balance" value={r.balance} />
              </dl>
            </div>

            <div className="receipt__foot">
              <p className="receipt__footnote">{STORE.footnote}</p>
              <div className="receipt__socials">
                {SOCIALS.map((s) => (
                  <span key={s} className="receipt__social"><Icon name={s} />{STORE.handle}</span>
                ))}
              </div>
              <p className="receipt__credit">{STORE.credit}</p>
            </div>
          </div>
        </article>
      </div>

      <footer className="receiptScreen__footer">
        <button type="button" className="receiptScreen__action" onClick={onShare}>
          <Icon name="share-01" /><span>Share receipt</span>
        </button>
        <button type="button" className="receiptScreen__action" onClick={onPrint}>
          <Icon name="printer" /><span>Print receipt</span>
        </button>
      </footer>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return <div className="receipt__row"><dt>{label}</dt><dd>{value}</dd></div>;
}
