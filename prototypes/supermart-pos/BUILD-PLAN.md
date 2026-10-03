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
| 10 | **Header sits at y=50, but the Dynamic Island safe-area inset is 59.** Content at y=50 clears the island's bottom edge (47.67) by 2.33px, against 11.33px at 59 | **Blocks screen 1 — needs a decision** |
| 11 | Letter-spacing values filed under a colour namespace: `Color/container/accent/indigo/heading/h4` = −0.48, `/h5` = −0.20. `Heading/h4` and `Heading/h5` bind `letterSpacing` to them | Handled in the generator, documented in `src/tokens/TOKENS.md` |
| 12 | Five type-style pairs differ only by case, and four are **not** equivalent — `Heading/H4` is 14/20 while `Heading/h4` is 20/24. System looks mid-migration from literal to primitive-composed styles | Both kept under exact Figma names; CSS property names preserve case |
| 13 | `H/6` holds a **unitless line-height ratio (1.4)** while the other 20 styles hold px. `H/6` and `Body/Reg/Large` also hold letter-spacing −2 against −0.16…−0.96 elsewhere — probably −2% in a px field | Ratio handled by `lineHeightCss`; the −2 is **unresolved** |
| 14 | 11 colour tokens sit outside the semantic `Color/*` system, including `Omnix Neutral/400` (a foreign system) and `Primary / White` (spaces around the slash) | Exported as `legacyColor`; prefer semantic tokens |
| 15 | Components doing real work under default Figma names: `Frame 4908` x77, `Frame 4909` x18, `Frame 5071` x1 | Open — need naming before they can be built as components |
| 16 | Both `trash-01` (79 uses) and `trash-03` (107 uses) are in use — two different trash icons for the same action | Open |
| 17 | `List` (26 uses) and `list` (2 uses) — case-variant component names, same pattern as the type styles | Open |

## Work order

Screens get built 1–3 at a time, by node ID.

| # | Screen | Node | Status |
|---|---|---|---|
| 1 | Sales point (band 4) | `88:8079` | **tokens + inventory done; build not started** |

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

## Before screen 1 can be built

1. **Decide the safe-area conflict** (inconsistency #10): build the header at the
   design's y=50, or at the device's 59pt Dynamic Island inset.
2. Read band 4's Section Header title (`88:8155`).
3. `get_design_context` on `88:8079` alone, with a screenshot, then `download_assets`
   for its icons and imagery.
4. Name `Frame 4908` (#15) if it appears in this screen — 77 uses across the board
   means it is a real component.
