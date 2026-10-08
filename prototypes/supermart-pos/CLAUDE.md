# Freshvale POS — case study specifics

Inherits the working agreement at the repo root. This file records only what is
specific to this study.

## Figma source

- File key: `OWq8E2gQpWnYjPwLlPI5HA`
- Section / board: `88:7008` — "Sales point", 15348 x 16105
- Screens: 90 top-level frames, 85 at **393x852** — the same size as
  `shared/src/device.ts`, so frames map to the device frame 1:1 with no rescaling
- Main page: **not recorded.** Only the section was given; the page it sits on was
  never queried, and is not needed while every call targets node IDs inside it.
- Frames shown in the case study deck: **not yet chosen.** Needed to know which
  frames must be populated from `figma/catalogue.csv`.

The board map, the numbered work order and the running log of design
inconsistencies live in [`BUILD-PLAN.md`](./BUILD-PLAN.md). Read it before building
anything — it records **74** inconsistencies, including that 31 frames share the name
"Customer added", so **screens must be referenced by node ID, never by name**.

### Built so far — band 4, "Adding customer to an order"

| # | Screen | Node | State |
|---|---|---|---|
| 1 | Sales Point | `88:8079` | 0 coordinates outside 0.5px after the designer's spacing pass (header gap 8, 8 below the chips, grid 8 below the header); screens start at the frame's y=50, not the platform's 59 (BUILD-PLAN, "Safe-area top inset"); 22/22 flow |
| 2 | Cart / Order Preview | `88:8164` | 0 outside 0.5px, 19/19 flow |
| 3 | Select customer (empty + populated) | `88:11845`, `88:12043` | 0 outside tolerance, 17/17 flow |
| 4 | Customer added (+ toast) | `88:8243`, `88:8322` | 0 outside 0.5px, 11/11 flow and motion |

All of it passes `npm run figma:audit`: **274 properties read off the Figma nodes**
(fills, strokes and their weight and alignment, radii, effects, auto-layout padding and
spacing, full type spec) against computed style, **0 differing**.

**Band 4 is complete.** Customer added is built as STATE on the Cart, not a fourth
screen: `88:8243` is the Cart's own frame with the customer row's label at Heading/H3
instead of Label/Base and a trash in place of the plus-circle. `88:8402` is a
byte-identical duplicate of it; `88:8322` is the same frame plus the toast.

### In progress — band `115:8774`, "Adjusting qty & product details in cart"

Three features in dependency order: the footer order total, the Quantity sheet, the
line-details modal.

| Step | What | Node | State |
|---|---|---|---|
| 1 | Money model and pack units (no UI) | — | `catalogue:verify` 57/57, `cart:verify` 22/22 |
| 2 | Order total, collapsed and expanded | `88:8639`, `88:9338` | 0 outside 0.5px over 77 measurements, 19/19 flow and motion |
| 3 | Quantity sheet | `88:11532`, `88:11647` | next |
| 4 | Line-details modal | `88:9439` | — |

`88:8481` and `88:11766` are byte-identical to `88:8243` and need nothing built.

**Hosted preview:** <https://claude.ai/artifact/LnsiYh4uBeTNY1J3XDMJHX> — rebuild and
republish it with `npm run build:hosted`.

## The store

Freshvale — a **fictional** store selling **clothing and wearables**.

It began as a packaged-goods supermart, and changed for the photography: no stock
library is reachable from this environment's network, and image models put garbled
text on every packaged-goods label. A garment has no label to garble, so one fixed
prompt gives a library of shots that match (see "Product images"). The screens are
unchanged; only the data and the pictures moved.

Every brand is invented: Freshvale (house brand), Northline, Kora. Nothing names a
real product.

- **Every item is a counted unit with a printed barcode.** A line quantity is always a
  whole count, and `lineTotalMinor` throws on a fractional one rather than rounding it
  into a total that cannot be reconciled.
- **Every barcode carries the GS1 Nigeria manufacturer prefix `615`**, never the
  in-store `2x` range. A verification check asserts it.

## Catalogue

`src/data/catalogue.ts` is the single source of truth for product data, and it feeds
both the prototype and the Figma frames. **Product names reach Figma by export, never
by retyping** — see `figma/README.md`.

- 10 products, 5 categories (Tops, Bottoms, Footwear, Accessories, Bags), 3 invented
  brands. Ten, because each needs a generated photograph and this is a prototype.
- `brand`, `name` and `size` are **separate fields**: the garment size ('M', '32W',
  'UK 9', 'One size') is never baked into the name. A check asserts it.
- Money is integer minor units (kobo). Never a float: 0.1 + 0.2 arithmetic on prices
  is how demo receipts stop reconciling.
- Every product lists its **pack units** (`units`), Each first. Prices stay per single
  unit; a pack's price is derived. Only Crew Socks' 1/4/8/16 comes from a frame — the
  rest, and the "ctn" / "box" abbreviations, are invented (BUILD-PLAN #64).

### Money

One model, in `catalogue.ts`; `src/state/cart.ts` only says how a line may change.
Nothing else does arithmetic on money.

- A Cart line displays its **gross**, so lines add up to the Subtotal on screen.
- Total = Subtotal - Discount + Tax, exact in kobo. VAT is per line on the net,
  and the order's tax is rounded once to whole Naira, so the total is collectable.
- **The Cart's Total includes VAT** (BUILD-PLAN #67). Its breakdown shows Discount
  only when there is one — the design draws that row hidden (#71).
- Typed money and counts go through `parseCount` / `parseWholeNaira` /
  `parsePercent`, never `Number()` or `parseFloat`.
- **One line per product** — a stated limitation, not an oversight.
- Barcodes are valid EAN-13, check digits included.

### ASSUMPTION — currency and tax

Naira, 7.5% VAT, every item standard-rated (clothing carries VAT). The money model
still handles zero-rated lines and its verifier still proves them. **If this is wrong,
say so** — `CURRENCY` and the `priceMinor` values are the only things that change, and
no component reads a currency symbol directly.

### States deliberately reachable

Seeded so every state can be demoed without editing data (root agreement §4, §6):

| State | Product |
|---|---|
| Out of stock | Kora Leather Sneakers |
| Stock ceiling (3), and a pack the shelf can't fill once | Kora Wool Beanie — 3 in stock, sold in packs of 6 |
| The Quantity frame's 1/4/8/16 | Freshvale Crew Socks — 180 in stock |
| Sold singly only (no Measurement list) | Freshvale Canvas Tote |
| Discounted | Freshvale Slim Denim Jeans, ₦24,000 (was ₦28,000) |
| Long name (truncation) | Water-Repellent Lightweight Packable Rain Jacket — 48 chars |
| Single-item category | Bottoms, Footwear, Bags |
| Category that wraps | Tops — 4 items |
| Price width range | ₦950 to ₦45,000 (3 to 5 digits) |

The no-photo state is no longer seeded: every item has a photo. The card still falls
back to its neutral fill if one is missing.

## Commands

```bash
npm run dev                # iterate; open with ?dev=1 for the toolbar
npm run build && npm run preview   # demo from here, not dev

npm run catalogue:verify   # 57 invariants: check digits, units, money, totals, states, CSV
npm run cart:verify        # 22 rules for changing a line: stock, clamps, unit changes
npm run catalogue:csv      # regenerate figma/catalogue.csv from catalogue.ts
npm run tokens:gen         # regenerate tokens.ts/.css from figma-variables.json
npm run tokens:verify      # the generated tokens still match the Figma dump
npm run motion:sample      # transitions animate in BOTH directions (needs a server)
npm run figma:audit        # 274 properties read off the Figma NODES vs computed style
npm run images:manifest    # which photos are missing
npm run images:optimise -- --box <css-px>   # --box MUST come from a measured frame
npm run build:hosted       # publish-ready bundle for the hosted preview

# Browser walks and diffs — pass a server's base URL (default the dev server, :4251)
node scripts/walk-total.mjs      [url]   # order total: reconciles, motion both ways
node scripts/diff-total.mjs      [url]   # order total vs 88:8639 / 88:9338
node scripts/walk-stock.mjs      [url]   # stock clamp and its toast
node scripts/walk-sheet-keys.mjs [url]   # sheet focus, Escape, Tab trap
node scripts/diff-added.mjs      [url]   # Customer added vs 88:8243
```

Run `catalogue:verify` and `cart:verify` after any edit to `catalogue.ts` or `cart.ts`. An invalid check digit or a
total that stops reconciling shows up live in a demo. Run `motion:sample` after any
change to a presented surface — checking a transition is "visible" cannot catch an
entrance that never animates.

## Still open

- `search-sm` carries a non-token stroke, and the filter button has no designed
  destination (BUILD-PLAN #50, #51).
- **The Cart's title-bar trash clears the whole order in one tap** — no confirmation
  or undo, and none is designed in this band (BUILD-PLAN #35).
- The sheet **exit curve** is heavily back-loaded and is deferred to `better-ui`,
  which owns motion and is not installed (BUILD-PLAN #37).
- **No motion is authored anywhere in the Figma file** — `get_motion_context` returns
  `{"nodes":[]}` for all 90 frames. Transitions come from `shared/src/motion.ts`,
  documented as the project's baseline rather than design-derived.

## Product images

Ten generated photographs, one per product, made with Figma's image generation
(`gemini-3.1-flash-image`, billed to klakpad's team) from ONE prompt template, so the
library matches — same backdrop, light, angle and margin:

> E-commerce studio product photo of a {item}, {colour}, centred, front-facing, on a
> seamless warm light-grey backdrop, soft diffused top light, subtle contact shadow,
> no text, no logos, no labels, no model, square composition with generous margin
> around the product.

They are **generated, not photographed**, and must not be presented as photography of
real stock. The originals land in `assets/products-src/` (gitignored) and go through:

```bash
npm run images:optimise -- --box 160
```

**160 is measured, not assumed**: `.productCard__image` renders 160x108, and the
design's own "Product Image" frame is 160x108. The pipeline sniffs the real format,
resizes against a square box with `fit: 'outside'` (because `object-fit: cover` is
driven by the short side), writes WebP q80 with metadata stripped, and reports mean
absolute pixel error at display size.

**Status: these are the 256px previews, not the full-size originals.** Each generation
returns a 1024px PNG hosted on `www.figma.com`, which this environment's network policy
blocks, plus an inline 256px preview; the previews are what ship. 256 covers the 160x108
box at 1.6x, so the photos are slightly soft on a 2x or 3x screen, and
`images:optimise` exits non-zero listing all 10 as undersized — correctly. It never
enlarges a source: that would add bytes, not detail. To fix: allow `www.figma.com`,
regenerate (the 1024px URLs expire after 7 days), drop the PNGs into
`assets/products-src/` under the same names, and rerun the optimiser.

**The image scrim is softer than the design, on the designer's request.** `88:8113`
goes clear -> 40% black by 64.663% -> 80% at the edge, which read as a hard dark band
over the lower half of every photo. The card and Cart thumbnails now share 0% at 40%
-> 6% at 70% -> 20% at the edge; `figma:audit` expects that value, not the node's.
