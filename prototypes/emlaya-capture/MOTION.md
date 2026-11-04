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

Measured in a production build by `npm run verify:motion`, from each animation's scheduled
start (Web Animations `startTime + delay`), relative to the backdrop. All 8 are exact.

| t | Element | Motion | Tokens |
|---|---|---|---|
| 0 | Backdrop (`.celebration__backdrop`) | fade in | `--motion-duration-fast`, `--motion-ease-out` |
| 80 | Rays (`.rays`) | scale 0.6 → 1 + fade, soft spring, no overshoot | `--motion-delay-celebration-rays`, `--motion-scale-rays-from`, `--motion-duration-launch`, `--motion-ease-launch` |
| 160 | Badge (`.celebration__badge`) | scale 0.4 → 1 with overshoot (peak 1.163); fade | `--motion-delay-celebration-badge`, `--motion-scale-badge-from`, `--motion-spring-overshoot`, `--motion-duration-spring-overshoot` (700ms) |
| 280 | Check mark (`.checkBadge__stroke`) | stroke draws on | badge delay + `--motion-duration-instant`; `--motion-duration-base`, `--motion-ease-out` |
| 300 | Confetti | first burst | `--motion-delay-celebration-confetti` |
| 360 | Title | rise 12 + fade | `--motion-delay-celebration-title`, `--motion-rise-distance`, `--motion-duration-base`, `--motion-ease-out` |
| 420 | Body | rise 12 + fade | `--motion-delay-celebration-body` |
| 480 | Insight card | rise 12 + fade (not in the brief's table) | `--motion-delay-celebration-card` |
| 600 | CTA + close | rise + fade; **inert until `animationend`** | `--motion-delay-celebration-cta` |

Frame rate over the first 3s: 60.7 fps, worst frame 17ms (headless Chromium on desktop — not a
mid-range phone; on-device profiling is still to do).

## Celebration — exit

On Done (or ×): content and badge reverse, while rays, confetti and the ground fade together.

| Element | Motion | Tokens |
|---|---|---|
| Copy, card, CTA, close | sink 12 + fade | `--motion-duration-celebration-exit` (= fast, 200ms), `--motion-ease-inOut` |
| Badge | shrink to 0.4 + fade | same |
| Ground, rays, confetti canvas | fade | same |

Copy opacity is 0.07 at 170ms of 200. The layer unmounts at 200ms (`usePresence`), so nothing cuts.
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
| Clear | pieces leave off the bottom only. Last one gone at 4.5s (target ~5s) | `--confetti-clear-by` |

## Rest of the flow

| Moment | Motion | Tokens |
|---|---|---|
| Shutter | white flash 1 → 0 | `--motion-duration-base`, `--motion-ease-out`, `--gap-color-shutter-flash` |
| Live → captured | tab bar slides down; Continue bar slides up; hint, flash, controls fade | base / fast, `inOut` / `out` |
| Captured → processing | the photo shrinks toward the pill's centre (scale 0.575 at 200ms) and fades; the chrome falls away | `--motion-duration-slow`, `--gap-handoff-scale` (0.22) |
| Processing | pill arrives on the launch spring; spinner 900ms/turn; skeleton breathes | `--motion-duration-spinner-rev`, `--motion-ease-launch` |
| Processing → review | skeleton and veil fade; fields rise in, 45ms apart | `--motion-delay-field-stagger` |
| Screens | every layer cross-fades in **and out** (`Layer` + `usePresence`) | `--motion-duration-base` |
| Press | 0.97 scale on every discrete control | `--motion-press-scale`, `--motion-duration-instant` |

## Reduced motion

`prefers-reduced-motion`, or the dev toolbar's *Reduced motion* switch, sets
`data-reduced-motion` on the app. Then: no confetti (never started: 0 spawned), still rays (no
turn, no breathe), and a plain fade for all content. No scale, no rise, no stroke draw, no
photo handoff transform. Verified by `verify:motion`.
