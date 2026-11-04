# Emlaya receipt capture: case study specifics

Inherits the working agreement at the repo root. This file records only what is
specific to this study.

## Figma source

- File key: `LPXddONZ7IMNlIowbz161x` (Emlaya Design; library node `4099-8016`)
- Page: `4001:1213` "📷 Capture"
- Flow node: `9502:21986` "Frame 5315", 4 frames at **402x874** (iPhone 16 Pro / 17 size, not the
  playground's 393x852): `9502:21686` camera, `9502:21716` captured, `9502:21324` review,
  `9502:21212` receipt saved
- Processing: `4653:68091`, from sibling section `4810:31333`. The flow node has none.
- Extraction error: `4142:9167` exists but was **not inspected** (MCP timeouts). The state is a placeholder.
- Modes: the camera frames resolve **Dark**, the rest pin **Light** (`152:0`).

## Layout

```
src/tokens/tokens.css        Figma variables (Light + Dark), text styles, Shadow/xs: [var]
src/tokens/tokens.gaps.css   every raw value, with its node, and all motion; proposed names
src/tokens/read.ts           JS reads tokens through getComputedStyle; never literals
src/components/ui.tsx        Button, HeaderButton, TextField, Pill, GlassButton, Icon
src/components/celebration/  MilestoneCelebration, CheckBadge, MilestoneCard, Rays, Confetti
src/screens/                 Camera (live + captured), Review (processing + ready + error)
src/data/records.ts          the one record store; milestone figures are derived from it
src/api/emlaya.ts            extract / save through shared/src/mockApi.ts
figma/nodes.json             frame-relative boxes for every node in 9502:21986 (get_metadata)
```

## Commands (inside this folder, against `npm run build && npm run preview -- --port 4180`)

```
npm run check:tokens    # 0 literals outside the token files, or it fails
npm run verify:diff     # DOM boxes vs Figma boxes in the 402x874 harness
npm run verify:motion   # choreography offsets, fps, confetti, rays, exit, reduced motion
npm run verify:shots    # screenshots of every screen in the harness
```

`?frame=figma` renders the screen at 402x874 with Figma's 62 safe top. Every measurement is
taken there. `?dev=1` turns on the dev toolbar and the "Replay celebration" control.

## Read before changing anything

[`CORRECTIONS.md`](./CORRECTIONS.md) logs every departure and why. [`NOTES.md`](./NOTES.md) holds
every Figma note. [`MOTION.md`](./MOTION.md) holds the choreography. Several values look wrong and
are deliberate (the 1 below the status bar, the 3-above-centre title, the 4px tab overhang).
Check there before "fixing" one back.
