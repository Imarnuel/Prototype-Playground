import { CloseButton } from '../components/CloseButton';
import { Icon, type IconName } from '../components/Icon';
import { STORE } from '../data/store';
import { usePresented } from '../hooks/usePresented';
import type { Receipt as ReceiptRecord } from '../state/sale';
import './SaleComplete.css';

/** Transaction success — `88:8723`. Full screen; the caller moves on to the receipt. */
export function TransactionSuccess({ open, onContinue }: { open: boolean; onContinue: () => void }) {
  const { mounted, entered } = usePresented(open);
  if (!mounted) return null;
  return (
    // A tap anywhere moves on, so nobody waits on the timer.
    <div className="saleScreen saleSuccess" data-open={entered ? 'on' : 'off'} onClick={onContinue} role="status">
      <div className="saleSuccess__content">
        <span className="saleSuccess__icon"><Icon name="check-success" /></span>
        <p className="saleSuccess__text">Transaction success!</p>
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
    <div className="saleScreen receiptScreen" data-open={entered ? 'on' : 'off'} role="dialog" aria-label="Receipt">
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
