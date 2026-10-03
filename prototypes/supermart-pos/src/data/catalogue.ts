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
};

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

export const VAT_STANDARD_RATE = 0.075;

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

export function vatRateFor(product: Product): number {
  return product.taxClass === 'standard' ? VAT_STANDARD_RATE : 0;
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

export function findByBarcode(barcode: string): Product | undefined {
  return PRODUCTS.find((p) => p.barcode === barcode);
}
