# Prototype Playground

High-fidelity, design-to-code prototypes for portfolio / case-study presentation.
One directory per case study, with a shared device shell, motion set and mock API.

The working agreement in [`CLAUDE.md`](./CLAUDE.md) governs everything here — fidelity
rules, verification standards, and a list of traps that have each cost real debugging
time. Read it before building.

## Layout

```
shared/              composed by every study — device frame, motion, mock API, dev toolbar
prototypes/
  _template/         starting point, and the harness the frame geometry is measured against
  supermart-pos/     Freshvale Supermart POS — packaged-goods till (first study)
  <case-study>/      one per study
```

## Running the prototype

Requires **Node 18 or newer** (Vite 5). Verified from a clean clone.

```bash
npm install
npm run dev --workspace @playground/supermart-pos
```

Then open **<http://localhost:5173/?dev=1>**.

`?dev=1` is not optional if you want to see more than one screen: the dev toolbar is
off by default, and it is how every screen and state is reached in one tap.

To demo, build first — the working agreement is explicit that dev and production
builds diverge in both directions:

```bash
npm run build   --workspace @playground/supermart-pos
npm run preview --workspace @playground/supermart-pos
```

### Other commands

```bash
npm run typecheck                                      # whole workspace, strict
npm run dev --workspace @playground/template           # the frame-geometry harness

# inside prototypes/supermart-pos
npm run catalogue:verify   # 35 invariants on the product data
npm run tokens:verify      # generated tokens still match the Figma dump
npm run motion:sample      # transitions animate in both directions (needs a server)
npm run images:manifest    # which product photos are still missing
```

### What you will see

Product tiles and icons render as neutral grey blocks. That is expected, not a
failure: 21 icons and 42 product photos could not be downloaded from Figma, and
nothing was substituted or hand-drawn in their place. The layout is real; only the
artwork is absent. See `prototypes/supermart-pos/src/assets/icons/MANIFEST.md`.

The missing photos also mean the browser console shows `404`s for
`/products/*.webp`. Harmless — the tiles fall back to their neutral fill.

## Starting a case study

```bash
cp -r prototypes/_template prototypes/<case-study>
```

Then, in order:

1. Rename the package in `prototypes/<case-study>/package.json`.
2. Create `prototypes/<case-study>/CLAUDE.md` with the Figma file key, page and section.
   Leave nothing as a guess.
3. Pull the design — `get_variable_defs` for the page, then `get_design_context` per
   frame, one frame at a time. Never build from a screenshot alone.
4. Build the screens by composing `shared/`. Add every screen and state to the dev toolbar.
5. Verify against the DOM with numbers, in a production build. See `CLAUDE.md` section 7.

## What `shared/` gives you

| Export | Purpose |
|---|---|
| `DeviceFrame` | iPhone 15 Pro shell. Screen stays 393x852 CSS px so measurements match Figma 1:1. |
| `SCREEN`, `BODY`, `BEZEL`, `SAFE_AREA`, `DYNAMIC_ISLAND`, `IOS` | Device metrics, derived from the mm figures rather than hardcoded. |
| `DURATION`, `EASING`, `SHEET_SPRING`, `PRESS_SCALE`, `duration()` | The project's only motion set. Don't add a second. |
| `request()`, `failNextRequest()`, `setLatencyScale()` | The one mock API. Every fake call goes through it. |
| `DevToolbar`, `devFlagEnabled()` | Presentation affordances, off by default. |
| `useReducedMotion()` | Live `prefers-reduced-motion`. |

`shared/` holds no colour or type tokens, and none were invented. Each study defines its
own once a Figma file supplies variables.
