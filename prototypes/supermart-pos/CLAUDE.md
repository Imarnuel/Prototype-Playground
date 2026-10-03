# Freshvale Supermart POS — case study specifics

Inherits the working agreement at the repo root. This file records only what is
specific to this study.

## Figma source

**Not yet attached.** Fill these in before pulling any design context — section 1
of the root agreement, and nothing here should be a guess:

- File key:
- Main page:
- Section / board:
- Frames shown in the case study deck:

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
