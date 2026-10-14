import { useCallback, useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import { fetchDashboard } from '../api/pos';
import { Icon, type IconName } from '../components/Icon';
import { ListMessage } from '../components/ListMessage';
import { TabBar, type Tab } from '../components/SalesPointChrome';
import { STORE } from '../data/store';
import { useDismiss } from '../hooks/useDismiss';
import { usePresented } from '../hooks/usePresented';
import {
  PERIODS, formatLongDate, formatNaira, formatPct, type DashboardSummary, type Period, type Tender,
} from '../state/ledger';
import './Dashboard.css';

type Status = { kind: 'loading' } | { kind: 'ready'; data: DashboardSummary } | { kind: 'error'; message: string };

/**
 * Dashboard — `197:20741`. Every figure is computed from the store's books
 * (`state/ledger.ts`) for the chosen period; nothing is copied from the frame, whose
 * own figures do not reconcile (BUILD-PLAN #131).
 */
export function Dashboard({ initialPeriod = 'today', forceState, menuOpen: initialMenuOpen = false, onNavigate, onNotDesigned }: {
  initialPeriod?: Period;
  /** Dev toolbar: hold the screen in a state that is otherwise momentary. */
  forceState?: 'loading' | 'error';
  menuOpen?: boolean;
  onNavigate: (tab: Tab) => void;
  onNotDesigned: (message: string) => void;
}) {
  const [period, setPeriod] = useState<Period>(initialPeriod);
  const [status, setStatus] = useState<Status>({ kind: 'loading' });
  const [menuOpen, setMenuOpen] = useState(initialMenuOpen);

  const run = useCallback(() => {
    if (forceState === 'loading') { setStatus({ kind: 'loading' }); return undefined; }
    let live = true;
    setStatus({ kind: 'loading' });
    fetchDashboard(period)
      .then((data) => { if (live) setStatus(forceState === 'error' ? { kind: 'error', message: 'The connection dropped.' } : { kind: 'ready', data }); })
      .catch((e: Error) => { if (live) setStatus({ kind: 'error', message: e.message }); });
    return () => { live = false; };
  }, [period, forceState]);
  useEffect(() => run(), [run]);

  const d = status.kind === 'ready' ? status.data : null;
  const periodLabel = PERIODS.find((p) => p.id === period)!.label;

  return (
    <div className="dash">
      {/* `197:21099` */}
      <header className="dash__header">
        {/* `197:21100`: the store's initials. The frame's "ES" / "Emmanuel Stores" is
            another business; the store is Freshvale (BUILD-PLAN #131). */}
        <span className="dash__avatar" aria-hidden="true">FS</span>
        <h1 className="dash__store">{STORE.name}</h1>
        {/* Notifications are not designed; the bell says so rather than doing nothing. */}
        <button type="button" className="dash__bell" aria-label="Notifications"
          onClick={() => onNotDesigned('Notifications aren’t designed yet')}>
          <Icon name="bell-03" />
        </button>
      </header>

      <main className="dash__scroll">
        <div className="dash__main">
          {/* `197:20743` */}
          <div className="dash__filterRow">
            <PeriodFilter period={period} label={periodLabel} open={menuOpen} onOpen={() => setMenuOpen((v) => !v)}
              onClose={() => setMenuOpen(false)} onPick={(p) => { setPeriod(p); setMenuOpen(false); }} />
            <span className="dash__date">{formatLongDate(new Date())}</span>
          </div>

          {status.kind === 'error' ? (
            <ListMessage title="Couldn’t load the dashboard" body={status.message} onRetry={run} />
          ) : (
            <>
              {/* `197:20746` */}
              <section className="dash__tiles" aria-label="Summary">
                <Tile icon="shopping-cart-03-brand-16" label="Sales" value={d && formatNaira(d.salesMinor)} />
                <Tile icon="layers-three-01" label="Expenses" value={d && formatNaira(d.expensesMinor)} />
                <Tile icon="coins-stacked-04-orange" label="Cost of goods sold" value={d && formatNaira(d.cogsMinor)} />
                <Tile icon="bar-chart-12-green" label="Profit" value={d && formatNaira(d.profitMinor)} />
              </section>

              <SalesAnalysis data={d} period={period} />
              <Inventory data={d} />
              <ProfitAndLoss data={d} />
              <TopLocations data={d} />
              <CashFlow data={d} />
              <DebtorsCreditors data={d} />
            </>
          )}
        </div>
      </main>

      <TabBar active="dashboard" onNavigate={onNavigate} />
    </div>
  );
}

/* --- Pieces ------------------------------------------------------------------------ */

/** A figure, or its skeleton while the books load — sized to the frame's own text. */
function Fig({ value, width, className }: { value: string | null | undefined; width: number; className: string }) {
  return value == null
    ? <span className={`${className} dash__skeleton`} style={{ width }} aria-hidden="true" />
    : <span className={className}>{value}</span>;
}

/* `197:20748`: one of the four summary tiles. */
function Tile({ icon, label, value }: { icon: IconName; label: string; value: string | null }) {
  return (
    <div className="dash__tile">
      <div className="dash__tileDetails">
        <div className="dash__tileLabel"><Icon name={icon} /><span>{label}</span></div>
        <Fig className="dash__tileValue" value={value} width={88} />
      </div>
    </div>
  );
}

function Section({ title, titleStyle = 'h3', className, card, children }: {
  title: string; titleStyle?: 'label' | 'h3'; className: string; card: string; children: ReactNode;
}) {
  return (
    <section className={`dash__section ${className}`}>
      {/* Sales Analysis and Inventory Summary title in Label/Large; the other four in
          Heading/H3 — as the frame draws them (BUILD-PLAN #131). */}
      <h2 className="dash__title" data-style={titleStyle}>{title}</h2>
      <div className={`dash__card ${card}`}>{children}</div>
    </section>
  );
}

const TENDER_FILL: Record<Tender, string> = {
  cash: 'var(--color-icon-brand)',
  pos: 'var(--color-container-accent-aqua-bold-default)',
  bank: 'var(--color-container-accent-pink-bold-default)',
  credit: 'var(--legacy-orange-600)',
  comp: 'var(--legacy-yellow-600)',
  loyalty: 'var(--color-icon-success)',
};
/* The legend's dots bind slightly different tokens from the bar's segments for POS
   and Bank (icon/accent/aqua and /pink against the container accents' bold) — the
   same values in light, as drawn. */
const TENDER_DOT: Record<Tender, string> = {
  ...TENDER_FILL,
  pos: 'var(--color-icon-accent-aqua)',
  bank: 'var(--color-icon-accent-pink)',
};
/** The frame's bar is 318 long inside a 325 track (BUILD-PLAN #131); kept as drawn. */
const SPLIT_BAR = 318;

/* `197:20777` */
function SalesAnalysis({ data: d, period }: { data: DashboardSummary | null; period: Period }) {
  const total = d?.salesMinor ?? 0;
  const widths = d ? spread(d.byTender.map((t) => t.amountMinor), SPLIT_BAR) : [];
  const first = widths.findIndex((w) => w > 0);
  const last = widths.length - 1 - [...widths].reverse().findIndex((w) => w > 0);
  return (
    <Section title="Sales Analysis" titleStyle="label" className="dash__sales" card="dash__salesCard">
      <div className="dash__salesHead">
        <span className="dash__salesToday">
          <span>{period === 'today' ? 'Today:' : `${PERIODS.find((p) => p.id === period)!.label}:`}</span>
          <Fig className="dash__salesTodayValue" value={d && formatNaira(d.salesMinor)} width={60} />
        </span>
        <span className="dash__salesMargin">
          <span>Profit Margin:</span>
          <Fig className="" value={d && (d.marginPct === null ? '—' : formatPct(d.marginPct))} width={49} />
        </span>
      </div>
      <div className="dash__salesChart">
        <div className="dash__splitBar" role="img" aria-label="Sales by payment method">
          {d && total === 0 && <span className="dash__splitEmpty" />}
          {d && d.byTender.map((t, i) => (
            <span key={t.id} className="dash__splitSeg" data-first={i === first ? 'on' : undefined} data-last={i === last ? 'on' : undefined}
              style={{ width: widths[i], background: TENDER_FILL[t.id] }} />
          ))}
        </div>
        <div className="dash__methods">
          {[0, 1].map((row) => (
            <div key={row} className="dash__methodRow">
              {(d?.byTender ?? PLACEHOLDER_TENDERS).slice(row * 3, row * 3 + 3).map((t) => (
                <div key={t.id} className="dash__method">
                  <span className="dash__methodLabel"><span className="dash__square" style={{ background: TENDER_DOT[t.id] }} />{t.label}</span>
                  <Fig className="dash__methodValue" value={d && formatNaira(t.amountMinor)} width={60} />
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </Section>
  );
}
const PLACEHOLDER_TENDERS = (['cash', 'pos', 'bank', 'credit', 'comp', 'loyalty'] as const).map((id) => ({
  id, label: { cash: 'Cash', pos: 'POS', bank: 'Bank', credit: 'Credit', comp: 'Comp.', loyalty: 'Loyalty' }[id], amountMinor: 0,
}));

/** Whole-pixel widths that add up to `total` exactly, in proportion to `values`. */
function spread(values: readonly number[], total: number): number[] {
  const sum = values.reduce((a, v) => a + v, 0);
  if (sum === 0) return values.map(() => 0);
  const exact = values.map((v) => (v / sum) * total);
  const out = exact.map(Math.floor);
  let left = total - out.reduce((a, v) => a + v, 0);
  for (const i of exact.map((v, i) => [v - Math.floor(v), i] as const).sort((a, b) => b[0] - a[0]).map(([, i]) => i)) {
    if (left === 0) break;
    if (values[i] > 0) { out[i]++; left--; }
  }
  return out;
}

/* `197:20830` */
function Inventory({ data: d }: { data: DashboardSummary | null }) {
  const inv = d?.inventory;
  return (
    <Section title="Inventory Summary" titleStyle="label" className="dash__inventory" card="dash__inventoryCard">
      <div className="dash__inventoryInner">
        <div className="dash__stock">
          <span className="dash__stockIcon" data-tone="brand"><Icon name="shopping-cart-03-brand-20" /></span>
          <span className="dash__stockDetails">
            <span className="dash__stockLabel">Stock Value</span>
            <Fig className="dash__stockValue" value={inv && formatNaira(inv.stockMinor, 2)} width={163} />
          </span>
        </div>
        <hr className="dash__rule" />
        <div className="dash__stock">
          <span className="dash__stockIcon" data-tone="aqua"><Icon name="coins-stacked-04-aqua-20" /></span>
          <span className="dash__stockDetails">
            <span className="dash__stockLabel">Retail Value</span>
            <Fig className="dash__stockValue" value={inv && formatNaira(inv.retailMinor, 2)} width={177} />
          </span>
        </div>
        <Badge className="dash__markup" label="Mark up:" value={inv?.markupPct} />
        <Badge className="dash__margin" label="Profit Margin:" value={inv?.marginPct} />
      </div>
    </Section>
  );
}

/* `197:20849` / `197:20853`: the frame draws the mark-up green and the margin red
   (-500%); here the pill follows the sign — green for a gain, red for a loss. */
function Badge({ className, label, value }: { className: string; label: string; value: number | undefined }) {
  return (
    <span className={`dash__badge ${className}`}>
      <span className="dash__badgeLabel">{label}</span>
      {value === undefined
        ? <span className="dash__pill dash__skeleton" style={{ width: 55 }} aria-hidden="true" />
        : <span className="dash__pill" data-tone={value < 0 ? 'loss' : 'gain'}>{formatPct(value, { digits: 0 })}</span>}
    </span>
  );
}

/** Two shares on one 318 bar, the first overlapping the second by 8 (`197:20880`). */
function SplitBar({ pct, left, right }: { pct: number | null; left: string; right: string }) {
  return (
    <div className="dash__pair">
      {pct !== null && <span className="dash__pairLeft" style={{ width: Math.max(12, Math.round((pct / 100) * 318)), background: left } as CSSProperties} />}
      <span className="dash__pairRight" style={{ background: pct === null ? 'var(--color-container-neutral-default)' : right }} />
    </div>
  );
}

/* `197:20857` */
function ProfitAndLoss({ data: d }: { data: DashboardSummary | null }) {
  const p = d?.pnl;
  return (
    <Section title="Profit & Loss" className="dash__pnl" card="dash__shareCard">
      <div className="dash__shareInner">
        <div className="dash__shareTop">
          <div className="dash__shareLabels">
            <span className="dash__shareLabel"><span className="dash__shareKey"><Icon name="bar-chart-12-brand" /><span>Revenue:</span></span>
              <Fig className="dash__sharePct" value={p && formatPct(p.revenuePct)} width={52} /></span>
            <span className="dash__shareLabel"><span className="dash__shareKey"><Icon name="layers-three-01" /><span>Expense:</span></span>
              <Fig className="dash__sharePct" value={p && formatPct(p.expensePct)} width={51} /></span>
          </div>
          <SplitBar pct={p ? (p.revenueMinor + p.expenseMinor === 0 ? null : p.revenuePct) : null}
            left="var(--color-icon-brand)" right="var(--color-container-accent-aqua-bold-default)" />
          <div className="dash__shareAmounts">
            <span className="dash__shareAmount"><span className="dash__dot" style={{ background: 'var(--color-icon-brand)' }} />
              <Fig className="" value={p && formatNaira(p.revenueMinor)} width={77} /></span>
            <span className="dash__shareAmount"><span className="dash__dot" style={{ background: 'var(--color-container-accent-aqua-bold-default)' }} />
              <Fig className="" value={p && formatNaira(p.expenseMinor)} width={66} /></span>
          </div>
        </div>
        <hr className="dash__rule" />
        <div className="dash__total">
          <span className="dash__totalLabel"><span className="dash__dot" style={{ background: 'var(--color-icon-success)' }} />Profit</span>
          <Fig className="dash__totalValue" value={p && formatNaira(p.profitMinor, 2)} width={173} />
        </div>
      </div>
    </Section>
  );
}

/* `197:20896` */
function TopLocations({ data: d }: { data: DashboardSummary | null }) {
  const rows = d?.locations ?? [];
  return (
    <Section title="Top Locations" className="dash__locations" card="dash__locationsCard">
      <table className="dash__table">
        <thead>
          <tr><th className="dash__colNo">#</th><th className="dash__colName">Location</th><th className="dash__colSales"><span>Sales</span></th></tr>
        </thead>
        <tbody>
          {(d ? rows : Array.from({ length: 5 }, () => null)).map((r, i) => (
            <tr key={r?.branch.id ?? i}>
              <td className="dash__colNo">{i + 1}.</td>
              <td className="dash__colName">
                {r ? <span className="dash__locName">{r.branch.name}</span> : <span className="dash__locName dash__skeleton" style={{ width: 106 }} />}
                <span className="dash__locAddress"><Icon name="marker-pin-01" /><span>{r?.branch.address ?? ''}</span></span>
              </td>
              <td className="dash__colSales">
                <span className="dash__locSales">{r ? formatNaira(r.salesMinor, 2) : <span className="dash__skeleton" style={{ width: 108, display: 'inline-block' }} />}</span>
                {r && r.changePct !== null && (
                  <span className="dash__locChange">
                    {formatPct(r.changePct, { sign: true })}
                    {/* A fall is not designed (only the up arrow is drawn): the figure
                        alone, signed, until it is (BUILD-PLAN #131). */}
                    {r.changePct >= 0 && <Icon name="trend-up-01" />}
                  </span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </Section>
  );
}

/* `197:20988` */
function CashFlow({ data: d }: { data: DashboardSummary | null }) {
  return (
    <Section title="Cash Flow" className="dash__flow" card="dash__flowCard">
      <div className="dash__flowList">
        <FlowBlock icon="bank-note-02-pink" label="Cash" flow={d?.cash} />
        <FlowBlock icon="bank-brand" label="Bank" flow={d?.bank} />
      </div>
      <div className="dash__total">
        <span className="dash__totalLabel">Current Balance</span>
        <Fig className="dash__totalValue" value={d && formatNaira(d.currentBalanceMinor, 2)} width={173} />
      </div>
    </Section>
  );
}

function FlowBlock({ icon, label, flow }: { icon: IconName; label: string; flow: DashboardSummary['cash'] | undefined }) {
  return (
    <div className="dash__flowBlock">
      <span className="dash__flowHead"><Icon name={icon} /><span>{label}</span></span>
      <div className="dash__flowBox">
        <div className="dash__flowTop">
          <div className="dash__flowKeys">
            <span className="dash__flowKey"><Icon name="arrow-circle-broken-down-left" />Received</span>
            <span className="dash__flowKey"><Icon name="arrow-circle-broken-up-right" />Spent</span>
          </div>
          <div className="dash__flowAmounts">
            <span className="dash__flowAmount"><span className="dash__dot" style={{ background: 'var(--color-icon-success)' }} />
              <Fig className="" value={flow && formatNaira(flow.receivedMinor, 2)} width={102} /></span>
            <span className="dash__flowAmount"><span className="dash__dot" style={{ background: 'var(--color-icon-danger)' }} />
              <Fig className="" value={flow && formatNaira(flow.spentMinor, 2)} width={91} /></span>
          </div>
        </div>
        <div className="dash__flowFoot">
          <div className="dash__flowBalance">
            <span>Balance:</span>
            <Fig className="" value={flow && formatNaira(flow.balanceMinor, 2)} width={86} />
          </div>
        </div>
      </div>
    </div>
  );
}

/* `197:21059` */
function DebtorsCreditors({ data: d }: { data: DashboardSummary | null }) {
  return (
    <Section title="Debtors/Creditors" className="dash__debts" card="dash__shareCard dash__debtsCard">
      <div className="dash__shareTop">
        <div className="dash__shareLabels">
          <span className="dash__shareLabel"><span className="dash__shareKey"><Icon name="minus-circle" /><span>Debtors:</span></span>
            <Fig className="dash__sharePct" value={d && formatPct(d.debtorsPct)} width={52} /></span>
          {/* "Creditors", no colon, where "Debtors:" has one — as drawn (#131). */}
          <span className="dash__shareLabel"><span className="dash__shareKey"><Icon name="plus-circle-aqua-16" /><span>Creditors</span></span>
            <Fig className="dash__sharePct" value={d && formatPct(d.creditorsPct)} width={51} /></span>
        </div>
        <SplitBar pct={d ? (d.debtorsMinor + d.creditorsMinor === 0 ? null : d.debtorsPct) : null}
          left="var(--color-container-accent-pink-bold-default)" right="var(--color-container-accent-aqua-bold-default)" />
        <div className="dash__shareAmounts">
          <span className="dash__shareAmount"><span className="dash__dot" style={{ background: 'var(--color-icon-accent-pink)' }} />
            <Fig className="" value={d && formatNaira(d.debtorsMinor, 2)} width={101} /></span>
          <span className="dash__shareAmount"><span className="dash__dot" style={{ background: 'var(--color-container-accent-aqua-bold-default)' }} />
            <Fig className="" value={d && formatNaira(d.creditorsMinor, 2)} width={90} /></span>
        </div>
      </div>
    </Section>
  );
}

/* --- The period filter ----------------------------------------------------------------
   `197:20744`, the file's Filter. What it opens is not designed: the file's own
   Dropdown (`88:16379`, Queued orders' row menu) lists the three periods, the chosen
   one ticked. */
function PeriodFilter({ period, label, open, onOpen, onClose, onPick }: {
  period: Period; label: string; open: boolean; onOpen: () => void; onClose: () => void; onPick: (p: Period) => void;
}) {
  const anchor = useRef<HTMLButtonElement>(null);
  const menu = useRef<HTMLDivElement>(null);
  const { mounted, entered } = usePresented(open);
  useDismiss(open, menu, anchor, onClose);
  useEffect(() => {
    if (open && mounted) menu.current?.querySelector<HTMLElement>('[aria-checked="true"]')?.focus({ preventScroll: true });
  }, [open, mounted]);
  return (
    <div className="dash__filterWrap">
      <button ref={anchor} type="button" className="dash__filter" aria-haspopup="menu" aria-expanded={open} onClick={onOpen}>
        <span>{label}</span>
        <Icon name="chevron-down-16" />
      </button>
      {mounted && (
        <div ref={menu} className="rowMenu dash__periodMenu" role="menu" data-open={entered ? 'on' : 'off'}>
          {PERIODS.map((p) => (
            <button key={p.id} type="button" className="rowMenu__item" role="menuitemradio" aria-checked={p.id === period} onClick={() => onPick(p.id)}>
              <span className="rowMenu__label dash__periodLabel">{p.label}</span>
              {p.id === period && <Icon name="check" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
