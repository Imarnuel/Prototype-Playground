# Icons

All 59 are present, 56 here and 3 in `shared/src/assets/`. Band `170:8988` (queueing
and recalling an order) added five, each from its own instance: `layout-alt-02`
(`88:16257`, 40, the empty Queued orders), `clock` (`88:16298`, 16), `dots-horizontal-24`
(`88:16301` — the order card's 24 instance, not the 20 export beside it) and
`trash-03-danger` (from the Dropdown menu `88:16379`, 16, stroked `#C2261A`: one step
off Color/text/danger `#C1261A`, which its label uses) and `toast-success` (the pill
toast's 20 icon in `88:16028`: a filled `#0A9645` disc — the primitive Green/600, not a
semantic token — unlike the card toast's outlined `check-circle`). `chevron-down` joined with
the order total (band `115:8774`), exported from its instance `88:8718`. They are the screens' own
Figma exports — nothing here was substituted, redrawn, or traced.

Band `214:26054` (scanning) added six, each from its own instance: `scan` (`88:19370`,
28, white, the scan button), `expand-01` (`I88:19513;2049:9449`, 20, the docked Order
Preview's leading control), `x-close-camera` (`I88:19536;2049:9449`, 20, `#CFD0D3` — the
camera's close, under the file's dark mode), `scan-line` (`88:19544`, the 274 green
line with its own gradient), `toast-check-card` (`I88:20033;68:3364`, 20, the banner's
white disc with a green tick) and `shopping-cart-40` (`88:19527`, 40, `#20293C`, the
empty Cart and empty scanner — not the View cart button's 16 white
`shopping-cart-01`; `88:19464` exports identically).

`cellular-connection`, `wifi` and `battery` are not in this set: they are the status
bar's glyphs, and the status bar is device chrome drawn by `DeviceFrame`, not screen
content. They live with it in `shared/src/assets/`.

## How they got here, and why it was not obvious

`download_assets` does not return bytes. It returns `https://www.figma.com/api/mcp/asset/…`
URLs that the agent then has to fetch over ordinary HTTPS — and this environment's
network policy denies `figma.com`, so every one of those fetches failed.

The Figma MCP tools themselves were never blocked: they reach
`mcp-proxy.anthropic.com`, which is on the container's noProxy list. Same service,
two different network paths, only one of them filtered.

So these came out through the plugin API instead:

```js
const bytes = await node.exportAsync({ format: 'SVG' });
```

which returns the file's bytes through the MCP channel and sidesteps the blocked
path entirely. `scripts/gen-icons.mjs` rebuilds `index.ts` from whatever `.svg`
files sit in this directory.

## Exported from instances, not components

Each file is exported from the **instance** that appears on the screen, not from the
component. A component exports uncoloured — `dots-horizontal` straight from
`88:2187` is `stroke="black"`. The instance carries the colour the design actually
applies, so `dots-horizontal.svg` here is `#20293C`, the tab bar's `cart.svg` is
`#2C4A8B` because that tab is selected, and `user-02.svg` is `#D42189` to match its
pink avatar. No recolouring was needed or done.

| File | Size | Colour | Used in | Figma node |
|---|---|---|---|---|
| `cellular-connection.svg` | 20x13 | `#141F33` | Status bar | `I88:8080;488:57541` |
| `wifi.svg` | 18x13 | `#141F33` | Status bar | `I88:8080;488:57785` |
| `battery.svg` | 28x13 | `#141F33` | Status bar | `I88:8080;128:71949` |
| `dots-horizontal.svg` | 20x20 | `#20293C` | Header / title bar overflow | `88:8085` |
| `search-sm.svg` | 20x20 | `#5B6579` | Search field prefix | `I88:8088;519:2671;519:2391` |
| `filter-lines.svg` | 16x16 | `#5E6A82` | Filter button | `I88:8089;678:31` |
| `ellipse-79.svg` | 3x3 | `#5E6A82` | Product detail separator | `88:8110` |
| `grid-01.svg` | 20x20 | `#20293C` | Tab bar — Dashboard | `I88:8153;2232:7411;2227:7764` |
| `cart.svg` | 19x18 | `#2C4A8B` | Tab bar — Sales Point (selected) | `I88:8153;2232:7413;2227:7825` |
| `menu-01.svg` | 20x20 | `#20293C` | Tab bar — More | `I88:8153;2232:7414;2227:7827` |
| `shopping-cart-01.svg` | 16x16 | `white` | View cart button | `I88:8154;2398:7604` |
| `x-close.svg` | 20x20 | `#20293C` | Close button | `I88:8168;2049:9449` |
| `trash-03.svg` | 20x20 | `#20293C` | Cart title bar — clear order | `88:8174` |
| `user-02.svg` | 16x16 | `#D42189` | Add customer avatar | `88:8179` |
| `plus-circle.svg` | 24x24 | `#2C4A8B` | Add customer trailing | `88:8181` |
| `minus.svg` | 16x16 | `#9EA4B3` | Quantity stepper — decrease | `I88:8188;1569:4487` |
| `plus.svg` | 16x16 | `#9EA4B3` | Quantity stepper — increase | `I88:8188;1569:4491` |
| `x-circle.svg` | 20x20 | `#9EA4B3` | Cart line — remove | `88:8190` |
| `chevron-right.svg` | 16x16 | `white` | Checkout button | `I88:8241;2398:7606` |
| `users-02.svg` | 40x40 | `#20293C` | Select customer — empty state | `88:11938` |
| `add-one.svg` | 20x20 | `#2C4A8B` | Select customer — add button | `I88:12133;2481:15937` |
| `user-02-brand.svg` | 20x20 | `#2C4A8B` | More options — Add a customer | `88:15550` |
| `percent-03.svg` | 20x20 | `#2C4A8B` | More options — Apply discount | `88:15555` |
| `trash-01.svg` | 20x20 | `#C2261A` | More options — Clear cart | `88:15561` |
| `list.svg` | 20x20 | `#2C4A8B` | More options — Queued orders | `88:15567` |
| `chevron-right-subtle.svg` | 20x20 | `#9EA4B3` | Checkout — method and bank rows | `88:12500` |
| `bank-note-02.svg`, `bank.svg`, `credit-card-02.svg`, `wallet-04.svg`, `gift-02.svg`, `rows-03.svg` | 20x20 | `#20293C` | Select payment method | `88:14112` … `88:14137` |
| `check-24.svg` | 24x24 | `#2C4A8B` | Select payment method — chosen | `88:14114` |
| `dot-2.svg` | 2x2 | `#5E6A82` | Select bank — separator | `88:14810` |
| `check-success.svg` | 40x40 | white | Transaction success | `88:8727` |
| `share-01.svg`, `printer.svg` | 16x16 | `#2C4A8B` | Receipt — Share / Print | inside `88:8851` |
| `instagram.svg`, `facebook.svg`, `tiktok.svg`, `twitter.svg` | 15.3 / 13.1 | `#5A5C63` | Receipt — socials | `88:8831` … `88:8847`; built from each vector's path data (below the frame's clip, so not exportable); the X recoloured from #000 (BUILD-PLAN #98) |

Bank logos live in `src/assets/banks/`: Access, Moniepoint and Opay exported as SVG
from `88:14801`, `88:14826`, `88:14839`; Palmpay holds a raster, so it is a 3x PNG
(120x120) of `88:14815`.

## Sizes are intrinsic

`<Icon>` takes no size prop. Each file renders at the width/height on its own root
element. Three are not square — `cart` 19x18, `battery` 28x13, `wifi` 18x13 — so
forcing a square box at a call site would distort them.

## Two upstream oddities worth knowing

- `search-sm` is `#5B6579`, which is **not a token**. The nearest is
  `Color/icon/subtle` at `#5E6A82`, which `filter-lines` beside it does use.
- The node IDs with several `;` segments do not resolve through
  `getNodeByIdAsync`; the status-bar and stepper icons had to be reached by
  traversing from their parent instance.
