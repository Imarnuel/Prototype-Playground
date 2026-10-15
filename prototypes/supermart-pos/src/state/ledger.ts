/**
 * The store's books: every sale, expense and unpaid supplier bill the Dashboard
 * (`197:20741`) reads. One source of truth — every figure on that screen is computed
 * here from these records, so the tiles, the payment split, the P&L, the cash flow and
 * the top locations cannot disagree with one another. The frame's own figures do not
 * reconcile (BUILD-PLAN #131), so none of them is copied.
 *
 * The history is SEEDED: 60 days of orders across five branches, drawn from the
 * catalogue through the same money model the Cart uses (`totals`), with a fixed
 * pseudo-random seed so a demo reads the same twice. Every sale paid at this till is
 * added on top (`recordSale`), so a sale made in the demo shows on the Dashboard.
 */
import { PRODUCTS, CURRENCY, type Product } from '../data/catalogue';
import { STORE } from '../data/store';
import { productFor, totals, type CartLine } from './cart';

/* --- Branches ---------------------------------------------------------------------
   INVENTED. The frame lists other businesses ("Hitee Enterprise", "City Mall", three
   "Joy Enterprise" rows on one address); a store's "Top Locations" are its own
   branches. Bodija is this till's (the receipt's address); Iwo Road keeps the frame's
   own "13, Jones Street, Iw…". */
export type Branch = { id: string; name: string; address: string; weight: number };
export const BRANCHES: readonly Branch[] = [
  { id: 'bodija', name: 'Freshvale Bodija', address: STORE.address, weight: 1 },
  { id: 'ringroad', name: 'Freshvale Ring Road', address: '22, Ring Road, Challenge, Ibadan', weight: 0.9 },
  { id: 'dugbe', name: 'Freshvale Dugbe', address: '5, Lebanon Street, Dugbe, Ibadan', weight: 0.8 },
  { id: 'agbowo', name: 'Freshvale Agbowo', address: '3, Oyo Road, Agbowo, Ibadan', weight: 0.72 },
  { id: 'iworoad', name: 'Freshvale Iwo Road', address: '13, Jones Street, Iwo Road, Ibadan', weight: 0.62 },
];
/** The branch this till sells from. */
export const HOME_BRANCH = 'bodija';

/* --- Tenders ------------------------------------------------------------------------
   The Dashboard's six, in its order. Cash, POS and Bank are this till's own methods;
   Credit is a sale on the customer's balance, Comp. a complimentary sale, Loyalty one
   paid in points. All six count as sales at their value (the frame's split adds them
   all); only Cash, POS and Bank move money (Cash Flow). */
export type Tender = 'cash' | 'pos' | 'bank' | 'credit' | 'comp' | 'loyalty';
export const TENDERS: readonly { id: Tender; label: string }[] = [
  { id: 'cash', label: 'Cash' },
  { id: 'pos', label: 'POS' },
  { id: 'bank', label: 'Bank' },
  { id: 'credit', label: 'Credit' },
  { id: 'comp', label: 'Comp.' },
  { id: 'loyalty', label: 'Loyalty' },
];

export type Sale = {
  at: Date;
  branch: string;
  tender: Tender;
  /** Collected, VAT included — what the receipt's Total says. */
  totalMinor: number;
  vatMinor: number;
  /** What the goods cost the store: Σ single units × costMinor. */
  costMinor: number;
};
export type Expense = { at: Date; label: string; account: 'cash' | 'bank'; amountMinor: number };
export type Bill = { supplier: string; amountMinor: number };

/* --- Seed ----------------------------------------------------------------------------
   INVENTED, and shaped like a real mid-size chain rather than even noise: about 26-40
   sales a branch a day, trading 8:00-20:00 (Sunday 12:00-18:00) with a lunchtime and a
   bigger after-work peak, Saturday the busiest day and Sunday the quietest, a lift
   around month-end pay day, and a gentle climb over the two months. */
const DAYS = 60;
/** Sales a day at the busiest branch, on an ordinary weekday. */
const ORDERS_PER_DAY = 40;
const naira = (n: number) => n * CURRENCY.minorPerUnit;

/** Opening hours, [open, close), by day of the week, Sunday first. */
const HOURS: readonly (readonly [number, number])[] = [[12, 18], [8, 20], [8, 20], [8, 20], [8, 20], [8, 20], [8, 20]];
/** How busy each day of the week is, Sunday first. */
const WEEKDAY = [0.5, 0.85, 0.9, 0.9, 0.95, 1.1, 1.4];
/** How busy each hour is, from 8:00 to 20:00. */
const HOURLY = [0.4, 0.6, 0.8, 1, 1.3, 1.2, 0.9, 1, 1.3, 1.5, 1.3, 0.7];
/** Salaries land on the 25th, or the Friday before when the 25th is a weekend. */
const isPayday = (d: Date) => (d.getDate() === 25 && d.getDay() % 6 !== 0) || (d.getDay() === 5 && (d.getDate() === 23 || d.getDate() === 24));

/** mulberry32: small, fast, and the same sequence every load. */
function random(seed: number) {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const pick = <T,>(rnd: () => number, items: readonly T[], weights: readonly number[]): T => {
  let r = rnd() * weights.reduce((a, w) => a + w, 0);
  for (let i = 0; i < items.length; i++) { r -= weights[i]; if (r < 0) return items[i]; }
  return items[items.length - 1];
};

/* Cheap things sell often, dear things rarely. */
const PRODUCT_WEIGHT = (p: Product) => 1 / Math.sqrt(p.priceMinor / naira(1000));
/* Cards lead in Nigerian retail; a complimentary sale is rare. */
const TENDER_WEIGHT: Record<Tender, number> = { cash: 26, pos: 38, bank: 28, credit: 5, comp: 0.7, loyalty: 2.3 };
/** A POS terminal's charge on what it takes, debited from the bank daily. INVENTED. */
const POS_CHARGE = 0.005;

/** INVENTED: the chain's running costs, each on the days a real one falls due. */
const EXPENSES: readonly {
  label: string;
  account: 'cash' | 'bank';
  naira: readonly [number, number];
  on: (day: Date) => boolean;
  /** Paid by every branch, not once for the chain. */
  perBranch?: true;
}[] = [
  { label: 'Staff salaries', account: 'bank', naira: [9400000, 9400000], on: isPayday },
  { label: 'Shop rent, monthly share', account: 'bank', naira: [4200000, 4200000], on: (d) => d.getDate() === 1 },
  { label: 'Security and cleaning', account: 'bank', naira: [1100000, 1100000], on: (d) => d.getDate() === 1 },
  { label: 'Internet and phone lines', account: 'bank', naira: [150000, 150000], on: (d) => d.getDate() === 1 },
  { label: 'Diesel for the generator', account: 'cash', naira: [18000, 30000], on: () => true, perBranch: true },
  { label: 'Staff transport and lunch', account: 'cash', naira: [8000, 12000], on: () => true, perBranch: true },
  { label: 'Electricity tokens', account: 'bank', naira: [30000, 45000], on: (d) => d.getDay() === 1, perBranch: true },
  { label: 'Stock delivery to branches', account: 'cash', naira: [60000, 110000], on: (d) => [1, 3, 5].includes(d.getDay()) },
  { label: 'Instagram and radio ads', account: 'bank', naira: [450000, 650000], on: (d) => d.getDay() === 4 },
  { label: 'Carrier bags and tags', account: 'bank', naira: [90000, 140000], on: (d) => d.getDay() === 2 },
];

/** INVENTED: what the chain owes its suppliers today — a few weeks of purchases. */
const BILLS: readonly Bill[] = [
  { supplier: 'Northline Apparel', amountMinor: naira(12400000) },
  { supplier: 'Kora Knitwear', amountMinor: naira(5650000) },
  { supplier: 'Freshvale Textiles', amountMinor: naira(8800000) },
];

const sale = (at: Date, branch: string, tender: Tender, lines: readonly CartLine[]): Sale => {
  const t = totals(lines);
  return {
    at, branch, tender, totalMinor: t.total, vatMinor: t.tax,
    costMinor: lines.reduce((a, l) => {
      const p = productFor(l);
      return a + p.costMinor * l.count * (p.units.find((u) => u.id === l.unitId)?.each ?? 1);
    }, 0),
  };
};

/* Every day, today included, is seeded whole and then cut at `now`, so today so far
   compares like for like with yesterday at the same hour (Top Locations), and the
   books never fill in under a demo as the clock moves. */
function seed(now: Date) {
  const rnd = random(20260509);
  const sales: Sale[] = [];
  const expenses: Expense[] = [];
  /** Units each branch sold of each product over the last 30 days: its stock follows. */
  const sold: Record<string, Record<string, number>> = Object.fromEntries(BRANCHES.map((b) => [b.id, {}]));
  const midnight = new Date(now); midnight.setHours(0, 0, 0, 0);
  for (let d = DAYS; d >= 0; d--) {
    const day = new Date(midnight); day.setDate(day.getDate() - d);
    const [open, close] = HOURS[day.getDay()];
    const hours = HOURLY.map((_, i) => 8 + i).filter((h) => h >= open && h < close);
    const at = (hour?: number) => {
      const h = hour ?? pick(rnd, hours, hours.map((x) => HOURLY[x - 8]));
      return new Date(day.getTime() + (h + rnd()) * 3600e3);
    };
    const date = day.getDate();
    const lift = (date >= 25 || date <= 2 ? 1.15 : 1) * WEEKDAY[day.getDay()] * (0.96 + 0.08 * ((DAYS - d) / DAYS));
    let posTaken = 0;
    for (const b of BRANCHES) {
      const n = Math.round(ORDERS_PER_DAY * b.weight * lift * (0.95 + 0.1 * rnd()));
      for (let i = 0; i < n; i++) {
        const count = 1 + Math.floor(rnd() * 2.4);
        const lines: CartLine[] = [];
        for (let j = 0; j < count; j++) {
          const p = pick(rnd, PRODUCTS, PRODUCTS.map(PRODUCT_WEIGHT));
          if (lines.some((l) => l.productId === p.id)) continue;
          lines.push({ productId: p.id, unitId: 'each', count: p.priceMinor < naira(2000) ? 1 + Math.floor(rnd() * 4) : 1 });
        }
        const s = sale(at(), b.id, pick(rnd, TENDERS.map((t) => t.id), TENDERS.map((t) => TENDER_WEIGHT[t.id])), lines);
        sales.push(s);
        if (s.tender === 'pos') posTaken += s.totalMinor;
        if (d < 30) for (const l of lines) sold[b.id][l.productId] = (sold[b.id][l.productId] ?? 0) + l.count;
      }
    }
    for (const e of EXPENSES) {
      if (!e.on(day)) continue;
      for (let k = 0; k < (e.perBranch ? BRANCHES.length : 1); k++) {
        const amount = e.naira[0] + Math.round((rnd() * (e.naira[1] - e.naira[0])) / 500) * 500;
        expenses.push({ at: at(open), label: e.label, account: e.account, amountMinor: naira(amount) });
      }
    }
    expenses.push({ at: new Date(day.getTime() + close * 3600e3 - 60e3), label: 'POS charges', account: 'bank', amountMinor: naira(Math.round((posTaken * POS_CHARGE) / CURRENCY.minorPerUnit)) });
  }
  // This till's branch holds the catalogue's own stock (its demo states depend on it);
  // every other branch holds one and a half to three months of what it sells.
  const stock: Record<string, Record<string, number>> = Object.fromEntries(BRANCHES.map((b) => [b.id,
    b.id === HOME_BRANCH
      ? Object.fromEntries(PRODUCTS.map((p) => [p.id, p.stock]))
      : Object.fromEntries(PRODUCTS.map((p) => [p.id, Math.max(4, Math.round(((sold[b.id][p.id] ?? 0) / 30) * (45 + rnd() * 45)))]))]));
  return { sales: sales.filter((s) => s.at <= now), expenses: expenses.filter((e) => e.at <= now), stock };
}

let books = seed(new Date());

/** What each branch holds, by product id: the Inventory card's source. */
export const stockHeld = (): Readonly<Record<string, Readonly<Record<string, number>>>> => books.stock;

/** A sale paid at this till: it lands in the books the Dashboard reads. */
export function recordSale(args: { at: Date; tender: 'cash' | 'pos' | 'bank'; lines: readonly CartLine[]; orderDiscount?: Parameters<typeof totals>[1] }) {
  const s = sale(args.at, HOME_BRANCH, args.tender, args.lines);
  const t = totals(args.lines, args.orderDiscount);
  books.sales.push({ ...s, totalMinor: t.total, vatMinor: t.tax });
}

/** Dev toolbar: a store with no sales yet today. */
export function setBooksForDemo(state: 'seeded' | 'quiet-today') {
  books = seed(new Date());
  if (state === 'quiet-today') {
    const midnight = new Date(); midnight.setHours(0, 0, 0, 0);
    books.sales = books.sales.filter((s) => s.at < midnight);
    books.expenses = books.expenses.filter((e) => e.at < midnight);
  }
}

/* --- Periods ------------------------------------------------------------------------ */
export type Period = 'today' | 'week' | 'month';
export const PERIODS: readonly { id: Period; label: string; short: string }[] = [
  { id: 'today', label: 'Today', short: 'Today' },
  { id: 'week', label: 'This week', short: 'This week' },
  { id: 'month', label: 'This month', short: 'This month' },
];

/** [from, to) for the period, and the same stretch of the one before it. */
export function periodRange(period: Period, now: Date): { from: Date; to: Date; prevFrom: Date; prevTo: Date } {
  const from = new Date(now); from.setHours(0, 0, 0, 0);
  if (period === 'week') from.setDate(from.getDate() - ((from.getDay() + 6) % 7)); // Monday
  if (period === 'month') from.setDate(1);
  const prevFrom = new Date(from);
  if (period === 'today') prevFrom.setDate(prevFrom.getDate() - 1);
  if (period === 'week') prevFrom.setDate(prevFrom.getDate() - 7);
  if (period === 'month') prevFrom.setMonth(prevFrom.getMonth() - 1);
  const prevTo = new Date(prevFrom.getTime() + (now.getTime() - from.getTime()));
  return { from, to: now, prevFrom, prevTo };
}

/* --- The Dashboard's figures ---------------------------------------------------------- */
export type LocationRow = { branch: Branch; salesMinor: number; changePct: number | null };
export type DashboardSummary = {
  period: Period;
  at: Date;
  salesMinor: number;
  expensesMinor: number;
  cogsMinor: number;
  /** Sales less VAT, less the cost of the goods, less expenses. */
  profitMinor: number;
  /** profit / sales, in percent; null with no sales. */
  marginPct: number | null;
  byTender: readonly { id: Tender; label: string; amountMinor: number }[];
  inventory: { stockMinor: number; retailMinor: number; markupPct: number; marginPct: number };
  /** Revenue is sales less VAT; expense is cost of goods plus expenses. */
  pnl: { revenueMinor: number; expenseMinor: number; revenuePct: number; expensePct: number; profitMinor: number };
  locations: readonly LocationRow[];
  cash: { receivedMinor: number; spentMinor: number; balanceMinor: number };
  bank: { receivedMinor: number; spentMinor: number; balanceMinor: number };
  currentBalanceMinor: number;
  /** Outstanding now, whatever the period: credit sales of the last 14 days, unpaid bills. */
  debtorsMinor: number;
  creditorsMinor: number;
  debtorsPct: number;
  creditorsPct: number;
};

const sum = <T,>(xs: readonly T[], f: (x: T) => number) => xs.reduce((a, x) => a + f(x), 0);
const pct = (part: number, whole: number) => (whole === 0 ? 0 : (part / whole) * 100);

export function summarise(period: Period, now = new Date()): DashboardSummary {
  const { from, to, prevFrom, prevTo } = periodRange(period, now);
  const inP = (at: Date) => at >= from && at <= to;
  const sales = books.sales.filter((s) => inP(s.at));
  const expenses = books.expenses.filter((e) => inP(e.at));

  const salesMinor = sum(sales, (s) => s.totalMinor);
  const vatMinor = sum(sales, (s) => s.vatMinor);
  const cogsMinor = sum(sales, (s) => s.costMinor);
  const expensesMinor = sum(expenses, (e) => e.amountMinor);
  const revenueMinor = salesMinor - vatMinor;
  const expenseMinor = cogsMinor + expensesMinor;
  const profitMinor = revenueMinor - expenseMinor;

  const held = (value: (p: Product) => number) =>
    sum(BRANCHES, (b) => sum(PRODUCTS, (p) => books.stock[b.id][p.id] * value(p)));
  const stockMinor = held((p) => p.costMinor);
  const retailMinor = held((p) => p.priceMinor);

  const branchSales = (f: Date, t: Date) => (id: string) =>
    sum(books.sales.filter((s) => s.branch === id && s.at >= f && s.at <= t), (s) => s.totalMinor);
  const now$ = branchSales(from, to);
  const prev$ = branchSales(prevFrom, prevTo);
  const locations = BRANCHES.map((branch) => {
    const salesMinor = now$(branch.id), before = prev$(branch.id);
    return { branch, salesMinor, changePct: before === 0 ? null : ((salesMinor - before) / before) * 100 };
  }).sort((a, b) => b.salesMinor - a.salesMinor).slice(0, 5);

  const flow = (account: 'cash' | 'bank', tenders: readonly Tender[]) => {
    const receivedMinor = sum(sales.filter((s) => tenders.includes(s.tender)), (s) => s.totalMinor);
    const spentMinor = sum(expenses.filter((e) => e.account === account), (e) => e.amountMinor);
    return { receivedMinor, spentMinor, balanceMinor: receivedMinor - spentMinor };
  };
  const cash = flow('cash', ['cash']);
  // A POS terminal settles into the store's bank account ("POS basically means bank").
  const bank = flow('bank', ['bank', 'pos']);

  const twoWeeks = new Date(now); twoWeeks.setDate(twoWeeks.getDate() - 14);
  const debtorsMinor = sum(books.sales.filter((s) => s.tender === 'credit' && s.at >= twoWeeks && s.at <= now), (s) => s.totalMinor);
  const creditorsMinor = sum(BILLS, (b) => b.amountMinor);

  return {
    period, at: now, salesMinor, expensesMinor, cogsMinor, profitMinor,
    marginPct: salesMinor === 0 ? null : pct(profitMinor, salesMinor),
    byTender: TENDERS.map((t) => ({ ...t, amountMinor: sum(sales.filter((s) => s.tender === t.id), (s) => s.totalMinor) })),
    inventory: { stockMinor, retailMinor, markupPct: pct(retailMinor - stockMinor, stockMinor), marginPct: pct(retailMinor - stockMinor, retailMinor) },
    pnl: {
      revenueMinor, expenseMinor, profitMinor,
      revenuePct: pct(revenueMinor, revenueMinor + expenseMinor),
      expensePct: pct(expenseMinor, revenueMinor + expenseMinor),
    },
    locations, cash, bank,
    currentBalanceMinor: cash.balanceMinor + bank.balanceMinor,
    debtorsMinor, creditorsMinor,
    debtorsPct: pct(debtorsMinor, debtorsMinor + creditorsMinor),
    creditorsPct: pct(creditorsMinor, debtorsMinor + creditorsMinor),
  };
}

/* --- Formats, as the frame writes them -------------------------------------------- */
/** "₦453,560" or, with kobo, "₦7,477,500,000.00". A loss reads "-₦12,000". */
export function formatNaira(minor: number, fractionDigits: 0 | 2 = 0): string {
  const major = Math.abs(minor) / CURRENCY.minorPerUnit;
  const s = CURRENCY.symbol + major.toLocaleString('en-NG', { minimumFractionDigits: fractionDigits, maximumFractionDigits: fractionDigits });
  return minor < 0 ? `-${s}` : s;
}
/** "64.34%", "+23.50%", "1000%". */
export function formatPct(value: number, { digits = 2, sign = false } = {}): string {
  const s = `${value.toFixed(digits)}%`;
  return sign && value >= 0 ? `+${s}` : s;
}
/** "7th May, 2025". */
export function formatLongDate(at: Date): string {
  const d = at.getDate();
  const suffix = d % 100 >= 11 && d % 100 <= 13 ? 'th' : ['th', 'st', 'nd', 'rd'][d % 10] ?? 'th';
  return `${d}${suffix} ${at.toLocaleString('en-GB', { month: 'long' })}, ${at.getFullYear()}`;
}
