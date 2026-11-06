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
the same time"). This replaces the brief's 0–600ms table. The badge was then brought forward
twice ("the success icon appearance is too slow"): 380 → 160 → 80ms, on a quicker spring that
reaches full size 96ms after it starts (it was ~180). Then it was made to spin in, and the
whole sequence moved onto natural curves (below); the title now waits for the badge to clear
its line (1400), which ends the sequence at ~2.85s. Measured in a production build by
`npm run verify:motion`, from each animation's scheduled start (Web Animations
`startTime + delay`), relative to the ground. All 11 are exact.

| t (ms) | Beat | Motion | Tokens |
|---|---|---|---|
| 0 | The ground floods out of the Save button | a 1800 disc centred on the docked button scales 0.03 → 1 over 650, decelerating | `--motion-duration-celebration-ground`, `--motion-ease-natural-out`, `--gap-reveal-diameter` |
| 80 | The badge pops, alone, at the screen's centre, **spinning in** | `scale` 0 → 1 (overshoot spring, full size at +96) and `rotate` −160° → 0 (spin spring: +17° past level, settled by 850), held at 1.45x | `--motion-delay-celebration-badge`, `--motion-spring-overshoot`, `--motion-spring-spin`, `--motion-spin-from` |
| 130 | The check draws on — while the disc still turns, so the spin reads | stroke-dashoffset, 300 | `--motion-delay-celebration-check`, `--motion-ease-natural-out` |
| 140 / 280 | Two shock rings | scale 1 → 3.2, fading, 700 each | `--motion-delay-celebration-ring`, `--motion-scale-ring-to` |
| 176 | It squashes as it reaches full size | 1.10 × 0.90 → 0.94 × 1.07 → rest, 420 | `--motion-delay-badge-squash`, `--motion-squash-*`, `--motion-stretch-*` |
| 850 | Anticipation, then the rise | dips 10 and squashes (18%) → rises on an arc 10 to the side, stretched along the motion (55%) → carries 5 past its slot, squashed (82%) → settles, 600 | `--motion-delay-celebration-settle`, `--motion-badge-dip`, `--motion-badge-arc`, `--motion-badge-overshoot` |
| 900 | The rays bloom | scale 0.3 → 1 + fade, critically damped, 900 | `--motion-delay-celebration-rays`, `--motion-ease-launch` |
| 950 | The confetti releases | burst, then a 2.5s trickle | `--motion-delay-celebration-confetti` |
| 1400 / 1510 | "Receipt" … "saved" | each word rises out of its mask, 4% follow-through, 620 | `--motion-delay-celebration-title`, `--motion-spring-gentle` |
| 1700 | The body | rise 12 (gentle spring) + fade | `--motion-delay-celebration-body` |
| 2100 / 2240 | The insight card, then its star | card: rise 24 + scale 0.96 → 1 (gentle spring); star: scale 0.5 → 1, −30° → 0 (overshoot spring) | `--motion-delay-celebration-card`, `--motion-delay-celebration-star` |
| 2550 | Done and × | rise (gentle spring) + fade; **inert until `animationend`** | `--motion-delay-celebration-cta` |

## The 12 principles, where each is used

Asked for by the user ("natural motion curves following the 12 principles of motion, for the
badge especially, and for every motion there"). Verified by `verify:motion`, which freezes every
animation at set times and reads the badge's pose.

| Principle | Where | Measured |
|---|---|---|
| Squash and stretch | the badge squashes reaching full size, stretches along its rise, squashes on arrival; volume kept (factors multiply to ~1) | 1.05 × 0.95 at 250ms; 1.11 × 1.26 mid-rise; 1.10 × 0.90 on arrival |
| Anticipation | a dip and squash before the rise; on exit, a swell and counter-turn before it spins away | +9px down at 960ms |
| Staging | one beat at a time; the title waits until the badge has cleared its line | — |
| Straight ahead / pose to pose | the rise is pose to pose (4 keyed poses); the confetti is straight ahead (simulated) | — |
| Follow-through / overlapping | the spin overshoots and settles; the rise carries past its slot; words and Done overshoot 4%; the check draws while the disc still turns; the star lands after its card | spin +17°; −4px past the slot |
| Slow in / slow out | sine in-out between poses and for anything that breathes; springs for arrivals | — |
| Arcs | the rise bows 10px to the side | −10px at 1180ms |
| Secondary action | the shock rings; the star; the rays' slow turn | — |
| Timing | fast where it is light (pop 96ms to full size), slower where it carries weight (rise 600) | — |
| Exaggeration | the 1.45x hold at the centre; a moderate −160° spin | — |
| Solid drawing | volume-preserving squash; the badge's own shading is the export's | — |
| Appeal | one clear focal object, then reading order | — |

Frame rate over the first 3.7s: 60.0 fps, worst frame 33ms (headless Chromium on desktop, not
a mid-range phone; on-device profiling is still to do).

## Celebration — exit

On Done (or ×): content and badge reverse, while rays, confetti and the ground fade together.

| Element | Motion | Tokens |
|---|---|---|
| Copy, card, CTA, close | sink 12 + fade | `--motion-duration-celebration-exit` (= fast, 200ms), `--motion-ease-natural` |
| Badge | anticipation (swell 1.08, turn −10°), then spins away 90° and shrinks to 0 | same, `--motion-badge-exit-*` |
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
| Celebration → Receipt Details | Done: the celebration exits (200) over Receipt Details, which fades in beneath it | `--motion-duration-celebration-exit`, `--motion-duration-base` |
| "Not this" | the suggestion folds away: rows collapse (grid 1fr → 0fr), fade, scale to 0.96 | `--motion-duration-base`, `--motion-ease-inOut` |
| Screens | every layer cross-fades in **and out** (`Layer` + `usePresence`) | `--motion-duration-base` |
| Press | 0.97 scale on every discrete control | `--motion-press-scale`, `--motion-duration-instant` |

## Reduced motion

`prefers-reduced-motion`, or the dev toolbar's *Reduced motion* switch, sets
`data-reduced-motion` on the app. Then: no confetti (never started: 0 spawned), still rays (no
turn, no breathe), and a plain fade for all content. No flood, no pop, no rings, no rise, no
word masks, no stroke draw. The capture scene is still: no drift, no focus hunt. Review fades in
instead of rising. Verified by `verify:motion`.
