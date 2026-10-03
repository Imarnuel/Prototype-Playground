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
  <case-study>/      one per study
```

## Commands

```bash
npm install
npm run typecheck                                  # whole workspace, strict

npm run dev     --workspace @playground/template   # iterate
npm run build   --workspace @playground/template   # always verify here too
npm run preview --workspace @playground/template   # and demo from here, not dev
```

Demo from `build` + `preview`. Dev and production builds diverge in both directions —
see "Dev build vs production build" in `CLAUDE.md`.

Append `?dev=1` to reach the dev toolbar. It is off by default.

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
