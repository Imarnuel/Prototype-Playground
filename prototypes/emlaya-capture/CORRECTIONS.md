# Corrections — every departure, every token gap, every Figma inconsistency

Each entry is marked **departs** (the prototype differs from the Figma reference) or
**doesn't depart** (flagged only; built as drawn). Node IDs are from `LPXddONZ7IMNlIowbz161x`.
The rendered UI marks each departure: open the dev toolbar (`?dev=1`) → *Show departures*.

## Up front

1. **The flow has four frames, not five.** `9502:21986` holds Camera → Captured → Review → Saved.
   No Extract or Processing frame exists inside it. Processing is `4653:68091`, the same flow's
   processing state in sibling section `4810:31333`. The brief's "Extract" is the Captured
   confirm (`9502:21716`). Figma wins (F1).
2. **The extraction error frame was not inspected.** `4142:9167` "Error / Could Not Extract Details"
   exists, but `get_design_context` timed out three times this session. The error state is a
   placeholder in that frame's words, marked "Needs design input". **Departs.**
3. **figma.com is blocked by this environment's network policy**, so assets were not downloaded from
   the MCP asset URLs. Every SVG was exported with `exportAsync({format:'SVG_STRING'})`. The receipt
   photo came from the image fill's hash: a temporary off-canvas rectangle `9543:15236` was created
   in the file, screenshotted at its native 848×1264, and deleted (confirmed: 0 remain).
4. **The device is 393×852; the frames are 402×874.** The playground's shared device is an iPhone 15
   Pro and is not changed per study. Screens are fluid. `?frame=figma` renders them at exactly
   402×874 with Figma's 62 safe top, and every measurement below is taken there. **Departs**
   (in device mode only).
5. **The data in the frames does not reconcile, so it is not copied.** R1–R4, R8, R9. **Departs.**
6. **Changes at the user's request, after the first build** (all **depart**):
   - The camera is a **live scene**, not the frame's stock photo (C12). The receipt in it is
     printed from the record, so the evidence now agrees with the extraction (R14 resolved).
   - Capture → Review is **a sheet rising over the shot**, not a zoom (P5).
   - The yellow **receipt-actions rail is removed** from Review (R13).
   - The celebration is **staged over ~2.4s**, one beat at a time (S16). The badge appears at
     80ms (it was 380: "the success icon appearance is too slow", asked twice), holds the centre
     until 500ms and is in its slot by 900ms (it was 1450: "the success icon wastes too much time").
   - Done leads to **Receipt Details** (`9564:21987`), section D.
   - The badge **spins in** (−160°), and every celebration motion is on natural curves, mapped
     to the 12 principles in MOTION.md. The badge then lost its squash, stretch, anticipation dip
     and every overshoot ("i don't want the success icon stretching and bouncing"): its spin
     decelerates into level and stops, its scale never passes 1 and stays uniform.
   - Both camera bars sit **clear of the home indicator** (C13), which cut through Continue.
7. **A dark-themed host darkened the app.** The hosted viewer sets `data-theme="dark"` on `<html>`;
   the token file matched it, and gap tokens composed of semantic colours (the processing veil)
   resolve at the root, so the light processing screen drew a dark veil (mean luminance 152 against
   250). Theme selectors are now scoped to the app's own sections. Fixed; verified by
   `verify:motion` ("dark host").

## Flow (F)

| # | Finding | Node | Handling | |
|---|---|---|---|---|
| F1 | No processing frame in the flow node | `9502:21986` | `4653:68091` used, from section `4810:31333` | departs (scope) |
| F2 | Saved frame named "Receipt Details / Tags + Image Attached" | `9502:21212` | Named "Receipt saved" in code | doesn't depart |
| F3 | Both camera frames are named "Scan / Camera – Receipt in Frame" | `9502:21686`, `9502:21716` | Referenced by node ID | doesn't depart |
| F4 | Prototype links do not connect the flow. Save has only a hover variant swap; Done navigates to `4480:25837`, outside the node | `I9502:21685;4018:1211`, `9502:21323` | Save → mock API → celebration; Done → back to the camera | departs |
| F5 | Frames are 402×874 with a 62 status bar; the playground device is 393×852 / 59 | all | See "Up front" 4 | departs (device mode) |
| F6 | Excluded, outside the flow's bounds: the rest of `4810:31333` (21 frames), section `9461:13287` "Unsaved receipt" (7 frames: leave without saving, discard, duplicate…), `9332:30662`, `9332:31565`, `6294:20467`, `6294:20978`, `6337:39158` | — | Not built. Back, Close and the exits they design are answered with the not-designed notice | — |

## Camera (C) — `9502:21686`, `9502:21716`

| # | Finding | Node | Handling | |
|---|---|---|---|---|
| C1 | The feed is 400 wide in a 402 frame, leaving a 2px black strip on the right | `9502:21689`, `9502:21718` | The feed fills the frame. A/B against the Figma render, same region: 5.07% mean pixel error at 402 wide, 2.66% at 400. The difference is the photo's scale, not layout | departs |
| C2 | The controls row is centred in the 400 feed, so the shutter sits 1.5 left of the screen's centre | `9502:21695` | Centred: shutter x 170 against Figma's 168.5 | departs |
| C3 | Top row insets: 15 left, 16 right | `9502:21711` | Kept | doesn't depart |
| C4 | The bottom tab hangs 4 below the frame (809 + 69 = 878) | `9502:21688` | Kept (`--gap-tab-bar-bottom`) | doesn't depart |
| C5 | Tab layer names do not match their glyphs: "Notes" (layer "Bag") draws ListChecks; "profile" draws Bell | `4073:1527`, `4073:1528` | Accessible names "Shopping Notes" (terminology lock) and "Profile" (layer name). Needs design input | doesn't depart |
| C6 | In Captured, the hint and the flash control are at opacity 0, not hidden | `9502:21720`, `9502:21730` | Read as hidden in that phase: they fade out and go inert | doesn't depart |
| C7 | Hidden placeholder button with Heart/Repeat icons in the Captured bar | `9502:21733` | Not built | doesn't depart |
| C8 | Mixed icon sets: close is Material (`4003:1295`, Code Connect Compose), the hint is heroicons, add-page is fluent, the Continue check is bitcoin-icons; the rest are Phosphor. The brief asks for Phosphor throughout | `9502:21713`, `9502:21692`, `9502:21725`, `9502:21743` | Each frame's own export is used. Swapping in Phosphor would substitute assets the design chose | doesn't depart |
| C9 | No destination in this flow: close (live), gallery, files, flash, add a page, and all four other tabs | — | Each shows the not-designed notice | departs (notice is not in Figma) |
| C10 | Close in Captured has no designed destination | `9502:21729` | Retake: back to the live camera. Needs design input (the "Leave without saving" frames are out of scope) | departs |
| C11 | Shutter flash | — | Not in Figma. A 300ms white fade on capture, so the moment registers | departs |
| C12 | The feed is a still stock photo | `9502:21690` | **User request:** a live canvas scene (`CaptureScene.ts`) — a thermal receipt printed from the record on a wood counter, seen hand-held: drift, roll and zoom breathing, an autofocus hunt and exposure settle on opening and on Retake, sensor grain, a vignette, and a document outline (brand yellow) that finds the paper after 1.1s and follows it. The shutter freezes the frame; the flattened paper becomes the evidence image. Receipt boilerplate ("RCPT", "ITEMS", "TOTAL", "THANK YOU FOR SHOPPING", the barcode) is not in Figma. Reduced motion: a still scene | departs |
| C13 | The Continue bar (12 of padding all round) and the tab bar (8, hanging 4 below the frame) put their controls where the home indicator draws on the device. A Figma frame has no indicator; on the device it sits 8–13 above the bottom and cut through Continue, and the Capture disc ended 6 above the edge | `9502:21732`, `9502:21739`, `9502:21688` | **User request.** Both bars grow by 22 (the Continue bar's bottom padding becomes the 34 safe-area inset; the tab bar's gains the same), and the feed and shutter row rise with them. `verify:diff` reports exactly these, each off by 22: `9502:21688`, `9502:21689`, `9502:21695`, `9502:21698`, `9502:21724`, `9502:21732`, `9502:21739`. `verify:motion` checks nothing tappable crosses the indicator on any screen | departs |

## Processing — `4653:68091`

| # | Finding | Handling | |
|---|---|---|---|
| P1 | The skeleton's fields run Merchant, then Amount; Review runs Amount, then Merchant. The skeleton has no Date/Time row and 5 item rows | Built as the skeleton frame draws it | doesn't depart |
| P2 | Copy is "Extracting the details..."; the design-engineer handbook's settled microcopy is "Hunting for the total" | Figma copy used verbatim. Owner decision | doesn't depart |
| P3 | The skeleton is static in Figma | It breathes (opacity 0.72↔1 on the rays' 3s token) so it reads as alive; the spinner turns | departs |
| P4 | "Real progress states" (brief) | The file designs one state. No stages invented: processing → fields arrive staggered → ready. Extraction failure → error placeholder | — |
| P5 | Captured photo carry-through (brief) | **User request: no zoom.** Review rises over the frozen shot as a sheet (420ms, the shared sheet curve); the shot stays still under it. The scan reappears as Review's evidence thumbnail | departs (motion) |

## Review (R) — `9502:21324`

| # | Finding | Node | Handling | |
|---|---|---|---|---|
| R1 | Items do not reach the amount: 7 rows total ₦4,023,000 under an Amount of ₦15,000. "Macbook pro M5 Max 2026" is 2 × ₦2,000 = **₦4,000,000**. Five rows are an identical "Whole milk 2 × ₦2,000" | `9502:21342` | Kept Whole milk 2 × ₦2,000 and Peanut butter jelly 1 × ₦3,000. Added Cheddar cheese 1 × ₦5,000 and Eggs dozen 1 × ₦3,000, names taken from the evidence photo's own lines. Total ₦15,000 | departs |
| R2 | A text cursor is left in the frame after "₦4,000,000" | `9502:21405` | Not built | departs |
| R3 | Tag "S" — truncated (it duplicates "Snacks") | `9502:21540` | Dropped | departs |
| R4 | A second Tags / Shared with card, with tag names in the @mention row | `9502:21569` | Dropped as a duplicated placeholder | departs |
| R5 | The two @mentions use different remove glyphs (MinusCircle 16 vs x-close 12) | `9502:21561`, `9502:21564` | Kept as drawn | doesn't depart |
| R6 | Row dividers: rows 1–2 use border/subtler, rows 3–7 border/subtle | `9502:21346` … | border/subtler for all (the first, and the skeleton's) | departs |
| R7 | Section side padding is inconsistent: 12 (Items, Tags card) vs 16 (top card, attachment, duplicate card) | — | Kept per section | doesn't depart |
| R8 | The attachment row describes another document: "Shoprite 16 Aug · 3 pages · 2.4 MB". Its CaretRight and Trash export with no visible layers | `9502:21668`, `9502:21674`, `9502:21673` | Derived from this capture: "Fresh Market Groceries 16 Aug · 1 page · 0.1 MB". No caret | departs |
| R9 | Date "12/10/2026" reads as 12 Oct or 10 Dec, and disagrees with "16 Aug" on the celebration. The hidden Date field says "25 Aug, 2026" | `9502:21335`, `9502:21332` | One date, 16 Aug 2026, shown as "16/08/2026" in the field's DD/MM/YYYY shape | departs |
| R10 | The header sits at 63, 1 below the status bar | `9502:21676` | Kept (`--gap-header-top`) | doesn't depart |
| R11 | The title sits at calc(50% − 14px): 3 above the row's centre | `9502:21683` | Kept | doesn't depart |
| R12 | Two "Button Icon" Size=default instances, at 40 and 44 | `9502:21681`, `9502:21682` | Kept at their instance sizes | doesn't depart |
| R13 | The receipt-actions rail overlaps the fields' right 28 | `5359:8681` | **User request: removed.** Its four actions had no destination in this flow | departs |
| R14 | **The evidence photo contradicts the record.** It is a US receipt (FRESH MARKET GROCERS, $43.26, 10/14/23). RP-07 says extraction never invents, so no extraction yields ₦15,000 / 16 Aug from it | `9502:21690` | **Resolved** by C12: the receipt is printed from the record, and its scan is the evidence ("1 page · 52 KB") | departs |
| R15 | Merchant "Fresh Market Groceries" vs "GROCERS" on the photo | — | Figma's value, used consistently everywhere | doesn't depart |
| R16 | "Shared with" is pre-filled on a fresh extraction. PRV-01/02: saving never shares | `9502:21552` | Shown as designed. Saving stores the @mentions and creates no share. Owner decision: where these come from | doesn't depart |
| R17 | ₦ renders as nothing in Figma: the frames read "15,000", because the file's font setup draws no glyph. The text layers contain "₦15,000" | `9502:21331` … | The text layers' content: ₦ renders | departs (render only) |
| R18 | Hidden edit-mode layers in every row: Checkbox, Leading, Trailing, _Grabber; hidden "Add item" | `9502:21341` … | Not built (no edit mode in this flow) | doesn't depart |
| R19 | No destination in this flow: Back, More, Tags ›, Shared with ›, date and time pickers, the evidence row | — | The not-designed notice. Tag and @mention removal, merchant and amount edits **are** live, and the celebration reads the edited draft | departs (notice) |

## Receipt saved (S) — `9502:21212`

| # | Finding | Node | Handling | |
|---|---|---|---|---|
| S1 | Body has a double space: "Fresh Market Groceries  • ₦15,000 • 16 Aug" | `9502:21225` | Single space | departs |
| S2 | Card says "Fresh Market groceries" (lower-case g) | `9502:21321` | "Fresh Market Groceries", from the record | departs |
| S3 | "₦55,000" is Label-Bold/small (13) inside a Body/base (15) line | `9502:21322` | Kept. Line box held at 18 (`line-height: 0` on the span) so the card is 118 tall, as in Figma | doesn't depart |
| S4 | Done sits at x 40: 40 left, 32 right | `9502:21323` | Centred: x 36 | departs |
| S5 | Leftovers: a hidden primary check button and an opacity-0 "Review details" title inside the confetti frame's `.Modal header`; the close glyph's layer is named "HeartStraight" | `9502:21305`, `9502:21306` | Not built | doesn't depart |
| S6 | Raw, unbound colours: ground #ffde46 (= yellow/300), "2nd"/"Groceries" #e58800 (= text/brand), Done #181102 (= neutral/950), "₦55,000" #524a37 (= text/secondary) | — | Gap tokens aliasing the matching primitive | doesn't depart |
| S7 | The star badge holds an opacity-0 mask group with an invalid skew (`skew-x-[NaNdeg]`) | `9502:21317` | The exported SVG is used; the empty group is not in it | doesn't depart |
| S8 | The close X has no destination | `9502:21304` | Does what Done does | doesn't depart |
| S9 | Static confetti (13 rects, 18 dots, 20 polygons, 19 stars) | `9502:21227` | Canvas confetti per the brief, in the frame's own rect palette | departs (brief) |
| S10 | Six flat rays at 20% white | `9502:21213` | 16 rays in two layers, per the brief. The wedge angle (27.3°) and origin (201, 414) are the frame's | departs (brief) |
| S11 | "Groceries is your top category" needs a category; nothing in the flow captures one | `9502:21322` | Seed records carry a category. Owner decision | doesn't depart |
| S12 | "₦55,000 there so far" is a total. INS-08 asks for totals scoped to records in Emlaya | `9502:21322` | Figma copy kept; flagged | doesn't depart |
| S13 | The figures are derived, not typed: "2nd" and "₦55,000" come from the store (one earlier ₦40,000 purchase) | — | A second pass reads "3rd … ₦70,000" (verified) | — |
| S14 | The close X glyph has two strokes of different width and colour (1.5 #393121, 1.8 #343330) | `9502:21304` | Export kept | doesn't depart |
| S15 | The card slot | — | `MilestoneCelebration` takes `children`; the brief's signature is `title body icon primaryAction` | departs (API) |
| S16 | Entrance timing | — | **User request: "more dramatic … not everything revealing at the same time".** The brief's 0–600ms table is replaced by a staged ~2.4s sequence: the ground floods out of the Save button; the badge pops alone at the centre at 1.45x, two rings shock out of it, its check draws; it rises to its place as the rays bloom and the confetti releases; the title rises word by word; then the body, the card and Done. Rings, flood and word masks are not in Figma. The badge was then brought forward to 80ms, then made to spin in; then, at the user's request, its squash, stretch, dip and overshoots were removed and its hold cut from 850 to 500ms (rise 600 → 400), which moved every later beat up ~600ms. Then "the success icon is now too quick": the pop went 300 → 400ms and the spin 480 → 640ms, with no other beat moved. The card's star ("the badge inside of the message") then got the badge's moderate spin, −160° → 0 with no overshoot, from 1600ms (it turned −30° on an overshoot spring at 1540). MOTION.md | departs (motion) |
| S17 | Exit easing | — | The shared exit curve (`in`) left the copy at 0.90 opacity at 170 of 200ms, so the unmount read as a cut. The exit uses the sine in-out (`--motion-ease-natural`), and Receipt Details mounts two frames after Done so its render does not hold the exit back: 0.05 at 170ms of the exit, starting 11–12ms after the tap | departs (motion set) |

## Receipt Details (D) — `9564:21987`

Reached from the celebration's Done (and ×), at the user's request. It reads the record that
was saved, so edits made on Review show here (verified: a tag removed on Review is absent).

| # | Finding | Node | Handling | |
|---|---|---|---|---|
| D1 | Same data problems as Review: 7 item rows including "Macbook pro M5 Max 2026" 2 × ₦2,000 = ₦4,000,000, four duplicate "Whole milk" rows, a text cursor after ₦4,000,000, tag "S", attachment "Shoprite 16 Aug · 3 pages · 2.4 MB" | `9564:22015`, `9564:22078`, `9564:22248`, `9564:22301` | The saved record: 4 items summing to ₦15,000, tags as saved, this capture's scan | departs |
| D2 | "Sat 16 Aug, 9:04 am": 16 Aug 2026 is a **Sunday**, and the record's time is 09:00 | `9564:22008` | Computed from the record: "Sun 16 Aug, 9:00 am" | departs |
| D3 | Other details' Date says "21 Aug, 2026, 9:06 am", a third date for the same purchase | `9564:22211` | "16 Aug, 2026, 9:00 am", from the record | departs |
| D4 | Merchant "Fresh market Groceries" (lower-case m) in Other details | `9564:22210` | The record's "Fresh Market Groceries" | departs |
| D5 | The address "12B Opebi Road, Ikeja, Lagos" exists only here | `9564:22212` | Added to the record, and printed on the receipt the camera sees, so the two agree | doesn't depart |
| D6 | The header sits at x 1 (its .Modal header is 401 wide), putting Back at 17 and More at 346: 17 left, 16 right | `9564:21989` | Back at 16, symmetric (1px, the one box outside 0.5 in `verify:diff`) | departs |
| D7 | The header has no fill | `9564:21989` | Takes the frame's ground, so content scrolled under it does not pass behind the buttons | departs |
| D8 | Other details rows draw their stroke on top, the first row included | `9564:22210` | Kept | doesn't depart |
| D9 | The Tags block and the Inline message include their strokes in layout (123 = 18+12+80+12+1; 152 = 150+2) | `9564:22234`, `9564:22311` | Real borders there. Also corrects Review's Tags card, which shares the block | — |
| D10 | Two values for Color/border/default: #252b3724 (bound in the flow node) and alpha neutral/300 #2c271b24 (bound here) | `9564:22333` | The later screen's | doesn't depart |
| D11 | The suggested payment "GTBank Transfer · ₦15,000 · 16 Aug, 9:11 am" | `9564:22311` | Derived (RP-13): the payment proof with the same amount on the same day. Seeded as a payment record | doesn't depart |
| D12 | "Not this" and "Link" | `9564:22330`, `9564:22331` | "Not this" turns the suggestion down: the card folds away and stays dismissed for this receipt. "Link" shows the not-designed notice; the linked state exists elsewhere in the file (`4729:26790`), not in what was given | departs (Link) |
| D13 | "Link shopping notes": the terminology lock's form is "Link to … Shopping Note" | `9564:22338` | Figma copy kept; flagged | doesn't depart |
| D14 | No destination in this flow: More, Tags ›, Shared with ›, the evidence row, Link payment, Link shopping notes | — | The not-designed notice. Tag and @mention removal are live and write the saved record | departs (notice) |
| D15 | Back has no designed destination (a Receipts list is not in the flow) | `9564:21994` | Starts the flow over at the camera | departs |

## Components

No code component library exists for Emlaya, and Code Connect has no mappings (the MCP
reported these components unmapped). Ladder used. The levels are undefined in the brief,
so they are interpreted as: **a** Code Connect component; **b** rebuilt in code from the Figma
component's definition, variants and props mirrored; **c** composed from b; **d** a raw
Figma frame rebuilt; **e** not in Figma.

| Component | Figma | Level |
|---|---|---|
| `Button` hierarchy primary / secondary | `4018:505` Button | b |
| `HeaderButton` | `4018:816` Button Icon (inverse) | b |
| `TextField` large / default | `4064:685` Text field | b |
| `Pill` tag / mention | "tag-pill" frames | d |
| `BottomTab` | `4071:1317` Bottom tab, Active=capture | b |
| Receipt actions rail | `5359:8681` (component, no set) | b |
| `GlassButton` | raw frames `9502:21712` … | d |
| `MilestoneCelebration`, `MilestoneCard`, `CheckBadge` | `9502:21212`, `9502:21308`, `9502:21221` | d |
| `Rays`, `Confetti` | brief | e |
| `CameraFeed`, `CaptureScene` | user request (C12) | e |
| `ItemRow`, `MetaBlock`, `EvidenceRow` (shared by Review and Receipt Details) | "Lists", tag/@mention blocks, `9564:22297` | d |
| Suggested link, small buttons, link rows | `9564:22311` "Inline message", `9564:22330` / `22331` Button, `9564:22333` | d |
| `Notice` (not designed) | — | e, marked "Needs design input" on its face |
| iOS status bar, home indicator | `4012:27` (remote iOS 26 kit) | the playground's `DeviceFrame` chrome |

## Token naming

Tokens use the Figma variable **path** (`Color/text/default` → `--color-text-default`), not the
variables' Web code syntax, because the code syntax collides:

- `theme.colors.iconDefault` is claimed by Color/icon/default, Color/icon/white and Color/icon/black.
- `theme.colors.borderBrand` by Color/border/brand and Color/border/brand-subtle.
- `theme.colors.borderSubtle` by Color/border/subtle and Color/border/subtler.
- `theme.colors.containerBrandBold` by Color/background/brand/bold and …/bolder.
- `theme.colors.surfaceOverlayDefault` by Color/surface/translucent and Color/surface/overlay.
- `theme.textVariants.bodyLarge.fontSize` by Type/font size/body/base (15) **and** body/large (17).

Two variables are both named `Color/surface/secondary/default` (#f6f3ef, code syntax
surfaceSecondary; and #f6f7f9, none). The first is the one bound here; its Dark value did not
resolve unambiguously, so `tokens.css` emits it for Light only.

## Token gaps

Every value a node uses raw, plus every motion value, lives in `src/tokens/tokens.gaps.css`
under a proposed name with its node ID. In summary:

| Group | Count | Examples |
|---|---|---|
| Colour | 24 | `--gap-color-celebration-surface` (#ffde46 → yellow/300), `--gap-color-camera-control`, `--gap-color-captured-bar` (#1b1a19), the badge green, the shock-ring white, 10 confetti colours and their palette list |
| Gradient / mask | 5 | button gloss ×2, milestone card, processing veil, ray fade |
| Shadow / blur / stroke | 15 | `--gap-shadow-card`, `--gap-shadow-float`, `--gap-blur-camera-control` (4), hairline 1 / 0.5, shutter ring 3, shock ring 3 |
| Radius | 3 | `--gap-radius-pill` (100, not Border radius/full), tab item 32, frame 48 (harness) |
| Size | 32 | every icon size, buttons 40/44/46/48/56, field heights 56/64, widths 176 / 290 / 330 / 355, ray length and widths, the flood disc 1800 |
| Layout offset | 21 | camera row 16 / 15 / 16, celebration badge 107, copy gap 21, card gap 32, CTA 66 from the bottom, rays origin 352 |
| Spacing | 1 | `--gap-space-24` (no Spacing/600 exists) |
| Type | 1 | "Large input" letter-spacing −0.32, raw |
| Motion | 46 | the staged entrance (13 beats), start and end scales, rise distances, the word mask, natural curves, the gentle spring, the badge's spin, pop, arc and exit turn, the star, ray periods and breathe, exit, spinner, field stagger, notice hold |
| Confetti physics | 31 | gravity, drag, terminal velocity, velocity / sway / spin / flip / size ranges, counts, trickle window, clear-by |
| Mock API | 2 | extract 2200ms, save 700ms |
| Live capture scene | 43 | counter, paper and ink colours; paper geometry; hand-held drift; focus, exposure, detection, outline |
| Harness | 3 | the Figma frame's 402 × 874 and 62 safe top |

236 in all (116 `--gap-*`, 46 `--motion-*`, 43 `--capture-*`, 31 `--confetti-*`). The non-motion rows were counted before Receipt Details (section D) added its layout gaps, so they sum short of 236.

`npm run check:tokens` fails on any hex, rgb/hsl, px, rem, ms, s, cubic-bezier or linear()
literal outside the two token files: **0 violations in 32 files**.
