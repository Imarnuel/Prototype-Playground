# Freshvale Supermart POS — case study specifics

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
anything — it records eight open inconsistencies, including that 31 frames share the
name "Customer added", so **screens must be referenced by node ID, never by name**.

Nothing has been built from this board yet, and no `get_design_context` call has
been made against any screen.

## The store

Freshvale Supermart — a **fictional** supermart selling **packaged goods only**.

Every brand in the catalogue is invented: Freshvale (own brand), Bluewell, Koloma,
Palmrise, Tiny Steps, Verdane, Zivra. Nothing names a real product — a case study
showing a real brand's packaging reads as work you weren't engaged for.

### Packaged-only is a scope decision, not an omission

Nothing is loose, fresh or weighed. Two things follow from it:

- **No scale, so no per-kilogram pricing.** A line quantity is always a whole count
  of units, and `lineTotalMinor` throws on a fractional quantity rather than
  rounding it into a total that cannot be reconciled.
- **Every barcode carries the GS1 Nigeria manufacturer prefix `615`.** The in-store
  `2x` range is for items a shop codes itself, which only applies to loose and
  weighed goods, so it has no place here. A verification check asserts no item
  drifts onto it.

It also makes the photography tractable: packaged goods shoot consistently against
a plain background, which a grid of loose produce does not.

## Catalogue

`src/data/catalogue.ts` is the single source of truth for product data, and it feeds
both the prototype and the Figma frames. **Product names reach Figma by export, never
by retyping** — see `figma/README.md`.

- 43 products, 9 categories, 7 invented brands.
- `brand`, `name` and `size` are **separate fields**. Packaged items are identified
  by all three, and a POS card renders them as separate lines, so the pack size is
  never baked into the name. A check asserts it never gets duplicated back in.
- Money is integer minor units (kobo). Never a float: 0.1 + 0.2 arithmetic on prices
  is how demo receipts stop reconciling.
- Barcodes are valid EAN-13, check digits included.

### ASSUMPTION — currency and tax

Naira, 7.5% VAT, basic food zero-rated. Chosen because "supermart" and this price
range put the POS somewhere mixed tax classes are normal, which gives the receipt
something real to show. **If this is wrong, say so** — `CURRENCY` and the
`priceMinor` values are the only things that change, and no component reads a
currency symbol directly.

### States deliberately reachable

Seeded so every state can be demoed without editing data (root agreement §4, §6):

| State | Product |
|---|---|
| No photo (fallback) | Palmrise Sweetcorn 340g Tin |
| Out of stock | Bluewell Apple Juice 1L Carton |
| Discounted | Palmrise Vegetable Oil 3L, Freshvale Toilet Tissue 4-pack |
| Long name (truncation) | Unscented Antibacterial Laundry Detergent Powder — 48 chars |
| Single-item category | Baby |
| Category that wraps | Beverages — 12 items |
| Price width range | ₦300 to ₦11,500 (3 to 5 digits) |
| Same product, two pack sizes | Freshvale Still Water 75cl and 1.5L |

## Commands

```bash
npm run catalogue:verify   # 35 invariants: check digits, money, totals, states, CSV agreement
npm run catalogue:csv      # regenerate figma/catalogue.csv from catalogue.ts
npm run images:manifest    # which photos are still missing
npm run images:optimise -- --box <css-px>   # --box MUST come from a measured frame
```

Run `catalogue:verify` after any edit to `catalogue.ts`. An invalid check digit or a
total that stops reconciling shows up live in a demo.

## Still open

- No Figma file attached, so no colour or type tokens, and the screen is a catalogue
  readout rather than POS UI. Nothing invented in their place.
- **No product photography.** 42 photos expected, 0 present. `assets/products/` is
  empty and `images:manifest` lists exactly what is missing.
- `images:optimise --box` defaults to a placeholder 112px. The real value is the
  largest CSS box a product photo is drawn into, measured off the design.
