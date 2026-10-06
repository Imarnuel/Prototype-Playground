/**
 * Freshvale Supermart product catalogue — the single source of truth for product
 * data, per CLAUDE.md section 4.
 *
 * This file feeds BOTH the prototype and the Figma frames: `npm run catalogue:csv`
 * emits a sheet for the Figma data-sync plugin from exactly these records. Never
 * retype a product name into Figma, and never edit the generated CSV — the two
 * would drift and the screens would stop matching the design.
 *
 * Everything here is a PACKAGED good: a boxed, bottled, canned, jarred or bagged
 * item with a printed barcode. Nothing is loose, fresh or weighed. That is a
 * deliberate scope choice, and it has two consequences worth knowing:
 *   - there is no per-kilogram pricing and no scale, so a line quantity is always
 *     a whole count of units;
 *   - every barcode carries the GS1 Nigeria manufacturer prefix 615. The in-store
 *     2x range exists for items a shop codes itself, which only applies to loose
 *     and weighed goods — so it has no place in this catalogue.
 *
 * Freshvale is a fictional store and every brand below is invented
 * (Zivra, Freshvale, Bluewell, Koloma, Palmrise, Verdane, Tiny Steps).
 * Nothing names a real product: a case study showing a real brand's packaging
 * reads as work you weren't engaged for.
 *
 * Money is stored as INTEGER minor units (kobo), never as a float. 0.1 + 0.2
 * arithmetic on prices is how demo receipts stop reconciling, and CLAUDE.md
 * section 4 requires totals that add up. Format with `formatPrice`.
 *
 * Barcodes are valid EAN-13, check digits included — verified by
 * `npm run catalogue:verify`.
 */

export type TaxClass = 'zero' | 'standard';

export type Category =
  | "Beverages"
  | "Snacks & Confectionery"
  | "Breakfast"
  | "Noodles & Pasta"
  | "Cooking & Baking"
  | "Canned & Jarred"
  | "Household & Cleaning"
  | "Personal Care"
  | "Baby";

export type Product = {
  id: string;
  /** Invented house or supplier brand. A POS card renders this above the name. */
  brand: string;
  /** Product name WITHOUT the pack size — the size is its own field. */
  name: string;
  /** Pack size as printed on the packaging: '500g', '50cl PET', '4-pack'. */
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
   * single unit. INVENTED, like the prices: this is a fictional store, so how many
   * bottles make a carton is a per-product choice, not a value from the design.
   * Zivra Cola carries the Quantity frame's own 1/4/8/16 so it can be compared
   * against that frame exactly.
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
 * ASSUMPTION — Nigerian Naira, 7.5% VAT, basic food zero-rated.
 *
 * Chosen because "supermart" and this price range put the POS somewhere mixed tax
 * classes are normal, which gives the receipt something real to show. If this
 * should be another currency, this block and the priceMinor values are the only
 * things that change — no component reads a currency symbol directly.
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

export const CATEGORY_ORDER: readonly Category[] = [
  "Beverages",
  "Snacks & Confectionery",
  "Breakfast",
  "Noodles & Pasta",
  "Cooking & Baking",
  "Canned & Jarred",
  "Household & Cleaning",
  "Personal Care",
  "Baby",
];

export const PRODUCTS: readonly Product[] = [
  {
    id: 'bev-cola',
    brand: 'Zivra',
    name: "Cola",
    size: '50cl PET',
    category: "Beverages",
    priceMinor: 50000,
    barcode: '6151000000010',
    taxClass: 'standard',
    stock: 74,
    units: units(['pack', 4], ['carton', 8], ['box', 16]),
    image: 'cola.webp',
  },
  {
    id: 'bev-lemonlime',
    brand: 'Zivra',
    name: "Lemon-Lime Soda",
    size: '50cl PET',
    category: "Beverages",
    priceMinor: 50000,
    barcode: '6151000000027',
    taxClass: 'standard',
    stock: 68,
    units: units(['pack', 6], ['carton', 12]),
    image: 'lemonlime.webp',
  },
  {
    id: 'bev-orangesoda',
    brand: 'Zivra',
    name: "Orange Soda",
    size: '50cl PET',
    category: "Beverages",
    priceMinor: 50000,
    barcode: '6151000000034',
    taxClass: 'standard',
    stock: 61,
    units: units(['pack', 6], ['carton', 12]),
    image: 'orangesoda.webp',
  },
  {
    id: 'bev-icedtea',
    brand: 'Zivra',
    name: "Iced Tea Lemon",
    size: '50cl PET',
    category: "Beverages",
    priceMinor: 80000,
    barcode: '6151000000041',
    taxClass: 'standard',
    stock: 44,
    units: units(['pack', 6], ['carton', 12]),
    image: 'icedtea.webp',
  },
  {
    id: 'bev-energy',
    brand: 'Zivra',
    name: "Energy Drink",
    size: '25cl Can',
    category: "Beverages",
    priceMinor: 90000,
    barcode: '6151000000058',
    taxClass: 'standard',
    stock: 35,
    units: units(['pack', 4], ['carton', 24]),
    image: 'energy.webp',
  },
  {
    id: 'bev-water75',
    brand: 'Freshvale',
    name: "Still Water",
    size: '75cl',
    category: "Beverages",
    priceMinor: 30000,
    barcode: '6151000000065',
    taxClass: 'standard',
    stock: 96,
    units: units(['pack', 12]),
    image: 'water75.webp',
  },
  {
    id: 'bev-water15',
    brand: 'Freshvale',
    name: "Still Water",
    size: '1.5L',
    category: "Beverages",
    priceMinor: 60000,
    barcode: '6151000000072',
    taxClass: 'standard',
    stock: 52,
    units: units(['pack', 6]),
    image: 'water15.webp',
  },
  {
    id: 'bev-sparkling',
    brand: 'Freshvale',
    name: "Sparkling Water",
    size: '50cl',
    category: "Beverages",
    priceMinor: 70000,
    barcode: '6151000000089',
    taxClass: 'standard',
    stock: 38,
    units: units(['pack', 6], ['carton', 24]),
    image: 'sparkling.webp',
  },
  {
    id: 'bev-orangejuice',
    brand: 'Bluewell',
    name: "Orange Juice",
    size: '1L Carton',
    category: "Beverages",
    priceMinor: 250000,
    barcode: '6151000000096',
    taxClass: 'standard',
    stock: 23,
    units: units(['pack', 6]),
    image: 'orangejuice.webp',
  },
  {
    id: 'bev-pinejuice',
    brand: 'Bluewell',
    name: "Pineapple Juice",
    size: '1L Carton',
    category: "Beverages",
    priceMinor: 250000,
    barcode: '6151000000102',
    taxClass: 'standard',
    stock: 19,
    units: units(['pack', 6]),
    image: 'pinejuice.webp',
  },
  {
    id: 'bev-applejuice',
    brand: 'Bluewell',
    name: "Apple Juice",
    size: '1L Carton',
    category: "Beverages",
    priceMinor: 250000,
    barcode: '6151000000119',
    taxClass: 'standard',
    stock: 0,
    units: units(['pack', 6]),
    image: 'applejuice.webp',
  },
  {
    id: 'bev-malt',
    brand: 'Koloma',
    name: "Malt Drink",
    size: '33cl Can',
    category: "Beverages",
    priceMinor: 70000,
    barcode: '6151000000126',
    taxClass: 'standard',
    stock: 3,
    units: units(['pack', 6], ['carton', 24]),
    image: 'malt.webp',
  },
  {
    id: 'snk-crisps',
    brand: 'Koloma',
    name: "Potato Crisps Salted",
    size: '50g',
    category: "Snacks & Confectionery",
    priceMinor: 70000,
    barcode: '6152000000017',
    taxClass: 'standard',
    stock: 82,
    units: units(['box', 24]),
    image: 'crisps.webp',
  },
  {
    id: 'snk-plantain',
    brand: 'Koloma',
    name: "Plantain Chips",
    size: '100g',
    category: "Snacks & Confectionery",
    priceMinor: 100000,
    barcode: '6152000000024',
    taxClass: 'standard',
    stock: 67,
    units: units(['box', 20]),
    image: 'plantain.webp',
  },
  {
    id: 'snk-choc',
    brand: 'Koloma',
    name: "Dark Chocolate 70%",
    size: '80g',
    category: "Snacks & Confectionery",
    priceMinor: 350000,
    barcode: '6152000000031',
    taxClass: 'standard',
    stock: 1,
    units: units(['box', 24]),
    image: 'choc.webp',
  },
  {
    id: 'snk-digestive',
    brand: 'Bluewell',
    name: "Digestive Biscuits",
    size: '250g',
    category: "Snacks & Confectionery",
    priceMinor: 220000,
    barcode: '6152000000048',
    taxClass: 'standard',
    stock: 41,
    units: units(['carton', 12]),
    image: 'digestive.webp',
  },
  {
    id: 'snk-peanuts',
    brand: 'Koloma',
    name: "Salted Peanuts",
    size: '150g',
    category: "Snacks & Confectionery",
    priceMinor: 150000,
    barcode: '6152000000055',
    taxClass: 'standard',
    stock: 56,
    units: units(['box', 24]),
    image: 'peanuts.webp',
  },
  {
    id: 'brk-cornflakes',
    brand: 'Bluewell',
    name: "Corn Flakes",
    size: '500g',
    category: "Breakfast",
    priceMinor: 480000,
    barcode: '6153000000014',
    taxClass: 'zero',
    stock: 26,
    units: units(['carton', 12]),
    image: 'cornflakes.webp',
  },
  {
    id: 'brk-oats',
    brand: 'Bluewell',
    name: "Rolled Oats",
    size: '1kg',
    category: "Breakfast",
    priceMinor: 520000,
    barcode: '6153000000021',
    taxClass: 'zero',
    stock: 21,
    units: units(['carton', 12]),
    image: 'oats.webp',
  },
  {
    id: 'brk-milkpowder',
    brand: 'Bluewell',
    name: "Full Cream Milk Powder",
    size: '900g Tin',
    category: "Breakfast",
    priceMinor: 1150000,
    barcode: '6153000000038',
    taxClass: 'zero',
    stock: 14,
    units: units(['carton', 12]),
    image: 'milkpowder.webp',
  },
  {
    id: 'brk-maltpowder',
    brand: 'Bluewell',
    name: "Chocolate Malt Drink Powder",
    size: '400g Tin',
    category: "Breakfast",
    priceMinor: 420000,
    barcode: '6153000000045',
    taxClass: 'standard',
    stock: 29,
    units: units(['carton', 12]),
    image: 'maltpowder.webp',
  },
  {
    id: 'brk-teabags',
    brand: 'Freshvale',
    name: "Tea Bags",
    size: '50 bags',
    category: "Breakfast",
    priceMinor: 260000,
    barcode: '6153000000052',
    taxClass: 'zero',
    stock: 33,
    units: units(['carton', 24]),
    image: 'teabags.webp',
  },
  {
    id: 'noo-single',
    brand: 'Koloma',
    name: "Instant Noodles Chicken",
    size: '70g',
    category: "Noodles & Pasta",
    priceMinor: 35000,
    barcode: '6154000000011',
    taxClass: 'zero',
    stock: 120,
    units: units(['pack', 5], ['carton', 40]),
    image: 'single.webp',
  },
  {
    id: 'noo-multipack',
    brand: 'Koloma',
    name: "Instant Noodles",
    size: '10-pack',
    category: "Noodles & Pasta",
    priceMinor: 320000,
    barcode: '6154000000028',
    taxClass: 'zero',
    stock: 37,
    units: units(['carton', 8]),
    image: 'multipack.webp',
  },
  {
    id: 'noo-spaghetti',
    brand: 'Palmrise',
    name: "Spaghetti",
    size: '500g',
    category: "Noodles & Pasta",
    priceMinor: 140000,
    barcode: '6154000000035',
    taxClass: 'zero',
    stock: 52,
    units: units(['carton', 20]),
    image: 'spaghetti.webp',
  },
  {
    id: 'noo-macaroni',
    brand: 'Palmrise',
    name: "Macaroni",
    size: '400g',
    category: "Noodles & Pasta",
    priceMinor: 160000,
    barcode: '6154000000042',
    taxClass: 'zero',
    stock: 44,
    units: units(['carton', 20]),
    image: 'macaroni.webp',
  },
  {
    id: 'cok-oil',
    brand: 'Palmrise',
    name: "Vegetable Oil",
    size: '3L Bottle',
    category: "Cooking & Baking",
    priceMinor: 1100000,
    wasPriceMinor: 1250000,
    barcode: '6155000000018',
    taxClass: 'zero',
    stock: 17,
    units: units(['carton', 4]),
    image: 'oil.webp',
  },
  {
    id: 'cok-paste',
    brand: 'Palmrise',
    name: "Tomato Paste",
    size: '400g Tin',
    category: "Cooking & Baking",
    priceMinor: 180000,
    barcode: '6155000000025',
    taxClass: 'zero',
    stock: 64,
    units: units(['carton', 24]),
    image: 'paste.webp',
  },
  {
    id: 'cok-flour',
    brand: 'Freshvale',
    name: "All-Purpose Flour",
    size: '1kg',
    category: "Cooking & Baking",
    priceMinor: 220000,
    barcode: '6155000000032',
    taxClass: 'zero',
    stock: 29,
    units: units(['carton', 10]),
    image: 'flour.webp',
  },
  {
    id: 'cok-sugar',
    brand: 'Freshvale',
    name: "Granulated Sugar",
    size: '1kg',
    category: "Cooking & Baking",
    priceMinor: 220000,
    barcode: '6155000000049',
    taxClass: 'zero',
    stock: 31,
    units: units(['carton', 10]),
    image: 'sugar.webp',
  },
  {
    id: 'cok-salt',
    brand: 'Freshvale',
    name: "Iodised Table Salt",
    size: '500g',
    category: "Cooking & Baking",
    priceMinor: 50000,
    barcode: '6155000000056',
    taxClass: 'zero',
    stock: 48,
    units: units(['carton', 20]),
    image: 'salt.webp',
  },
  {
    id: 'can-beans',
    brand: 'Palmrise',
    name: "Baked Beans in Tomato Sauce",
    size: '400g Tin',
    category: "Canned & Jarred",
    priceMinor: 240000,
    barcode: '6156000000015',
    taxClass: 'zero',
    stock: 38,
    units: units(['carton', 24]),
    image: 'beans.webp',
  },
  {
    id: 'can-sardines',
    brand: 'Palmrise',
    name: "Sardines in Tomato Sauce",
    size: '125g Tin',
    category: "Canned & Jarred",
    priceMinor: 150000,
    barcode: '6156000000022',
    taxClass: 'zero',
    stock: 72,
    units: units(['carton', 50]),
    image: 'sardines.webp',
  },
  {
    id: 'can-sweetcorn',
    brand: 'Palmrise',
    name: "Sweetcorn",
    size: '340g Tin',
    category: "Canned & Jarred",
    priceMinor: 200000,
    barcode: '6156000000039',
    taxClass: 'zero',
    stock: 26,
    units: units(['carton', 24]),
    image: null,
  },
  {
    id: 'can-mayo',
    brand: 'Bluewell',
    name: "Mayonnaise",
    size: '430ml Jar',
    category: "Canned & Jarred",
    priceMinor: 380000,
    barcode: '6156000000046',
    taxClass: 'standard',
    stock: 23,
    units: units(['carton', 12]),
    image: 'mayo.webp',
  },
  {
    id: 'hse-detergent',
    brand: 'Verdane',
    name: "Unscented Antibacterial Laundry Detergent Powder",
    size: '900g',
    category: "Household & Cleaning",
    priceMinor: 420000,
    barcode: '6157000000012',
    taxClass: 'standard',
    stock: 25,
    units: units(['carton', 12]),
    image: 'detergent.webp',
  },
  {
    id: 'hse-dishliquid',
    brand: 'Verdane',
    name: "Dishwashing Liquid Lemon",
    size: '500ml',
    category: "Household & Cleaning",
    priceMinor: 240000,
    barcode: '6157000000029',
    taxClass: 'standard',
    stock: 39,
    units: units(['carton', 12]),
    image: 'dishliquid.webp',
  },
  {
    id: 'hse-tissue',
    brand: 'Freshvale',
    name: "Toilet Tissue",
    size: '4-pack',
    category: "Household & Cleaning",
    priceMinor: 300000,
    wasPriceMinor: 360000,
    barcode: '6157000000036',
    taxClass: 'standard',
    stock: 58,
    units: units(['carton', 6]),
    image: 'tissue.webp',
  },
  {
    id: 'hse-bleach',
    brand: 'Verdane',
    name: "Multi-Surface Bleach",
    size: '750ml',
    category: "Household & Cleaning",
    priceMinor: 220000,
    barcode: '6157000000043',
    taxClass: 'standard',
    stock: 44,
    units: units(['carton', 12]),
    image: 'bleach.webp',
  },
  {
    id: 'per-toothpaste',
    brand: 'Verdane',
    name: "Toothpaste Fresh Mint",
    size: '140g',
    category: "Personal Care",
    priceMinor: 280000,
    barcode: '6158000000019',
    taxClass: 'standard',
    stock: 51,
    units: units(['pack', 3], ['carton', 36]),
    image: 'toothpaste.webp',
  },
  {
    id: 'per-soap',
    brand: 'Verdane',
    name: "Moisturising Bar Soap",
    size: '175g',
    category: "Personal Care",
    priceMinor: 100000,
    barcode: '6158000000026',
    taxClass: 'standard',
    stock: 88,
    units: units(['pack', 6], ['carton', 48]),
    image: 'soap.webp',
  },
  {
    id: 'per-shampoo',
    brand: 'Verdane',
    name: "Anti-Dandruff Shampoo",
    size: '400ml',
    category: "Personal Care",
    priceMinor: 750000,
    barcode: '6158000000033',
    taxClass: 'standard',
    stock: 18,
    units: units(['carton', 12]),
    image: 'shampoo.webp',
  },
  {
    id: 'bby-wipes',
    brand: 'Tiny Steps',
    name: "Baby Wipes",
    size: '72 wipes',
    category: "Baby",
    priceMinor: 380000,
    barcode: '6159000000016',
    taxClass: 'standard',
    stock: 31,
    units: units(),
    image: 'wipes.webp',
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
 * Discount on one line, whole Naira. A percent rounds half-up using integers only:
 * floor((naira x p + 50) / 100). An amount is clamped to the line so a line can
 * never go below zero.
 */
export function lineDiscountMinor(line: PricedLine): number {
  const d = line.discount;
  if (!d) return 0;
  const gross = lineGrossMinor(line);
  if (d.kind === 'amount') {
    requireWholeNaira(d.minor, 'a discount');
    return Math.min(d.minor, gross);
  }
  if (!Number.isInteger(d.percent) || d.percent < 0 || d.percent > 100) {
    throw new Error(`a percent discount must be a whole number from 0 to 100, got ${d.percent}`);
  }
  return Math.floor(((gross / MINOR) * d.percent + 50) / 100) * MINOR;
}

/** VAT on the line AFTER its discount, in kobo, rounded half-up per line. */
export function lineTaxMinor(line: PricedLine): number {
  const net = lineGrossMinor(line) - lineDiscountMinor(line);
  return Math.floor((net * vatBpFor(line.product) + 5_000) / 10_000);
}

export type OrderTotals = { subtotal: number; discount: number; tax: number; total: number };

/**
 * Subtotal is the sum of line GROSS, which is what each Cart line displays, so the
 * lines visibly add up to it. Tax is summed per line in kobo and then rounded ONCE to
 * a whole Naira for the order: without that the payable total is fractional (Cola
 * ₦500 carries 3750 kobo of VAT, a total of ₦537.50 shown as "₦538", and paying ₦538
 * leaves 50 kobo of change shown as "₦1"). With it, subtotal - discount + tax = total
 * holds exactly, in kobo and on screen.
 */
export function orderTotals(lines: readonly PricedLine[]): OrderTotals {
  let subtotal = 0;
  let discount = 0;
  let taxKobo = 0;
  for (const line of lines) {
    subtotal += lineGrossMinor(line);
    discount += lineDiscountMinor(line);
    taxKobo += lineTaxMinor(line);
  }
  const tax = Math.floor((taxKobo + MINOR / 2) / MINOR) * MINOR;
  return { subtotal, discount, tax, total: subtotal - discount + tax };
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
