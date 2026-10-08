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
| 32 | **The Cart shows no order total**, and its button reads "Checkout (5)" over **six** priced rows whose line prices reconcile with nothing (₦10,000 on one row, ₦1,000 on five at the same quantity) | Total added as a minimal honest addition. **Resolved** by band `115:8774`, which designs one (`88:8639` / `88:9338`) — the ad-hoc line is gone |
| 33 | **No motion is authored anywhere in the file.** `get_motion_context` returns `{"nodes":[]}` for the Cart, the Sales Point, and all 90 frames in the section | Transitions use the project's own documented baseline, explicitly not design-derived |
| 34 | Product names clamp to two lines in a 172px card and the longest real name still overflows. The design sets `nowrap`, which only holds for its own short placeholder names | `title` added as the minimum way to reach the full value; **a designed affordance is still needed** |
| 35 | **The Cart's title-bar trash clears the whole order in one tap** — no confirmation, no undo, no distinct treatment. Measured: 4 lines to 0 with no dialog | **Resolved by the designer's call** (band `152:8774`): it clears at once and the toast offers **Undo**, which restores the lines and the order discount. The toast's action is not designed (#86) |
| 36 | **The sheet's ENTRY was an instant cut.** It mounted already in its open state, so there was no rendered starting frame to transition from — measured `translateY 0.0` at every frame including t=44ms. Only the exit had ever been checked | **Fixed.** Two-phase mount; entry now measures 0% → 55.9% → 91.8% at t=20/104/204ms. `npm run motion:sample` guards it |
| 37 | The sheet's **exit curve is heavily back-loaded**: 0.2% travelled at 25% of the duration, 2.8% at 50%, 46.8% at 90% — visually motionless for roughly the first 150ms after the tap. `EASING.in` is `cubic-bezier(0.7, 0, 0.84, 0)` | **Open — deferred to `better-ui`**, which owns motion. Measured, not retuned on taste |
| 38 | The Cart's **Add customer row differs between frames**: `88:8164` draws a 32px pink circle with `user-02` and `Color/text/default`; `88:11845` draws a bare 20px `heroicons:user-16-solid` with `Color/text/brand` | Built as `88:8164` draws it, since that is the Cart's own frame |
| 39 | The Cart's **title-bar trailing icon** is `trash-03` in `88:8164` and `trash-01` in `88:11845` / `88:12043` | `trash-03` kept, per the Cart's own frame |
| 40 | The Cart's **per-line remove icon** is `x-circle` in `88:8164` (rows 1–5) but `trash-01` throughout `88:11845` | `x-circle` kept, per the Cart's own frame |
| 41 | `88:11845` renders the Cart **with a TabBar and its footer at y=706**; `88:8164` has no TabBar and its footer at y=773 | Built as `88:8164`; the sheet overlays it either way |
| 42 | The two "Add customer" frames show the sheet's **empty** (`88:11845`) and **populated** (`88:12043`) states — they are one component, not two screens | Both built as states of one sheet |
| 43 | **Invisible controls.** The modal header holds a `check` Button Icon at `opacity: 0`, and every one of the twelve customer rows carries a trailing "All" label at `opacity: 0` — identical on all of them, so its meaning is undefined | Neither built. An affordance nobody can see is not an affordance |
| 44 | **Two different buttons for one action.** The empty state's "Add customer" is brand-bold with inverse text, a 16px `plus` and gap 8; the populated state's is brand-subtle with default text, a 20px `add-one` and gap 16 | Both followed as drawn |
| 45 | The empty state's concentric rings use hardcoded `#f2f2f3` and `#dfe0e2`, with no token behind either; only the innermost ring uses `Color/border/default` | Kept as literals, flagged |
| 46 | Two of the twelve customer rows read **"Location"** instead of a name — leftover placeholder text | Replaced with names in the same style, so a demo does not show a row called "Location" |
| 47 | The add-customer **form** is not in band 4 — the sheet's CTA has no designed destination here | CTA seeds the list, so the empty state has somewhere to go. **Needs design input** |
| 48 | **The bottom scrim's blur was wrong, and the generated code could not have revealed it.** The codegen emits `backdrop-blur-[8px]`; the node itself holds `effects: [{ type: 'BACKGROUND_BLUR', radius: 16 }]` over a gradient whose alpha runs 0 to 0.9 to 1. A Figma BACKGROUND_BLUR is **modulated by the layer's own alpha**, so the blur fades in with the white. CSS `backdrop-filter` blurs the element's whole box evenly, which cut a hard seam across the content at the scrim's top edge — measured at a 1.97 step against a 0.10 content baseline | **Fixed.** Blur moved to its own layer masked by the fill's alpha ramp. Step at the edge now 0.10, identical to the no-scrim baseline |
| 49 | Figma stores the blur radius as **16**; its own code export emits **8px**. These are different units (the conventional mapping is 2:1) | 8px kept, matching the export. One value to change if it ever reads wrong |
| 50 | `search-sm`'s stroke is `#5B6579`, which is **not a token**. The nearest variable is `Color/icon/subtle` `#5E6A82`, and `filter-lines` — the icon sitting 8px away from it in the same search field — does use that token | Kept the literal `#5B6579` the export carries, so the icon matches the frame. **Needs design input**: one of the two icons in that field is off-token |
| 51 | The filter button in the search field has no designed destination anywhere in band 4 — no filter sheet, no sort menu, no active-filter state | Wired to reset the category chip and the query, which is the only coherent action available from the state the band designs. **Needs design input** |
| 52 | **Every frame carries its own status-bar instance.** That is a Figma necessity — a frame is the screen, so a designer pastes one in for it to read — not a platform fact. iOS draws the status bar once, above the app, and a presented sheet passes under it | **Fixed structurally.** Moved to `shared/src/StatusBar.tsx`, rendered once by `DeviceFrame` beside the Dynamic Island. Screens reserve the inset with `padding-top: var(--safe-top)` |
| 53 | **The whole 90-frame section holds 354 image fills but only 10 distinct images.** Four are grid photos, reused 109 / 61 / 60 / 59 times; all four are real-brand stock (Fanta can, Coca-Cola bottle, Sprite can, Fanta bottle) under cards that every one of them labels "Fanta Orange 50cl, ₦1,000". It is a mock, never a catalogue | Not a source for this build — it is the placeholder set the study replaces. Photos are a content decision, recorded under "Getting photos" in the study's CLAUDE.md |
| 54 | **The search field and the filter button each carry a SECOND stroke** — a linear gradient over the solid `Color/border/input`, black fading up from the bottom edge at 15% layer opacity on the field and 10% on the button. The code export emits only the solid one | **Fixed.** Built as a 1px gradient ring (gradient fill clipped to the border box by an xor mask), resolved from each paint's own `gradientTransform` |
| 55 | **The Cart's add-customer row is the only OUTSIDE stroke in the three screens** — 2px, `#0c0e180a`, drawn outside the 361x56 frame while every other stroke is INSIDE | **Fixed.** A non-inset spread ring. The project-wide `box-shadow: inset` rule is for INSIDE strokes; applying it here shrank the white fill by 2px on every side instead of ringing the row |
| 56 | **Figma reports an auto-width text node's width as an integer.** Every one in the frame is whole: 73, 112, 46, 17, 50, 90, 72, 138, 37, 56, 57, 27 — which real advances never are | Not fixable and not a CSS error. Measured against 12 strings: mean 0.769px, max 1.500px, with no consistent sign (one is +0.125). Pinning Inter v3 (`@fontsource/inter@4.5.15`) moves it to mean 0.730 / max 1.156 — 0.04px for a three-year-old font, so it was tested and reverted |
| 57 | The filter bar's second "Filter Spacer" is nested **inside the last chip** at x=447, off-screen past the 393 frame | Not built. The right-edge spacer at x=338 is real and is built; this one is a stray |
| 58 | **The qty stepper has two different border colours in the same screen.** Its main component (`88:2065`) strokes with `Color/border/input` `#cfd3d8`, and **15 of the 18 instances** across the Cart and both sheet frames override that to `Color/border/default` `#252b3724`. The 3 that keep the component value are the last row of each frame — which are also 124 wide instead of 116, typeset 15/22 at -1% instead of 16/24, and carry `#f0f2f5` stepper buttons with white glyphs. Verified by sampling Figma's own raster, not by reading node values: rows 1-5 paint **(224, 225, 227)**, row 6 paints **(207, 211, 216)** | Followed the 15. The last row is plainly an older variant that was not updated with the rest, and a grid where one row's border is darker than the other five reads as a bug. **Needs design input**: the component's own token is the semantically right one for an input |
| 59 | **The qty stepper's second, gradient stroke is applied to 53 of its 319 instances.** The paint is identical to the search field's — 0deg, black full-alpha on the bottom edge fading to nothing by 19.71% of the box, at 15% layer opacity — and all 53 sit in the 14 frames named "Customer added". The six rows in the Cart and both Select-customer frames carry the solid stroke alone. All 319 share one main component (`88:2065`), which has no gradient at all, so every one of the 53 is a per-instance addition | **Applied.** The three input surfaces — search field, filter button, qty stepper — now share one ring recipe in `index.css`. This DEVIATES from the three frames built, which show no gradient on the stepper; followed the input family instead, because the same paint on the search field two screens earlier makes 53 instances the intent and 266 the oversight. Three lines to revert |
| 60 | **`88:8402` is byte-identical to `88:8243`** — same 86 nodes, same names, same geometry, same text. Two of band 4's three "Customer added" frames are the same frame | Built once. `88:8322` is the real second state: the same frame plus a toast |
| 61 | **The footer and the bottom scrim move between the Cart and Customer added** although nothing between them changes: the footer sits at y=773 in `88:8164` and y=764 in `88:8243` (31px vs 40px from the screen bottom), and the scrim is [0,646,393,206] against [0,613,393,239]. Content height is identical — Frame 5005 is [12,130,361,736] in both | Kept the Cart's 31px and 206. A footer that jumps 9px when a customer is attached is a bug, not a state |
| 62 | The toast reads **"Customer has been created"**, but band 4 never designs an add-customer form — the sheet's CTA is the only "create" affordance and it has no destination (#47) | Raised only on that CTA path, not on selecting an existing customer, which creates nothing. **Needs design input** once the form exists |
| 63 | The customer row's trash is **20x20**, under the 44x44 minimum | Expanded with `::after { inset: -12px }` rather than growing the glyph |
| 64 | **Pack units are designed for one product only.** The Quantity sheet (`88:11532`) lists Each / Pack / Carton / Box at 1 / 4 / 8 / 16, and only "ea" and "pck" ever appear as abbreviations | Zivra Cola carries the frame's own 1/4/8/16. Every other product's pack sizes are **invented**, like its price, and "ctn" / "box" are invented abbreviations. **Needs design input** |
| 65 | **Nothing in the design limits a sale to stock.** The build let the out-of-stock Bluewell Apple Juice into the cart and stepped past the shelf from the grid (a build bug, not the design's) | Clamped in `addToCart`, in the line's own unit. A refused tap raises the existing toast — "Out of stock" / "Only 3 ea left" — **copy undesigned**, and without the check-circle, since a success glyph beside a refusal says the opposite. There is no warning glyph or warning token to use instead. **Needs design input** |
| 66 | **The band 4 toast faded out an empty box.** `message={toast ?? ''}` cleared the text the moment the exit began; and its timer restarted on every App render, so a busy screen could hold it up indefinitely | Mine, from band 4. **Fixed**: the message outlives `open`, and the timer restarts on each show (a repeat refusal gets the full 2.6s), not on render. Both A/B'd — the old code fails each check |
| 67 | **The Cart's Total changes value.** It was the plain sum of lines; it now includes the 7.5% VAT the study's tax assumption always implied — ₦1,500 of lines shows ₦1,613 | Deliberate: one money model, `orderTotals`, replaces the two that disagreed (the Cart's sum vs the verifier's VAT). The Total line itself is still the ad-hoc one from #32 until the footer total is built |
| 68 | **The total's header changes type between states**: Heading/H3 16px collapsed (`88:8717`), Heading/H2 18px expanded (`88:9416`) — and the expanded "Total" label is an unbound `#000000` where its value is Color/text/default | H3 and the token in both. A disclosure whose header grows when tapped moves the thing just tapped, and the label and value would reflow mid-animation |
| 69 | **The footer's buttons sit at y=780** in both new frames (24px above the bottom), against 773 in the band 4 Cart (`88:8164`) and 764 in Customer added (`88:8243`). At 780 their bottom edge (828) sits 10px inside the 34pt home-indicator inset | **780**, superseding #61: the total panel is now permanent, so the frame that draws it defines the footer, and the Cart and Customer added can no longer drift. The safe-area overlap is the design's — **needs design input** |
| 70 | **Side padding differs between states**: 16px collapsed (`88:8714`), 20px expanded (`88:9413`), so Checkout is 233 wide closed and 225 open | 16 in both. Otherwise the buttons resize while the panel animates |
| 71 | **The Discount row is drawn but hidden** (`88:9426`, `visible: false`), at a 36px inset where Subtotal and Tax sit at 20, and with its value in Label/Base Color/text/subtle where theirs are Heading/H4 Color/text/default | Shown **only when the order has a discount**, which is the reading "drawn but hidden" supports; at its siblings' inset; with its own styling, since that is the design's value for it. Amount signed: "−₦75". **Needs design input** |
| 72 | **The chevron never changes** between collapsed and expanded, so nothing says the row is open or that tapping again closes it. The sub-rows' chevrons are hidden | Turns 180° with the panel, over the same duration and curve; `aria-expanded` carries the state for assistive tech. Hidden sub-row chevrons are not built — they would be dead affordances (§9) |
| 73 | **The frames' numbers do not reconcile**: Subtotal ₦10,000 = Total ₦10,000 over six ₦1,000 lines, and Tax ₦0 contradicts the study's 7.5% VAT | Every figure is computed by `orderTotals`. A standard-rated basket shows its real VAT |
| 74 | **The footer panel's fill and shadow are unbound**: `#ffffff` with no variable (its child row binds Color/surface/default, same value), and a shadow pair with no effect style — Untitled UI's shadow-md cast upward | Fill from the token holding the same value; the shadow as a literal with a comment — no token was invented for it |
| 75 | **"Applying discount to an order" names four of its six frames "Customer added"** (`88:15677`, `88:15769`, `88:15861`, `88:15571`) | Referenced by node ID only, as everywhere on this board |
| 76 | **Every More options row carries a trailing check at opacity 0** (`88:15552` …), and the header's check Button Icon is at opacity 0 too | Neither built. An invisible mark on a menu row says nothing, and none of the rows is a selection; the header button as #43 |
| 77 | **Clear cart, the only row in its group, has the bottom divider** that separates rows elsewhere in the menu (`88:15559`); Queued orders, also alone, has none | Dropped: a line under the last row divides nothing |
| 78 | **The menu's groups are 345 wide in a 349 body** (`88:15546`), 16 from the left and 20 from the right | Full width, 16 each side |
| 79 | **More options offers "Add a customer" while a customer is attached** — the frame's own Cart shows Samuel Daudu | Label kept as drawn; the row opens the picker, which swaps the customer. **Needs design input**: "Change customer", or hide the row |
| 80 | **Queued orders has no destination** in this band | The designer's call: designed later. Until then the row raises a notice, "Queued orders is not designed yet", so it is not a dead control |
| 81 | **The final frame's numbers do not reconcile** (`88:15571`): Subtotal ₦10,000, Tax ₦0, Discount ₦100, Total ₦10,000 — and the sheets enter 10% and ₦10, neither of which is ₦100 | Every figure computed by `orderTotals` (as #73) |
| 82 | **The breakdown is redrawn** in `88:15652`: Label/Base in Color/text/secondary for every label and amount, 4px row padding, and Discount after Tax as an unsigned "₦100". `88:9338` (built, audited) has Color/text/subtle labels, Heading/H4 amounts, and Discount between Subtotal and Tax, signed | **Kept `88:9338`'s.** Which frame supersedes is the designer's call. The money is the same either way: both discounts come off before VAT whatever the row order. **Needs design input** |
| 83 | **The %/₦ switch sets its chosen option two ways**: Heading/h5 (Semi Bold 16/20) in Item details (`88:9562`), Label/large (Medium 16/24) in Apply discount (`88:15765`) | Each sheet follows its own frame, through one component with a variant |
| 84 | **The unchosen option changes colour between states of one sheet**: Color/text/subtle in `88:15949`, Color/text/subtlest in `88:15767`, `88:15859` and Item details' `88:9564` | Subtlest throughout |
| 85 | **The Discount field's "%" sat at the field's right edge** in Item details — the input filled the row, pushing its suffix away. Every frame writes the value and its unit as one string: "10%", "₦10" | Mine, from band `115:8774`. **Fixed**: the input sizes to what is typed, so the suffix sits 1px after it, in both sheets |
| 86 | **Clearing has no designed way back**, and the toast has no designed action | The designer's call: Undo on the existing toast. The pill is the header confirm's colours on the toast's dark fill, the toast stays up 5s, not 2.6s, and takes taps only while it shows an action. **Needs design input** |

## Work order

Screens get built 1–3 at a time, by node ID.

| # | Screen | Node | Status |
|---|---|---|---|
| 1 | Sales point (band 4) | `88:8079` | **built and verified** — 1 coordinate outside 0.5px, 21/21 flow checks |
| 2 | Cart / Order Preview (band 4) | `88:8164` | **built and verified** — 0 coordinates outside 0.5px, 19/19 flow checks |
| 3 | Select customer sheet — empty + populated (band 4) | `88:11845`, `88:12043` | **built and verified** — 0 measurements outside tolerance, 17/17 flow checks |
| 4 | _to be chosen_ — band 4 ends with Customer added (`88:8243`) | | not started |

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

**Reversed on review.** At 59 the Sales Point title sat 25px under the island, against
the design's 16, and read as too much and unlike iOS. The cramped-cutout worry was
about the header ROW's top edge, which is invisible; the visible content — the title
text at y=64, the overflow button at 58 — clears the island by 16 and 10. This study
now sets `--safe-top: 50px` (index.css), so screens sit exactly where the frames put
them and coordinate diffs carry no `+9`. The shared frame keeps 59 for other studies.

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

### Property-level audit against the Figma nodes

The screens were built to a measured coordinate diff, which proved geometry and left
everything else — colour, stroke, shadow, gradient, blur — resting on the code export.
`npm run figma:audit` now reads **207 properties off the Figma nodes themselves** via
the plugin API and compares each against the built element's computed style. Ten real
differences came out of the first run:

| Node | Property | Was | Figma |
|---|---|---|---|
| `88:8088` Text field | second stroke | absent | gradient, black 15% from the bottom edge |
| `88:8089` Filter button | second stroke | absent | gradient, black 10% over the full height |
| `88:8090` Filter Bar | width | 361, stopping at the gutter | 666 at x=16, clipped by the screen at 393 |
| `88:8091` Filter Spacer | right-edge fade | absent | `#f9fafb` 0 to 1 over 55px |
| `88:8104` Product Card | shadow spreads | both 0 | -2px and 0.5px |
| `88:8113` Product Image | scrim | 179.8deg / 64.588% / 99.743% | 180deg / 64.663% / 100% |
| `88:8154` View cart | shadow | `drop-shadow(0 1px 1px)` | `0 1px 2px 0 #0a0d120d` |
| `88:8176` Add customer row | stroke | 2px INSET | 2px **OUTSIDE** |
| `88:8241`, `88:8242` Cart footer | shadow | `drop-shadow(0 1px 1px)` | `0 1px 2px 0 #0a0d120d` |
| `88:12133` Add customer button | shadow | absent | `0 1px 2px 0 #0a0d120d` |

The `drop-shadow` filter appearing four times was one root cause: a filter blur and a
box-shadow blur are different Gaussians, so `drop-shadow(0 1px 1px)` is not the frame's
`0 1px 2px`. All four now use `--shadow-xs`, which holds exactly that value.

Two things the audit has to get right to be worth running:

- **Compound values are compared computed-to-computed.** The browser and the
  production build's CSS minifier both re-spell gradients and shadows in a normal form
  (dropping a leading `0%`, a trailing `100%`, a default `180deg`). Comparing a
  hand-written Figma string against a computed one reported three differences that
  were only spelling; the audit now paints both and compares pixels before calling
  one a finding. All three came back at **0/255 max channel delta**.
- **Text width is deliberately not asserted** — see #56.

### Band 4 complete — Customer added is a STATE, not a screen

`88:8243` is the Cart's own frame with two properties changed on one row, so it is
built as state on the Cart rather than a fourth screen:

| | Cart `88:8176` | Customer added `88:8255` |
|---|---|---|
| Label | "Add customer", Label/Base — Medium 16/24, -0.24 | the name, **Heading/H3** — Semi Bold 16/24, **-0.32** |
| Trailing | `plus-circle` 24x24, icon stroke `#2c4a8b` | `trash-03` 20x20, icon stroke **`#9ea4b3`** |

Everything else in the row — 361x56, radius 12, the 2px OUTSIDE stroke, 12px padding,
the `#fce9f7` avatar with its `#d42189` glyph — is identical.

`88:8322` adds one node, `Frame 5071` / `88:8401`: a 200x132 toast, `#141f33` at radius
8, 16px padding, 4px gap, a 48x48 `check-circle` in `#038c4e`, and Body/Large text in
`#ffffff` centred in a 168x48 box. It is vertically centred on the screen — (852-132)/2
is exactly 360 — so unlike everything else it does NOT take the +9 safe-area shift.

Two icons exported from their instances: `check-circle`, and a second `trash-03`,
because the customer row's is `#9ea4b3` where the title bar's is `#20293C`.

**A regression this caught in passing**: the Cart's line images still asked for
`/products/<file>`, the path fixed in `ProductCard` weeks of work earlier but never
here — every line rendered a broken-image glyph. The resolver now lives in
`src/data/productImage.ts` and both screens read it, which is what section 4 asks for
and what would have prevented the split in the first place.

**And one I introduced**: making the row a `div` so the trash could be its own button
shrank the empty state's target from 361x56 to 337x32. The plus moved back inside the
pick button and the hit area is expanded over the row's padding; probing all four
corners of the empty row now hits `.addCustomer__pick`.

Verified: 231 properties against the Figma nodes, 0 differing; the new state's
coordinate diff 0 outside 0.5px on all 22 measurements, the toast landing at
96.5/360/200/132 exactly; 11/11 flow and motion checks, including that the toast fades
in AND out over several frames rather than cutting, stays mounted through its exit, and
zeroes under reduced motion; 0 unnamed controls, toast contrast 16.49:1.

### The input ring, and the limit of a three-frame audit

`figma:audit` passed 207 properties against the three built frames while the qty
stepper was still missing a stroke — because the frames it checks do not have it.
Searching the whole section instead of the three frames: **319 qty-field instances,
53 of them carrying a second, gradient stroke**, all in the 14 "Customer added"
frames. The paint is the search field's, exactly: 0deg, black at full alpha on the
bottom edge fading to nothing by 19.71% of the box, 15% layer opacity.

All 319 share one main component (`88:2065`), which carries no gradient, so each of
the 53 is a per-instance addition — and in `88:8243` it is rows 1-4 of 6, with row 5
plain and row 6 on the other border colour entirely.

Applied, and the recipe moved to `index.css` so the search field, the filter button
and the qty stepper share one definition rather than three copies of a mask trick.
Measured: the stepper's bottom border goes from (224, 225, 227) to (193, 194, 195),
which is 15% black at the gradient's 92.9% alpha at that row's centre; the top edge
is unchanged.

**The lesson for the audit**: passing against the frames you built says nothing about
the frames you have not. The counts above came from walking all 90 frames, which is
what the next screen's audit should start from.

### Cart, inspected node by node

The first audit pass covered the Cart with 24 properties against selectors I had
guessed. Re-done properly against its full node tree — title bar, add-customer row,
every line row, the qty field, the trailing column and both footer buttons — it is
**82 properties**, and one more difference came out of it:

- `88:8189` Frame 4975, the line's trailing column, is `SPACE_BETWEEN` with
  `itemSpacing: 4`. The built column had no gap. It changes nothing at today's
  content, because a 72px column never gets tight enough for the minimum to bind,
  but without it a longer price lets the remove button and the price touch.

Two things checked and found already correct, recorded so they are not re-checked:

- **The three bottom scrims resolve to the same stop percentages** — 33.537% /
  58.748% / 122.418% — even though their boxes are 272 (Sales Point), 206 (Cart) and
  338 (the sheet's underlying screen). Figma's gradient transform scales with the box,
  so the shared `BottomScrim` taking a height prop and fixed percentages is right.
- **The Cart frame carries no TabBar**, and the built Cart does not render one.

### Generated packshots stand in for photography

With no photography available from the design and none obtainable (the container's
network policy is an allowlist of package registries, so every stock host answers 403
at CONNECT — and a stock library could not carry invented brands anyway), the grid
would have demoed as 43 grey tiles.

`scripts/gen-packshots.mjs` now draws one per product from the catalogue. Three things
it had to get right, each caught by looking rather than assuming:

1. **The scrim.** First pass stood each product on the floor of the tile, where the
   card's scrim is 80% black, so every packshot's lower half went to mud. The scrim is
   the design's own value and stays; the packshot is now a lit backdrop with the
   product filling the frame, which is how the design's photographs sit under it.
2. **Duplicates.** Category plus brand alone produced only **24 distinct files for 43
   products** — four 50cl beverages from one brand collapsing into one tile, the exact
   "Fanta Orange 50cl under every photo" failure this study replaced. A stable hash of
   the product id now varies hue, width and label band: **42 distinct, by checksum.**
3. **The no-photo state.** Giving all 43 a packshot would have made the designed
   fallback unreachable, contradicting the study's own states table. `image: null` is
   respected, so Sweetcorn has none.

Verified in a production build: 43 cards, 42 images, 0 broken, 0 requests over 400,
all intrinsic 480x324 into a measured 160x108 box (exactly 3x), all inlined under
`assetsInlineLimit`, which is safe because they are `<img src>` and never CSS `url()`.

### Product photos resolved through a path that could not work

`ProductCard` requested `/products/<file>`, which Vite serves only out of a `public/`
directory. There is none — the pipeline writes to `assets/products/`. So the URL could
never resolve, and because the fallback keyed off `product.image` being falsy rather
than the file existing, all 42 products carrying a filename rendered a broken-image
glyph over the neutral fill. Measured in a production build: **42 broken `<img>`**.
The CSS even carried a comment claiming the neutral fill was "what most cards show",
which the code had stopped making true.

Now resolved with `import.meta.glob` over `../../assets/products/*.webp` — a relative
pattern, since glob does not resolve path aliases. A name with no file is simply
absent from the map, so absence is a build-time fact and the card renders no `<img>`
at all. Re-measured in the same production build: **0 broken images, 0 failed
requests, 0 cards rendering an `<img>`,** 43 cards on the designed fill.

The `--box` placeholder went with it. `.productCard__image` renders **160x108** on all
43 cards and the design's own "Product Image" frame is 160x108, so the pipeline's
default is 160 — measured, where 112 was a guess nobody had checked.

### The status bar is device chrome, not screen content

Mirroring the file's composition put a `<StatusBar />` in both `SalesPoint` and
`Cart`. The consequence was measurable rather than theoretical: through the whole
cart transition **two status bars were visible at once** — one fixed at y=0 and a
second travelling up the screen with the sheet, sampled at y=686.1, 382.4, 142.9,
55.6, 20.1, 5.6. Two clocks, both reading 9:41.

It now lives in `shared/src/StatusBar.tsx` and is rendered once by `DeviceFrame`,
overlaid on the screen rather than laid out by it, so the sheet slides under it the
way it does on a device. Re-running the same sample: **1 status bar at every frame,
y=0 throughout.**

Three consequences worth recording:

- The three status glyphs moved to `shared/src/assets/` with it. They are device
  chrome, so the prototype's icon set is 18, not 21.
- It is `aria-hidden`. On a device this is system UI outside the app's accessibility
  tree, and a screen reader should not announce the app's own clock. The audit's Cart
  text-run count went 168 to 167 — that is the second clock leaving the DOM, not the
  aria change; the walker is `querySelectorAll('*')` and does not filter hidden nodes.
- The one thing an app genuinely owns here is the status-bar *style*
  (`preferredStatusBarStyle`, light vs dark content). No screen in this band needs
  anything but dark content, so no prop was added — an unused one is a dead flag.
  If a dark screen arrives, that is where it goes.

### 8px below the filter chips — requested, not designed

The frame ends the header flush with the chip row: filter bar bottom 216, header
bottom 216, product grid 240, the 24px between them belonging to the scroll area.
Because that 24px is the scroller's own top padding, it scrolls away with the
content, so at any scroll offset above 0 a product card arrived flush against the
chips and the boundary read as a clipped row rather than a scroll edge.

8px of `padding-bottom` now sits on `.salesPoint__searchAndFilters`, inside the
header, so it survives scrolling. Measured at scroll 0 / 180 / end: gap 8.00 at all
three. A/B with the padding flipped to 0 live: gap 8 to 0, header 174 to 166, grid
top 257 to 249 — the 8px is entirely this change.

Everything below the header takes it; the bottom-docked View cart (703), tab bar
(761) and scrim (580) do not, and re-measured unchanged.

### Band `115:8774`, step 1 — one money model, and pack units

No UI. The band adds pack units, price overrides and discounts, and its expanded footer
shows Subtotal / Discount / Tax / Total — so the two money models that disagreed (the
Cart summed lines with no VAT; `verify-catalogue.mjs` computed VAT on its own) became
one, in `catalogue.ts`, before any screen is built on it.

- **Integer throughout.** VAT in basis points (750), per line on the **net**,
  half-up in kobo; the order's tax rounded **once** to whole Naira, so the payable
  total is always collectable. Percent discounts `floor((naira x p + 50) / 100)`, exact.
- **Inputs parsed strictly** (`/^\d+$/`): `"1e2"`, `""`, `"-1"`, `"2.5"` all refused.
- **The amount-discount clamp is persisted**, so qty 3 -> 1 -> 3 cannot quietly bring
  back a discount nobody re-entered. A committed unit change drops a price override
  (it was agreed for that pack size) and keeps a percent discount.
- **One line per product** is a stated limitation: it cannot sell 2 packs and 2 singles
  of one item. The design never shows either.

Verified: `catalogue:verify` 57/57, `cart:verify` 22/22. Both A/B'd — the float percent
rule fails 2 checks (it gets 69% of ₦350 as ₦241, not ₦242: the raw value is
241.4999...), un-rounded order tax fails 2 (373 of 500 random baskets have a fractional
payable total), an unpersisted clamp fails 4, a kept override fails 1. Every UI gate
unchanged on dev and production, except the Cart walk's total check, rewritten for VAT.

### Band `115:8774`, step 2 — the order total

`88:8639` / `88:9338` built as one `OrderTotal` disclosure inside a docked footer
panel, replacing the ad-hoc Total line (#32). Every figure is `orderTotals`.

- **Motion**: `grid-template-rows` 0fr -> 1fr on `DURATION.base`, `EASING.out` open /
  `EASING.in` close; the chevron turns on the same values. One custom property drives
  every duration and the visibility delay, so stretching it for debugging stretches
  all of them — stretching only the durations made the panel vanish mid-close at
  82px, which was the test's fault, and is why it is built this way.
- **The buttons never move**: sampled over 20 frames of a stretched open and close,
  one y (836.59 in the test viewport).
- **The list keeps 10px of clearance** under either panel height; A/B with the open
  rule removed, the last line ends 31px under the panel.

Verified: `diff-total` 0 outside 0.5px over 77 measurements (collapsed, expanded,
collapsed again; the chevron's x replaced by the designed 8px gap, #56);
`walk-total` 19/19; `figma:audit` 274 properties, 0 differ (+43); every earlier gate
green on dev and production — the Cart diff retargeted to the new footer (#69).

### Band `152:8774` — "Applying discount to an order"

Six frames: the Cart, More options (`88:15543`), Apply discount empty / 10% / ₦10
(`88:15757`, `88:15849`, `88:15941`), and the Cart with the discount in its total
(`88:15571`). The designer's calls, asked before building: the order discount comes
off **after line discounts and before VAT**; it is changed by reopening the sheet and
**removed by an empty field**; **Clear cart clears with Undo**; Queued orders is
designed later.

- **Money**: `orderTotals(lines, orderDiscount)`. The discount is taken from what the
  lines come to after their own discounts, by the same rounding rule as a line's,
  and split across lines in whole Naira by largest remainder, so each line's VAT is
  on its share of what is collected. An amount past the order is clamped at
  computation, not stored clamped (see the function's comment).
- **Reused**: BottomSheet chrome; the Quantity sheet's grey panel and white close;
  the shared row press feedback in `motion.css`; the Item details text field and
  %/₦ switch, extracted to `DiscountInput` + `FieldError` + `DetailField.css`.
- **New**: `MoreOptions`, `ApplyDiscount`, four icons exported from their instances
  (`user-02-brand`, `percent-03`, `trash-01`, `list`), an optional Toast action.
- **Sequencing**: a menu row closes the menu and opens the next sheet once its exit
  has run, so two sheets never cross. Clear cart from the menu runs through the
  Cart's own line exit, the same path as the title-bar trash.

Verified: `walk-discount` 25/25; the sheets' boxes 0 outside 0.5px against the frames
(two label widths 0.6–0.8 narrow: Figma rounds text boxes up to whole pixels);
`figma:audit` 399 properties, 0 differ (+35); `catalogue:verify` with five new
order-discount checks, 2,000 random splits and 500 random baskets now carrying order
discounts; every earlier gate green.

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
