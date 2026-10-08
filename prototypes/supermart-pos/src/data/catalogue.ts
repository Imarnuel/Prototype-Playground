/**
 * Freshvale product catalogue — the single source of truth for product data, per
 * CLAUDE.md section 4.
 *
 * This file feeds BOTH the prototype and the Figma frames: `npm run catalogue:csv`
 * emits a sheet for the Figma data-sync plugin from exactly these records. Never
 * retype a product name into Figma, and never edit the generated CSV.
 *
 * Freshvale sells CLOTHING AND WEARABLES. It started as a packaged-goods supermart;
 * it changed because the grid needs photographs, no stock library is reachable from
 * this environment, and generated photos of packaged goods put garbled text on every
 * label. A garment has no label to garble, so one fixed prompt gives ten shots that
 * match (see CLAUDE.md, "Product images"). The screens' structure is unchanged.
 *
 * Every item is a counted unit with a printed barcode, so a line quantity is always a
 * whole count and every barcode carries the GS1 Nigeria manufacturer prefix 615.
 *
 * Freshvale is a fictional store and every brand below is invented (Freshvale,
 * Northline, Kora). Nothing names a real product.
 *
 * Money is stored as INTEGER minor units (kobo), never as a float. Format with
 * `formatPrice`. Barcodes are valid EAN-13 — verified by `npm run catalogue:verify`.
 */

export type TaxClass = 'zero' | 'standard';

export type Category = "Tops" | "Bottoms" | "Footwear" | "Accessories" | "Bags";

export type Product = {
  id: string;
  /** Invented house or supplier brand. A POS card renders this above the name. */
  brand: string;
  /** Product name WITHOUT the pack size — the size is its own field. */
  name: string;
  /** Garment size as printed on the tag: 'M', '32W', 'UK 9', 'One size'. */
  size: string;
  category: Category;
  priceMinor: number;
  /** Set only when discounted; renders as a struck-through was-price. */
  wasPriceMinor?: number;
  barcode: string;
  taxClass: TaxClass;
  stock: number;
  /** Filename under assets/products/, or null where no photo exists. */
  image: string | null;
  /**
   * The pack sizes this product is sold in, smallest first. Always starts with the
   * single unit. INVENTED, like the prices. Freshvale Crew Socks carry the Quantity
   * frame's own 1/4/8/16 so they can be compared against that frame exactly.
   */
  units: readonly PackUnit[];
};

export type UnitId = 'each' | 'pack' | 'carton' | 'box';

/** One sellable pack size. `each` is how many single units it holds. */
export type PackUnit = {
  readonly id: UnitId;
  readonly label: string;
  readonly abbrev: string;
  readonly each: number;
};

/* Labels are the Quantity frame's (`88:11532`). Of the abbreviations only "ea" and
   "pck" appear anywhere in the design; "ctn" and "box" are invented to match. */
const UNIT_NAMES: Record<UnitId, { label: string; abbrev: string }> = {
  each: { label: 'Each', abbrev: 'ea' },
  pack: { label: 'Pack', abbrev: 'pck' },
  carton: { label: 'Carton', abbrev: 'ctn' },
  box: { label: 'Box', abbrev: 'box' },
};

function units(...packs: [UnitId, number][]): readonly PackUnit[] {
  return [
    { id: 'each', ...UNIT_NAMES.each, each: 1 },
    ...packs.map(([id, each]) => ({ id, ...UNIT_NAMES[id], each })),
  ];
}

/**
 * ASSUMPTION — Nigerian Naira, 7.5% VAT. Clothing is standard-rated, so every line
 * carries VAT; `taxClass` stays because the money model handles zero-rated lines and
 * its verifier still proves them. If this should be another currency, this block and
 * the priceMinor values are the only things that change.
 */
export const CURRENCY = {
  code: 'NGN',
  symbol: '\u20a6',
  minorPerUnit: 100,
  /** Kobo is defunct in practice; whole Naira is what a till displays. */
  displayFractionDigits: 0,
} as const;

/* Held in basis points so tax is integer arithmetic; the rate is derived from it. */
export const VAT_STANDARD_BP = 750;
export const VAT_STANDARD_RATE = VAT_STANDARD_BP / 10_000;

/**
 * At or below this count a stock figure renders as a warning rather than normal.
 *
 * INTERPRETED. The Sales Point frame shows 32 as normal, 2 as warning and 0 as
 * danger, which only bounds the threshold to somewhere in 3..31; 5 is a reasonable
 * shop threshold, not a value read from the frame.
 *
 * It lives here rather than in the card because the seed data has to be able to
 * REACH the state: `catalogue:verify` asserts a low-stock product exists, which it
 * can only do against the same number the card renders from.
 */
export const LOW_STOCK_AT = 5;

export const CATEGORY_ORDER: readonly Category[] = ["Tops", "Bottoms", "Footwear", "Accessories", "Bags"];

export const PRODUCTS: readonly Product[] = [
  {
    // A three-pack is how plain tees are usually sold.
    id: 'tops-tee',
    brand: 'Freshvale',
    name: "Organic Cotton Tee",
    size: 'M',
    category: "Tops",
    priceMinor: 850000,
    barcode: '6153000000014',
    taxClass: 'standard',
    stock: 40,
    units: units(['pack', 3]),
    image: 'tee.webp',
  },
  {
    id: 'tops-oxford',
    brand: 'Northline',
    name: "Oxford Shirt",
    size: 'L',
    category: "Tops",
    priceMinor: 1850000,
    barcode: '6153000000021',
    taxClass: 'standard',
    stock: 22,
    units: units(),
    image: 'oxford.webp',
  },
  {
    id: 'tops-hoodie',
    brand: 'Kora',
    name: "Fleece Hoodie",
    size: 'M',
    category: "Tops",
    priceMinor: 2600000,
    barcode: '6153000000038',
    taxClass: 'standard',
    stock: 14,
    units: units(),
    image: 'hoodie.webp',
  },
  {
    // 48 characters: the long name that forces truncation.
    id: 'tops-rainjacket',
    brand: 'Northline',
    name: "Water-Repellent Lightweight Packable Rain Jacket",
    size: 'M',
    category: "Tops",
    priceMinor: 3950000,
    barcode: '6153000000045',
    taxClass: 'standard',
    stock: 9,
    units: units(),
    image: 'rainjacket.webp',
  },
  {
    // The discounted item.
    id: 'btm-jeans',
    brand: 'Freshvale',
    name: "Slim Denim Jeans",
    size: '32W',
    category: "Bottoms",
    priceMinor: 2400000,
    wasPriceMinor: 2800000,
    barcode: '6153000000052',
    taxClass: 'standard',
    stock: 18,
    units: units(),
    image: 'jeans.webp',
  },
  {
    // Out of stock, and the top of the price range.
    id: 'ftw-sneakers',
    brand: 'Kora',
    name: "Leather Sneakers",
    size: 'UK 9',
    category: "Footwear",
    priceMinor: 4500000,
    barcode: '6153000000069',
    taxClass: 'standard',
    stock: 0,
    units: units(),
    image: 'sneakers.webp',
  },
  {
    // The Quantity frame's own 1/4/8/16, with stock for 10 boxes of 16. Also the bottom of
    // the price range (3 digits), and an odd price that exercises half-up rounding.
    id: 'acc-socks',
    brand: 'Freshvale',
    name: "Crew Socks",
    size: 'One size',
    category: "Accessories",
    priceMinor: 95000,
    barcode: '6153000000076',
    taxClass: 'standard',
    stock: 180,
    units: units(['pack', 4], ['carton', 8], ['box', 16]),
    image: 'socks.webp',
  },
  {
    id: 'acc-cap',
    brand: 'Northline',
    name: "Baseball Cap",
    size: 'One size',
    category: "Accessories",
    priceMinor: 750000,
    barcode: '6153000000083',
    taxClass: 'standard',
    stock: 30,
    units: units(),
    image: 'cap.webp',
  },
  {
    // Low stock (3), sold in a pack of 6 the shelf cannot fill once.
    id: 'acc-beanie',
    brand: 'Kora',
    name: "Wool Beanie",
    size: 'One size',
    category: "Accessories",
    priceMinor: 600000,
    barcode: '6153000000090',
    taxClass: 'standard',
    stock: 3,
    units: units(['pack', 6]),
    image: 'beanie.webp',
  },
  {
    // Sold singly only: no Measurement list.
    id: 'bag-tote',
    brand: 'Freshvale',
    name: "Canvas Tote",
    size: 'One size',
    category: "Bags",
    priceMinor: 550000,
    barcode: '6153000000106',
    taxClass: 'standard',
    stock: 25,
    units: units(),
    image: 'tote.webp',
  },
];

/** Derived from PRODUCTS, not a parallel array (CLAUDE.md section 4). */
export const CATEGORIES: readonly { name: Category; count: number }[] = CATEGORY_ORDER.map(
  (name) => ({ name, count: PRODUCTS.filter((p) => p.category === name).length }),
);

export const BRANDS: readonly string[] = [...new Set(PRODUCTS.map((p) => p.brand))].sort();

export function formatPrice(minor: number): string {
  const major = minor / CURRENCY.minorPerUnit;
  return (
    CURRENCY.symbol +
    major.toLocaleString('en-NG', {
      minimumFractionDigits: CURRENCY.displayFractionDigits,
      maximumFractionDigits: CURRENCY.displayFractionDigits,
    })
  );
}

/** Brand, name and size as one string — for a receipt line or a search result. */
export function fullName(product: Product): string {
  return `${product.brand} ${product.name} ${product.size}`;
}

/**
 * Line total in minor units for `quantity` units of `product`.
 *
 * Quantity is a whole count — nothing in this catalogue is weighed — so this is
 * exact integer arithmetic with nothing to round. That is the property that keeps
 * a printed receipt's lines summing to its own total.
 */
export function lineTotalMinor(product: Product, quantity: number): number {
  if (!Number.isInteger(quantity)) {
    throw new Error(`quantity must be a whole number of units, got ${quantity}`);
  }
  return product.priceMinor * quantity;
}

/* ---------------------------------------------------------------------------
 * Order money. Lives here, beside `lineTotalMinor` and `formatPrice`, because this
 * module is the one both the app and `scripts/verify-catalogue.mjs` can import —
 * Node's type stripping cannot resolve an extensionless relative import, so a
 * separate money module that needed these constants could not be verified. One
 * implementation, two callers: the verifier checks the app's own arithmetic.
 *
 * Every amount is integer kobo, and every amount a person sees or pays is a WHOLE
 * Naira, because CURRENCY displays no fraction digits. That rules out floats
 * everywhere below: a float percent discount returns ₦241 for 69% of ₦350, where
 * the answer is ₦242.
 * ------------------------------------------------------------------------- */

const MINOR = CURRENCY.minorPerUnit;

export function vatBpFor(product: Product): number {
  return product.taxClass === 'standard' ? VAT_STANDARD_BP : 0;
}

export function unitFor(product: Product, unitId: UnitId): PackUnit {
  const unit = product.units.find((u) => u.id === unitId);
  if (!unit) throw new Error(`${product.id} is not sold by the ${unitId}`);
  return unit;
}

/** The most of `unitId` the shelf can supply. Stock is held in single units. */
export function maxCount(product: Product, unitId: UnitId): number {
  return Math.floor(product.stock / unitFor(product, unitId).each);
}

export type Discount =
  | { kind: 'percent'; percent: number }
  | { kind: 'amount'; minor: number };

/** A cart line with its product resolved — what every money function takes. */
export type PricedLine = {
  product: Product;
  unitId: UnitId;
  count: number;
  /** Price per unit, in the line's own unit. */
  priceOverrideMinor?: number;
  discount?: Discount;
};

function requireWholeNaira(minor: number, what: string): void {
  if (!Number.isInteger(minor) || minor % MINOR !== 0) {
    throw new Error(`${what} must be a whole number of Naira, got ${minor} kobo`);
  }
}

/** Price of one of the line's units: the override if set, else catalogue x pack size. */
export function unitPriceMinor(line: Pick<PricedLine, 'product' | 'unitId' | 'priceOverrideMinor'>): number {
  return line.priceOverrideMinor ?? line.product.priceMinor * unitFor(line.product, line.unitId).each;
}

export function lineGrossMinor(line: PricedLine): number {
  if (line.priceOverrideMinor === undefined) {
    return lineTotalMinor(line.product, line.count * unitFor(line.product, line.unitId).each);
  }
  requireWholeNaira(line.priceOverrideMinor, 'a price override');
  if (!Number.isInteger(line.count)) {
    throw new Error(`count must be a whole number of units, got ${line.count}`);
  }
  return line.priceOverrideMinor * line.count;
}

/**
 * A discount taken off `baseMinor`, whole Naira. A percent rounds half-up using
 * integers only: floor((naira x p + 50) / 100). An amount is clamped to the base so
 * nothing can go below zero. One rule for a line's discount and the order's.
 */
function discountOnMinor(baseMinor: number, d: Discount): number {
  if (d.kind === 'amount') {
    requireWholeNaira(d.minor, 'a discount');
    return Math.min(d.minor, baseMinor);
  }
  if (!Number.isInteger(d.percent) || d.percent < 0 || d.percent > 100) {
    throw new Error(`a percent discount must be a whole number from 0 to 100, got ${d.percent}`);
  }
  return Math.floor(((baseMinor / MINOR) * d.percent + 50) / 100) * MINOR;
}

/** Discount on one line, off its gross. */
export function lineDiscountMinor(line: PricedLine): number {
  return line.discount ? discountOnMinor(lineGrossMinor(line), line.discount) : 0;
}

/** What a line comes to after its own discount: the base an order discount is taken from. */
export function lineNetMinor(line: PricedLine): number {
  return lineGrossMinor(line) - lineDiscountMinor(line);
}

/**
 * VAT on the line AFTER its discount, in kobo, rounded half-up per line.
 * `orderShareMinor` is the line's part of an order discount, which also comes off
 * before VAT: VAT is charged on what is collected, not on the list price.
 */
export function lineTaxMinor(line: PricedLine, orderShareMinor = 0): number {
  const net = lineNetMinor(line) - orderShareMinor;
  return Math.floor((net * vatBpFor(line.product) + 5_000) / 10_000);
}

/**
 * Splits a whole-Naira order discount across lines in proportion to each line's net,
 * in whole Naira, by largest remainder (ties to the earlier line), so the parts sum
 * to the discount exactly and no line's share exceeds its net.
 */
export function allocateOrderDiscountMinor(discountMinor: number, netsMinor: readonly number[]): number[] {
  const base = netsMinor.reduce((a, n) => a + n, 0);
  if (discountMinor === 0 || base === 0) return netsMinor.map(() => 0);
  const naira = discountMinor / MINOR;
  const parts = netsMinor.map((n, i) => ({ i, whole: Math.floor((naira * n) / base), rem: (naira * n) % base }));
  let left = naira - parts.reduce((a, p) => a + p.whole, 0);
  for (const p of [...parts].sort((a, b) => b.rem - a.rem || a.i - b.i)) {
    if (left === 0) break;
    p.whole++; left--;
  }
  return parts.map((p) => p.whole * MINOR);
}

export type OrderTotals = {
  subtotal: number;
  /** Line discounts plus the order discount: the one Discount the breakdown shows. */
  discount: number;
  /** The order discount's part of `discount`, as applied — after any clamp. */
  orderDiscount: number;
  tax: number;
  total: number;
};

/**
 * Subtotal is the sum of line GROSS, which is what each Cart line displays, so the
 * lines visibly add up to it. Tax is summed per line in kobo and then rounded ONCE to
 * a whole Naira for the order: without that the payable total is fractional (a ₦500
 * line carries 3750 kobo of VAT, a total of ₦537.50 shown as "₦538", and paying ₦538
 * leaves 50 kobo of change shown as "₦1"). With it, subtotal - discount + tax = total
 * holds exactly, in kobo and on screen.
 *
 * An order discount comes off what the lines come to AFTER their own discounts, and
 * before VAT, so each line's VAT is on its share of the money actually collected.
 * An amount larger than that is clamped to it here, at computation, and not stored
 * clamped: the order is still being built, and emptying it to swap one line must not
 * quietly shrink a discount the cashier agreed. What is shown is always the clamp.
 */
export function orderTotals(lines: readonly PricedLine[], orderDiscount?: Discount): OrderTotals {
  const nets = lines.map(lineNetMinor);
  const base = nets.reduce((a, n) => a + n, 0);
  const applied = orderDiscount ? discountOnMinor(base, orderDiscount) : 0;
  const shares = allocateOrderDiscountMinor(applied, nets);
  let subtotal = 0;
  let discount = applied;
  let taxKobo = 0;
  lines.forEach((line, i) => {
    subtotal += lineGrossMinor(line);
    discount += lineDiscountMinor(line);
    taxKobo += lineTaxMinor(line, shares[i]);
  });
  const tax = Math.floor((taxKobo + MINOR / 2) / MINOR) * MINOR;
  return { subtotal, discount, orderDiscount: applied, tax, total: subtotal - discount + tax };
}

/** For amounts that can be negative, like a discount: "−₦53", never "₦-53" or "₦-0". */
export function formatSignedPrice(minor: number): string {
  if (minor === 0) return formatPrice(0);
  return minor < 0 ? `\u2212${formatPrice(-minor)}` : formatPrice(minor);
}

/*
 * Parsers for what a person types. Digits only, matched as text: `Number("1e2")` is
 * 100 and passes an integer check, `parseFloat("1.15") * 100` is 114.99999999999999.
 * Each returns null for anything it will not accept, and the caller shows why.
 */
export function parseCount(text: string): number | null {
  if (!/^\d{1,6}$/.test(text)) return null;
  const n = Number(text);
  return n >= 1 ? n : null;
}

export function parseWholeNaira(text: string): number | null {
  if (!/^\d{1,9}$/.test(text)) return null;
  return Number(text) * MINOR;
}

export function parsePercent(text: string): number | null {
  if (!/^\d{1,3}$/.test(text)) return null;
  const n = Number(text);
  return n <= 100 ? n : null;
}

export function findByBarcode(barcode: string): Product | undefined {
  return PRODUCTS.find((p) => p.barcode === barcode);
}
