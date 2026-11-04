/** Display formatting. Amounts appear at their real value, never animated (a11y-motion). */

const naira = new Intl.NumberFormat('en-NG', { maximumFractionDigits: 0 });

/** ₦15,000 — the currency is always explicit. */
export function formatNaira(amount: number): string {
  return `₦${naira.format(amount)}`;
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function parts(iso: string): [number, number, number] {
  const [y, m, d] = iso.split('-').map(Number);
  return [y, m, d];
}

/** 16 Aug — the celebration's and the attachment row's format. */
export function formatDayMonth(iso: string): string {
  const [, m, d] = parts(iso);
  return `${d} ${MONTHS[m - 1]}`;
}

/**
 * 16/08/2026 — the Date field's format. The frame shows "12/10/2026", which reads
 * as either 12 Oct or 10 Dec and agrees with neither "16 Aug" elsewhere; the field
 * keeps its DD/MM/YYYY shape and takes the record's one date.
 */
export function formatFieldDate(iso: string): string {
  const [y, m, d] = parts(iso);
  return `${String(d).padStart(2, '0')}/${String(m).padStart(2, '0')}/${y}`;
}

export function ordinal(n: number): string {
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return `${n}${s[(v - 20) % 10] ?? s[v] ?? s[0]}`;
}

/** "1 page · 86 KB" — the row's "3 pages · 2.4 MB" shape, in KB under a megabyte. */
export function formatPagesSize(pages: number, bytes: number): string {
  const size = bytes >= 1_000_000 ? `${(bytes / 1_000_000).toFixed(1)} MB` : `${Math.max(1, Math.round(bytes / 1000))} KB`;
  return `${pages} ${pages === 1 ? 'page' : 'pages'} · ${size}`;
}

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function clock(time: string): string {
  const [h, m] = time.split(':').map(Number);
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${String(m).padStart(2, '0')} ${h < 12 ? 'am' : 'pm'}`;
}

/**
 * "Sun 16 Aug, 9:00 am" — 9564:22008's shape. The weekday is computed: the frame says
 * "Sat 16 Aug", but 16 Aug 2026 is a Sunday.
 */
export function formatWeekdayDateTime(iso: string, time: string): string {
  const [y, m, d] = parts(iso);
  const day = DAYS[new Date(Date.UTC(y, m - 1, d)).getUTCDay()];
  return `${day} ${d} ${MONTHS[m - 1]}, ${clock(time)}`;
}

/** "16 Aug, 2026, 9:00 am" — 9564:22211's shape. */
export function formatLongDateTime(iso: string, time: string): string {
  const [y, m, d] = parts(iso);
  return `${d} ${MONTHS[m - 1]}, ${y}, ${clock(time)}`;
}

/** "16 Aug, 9:11 am" — 9564:22326's shape. */
export function formatDayMonthTime(iso: string, time: string): string {
  return `${formatDayMonth(iso)}, ${clock(time)}`;
}
