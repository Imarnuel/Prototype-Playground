# Working agreement — design-to-code prototypes

This is a **high-fidelity prototype for a portfolio / case-study presentation**, not production code.
Optimise for something that demos convincingly end to end. Don't over-engineer, and don't fake completeness either.

## Project specifics

> Fill these in at the start of the project. Leave nothing as a guess.

- Stack:
- Figma file key / main page / section:
- Design tokens live in: (mark each token `[var]` = Figma variable, or `[literal]` = read off a frame)
- Shared components live in:
- Mock API module:
- State:
- Dev toolbar:
- Device frame: (logical size, status-bar inset — see "Device metrics" below)

---

## 1. Before writing any code

- Read the existing codebase first: router, design tokens, shared components, motion constants, mock API. Most new screens are **composition of things that already exist**.
- Then pull the design: `get_variable_defs` for the page, `get_design_context` **per frame, one at a time**, `get_screenshot` per frame, `download_assets` for imagery.
- Never build a screen from the screenshot alone. The screenshot is for intent; the design context is for values.
- Keep a build plan file: board → node map, numbered work order, and a running log of every design inconsistency found and every coordinate diff resolved. It is how the next session picks up.

## 2. Fidelity rules

- **Never guess a value.** Type size, line-height, letter-spacing, colour, radius, padding, gap — take them from the design context, then map to existing token names. If a value has no token, say so rather than inventing one.
- **Use the frame's own asset exports.** Don't substitute a similar-looking icon, and don't redraw one by hand.
- Check an exported SVG's actual stroke colour before styling it. A white-stroked icon on a light background is invisible.
- **Watch line-height.** Figma writes `lineHeight: 1` as a convention; rendered literally it clips descenders (g, y, p, j) inside any `overflow: hidden` container.
- Work to a measured diff, not an impression: pull node metadata → compute absolute coordinates → diff against the live DOM → fix → re-measure to zero.

## 3. When the design is wrong or ambiguous

- **Flag it, don't silently normalise it.** Typos, duplicated placeholder data, an icon at 0 opacity, a menu item with no destination, states that contradict each other — surface them and explain what you did.
- If the brief and the frame disagree, follow the more coherent one and say which you followed and why.
- If something is referenced but never designed, build a minimal honest placeholder and mark it as needing design input. Don't invent a feature set.
- Put the reasoning in a code comment at the point of deviation, so the next reader doesn't "fix" it back.

## 4. State and data

- **One source of truth per concept.** If two screens show the same thing, they read the same state.
- Derive lists from existing records where the product implies it, rather than seeding a parallel array.
- All fake network calls go through **one mock API module** with simulated latency. Every list that loads gets a skeleton, an empty state, and — where it can fail — an error state.
- Seed enough demo data that every state is reachable, and keep it internally consistent (names match photos, IDs match labels, totals add up).

## 5. Motion

- Reuse the project's existing durations, easings, sheet springs, press scales. Don't introduce a second set.
- Nothing transitions instantly. Nothing cuts where it should cross-fade — **including exits**. A component that unmounts on `if (!open) return null` has no exit animation; that is a bug, not a style.
- Respect `prefers-reduced-motion` everywhere.
- To debug a transition, temporarily stretch the duration token to several seconds and sample positions frame by frame. Geometry can be correct while the composite is wrong.

## 6. Demo affordances

- Add **every** new screen and state to the dev toolbar, reachable in one tap while presenting.
- Anything that normally requires waiting needs a way to force it.
- Keep presentation-only helpers behind a switch that's off by default.

## 7. Verification — how to actually prove it

Type checking and a clean build prove nothing about behaviour. Neither does a screenshot.

- **Verify against the DOM**, not screenshots. Screenshot tooling serves stale frames, applies its own zoom, and crops. If a screenshot contradicts the DOM, trust the DOM and say so.
- **Produce a number and compare it to a target.** "Looks right" is not verification. Compute the ratio, the diff, the inset, the count.
- **Re-run the exact measurement that proved it broken.** Before/after in the same units is the only proof a fix worked.
- **A/B against the old value** to separate "I broke this" from "this was already broken". Flip the variable live and re-measure.
- **Prove state by consequence, not by assertion.** To confirm a write landed, go and find its effect somewhere else.
- **Drive the app with JS**, not synthetic clicks — clicks time out when the browser pane is covered. Click through `element.click()`, wait for the animation, then read.
- Walk the **full flow**: every screen, back navigation from each, empty states, the failure path. Not the happy screen.
- A naive check will over-report. Scope it (e.g. ignore elements inside scroll containers) before believing a long list of failures.
- **Verify in a production build, not just dev.** They diverge in both directions — see below.
- If you couldn't verify something, say that plainly instead of implying it works.

## 8. Reporting

At the end of a feature, state:
- what's built and verified, with the numbers;
- anything from the design still unresolved;
- **what you reused vs what you duplicated**, and why;
- anything you interpreted, and the call you made.

Corrections and limitations go **up front**, not buried at the end.

## 9. Code style

- Match the surrounding code. No new patterns or abstractions unless the feature needs them.
- Comments explain **why**, never what. Default to none — but a non-obvious constraint (see every trap below) earns one.
- **Keep comments true.** A comment that contradicts the code after an edit is worse than no comment.
- No backwards-compat shims, dead flags, or half-finished implementations.
- **Every control needs a destination.** A button with no `onClick` is a dead affordance; grep for them.

---

# Known traps

Each of these cost real debugging time. Read before, not after.

## Dev build vs production build

- **They diverge in both directions.** Verify in `build` + `preview`, not only `dev`.
- Vite inlines assets under `assetsInlineLimit` (4096 B) as data URIs at build time. Small SVGs become data URIs; in dev they stay plain paths.
- **Unquoted `url()` in a JS style object breaks only in a build.** Inlined SVG data URIs contain single-quoted attributes, and a CSS `url()` token may not contain a quote — so the whole declaration is silently dropped. Always write ``url("${icon}")``, never ``url(${icon})``. Symptom: a masked element paints as a solid `currentColor` block.
- Demo from `build` + `preview`, not `dev`: it bundles the JS and inlines small SVGs, collapsing hundreds of requests.

## CSS

- **`object-fit: cover` is driven by the SHORT side.** Sizing a source by width alone leaves a 1200×628 image only 120 px tall behind a 72 px square box. Resize with `fit: 'outside'` against a square target.
- **Specificity:** `.parent img` out-specifies `.child`. A descendant selector will silently stretch the one child you sized explicitly.
- **Grid items default to `min-height: auto`** and refuse to shrink below intrinsic size — `1fr` rows resolve wrong. Set `min-height: 0`.
- **`flex: 1` collapses** in a column context. Scope flex rules to the axis they were written for.
- **Default `<p>` margins are 1em** and survive absolute positioning. At 17 px that is exactly 17 px of mystery offset.
- **Figma strokes are drawn inside the frame.** Use `box-shadow: inset`, not `border`, or every box grows by 1 px.
- **Inline `z-index` or `translate` creates a stacking context** and traps descendants. Prefer painting order via DOM order.
- `button, input, textarea, select` need `font: inherit` — all of them, not just `button`.
- `overflow: hidden` elements are still programmatically scrollable. `overflow: clip` is not, but it needs Safari 16+.

## Focus and scroll

- **`autoFocus` inside a sheet that animates in from offscreen scrolls the whole app.** The browser reveals the focused element by scrolling the nearest scrollable ancestor — often the phone frame, which has `overflow: hidden` and no scrollbar, so the entire device lurches and drifts back. Use `element.focus({ preventScroll: true })` in an effect instead.
- Reading computed styles synchronously after an event returns **pre-render** values. Wait a frame.

## Figma → code

- **A Figma frame is the screen, not the device.** No bezel, no body, no buttons. If you want a device shell, you are building it.
- **A component frame is not its glyph.** A 48×48 frame holding an 8×36 glyph renders that glyph at 15 px in a 20×20 instance. Using the raw export at the instance size is 33 % too big.
- Code Connect components often have no inline asset export — call `download_assets` on the instance node, which returns size variants.
- `import.meta.glob` does **not** resolve path aliases like `@`. Use relative patterns.

## Device metrics (iOS)

- Safe-area top inset: **47 pt** for a notch device (12/13/14), **59 pt** for Dynamic Island (14 Pro, 15, 16). Getting this wrong makes the cutout look cramped and nothing else will fix it.
- Dynamic Island: **125 × 36.67 pt, 11 pt from the top, centred**, fully rounded — on a 393 pt wide screen. Scale the width by your screen width; keep the vertical values absolute.
- iPhone 15 Pro body 70.60 × 146.67 mm around a 65.10 × 141.14 mm display — a **uniform 2.75 mm bezel**. Derive px/mm from your screen width; outer radius = screen radius + bezel, or the corners won't be concentric.
- iOS nav title is **17 px semibold, centred**. Tap targets are **44 × 44** — expand with `::after { inset: -10px }` rather than growing the glyph.

## Assets and load time

- **Audit real pixel dimensions against rendered size**, not just file size. Design handoffs routinely contain multi-megapixel camera originals behind 48 px avatars.
- **Check the actual file format.** Files named `.png` are often JPEG with intact EXIF. Anything trusting the extension will mangle them.
- Resize to **3 × the largest CSS box** the asset is ever drawn into, then re-encode (WebP q80, q90 for alpha). Strip metadata.
- Keep vectors as SVG — the build inlines the small ones anyway.
- Measure fidelity numerically: decode original vs optimised at display size and compare mean absolute pixel error. Under ~2 % is imperceptible; it catches sizing mistakes eyes miss.

## Environment

- **Check whether the project is a git repo before any destructive file operation.** If it isn't, there is no undo. Copy originals aside and verify the copy with checksums *before* overwriting anything.
- Prefer move over delete. A staged directory swap is reversible; `rm -rf` is not.
- macOS TCC protects `~/Desktop`, `~/Documents`, `~/Downloads`. A dev server spawned by tooling without Files-and-Folders access fails with `EPERM: uv_cwd` before it reads a single config. Either grant access, move the project, or start the server yourself and attach the preview to a running URL.
- `tsc -b` writes `tsconfig.tsbuildinfo`, which can trigger an HMR reload mid-verification.
- The browser pane throttles timers and animations when hidden.

---

## Feature brief template

```
## Figma source
<file URL + node IDs>

## Group A — existing frames
| Node | Screen | Notes |

## Fix these before building
| Issue | Resolution |

## Group B — new screens and states
(numbered: empty, loading, error, edge cases)

## Wiring into what already exists
(which existing state/screens this must share)

## Motion
(what's new; everything else reuses existing constants)

## Extend the mock API
(function signatures)

## Verify before you finish
(the specific walkthrough, and the numbers that must come back)

Finally: list anything duplicated rather than reused, and anything you interpreted.
```
