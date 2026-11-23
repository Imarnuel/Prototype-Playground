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
twice ("the success icon appearance is too slow"): 380 → 160 → 80ms. Then it was made to spin
in, and the whole sequence moved onto natural curves (below). Last, at the user's request ("i
don't want the success icon stretching and bouncing … the success icon wastes too much time"),
the badge lost its squash, stretch, dip and every overshoot, and its hold at the centre was cut
from 850 to 500ms, with the rise from 600 to 400. Everything after it moved up by ~600ms, and
the sequence now ends at ~2.4s (it was ~2.85). Then "the success icon is now too quick":
the pop went from 300 to 400ms and the spin from 480 to 640ms, so the badge finishes turning in
the first moments of its rise. Nothing else moved. Then the card's star ("the badge inside of the message") was given the
same moderate spin; it had turned only 30°, on an overshoot spring. Measured in a production build by
`npm run verify:motion`, from each animation's scheduled start (Web Animations
`startTime + delay`), relative to the ground. All 11 are exact.

| t (ms) | Beat | Motion | Tokens |
|---|---|---|---|
| 0 | The ground floods out of the Save button | a 1800 disc centred on the docked button scales 0.03 → 1 over 650, decelerating | `--motion-duration-celebration-ground`, `--motion-ease-natural-out`, `--gap-reveal-diameter` |
| 80 | The badge pops, alone, at the screen's centre, **spinning in** | `scale` 0 → 1, critically damped (no overshoot), 400; `rotate` −160° → 0 on the natural ease-out, 640 (still turning as the rise begins), decelerating into level and never past it; held at 1.45x. Scale stays uniform throughout | `--motion-delay-celebration-badge`, `--motion-ease-launch`, `--motion-ease-natural-out`, `--motion-spin-from`, `--motion-duration-badge-pop`, `--motion-duration-badge-spin` |
| 130 | The check draws on — while the disc still turns, so the spin reads | stroke-dashoffset, 300 | `--motion-delay-celebration-check`, `--motion-ease-natural-out` |
| 140 / 280 | Two shock rings | scale 1 → 3.2, fading, 700 each | `--motion-delay-celebration-ring`, `--motion-scale-ring-to` |
| 500 | The rise | one smooth move to its slot on a slight arc (8 to the side at the midpoint), 1.45x → 1, sine in-out, 400. No dip before it, nothing past the slot | `--motion-delay-celebration-settle`, `--motion-duration-celebration-settle`, `--motion-badge-arc` |
| 520 | The rays bloom | scale 0.3 → 1 + fade, critically damped, 900 | `--motion-delay-celebration-rays`, `--motion-ease-launch` |
| 560 | The confetti releases | burst, then a 2.5s trickle | `--motion-delay-celebration-confetti` |
| 800 / 910 | "Receipt" … "saved" | each word rises out of its mask, 4% follow-through, 620 | `--motion-delay-celebration-title`, `--motion-spring-gentle` |
| 1050 | The body | rise 12 (gentle spring) + fade | `--motion-delay-celebration-body` |
| 1400 / 1600 | The insight card, then its star **spinning in** | card: rise 24 + scale 0.96 → 1 (gentle spring); star: the badge's own motion, `scale` 0.5 → 1 critically damped, 400, and `rotate` −160° → 0 on the natural ease-out, 640, level by 2240 and never past it. It starts once the card is ~85% opaque, so the turn is seen | `--motion-delay-celebration-card`, `--motion-delay-celebration-star`, `--motion-spin-from`, `--motion-duration-badge-pop`, `--motion-duration-badge-spin` |
| 1800 | Done and × | rise (gentle spring) + fade; **inert until `animationend`** | `--motion-delay-celebration-cta` |

## The 12 principles, where each is used

Asked for by the user ("natural motion curves following the 12 principles of motion, for the
badge especially, and for every motion there"), then narrowed by "i don't want the success icon
stretching and bouncing". Verified by `verify:motion`, which freezes every
animation at set times and reads the badge's pose.

| Principle | Where | Measured |
|---|---|---|
| Squash and stretch | **not on the badge**, at the user's request: its scale stays uniform at every sampled frame. It survives nowhere else either; the words and card only rise | x = y at all 93 samples, 80–1000ms |
| Anticipation | **removed from the badge** (it dipped before the rise and swelled before the exit). The flood out of the Save button still leads the eye to where the badge appears | — |
| Staging | one beat at a time; the title waits until the badge has cleared its line | — |
| Straight ahead / pose to pose | the rise is pose to pose (from the centre to the slot, through the arc's midpoint); the confetti is straight ahead (simulated) | — |
| Follow-through / overlapping | not on the badge: the spin decelerates into level and stops there. Overlap carries it instead: the check draws while the disc still turns, the spin finishes during the rise, the rays bloom while it rises, words and Done settle with a 4% follow-through, and the star lands after its card | badge spin max 0.00°, scale max 1.00 |
| Slow in / slow out | the spin and the flood decelerate (cubic ease-out); the rise is a sine in-out; springs for the later arrivals | — |
| Arcs | the rise bows 8px to the side | x −8 at 700ms |
| Secondary action | the shock rings; the card's star, spinning in after its card; the rays' slow turn | star −160° at 1600ms, 0° by 2240ms, max 0.00° |
| Timing | unhurried where it should be seen (the pop, 400; the spin, 640), quick where it travels (the rise, 400); the badge is in its slot by 900ms | scale 0.96 at 280ms; −8.8° at 480ms; at rest by 900ms |
| Exaggeration | the 1.45x hold at the centre; a moderate −160° spin | — |
| Solid drawing | the badge keeps its proportions; its shading is the export's | — |
| Appeal | one clear focal object, then reading order | — |

Frame rate over the first 3.7s: 60.0 fps, worst frame 33ms (headless Chromium on desktop, not
a mid-range phone; on-device profiling is still to do).

## Celebration — exit

On Done (or ×): content and badge reverse, while rays, confetti and the ground fade together.

| Element | Motion | Tokens |
|---|---|---|
| Copy, card, CTA, close | sink 12 + fade | `--motion-duration-celebration-exit` (= fast, 200ms), `--motion-ease-natural` |
| Badge | turns 90° away as it shrinks to 0 and fades; no swell before it | same, `--motion-badge-exit-turn` |
| Ground, rays, confetti canvas | fade | same |

Copy opacity is 0.05 at 170ms of 200 on the exit's own clock, and the fade starts 11–12ms after
the tap (checked separately: at most 2 frames). A wall-clock read at 170ms swung 0.14–0.37 with
0–2 frames of headless frame jitter, so it is no longer used. The layer unmounts at 200ms
(`usePresence`), so nothing cuts. Whatever Done reveals must not render in the exit's own commit:
the camera scene once held the copy at 0.93 opacity at 170ms until it deferred and batched its
token reads, and Receipt Details, rendered in the same commit as the exit, started the fade 36ms
late (0.37 at 170ms). Details now mounts two frames after Done. The exit uses the sine in-out
(`--motion-ease-natural`), not the shared exit curve (`in`). See CORRECTIONS S17.

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
| Processing | the processing loader, below | `--processing-*` |
| Processing → review | the loader finishes (A blooms, B checks), the veil sharpens away, fields rise in, 45ms apart | `--processing-resolve`, `--motion-delay-field-stagger` |
| Celebration → Receipt Details | Done: the celebration exits (200) over Receipt Details, which fades in beneath it | `--motion-duration-celebration-exit`, `--motion-duration-base` |
| "Not this" | the suggestion folds away: rows collapse (grid 1fr → 0fr), fade, scale to 0.96 | `--motion-duration-base`, `--motion-ease-inOut` |
| Screens | every layer cross-fades in **and out** (`Layer` + `usePresence`) | `--motion-duration-base` |
| Press | 0.97 scale on every discrete control | `--motion-press-scale`, `--motion-duration-instant` |

## Processing loader (user request: two prototypes after a reference video)

Measured off the reference (8.2s, 1600x1200 at 2x, sampled at 10 and 30fps) and recorded in
tokens.gaps.css, "Processing loader". Times are from Processing starting, in the production
build, typical pace (6.2s):

| Beat | A (after the reference) | B (calm) | Measured |
|---|---|---|---|
| Veil | once the sheet lands, the skeleton blurs to 9px over 420 | same | `blur(9px)` computed |
| First line | text and spinner fade in from a 3px blur: opacity over 350ms, blur clearing over 530ms, the spinner 100ms behind; the glow rises from the bottom (420, out) | same; the emoji arrives with its line | opacity 0.43 / 0.80 / 1.00 at 127 / 246 / 361ms (reference ≈0.48 / 0.76 / 1.00) |
| Cadence | a new line every 1.7s, the reference's vertical roll with no blur, slowed at the user's request ("the text change should be slower"): the old line fades as it slides up 3px (300, linear); the new one rises 2.5px from below once the old is down to a third, 200ms in (420, out). The reference runs the same staging in ~120 + ~120. The spinner and the text's left edge never move: the group is sized to the widest line | same; the emoji rolls with its line, nothing of its own | old 0.39 at 189ms, gone at 300; new 0.41 at 243, 0.81 at 300, settled by ~560; spinner centre one value throughout |
| Holding | a light band sweeps the text (350 pause, 1.6s cycle) | the same; the emoji holds still (a pop-in and an idle per emoji were tried and removed: "too much") | no animation on the emoji |
| Result lands | the line is held until it has been up 900ms | same | resolved 244ms into a line → finish at ~900 |
| Finish | the glow blooms over the screen (420, inOut), translucent; 250ms in, the line drifts up 3px and fades (300), blurring to 4px only at the end | the line drifts up and fades the same way, at once. No "done" line: extraction reports no progress, only its result (the user removed "Ready to review") | bloom 0.94 at +345ms |
| Hand-over (520 later) | the bloom fades as a layer, the veil sharpens, fields rise in | the veil sharpens, fields rise in | fields at 7543 (A), 7441 (B) |

The shader stops drawing once its layer has faded (it is unmounted). Its palette is a switch:
the reference's colours, sampled from the video, or Emlaya's yellow ramp.

## Reduced motion

`prefers-reduced-motion`, or the dev toolbar's *Reduced motion* switch, sets
`data-reduced-motion` on the app. Then: no confetti (never started: 0 spawned), still rays (no
turn, no breathe), and a plain fade for all content. No flood, no pop, no rings, no rise, no
word masks, no stroke draw. The capture scene is still: no drift, no focus hunt. Review fades in
instead of rising. The processing loader keeps its cadence, but each line is a plain 200ms fade.
There is no shimmer, spin or idle, and the glow is one still frame that never loops (`running: off`). Verified by `verify:motion`
and the loader checks.
