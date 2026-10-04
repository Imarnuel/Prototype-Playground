# Build plan — Freshvale Supermart POS

Board to node map, work order, and the running log of every design inconsistency
found. Root agreement §1: this is how the next session picks up.

**Nothing has been built from this board yet.** No `get_design_context` call has been
made against any screen.

## Figma source

| | |
|---|---|
| File key | `OWq8E2gQpWnYjPwLlPI5HA` |
| Section | `88:7008` — "Sales point" |
| Section size | 15348 x 16105 |
| Screens | 90 top-level frames, 85 of them 393x852 |
| Screen size | **393x852 — matches `shared/src/device.ts` exactly**, so no rescaling |

### Which node is the section — resolved

The link supplied two different nodes: the visible URL said `node-id=88-7008`, the
href said `node-id=88-2016`. `88:7008` was taken as correct on two pieces of
evidence: it carried Figma's `&t=` share token (the "Copy link" format), and the
metadata response reported it as the live selection in the desktop app
("Currently selected nodes: 88:7008 Sales point").

**`88:2016` was never inspected.** If the intended section was that one instead,
this whole map is wrong — worth one confirmation before building.

## Board bands

Frames grouped by their y position on the board. Band titles come from "Section
Header" instances that sit above each band; **those titles have not been read** —
reading one costs a `get_design_context` call on that header, which is worth doing
for whichever band gets built first.

### Band 1 — y=831  (2 frames)
Sales point v1x2

Header instance(s), title unread: `88:8073` (x=166), `88:8074` (x=166), `88:8076` (x=166)

| Node | Name | x | Size |
|---|---|---|---|
| `88:7009` | Sales point v1 | 166 | 393x852 |
| `88:7171` | Sales point v1 | 1152 | 393x852 |

### Band 2 — y=2330  (7 frames)
Cartx5, Sales point, Customer added

Header instance(s), title unread: `88:8077` (x=166)

| Node | Name | x | Size |
|---|---|---|---|
| `88:19293` | Sales point | 166 | 393x852 |
| `88:19449` | Customer added | 659 | 393x852 |
| `88:19506` | Cart | 1152 | 393x852 |
| `88:19777` | Cart | 1645 | 393x852 |
| `88:19584` | Cart | 2138 | 393x852 |
| `88:19938` | Cart | 2631 | 393x852 |
| `88:19119` | Cart | 3124 | 393x852 |

### Band 3 — y=3797  (5 frames)
Cartx4, Sales point

Header instance(s), title unread: `88:8078` (x=166)

| Node | Name | x | Size |
|---|---|---|---|
| `88:19371` | Sales point | 166 | 393x852 |
| `88:19545` | Cart | 683 | 393x852 |
| `88:19817` | Cart | 1200 | 393x852 |
| `88:19858` | Cart | 1717 | 393x852 |
| `88:19678` | Cart | 2234 | 393x852 |

### Band 4 — y=5216  (9 frames)
Add customerx4, Customer addedx3, Sales point, Cart

Header instance(s), title unread: `88:8155` (x=164)

| Node | Name | x | Size |
|---|---|---|---|
| `88:8079` | Sales point | 164 | 393x852 |
| `88:8164` | Cart | 657 | 393x852 |
| `88:11845` | Add customer | 1150 | 393x852 |
| `88:12043` | Add customer | 1643 | 393x852 |
| `88:12184` | Add customer | 2136 | 393x852 |
| `88:12277` | Add customer | 2629 | 393x852 |
| `88:8322` | Customer added | 3122 | 393x852 |
| `88:8243` | Customer added | 3615 | 393x852 |
| `88:8402` | Customer added | 4108 | 393x852 |

### Band 5 — y=6652  (7 frames)
Customer addedx7

Header instance(s), title unread: `88:8157` (x=164)

| Node | Name | x | Size |
|---|---|---|---|
| `88:8481` | Customer added | 166 | 393x852 |
| `88:11532` | Customer added | 667 | 393x852 |
| `88:11647` | Customer added | 1168 | 393x852 |
| `88:11766` | Customer added | 1669 | 393x852 |
| `88:9439` | Customer added | 2170 | 393x852 |
| `88:8639` | Customer added | 2675 | 393x852 |
| `88:9338` | Customer added | 3176 | 393x852 |

### Band 6 — y=8084  (6 frames)
Customer addedx4, Cart, More options

Header instance(s), title unread: `88:8158` (x=164)

| Node | Name | x | Size |
|---|---|---|---|
| `88:15374` | Cart | 166 | 393x852 |
| `88:15458` | More options | 659 | 393x852 |
| `88:15677` | Customer added | 1152 | 393x852 |
| `88:15769` | Customer added | 1645 | 393x852 |
| `88:15861` | Customer added | 2138 | 393x852 |
| `88:15571` | Customer added | 2631 | 393x852 |

### Band 7 — y=9464  (19 frames)
Checkoutx11, Customer addedx7, Frame 5093

Header instance(s), title unread: `88:8159` (x=164), `88:8161` (x=3088), `88:8163` (x=11494)

| Node | Name | x | Size |
|---|---|---|---|
| `88:8560` | Customer added | 166 | 393x852 |
| `88:12370` | Checkout | 659 | 393x852 |
| `88:12817` | Checkout | 1152 | 393x852 |
| `88:8723` | Customer added | 1645 | 393x852 |
| `88:8735` | Customer added | 2138 | 393x852 |
| `88:12515` | Checkout | 3070 | 393x852 |
| `88:14025` | Checkout | 3581 | 393x852 |
| `88:14562` | Frame 5093 | 4074 | **886x852** |
| `88:13115` | Checkout | 5060 | 393x852 |
| `88:13417` | Checkout | 5553 | 393x852 |
| `88:8729` | Customer added | 6064 | 393x852 |
| `88:8852` | Customer added | 6557 | 393x852 |
| `88:12962` | Checkout | 11494 | 393x852 |
| `88:14355` | Checkout | 11987 | 393x852 |
| `88:15132` | Checkout | 12480 | 393x852 |
| `88:13719` | Checkout | 12973 | 393x852 |
| `88:13872` | Checkout | 13466 | 393x852 |
| `88:9215` | Customer added | 13959 | 393x852 |
| `88:9221` | Customer added | 14452 | 393x852 |

### Band 8 — y=10905  (14 frames)
Checkoutx12, Customer addedx2

Header instance(s), title unread: `88:8160` (x=164)

| Node | Name | x | Size |
|---|---|---|---|
| `88:9567` | Checkout | 166 | 393x852 |
| `88:9712` | Checkout | 659 | 393x852 |
| `88:9840` | Checkout | 1152 | 393x852 |
| `88:10768` | Checkout | 1645 | 393x852 |
| `88:10879` | Checkout | 2138 | 393x852 |
| `88:11055` | Checkout | 2631 | 393x852 |
| `88:11166` | Checkout | 3124 | 393x852 |
| `88:11283` | Checkout | 3617 | 393x852 |
| `88:11394` | Checkout | 4110 | 393x852 |
| `88:10324` | Checkout | 4567 | 393x852 |
| `88:10569` | Checkout | 5096 | 393x852 |
| `88:10079` | Checkout | 5589 | 393x852 |
| `88:8969` | Customer added | 6082 | 393x852 |
| `88:8975` | Customer added | 6575 | 393x852 |

### Band 9 — y=11320  (1 frames)
 

Header instance(s), title unread: `88:8160` (x=164)

| Node | Name | x | Size |
|---|---|---|---|
| `88:19117` | _(blank name)_ | 6488 | **90x23** |

### Band 10 — y=12358  (10 frames)
Customer addedx7, Cartx2, Sales point

Header instance(s), title unread: `88:16029` (x=164)

| Node | Name | x | Size |
|---|---|---|---|
| `88:16031` | Cart | 164 | 393x852 |
| `88:15953` | Sales point | 657 | 393x852 |
| `88:16199` | Customer added | 1150 | 393x852 |
| `88:16216` | Customer added | 1643 | 393x852 |
| `88:16526` | Customer added | 2136 | 393x852 |
| `88:16233` | Customer added | 2629 | 393x852 |
| `88:16380` | Customer added | 3122 | 393x852 |
| `88:16262` | Customer added | 3615 | 393x852 |
| `88:16409` | Customer added | 4108 | 393x852 |
| `88:16115` | Cart | 4601 | 393x852 |

### Band 11 — y=14348  (10 frames)
Cartx10

Header instance(s), title unread: `88:16030` (x=164), `88:8075` (x=166)

| Node | Name | x | Size |
|---|---|---|---|
| `88:16572` | Cart | 166 | **393x1170** |
| `88:17099` | Cart | 659 | **393x1170** |
| `88:16833` | Cart | 1152 | **393x1170** |
| `88:17595` | Cart | 1643 | 393x852 |
| `88:18840` | Cart | 2137 | 393x852 |
| `88:18591` | Cart | 2630 | 393x852 |
| `88:18083` | Cart | 3123 | 393x852 |
| `88:18337` | Cart | 3616 | 393x852 |
| `88:17839` | Cart | 4109 | 393x852 |
| `88:17359` | Cart | 4602 | 393x852 |

## Design inconsistencies — running log

Surfaced, not silently normalised (root agreement §3). None of these are fixed.

| # | Issue | Status |
|---|---|---|
| 1 | Link text and href named different nodes (`88-7008` vs `88-2016`) | Resolved to `88:7008` via the live selection; needs confirming |
| 2 | **31 frames named "Customer added", 23 "Checkout", 23 "Cart".** States were never renamed, so names do not identify a screen | Open — the work order keys on node IDs, never names |
| 3 | `88:8073` and `88:8074` are two Section Header instances at the identical position and size (166,166 / 3498x268) — an exact duplicate | Open |
| 4 | `88:19117` is a frame named `" "` (a single space), 90x23, at (6488, 11320) — a stray | Open |
| 5 | `88:14562` "Frame 5093" is 886x852 — default Figma name, and double screen width. Either two screens in one frame or an annotation pair | Open — inspect before building band 7 |
| 6 | Three Cart frames are **393x1170**, taller than the 852 device: `88:16572`, `88:17099`, `88:16833` | Open — decide whether these are scroll-extended views of one screen or separate screens |
| 7 | Section Header `88:8155` contains a `Status/info` child with `hidden="true"` | Noted — hidden layers must not be built |
| 8 | Band 1 frames are named "Sales point **v1**" while later bands have "Sales point". A superseded version may still be on the board | Open — needs to be told which is current |
| 9 | **Status bar is the wrong device.** 89 of 95 `Status Bar - iPhone` instances are **402x50 at x=-5** on a 393-wide frame — a 402pt (iPhone 16 Pro) component on a 393pt (iPhone 15 Pro) frame, overhanging 5px left and 4px right. The other 6 are correctly 393x50 | Open |
| 10 | **Header sits at y=50, but the Dynamic Island safe-area inset is 59.** Content at y=50 clears the island's bottom edge (47.67) by 2.33px, against 11.33px at 59 | **RESOLVED — follow the device (59).** See "Resolved deviations" |
| 11 | Letter-spacing values filed under a colour namespace: `Color/container/accent/indigo/heading/h4` = −0.48, `/h5` = −0.20. `Heading/h4` and `Heading/h5` bind `letterSpacing` to them | Handled in the generator, documented in `src/tokens/TOKENS.md` |
| 12 | Five type-style pairs differ only by case, and four are **not** equivalent — `Heading/H4` is 14/20 while `Heading/h4` is 20/24. System looks mid-migration from literal to primitive-composed styles | Both kept under exact Figma names; CSS property names preserve case |
| 13 | `H/6` holds a **unitless line-height ratio (1.4)** while the other 20 styles hold px. `H/6` and `Body/Reg/Large` also hold letter-spacing −2 against −0.16…−0.96 elsewhere — probably −2% in a px field | Ratio handled by `lineHeightCss`; the −2 is **unresolved** |
| 14 | 11 colour tokens sit outside the semantic `Color/*` system, including `Omnix Neutral/400` (a foreign system) and `Primary / White` (spaces around the slash) | Exported as `legacyColor`; prefer semantic tokens |
| 15 | Components doing real work under default Figma names: `Frame 4908` x77, `Frame 4909` x18, `Frame 5071` x1 | Open — need naming before they can be built as components |
| 16 | Both `trash-01` (79 uses) and `trash-03` (107 uses) are in use — two different trash icons for the same action | Open |
| 17 | `List` (26 uses) and `list` (2 uses) — case-variant component names, same pattern as the type styles | Open |
| 18 | Frame `88:8079` filter chips read **"All, Alcohol, Energy drinks, Soft drinks, Soft drinks"** — "Soft drinks" twice, and none match the catalogue | Chips are DERIVED from `CATEGORY_ORDER` instead |
| 19 | **Row 3 product cards are a different design.** Rows 1–2 use Label/Large 16/24 names and 14px stock; row 3 uses Inter Semi Bold **15**/20 and **13**px. Neither 15 nor 13 exists anywhere in the token set | Built to the rows 1–2 spec; row 3 treated as the stale one |
| 20 | Card 2's stock label is a hardcoded **`#a64907`**. The system has no warning or orange token among its 57 semantic colours | Kept as the literal with a comment; needs a real token upstream |
| 21 | Design context reports `border: 1px solid black` on Text field and Filter, contradicting both the frame's own screenshot (light grey hairline) and the dedicated `Color/border/input` (#cfd3d8) | `Color/border/input` used |
| 22 | The image scrim is on 5 of 6 product cards and missing on card 1 | Applied uniformly — an inconsistent scrim across one grid is more visibly wrong than either choice |
| 23 | The two INACTIVE tab bar labels use different tokens: Dashboard `Color/text/default`, More `Color/text/secondary` | Followed exactly, not normalised |
| 24 | `Color/icon/inverse` used as a TEXT colour ("View cart") and as a SURFACE fill (header overflow button). Same value as the text/surface tokens, wrong semantic | Correct semantic tokens used |
| 25 | Stock unit label is "ea" on four cards and "each" on two | "ea" used throughout |
| 26 | All six cards show the same product ("Fanta Orange 50cl", ₦1,000) with real-brand photography (Fanta, Coca-Cola, Sprite) | Replaced by the fictional catalogue — the reason it exists |
| 27 | **Icons cannot be downloaded.** This environment's network policy denies `www.figma.com:443`, so `download_assets` returns unfetchable URLs | **Open — 11 icons reserved by `<AssetSlot>`, none substituted or redrawn.** See `src/assets/icons/MANIFEST.md` |
| 28 | The Cart frame carries a **28px** corner radius; the Sales Point frame carries **32px** — same device, same band | Neither applied; the device shell clips at 55px |
| 29 | Cart content sits at left 12 with width 361, so its right margin is 20 against the 16 used by the title bar and footer | Followed as drawn |
| 30 | **The Cart's six rows disagree with each other.** Five use gap 4, `Color/border/default` and "ea"; the sixth uses gap 8, `Color/border/input` and "each". Row 5 name is 18/22, row 6 is 15/22 — neither is a token | Five-row majority built |
| 31 | The Add-customer card's border uses `Color/container/neutral/subtle/hover` — a **hover** token on a static border | Followed (same value), flagged |
| 32 | **The Cart shows no order total**, and its button reads "Checkout (5)" over **six** priced rows whose line prices reconcile with nothing (₦10,000 on one row, ₦1,000 on five at the same quantity) | Total added as a minimal honest addition; **needs design input** |
| 33 | **No motion is authored anywhere in the file.** `get_motion_context` returns `{"nodes":[]}` for the Cart, the Sales Point, and all 90 frames in the section | Transitions use the project's own documented baseline, explicitly not design-derived |

## Work order

Screens get built 1–3 at a time, by node ID.

| # | Screen | Node | Status |
|---|---|---|---|
| 1 | Sales point (band 4) | `88:8079` | **built and verified** — 1 coordinate outside 0.5px, 21/21 flow checks |
| 2 | Cart / Order Preview (band 4) | `88:8164` | **built and verified** — 0 coordinates outside 0.5px, 19/19 flow checks |
| 3 | _to be chosen_ — band 4 continues with Add customer (`88:11845`) | | not started |

## Foundation — done

| Step | Result |
|---|---|
| Section confirmed | `88:7008`, confirmed by the user |
| Variables pulled | 138 variables -> `src/tokens/` (57 semantic colours, 21 type styles, 168 CSS properties) |
| Component census | 2475 instances, 50 distinct components (see below) |
| Libraries | 3 community kits subscribed: Material 3 Design Kit, Simple Design System, iOS 18 and iPadOS 18. **No custom org library**, so there is no published component library to mirror |
| Code Connect | **Unavailable** — needs a Dev/Full seat on Organization or Enterprise. Nothing is mapped, so every component is built from design context |

### Component census — the 20 most used

| Uses | Component | | Uses | Component |
|---|---|---|---|---|
| 321 | Product image | | 62 | `.Modal footer` |
| 319 | Qty input field | | 62 | Badge |
| 245 | x-circle | | 61 | Divider |
| 200 | chevron-right | | 60 | cube-01 |
| 142 | dots-horizontal | | 52 | Text field |
| 135 | Button | | 51 | user-02 |
| 118 | chevron-down | | 51 | check |
| 107 | trash-03 | | 49 | `.Modal header` |
| 95 | Status Bar - iPhone | | 26 | List |
| 79 | trash-01 | | 18 | Filter |
| 77 | **Frame 4908** | | 16 | Section Header |

`Product image` at 321 uses is the single most-used component on the board, which is
why the image pipeline matters: 42 product photos are still missing.

Icon names (`trash-01`, `x-circle`, `cube-01`, `bank-note-02`, `coins-stacked-02`,
`percent-03`, `layout-alt-02`) follow the Untitled UI convention, which is **not** one
of the three subscribed libraries — so they are either local to the file or from an
unsubscribed source. Assets must come from `download_assets` on the instance nodes.

## Resolved deviations from the design

Deliberate, agreed differences. **Do not "fix" these back** — each is a decision, not a bug.

### Safe-area top inset: 59, not the design's 50

The frames place the header at `y=50`, the height of the `Status Bar - iPhone`
component they use. The real Dynamic Island safe-area inset is **59pt**.

Agreed: **follow the device.** Everything below the status bar therefore sits **9px
lower than the frame**, and a coordinate diff against the design will read a constant
`+9` on every child below the header — that is expected and correct, not drift.

Why: at `y=50` content clears the island's bottom edge (11 + 36.67 = 47.67) by just
2.33px, which is the cramped-cutout failure the root agreement warns about. At 59 the
clearance is 11.33px, near-symmetric with the 11pt above the island. The design's own
status bar is 402pt wide (inconsistency #9) — an iPhone 16 Pro component — so the
50pt figure was most likely never checked against a 393pt Dynamic Island device.

`shared/src/device.ts` already holds `SAFE_AREA.top = 59`, so no code changes; screens
pad with `var(--safe-top)` and must **not** hardcode 50.

### Status bar is 393 wide, not the component's 402

Inconsistency #9: 89 of 95 instances are a 402pt (iPhone 16 Pro) status bar on a 393pt
frame. Built at 393, matching the 6 correct instances.

### The frame's own 32px corner radius is not applied

The frame carries `rounded-[32px]`. It renders inside a real device shell already
clipped at 55px, so a second radius would paint a visible rounded rectangle inside the
phone. Dropped deliberately.

### Filter chips come from the catalogue

Inconsistency #18. The frame's chips are placeholder labels with one duplicated and do
not match the catalogue, so they are derived from `CATEGORY_ORDER` — one source of
truth per concept.

### Product names are clamped to two lines

The frame sets every name to `nowrap`, which only works because all six cards say
"Fanta Orange 50cl". Real names run to 48 characters and would overflow the 172px
card, so they clamp.

## Screen 1 — verification record

| Check | Result |
|---|---|
| Coordinate diff vs design, live DOM, production build | 14 elements x 4 axes; **1 outside 0.5px** |
| Remaining diff | header title text run 110.72 vs 112 (−1.28px) — Figma vs Chromium text shaping, left-aligned, nothing downstream depends on it |
| Flow walk | **21/21**: all states, filters, search, empty, error, retry, cart, reduced motion |
| Typecheck / catalogue / tokens | clean / 0 failing / 0 failing |

Fixed during verification, each caught by measurement rather than by eye:

1. **Borders grew 8 boxes by 2px.** Figma strokes draw inside the frame, so `border`
   made the filter bar 38 instead of 36, which grew the header and pushed the product
   grid down 2px. Converted to inset `box-shadow`.
2. **Inter was never loading.** The H1 measured 131.83 against the design's 112 on a
   fallback font. Self-hosted via `@fontsource/inter`; now 110.72.
3. **A `<button>`'s UA default `border: 2px outset`** surfaced the moment the explicit
   border came off, making the filter button 44 wide and stealing 4px from the search
   field beside it.
4. **The dev toolbar's "Sales point" did not reset.** Returning from a forced state
   kept the previous search text, so the default screen came back empty.
5. **The low-stock warning state was unreachable.** The catalogue's minimum non-zero
   stock was 14 against a threshold of 5, so the design's warning colour could never
   be demoed. Two products now run low, and `catalogue:verify` asserts it stays so.

## Before screen 2

1. Read band 4's Section Header title (`88:8155`) — still unread.
2. Name `Frame 4908` (#15) — 77 uses across the board means it is a real component.
3. Decide whether the 393x1170 Cart frames (#6) are scroll views or separate screens.

## Band 4 — "Adding customer to an order"

Title read from `88:8155`. The band is one flow: Sales point -> Cart -> Add customer
-> Customer added. Screens 1 and 2 are the first two steps.

## Motion

`get_motion_context` was run against the Cart, the Sales Point and the whole section,
recursive, and returned `{"nodes":[]}` every time: **there is no authored motion in
this file**. Per the Figma motion skill's own rule, none was fabricated from it.

Transitions in the prototype therefore come from `shared/src/motion.ts`, which is
documented as the project's baseline rather than design-derived, and covers what a
static frame cannot express: press feedback, the presented-sheet transition and its
exit, and the skeleton pulse. If motion is later authored in Figma, replace the values
in that module rather than adding a second set beside it.

## Resolved: `Frame 4908` is `CloseButton` (#15)

77 uses, always 40x40 at the leading edge of a title bar, always wrapping a 20x20
`x-close` — a dismiss action, not a back action. Built as
`src/components/CloseButton.tsx`. Its 40x40 target is under the 44x44 minimum, so the
hit area is expanded with `::after` rather than by growing the glyph.
