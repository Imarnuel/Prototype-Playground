# Motion

The Figma file defines no motion (`get_motion_context` on `9502:21986`, recursive: no nodes).
Durations and easings are the playground's one set (`shared/src/motion.ts`), published by
`src/main.tsx` as `--motion-duration-*` / `--motion-ease-*`. Everything the brief adds on top
is a token in `src/tokens/tokens.gaps.css`. No value below is inlined anywhere.

| Shared token | Value |
|---|---|
| `--motion-duration-instant` | 120ms |
| `--motion-duration-fast` | 200ms |
| `--motion-duration-base` | 300ms |
| `--motion-duration-slow` | 420ms |
| `--motion-duration-launch` | 420ms |
| `--motion-ease-out` | cubic-bezier(0.16, 1, 0.3, 1) |
| `--motion-ease-in` | cubic-bezier(0.7, 0, 0.84, 0) |
| `--motion-ease-inOut` | cubic-bezier(0.65, 0, 0.35, 1) |
| `--motion-ease-launch` | critically damped spring, ω 24, sampled into `linear()` — no overshoot |
| `--motion-press-scale` | 0.97 |

## Celebration — entrance

Staged one beat at a time, at the user's request ("more dramatic … not everything revealing at
the same time"). This replaces the brief's 0–600ms table. Measured in a production build by
`npm run verify:motion`, from each animation's scheduled start (Web Animations
`startTime + delay`), relative to the ground. All 11 are exact.

| t (ms) | Beat | Motion | Tokens |
|---|---|---|---|
| 0 | The ground floods out of the Save button | a 1800 disc centred on the docked button scales 0.03 → 1 over 650 | `--motion-delay-celebration-ground`, `--motion-duration-celebration-ground`, `--motion-scale-ground-from`, `--motion-ease-out`, `--gap-reveal-diameter` |
| 380 | The badge pops, alone, at the screen's centre | scale 0 → 1 with overshoot (peak 1.163), held at 1.45x | `--motion-delay-celebration-badge`, `--motion-spring-overshoot` (700ms), `--motion-scale-badge-centre` |
| 480 / 620 | Two shock rings | scale 1 → 3.2, fading, 700 each | `--motion-delay-celebration-ring`, `--motion-delay-celebration-ring-gap`, `--motion-duration-celebration-ring`, `--motion-scale-ring-to` |
| 560 | The check draws on | stroke-dashoffset, 300 | `--motion-delay-celebration-check`, `--motion-duration-base` |
| 1150 | The badge rises to its place | from 50cqh at 1.45x to its slot at 1x, 560, critically damped | `--motion-delay-celebration-settle`, `--motion-duration-celebration-settle`, `--motion-ease-launch` |
| 1200 | The rays bloom | scale 0.3 → 1 + fade, 900 | `--motion-delay-celebration-rays`, `--motion-duration-celebration-rays`, `--motion-scale-rays-from` |
| 1250 | The confetti releases | burst, then a 2.5s trickle | `--motion-delay-celebration-confetti` |
| 1450 / 1560 | "Receipt" … "saved" | each word rises out of its own mask, 520 | `--motion-delay-celebration-title`, `--motion-delay-celebration-word-gap`, `--motion-duration-celebration-word`, `--motion-word-mask-bleed` |
| 1800 | The body | rise 12 + fade, 300 | `--motion-delay-celebration-body`, `--motion-rise-distance` |
| 2250 | The insight card | rise 24 + scale 0.96 → 1 + fade, 520 | `--motion-delay-celebration-card`, `--motion-duration-celebration-card`, `--motion-rise-card`, `--motion-scale-card-from` |
| 2750 | Done and × | rise + fade; **inert until `animationend`** (~3050) | `--motion-delay-celebration-cta` |

Frame rate over the first 3.6s: 60.0 fps, worst frame 33ms (headless Chromium on desktop, not
a mid-range phone; on-device profiling is still to do).

## Celebration — exit

On Done (or ×): content and badge reverse, while rays, confetti and the ground fade together.

| Element | Motion | Tokens |
|---|---|---|
| Copy, card, CTA, close | sink 12 + fade | `--motion-duration-celebration-exit` (= fast, 200ms), `--motion-ease-inOut` |
| Badge | shrink to 0 + fade | same |
| Ground, rays, confetti canvas | fade | same |

Copy opacity is 0.07 at 170ms of 200. The layer unmounts at 200ms (`usePresence`), so nothing cuts.
The camera that Done returns to paints its scene only after that frame. Its setup blocked the exit:
the copy was at 0.93 opacity at 170ms until the scene deferred and batched its token reads.
The exit uses `inOut`, not the shared exit curve (`in`). See CORRECTIONS S17.

## Rays

| Parameter | Value | Token |
|---|---|---|
| Count | 16: 8 wide + 8 narrow, narrow offset by half a step (22.5°) | — (`Rays.tsx`) |
| Origin | x centre, y 414 in the frame (= 9502:21213's centre) | `--gap-rays-origin-y` (352 below the safe top) |
| Length | 640 | `--gap-ray-length` |
| Wide wedge | 311 at the end — Figma's 27.3° wedge | `--gap-ray-width-wide`, `--gap-color-ray` (white 20%, Figma's) |
| Narrow wedge | 110, brighter | `--gap-ray-width-narrow`, `--gap-color-ray-bright` (white 34%) |
| Taper / fade | wedge clip-path + radial mask along the length | `--gap-mask-ray-fade` |
| Outer turn | 40s / rev, clockwise — measured 9.00°/s | `--motion-duration-rays-outer-rev` |
| Inner turn | 60s / rev, counter-clockwise — measured −6.00°/s | `--motion-duration-rays-inner-rev` |
| Breathe | opacity 1 ↔ 0.72, 3s, layers half a cycle apart | `--motion-duration-rays-breathe`, `--motion-rays-breathe-min` |

## Confetti

Canvas (`Confetti.ts`). Every constant is read from tokens at start. The loop pauses while the
tab is hidden and clamps each step to 1/30s, so a resumed tab does not teleport pieces.

| Parameter | Value | Token |
|---|---|---|
| Spawn | full top edge, 24–120 above the viewport | `--confetti-spawn-above` |
| Burst | 90 pieces at 300ms | `--confetti-burst-count` |
| Trickle | 60 pieces, evenly over 2.5s | `--confetti-trickle-count`, `--confetti-trickle-duration` |
| Cap | 150 alive (measured peak: 131) | `--confetti-max-particles` |
| Shapes | rect 2 : ribbon 1 : dot 1 | — |
| Sizes | rect 6–13 × 6–12; ribbon 16–25 × 4–7; dot 4–9 (from the frame's pieces) | `--confetti-rect-*`, `--confetti-ribbon-*`, `--confetti-dot-*` |
| Gravity / drag | 1400 px/s², linear drag 1.6/s, terminal 520 px/s | `--confetti-gravity`, `--confetti-drag`, `--confetti-terminal-vy` |
| Initial fall | burst 60–420 px/s; trickle 40–160 px/s | `--confetti-burst-vy-*`, `--confetti-trickle-vy-*` |
| Sway | 10–34 px at 0.8–2.2 Hz | `--confetti-sway-amp-*`, `--confetti-sway-freq-*` |
| Spin | −6 … 6 rad/s | `--confetti-spin-*` |
| 3D flutter | scaleY = cos(2π f t), f 1.2–3.4 Hz; brightness follows the face | `--confetti-flip-freq-*` |
| Palette | the frame's own 10 rect fills (9502:21228 …) | `--gap-confetti-1` … `-10` |
| Clear | pieces leave off the bottom only. Last one gone at 4.4s (target ~5s) | `--confetti-clear-by` |

## Live capture

Not in Figma (user request). `CaptureScene.ts` paints the world once and re-draws only its blit
per frame. Verified: the live feed changes frame to frame; the captured frame does not.

| Parameter | Value | Token |
|---|---|---|
| Hand-held drift | ±6 x, ±5 y px, ±0.7° roll, ±1.2% zoom, two incommensurate sines per axis at 0.32 Hz | `--capture-drift-*` |
| Autofocus | blur 8 → 0 with a hunt (overshoot), exposure 1.28 → 1, over 900ms on opening and on Retake | `--capture-focus-duration`, `--capture-focus-blur`, `--capture-exposure-from` |
| Detection | the outline fades in at 1.1s over 350ms, then follows the paper at 0.2 per frame | `--capture-detect-delay`, `--capture-detect-fade`, `--capture-track-follow` |
| Grain | a 96 px noise tile, re-offset every frame, at 0.6 | `--capture-grain-alpha` |
| Shutter | the frame freezes sharp, without the outline; white flash 1 → 0 over 300 | `--motion-duration-base`, `--gap-color-shutter-flash` |

## Rest of the flow

| Moment | Motion | Tokens |
|---|---|---|
| Live → captured | tab bar slides down; Continue bar slides up; hint, flash, controls fade | base / fast, `inOut` / `out` |
| Captured → processing | **no zoom**: Review rises over the frozen shot as a sheet (translateY 100% → 0); the status bar turns dark once it has landed | `--motion-duration-slow`, `--motion-ease-out` |
| Processing | pill arrives on the launch spring; spinner 900ms/turn; skeleton breathes | `--motion-duration-spinner-rev`, `--motion-ease-launch` |
| Processing → review | skeleton and veil fade; fields rise in, 45ms apart | `--motion-delay-field-stagger` |
| Screens | every layer cross-fades in **and out** (`Layer` + `usePresence`) | `--motion-duration-base` |
| Press | 0.97 scale on every discrete control | `--motion-press-scale`, `--motion-duration-instant` |

## Reduced motion

`prefers-reduced-motion`, or the dev toolbar's *Reduced motion* switch, sets
`data-reduced-motion` on the app. Then: no confetti (never started: 0 spawned), still rays (no
turn, no breathe), and a plain fade for all content. No flood, no pop, no rings, no rise, no
word masks, no stroke draw. The capture scene is still: no drift, no focus hunt. Review fades in
instead of rising. Verified by `verify:motion`.
