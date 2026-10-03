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
