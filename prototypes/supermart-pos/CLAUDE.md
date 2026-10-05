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
anything — it records **51** inconsistencies, including that 31 frames share the name
"Customer added", so **screens must be referenced by node ID, never by name**.

### Built so far — band 4, "Adding customer to an order"

| # | Screen | Node | State |
|---|---|---|---|
| 1 | Sales Point | `88:8079` | 1 coordinate outside 0.5px, 21/21 flow, +8px chip gap (requested) |
| 2 | Cart / Order Preview | `88:8164` | 0 outside 0.5px, 19/19 flow |
| 3 | Select customer (empty + populated) | `88:11845`, `88:12043` | 0 outside tolerance, 17/17 flow |

Next: Customer added (`88:8243`).

**Hosted preview:** <https://claude.ai/artifact/LnsiYh4uBeTNY1J3XDMJHX> — rebuild and
republish it with `npm run build:hosted`.

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
npm run dev                # iterate; open with ?dev=1 for the toolbar
npm run build && npm run preview   # demo from here, not dev

npm run catalogue:verify   # 37 invariants: check digits, money, totals, states, CSV agreement
npm run catalogue:csv      # regenerate figma/catalogue.csv from catalogue.ts
npm run tokens:gen         # regenerate tokens.ts/.css from figma-variables.json
npm run tokens:verify      # the generated tokens still match the Figma dump
npm run motion:sample      # transitions animate in BOTH directions (needs a server)
npm run images:manifest    # which photos are still missing
npm run images:optimise -- --box <css-px>   # --box MUST come from a measured frame
npm run build:hosted       # publish-ready bundle for the hosted preview
```

Run `catalogue:verify` after any edit to `catalogue.ts`. An invalid check digit or a
total that stops reconciling shows up live in a demo. Run `motion:sample` after any
change to a presented surface — checking a transition is "visible" cannot catch an
entrance that never animates.

## Still open

- **42 product photos are unavailable.** `download_assets` hands back
  `www.figma.com` URLs the agent has to fetch over ordinary HTTPS, and this
  environment's network policy denies that host. The 21 **icons** came out anyway,
  through `node.exportAsync({ format: 'SVG' })` on the plugin API, which returns bytes
  over the MCP channel instead — see `src/assets/icons/MANIFEST.md`. The photos cannot
  follow: the design's product images are real-brand packaging, deliberately replaced
  by the invented catalogue, so there is nothing in the file to export.
- `search-sm` carries a non-token stroke, and the filter button has no designed
  destination (BUILD-PLAN #50, #51).
- `images:optimise --box` defaults to a placeholder 112px. The real value is the
  largest CSS box a product photo is drawn into, measured off the design.
- **The Cart's title-bar trash clears the whole order in one tap** — no confirmation
  or undo, and none is designed in this band (BUILD-PLAN #35).
- **The Cart shows no order total** in the frame; one was added as a minimal honest
  addition and needs design input (BUILD-PLAN #32).
- The sheet **exit curve** is heavily back-loaded and is deferred to `better-ui`,
  which owns motion and is not installed (BUILD-PLAN #37).
- **No motion is authored anywhere in the Figma file** — `get_motion_context` returns
  `{"nodes":[]}` for all 90 frames. Transitions come from `shared/src/motion.ts`,
  documented as the project's baseline rather than design-derived.
