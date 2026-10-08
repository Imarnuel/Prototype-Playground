# Populating the Figma frames

`catalogue.csv` here is **generated** from `../src/data/catalogue.ts`. Do not edit it,
and do not retype product names into Figma. One list, two consumers — if the design
and the prototype ever disagree about a product name, that is visible in the deck.

```bash
npm run catalogue:csv
```

## Why the main component won't help

Product cards are component instances, and each card shows a different name — so each
has a **per-instance text override**. Overrides win over the main component, which is
why editing the component does not propagate and why this feels impossible by hand.
Bulk-populating is the way through, not more clicking.

## Method

A data-sync plugin (Google Sheets Sync, Sheet Data, or similar) maps a **layer name**
to a **column header**. The CSV's headers are chosen to be used as layer names
directly:

| Column | Layer it fills | Notes |
|---|---|---|
| `brand` | brand text | invented house/supplier brand |
| `name` | product name text | pack size is NOT in here |
| `size` | pack size text | `500g`, `50cl PET`, `4-pack` |
| `fullName` | combined name layer | brand + name + size, if the card uses one layer |
| `category` | section header text | |
| `price` | price text | |
| `wasPrice` | struck-through price | empty except on the 2 discounted items |
| `barcode` | barcode label | valid EAN-13, all on the 615 prefix |
| `stock` | stock badge | |
| `status` | status pill | `In stock` / `Out of stock` / `Offer` |
| `image` | image fill | filename; point the plugin at `../assets/products/` |
| `id` | — | join key, not for display |

Both layouts are covered: use `brand`/`name`/`size` if the card has three text
layers, or `fullName` if it has one. Don't map both.

Rename the card's text layers to match these headers once, then one run fills every
instance across every frame.

## If the catalogue needs to be switchable

Bind the text layers to Figma **string variables** instead, and put each catalogue in
a mode. Flipping branded/generic then becomes one click — worth it only if the deck
shows a before-and-after.

## Row order

Rows follow `CATEGORY_ORDER` in `catalogue.ts`, so row *n* in the sheet is card *n* in
category order. Re-run the export rather than reordering the sheet.

## Synced from the code (October 2026)

The board's product screens were brought in line with the prototype directly through
the Figma plugin API, from values computed by `npm run figma:spec` (the app's own
catalogue, cart, sale and queue modules → `figma-spec.json`). Nothing was retyped.

**The scenario.** Every Cart in the board draws six lines (the frames listed CocaCola
three times; the code holds one line per product), so they became six distinct
products at 1 each — Crew Socks, Organic Cotton Tee, Slim Denim Jeans, Wool Beanie,
Baseball Cap, Canvas Tote: Subtotal ₦52,450, VAT ₦3,934, Total ₦56,384 ("Checkout (6)").

| Screens | Now shows |
|---|---|
| 55 Cart-bearing screens (Cart, Checkout, every sheet over the Cart) | the six lines; footer, breakdown, Checkout heading, Amount, Pay and "… of … left" from the totals |
| Cart with an order discount (`88:15571`) | the frame's own ₦100 off, recomputed: VAT ₦3,926, Total ₦56,276 |
| 5 Sales Point grids | the grid in the app's mixed order, real prices and stock (nothing out of stock), the code's categories as chips |
| 4 receipts | six item lines (blocks cloned from the frame's own), Sales Value ₦52,450, VAT ₦3,934, Total ₦56,384, cash ₦60,000 tendered, ₦3,616 balance |
| 2 Queued orders screens | the seeded queue: four orders, their items, totals and times (the fifth card hidden) |
| Item details (`88:9518`) | Crew Socks, 1 ea, ₦950/ea, 10% off → ₦855 |
| Quantity sheet | the frame's Carton is the code's Bundle |
| Scan match sheet (`88:19899`) | "Northline": the three products that brand has, real stock and prices |

**Not changed**, as not product data: customer names, the receipt's store header and
footer (Klakpad), bank account holders, dates and receipt numbers in older frames, and
the split-payment partial amounts (₦2,000, ₦5,000), which remain valid parts of the
new total.

**Backup.** Before any edit, the Sales point section and the two loose product frames
were copied to the page "Backup — before product sync (drinks)" (text, frame and
instance counts verified identical). Delete that page once the sync is accepted.

**Photos.** 354 product image layers now carry the code's photos: every layer whose
card or row names exactly one code product took that product's photo (Cart rows, the
grids, the scan sheet's three matches, Item details), plus `88:19708`, a Sprite cut-out
laid over the Crew Socks row in `88:19678`. Hoodie is the only photo no drawn screen
shows.

- **How they got in.** `upload_assets` posts to `mcp.figma.com`, and this environment's
  network policy blocks that host. The plugin sandbox has no `fetch`, and
  `createImageAsync` is unsupported. So each photo was
  re-encoded as a 256px JPEG (q82, under 0.6% mean pixel error against the WebP;
  `createImage` rejects WebP) and passed to `figma.createImage` as base64.
- **How each was checked.** Every photo was sent as Adler-32-checksummed chunks, and
  the fill was set only when Figma's image hash equalled the file's SHA-1. Figma's image
  hash *is* the SHA-1 of the bytes, so every photo is byte-identical to its JPEG.
- **The scrim follows the code.** Grid and Cart photos carry the softened scrim (clear
  at 40%, 6% at 70%, 20% at the edge), including the four grid cards the design left
  without one (BUILD-PLAN #22). Item details' photo has none, as in the code. The scan
  sheet's 48px thumbnails keep the design's scrim: the code doesn't build that sheet.

**Still drinks, deliberately:**
- **Two newer frames** on the page: `197:18477` ("Frame 5165", Onboarding section)
  and `197:22556` ("Sella onboarding & dash"). Both were added after this sync and still
  name the drinks, so they were left alone.
- **The scan screens' camera shot.** `image 6` is a 568px photo of a hand holding
  Sprite, behind `88:19678`, `88:19817` and `88:19858`. It needs a camera-style
  clothing shot at that size, and none exists: a 256px packshot stretched to 568
  would be visibly soft. The barcode shot (`image 4`) holds no product and stays.
