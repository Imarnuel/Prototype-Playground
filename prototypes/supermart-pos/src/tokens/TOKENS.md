# Design tokens — Freshvale Supermart POS

All tokens are `[var]` — real Figma variables from the published system, not values
read off a frame. Nothing here was invented.

| | |
|---|---|
| Source | `figma-variables.json` — verbatim `get_variable_defs` for section `88:7008` |
| Dark mode | `figma-variables-dark.txt` — the `Semantic` collection's Dark mode (`255:1`), read through the plugin API: `name|light|dark|primitive`, FNV-1a `baa587f4` as computed in Figma. 56 dark overrides in `:root[data-theme='dark']`; `Color/alpha neutral/50` is a one-mode primitive (BUILD-PLAN #126) |
| Variables recorded | 138 |
| Semantic colours | 57 (`color.*`) |
| Legacy colours | 11 (`legacyColor.*`) |
| Spacing / radius / border-width / shadow | 11 / 9 / 4 / 3 |
| Type styles | 21 (6 composed from primitives) |
| CSS custom properties | 168 |

## How to use these

```ts
import { color, spacing, radius, type, typeStyle, shadowCss } from './tokens/tokens';
```

`tokens.ts` and `tokens.css` are **generated**. Edit `figma-variables.json` only by
re-pulling from Figma, then:

```bash
npm run tokens:gen      # regenerate both
npm run tokens:verify    # prove they still agree with the dump
```

`tokens:verify` asserts that no hex value exists in `tokens.ts` that is not in the
dump — the "never guess a value" rule, enforced rather than trusted.

### Line height is not always px

`lineHeight` is px for 20 of the 21 styles. **`H/6` holds `1.4` — a unitless ratio.**
Rendering a ratio as px gives a 1.4px line box and clips every descender; rendering
px as a ratio gives a line box 20× too tall. Use `lineHeightCss(style)` or
`typeStyle(name)` rather than reading `lineHeight` directly.

## Problems in the upstream system

Surfaced, not normalised (root agreement §3). None of these were "fixed" on the way in.

### 1. Letter-spacing values filed under a colour namespace

| Variable | Value |
|---|---|
| `Color/container/accent/indigo/heading/h4` | `-0.48` |
| `Color/container/accent/indigo/heading/h5` | `-0.20` |

These are numbers, not colours, and `Heading/h4` / `Heading/h5` bind their
`letterSpacing` to them. The generator excludes them from `color` so they cannot
appear as a phantom colour token, and resolves them for the two type styles.

### 2. Type styles differing only by case — and mostly not equivalent

| Pair | Verdict |
|---|---|
| `Heading/H4` 14/20 ls −0.20 vs `Heading/h4` 20/24 ls −0.48 | **Different size.** Picking the wrong one is a 6px type error |
| `Label/Base` 14/20 ls −0.16 vs `Label/base` 14/20 ls −0.20 | Different letter-spacing |
| `Label/Large` 16/24 ls −0.24 vs `Label/large` 16/24 ls −0.20 | Different letter-spacing |
| `Body/Large` 16/24 ls −0.24 vs `Body/large` 16/24 ls −0.20 | Different letter-spacing |
| `Body/Base` vs `Body/base` | Exactly identical — a true duplicate |

The lowercase set is composed from `Type/*` primitives; the capitalised set holds
literals. The system looks **mid-migration** between the two. Both are kept, keyed by
their exact Figma name, so a frame referencing either resolves correctly.

CSS property names **preserve case** for this reason: lowercasing collapses
`Heading/H4` and `Heading/h4` onto one property and silently drops one.

### 3. Mixed units in letter-spacing

`H/6` and `Body/Reg/Large` hold `-2`, where every other style is between −0.16 and
−0.96. −2px at 16–20px type is very tight; this is most likely **−2%** entered into a
px field. `Body/Reg/Large` otherwise duplicates `Body/Large`'s metrics, making it a
third variant of the same style.

**Not resolved** — needs a decision from whoever owns the system. Treated as px for
now, since that is what the variable says.

### 4. Cross-wired primitives

`Label/base` composes its family from `Type/font family/heading` and its size from
`Type/font size/body/base` — heading and body primitives inside a label style. It
resolves to the right values today only because all three families are `Inter`.

### 5. Colour tokens outside the semantic system

11 tokens sit outside `Color/*`: `Brand/600`, `Brand Colour/100`, `Green/600`,
`Neutral/200`, `Neutral/400`, `Neutral/500`, `Omnix Neutral/400`, `Primary / White`,
`White`, `Grays/Black`, `Labels/Primary`.

`Omnix Neutral/400` names a different design system. `Primary / White` has spaces
around the slash, breaking the naming convention. Several duplicate a semantic token's
value exactly — `Brand/600` is `#2C4A8B`, the same as `Color/container/brand/bold/default`.

They are exported as `legacyColor` so a frame referencing one resolves, but **prefer
the semantic token**.

### Not a defect: semantic aliasing

13 groups of semantic tokens share a value — 7 tokens are `#ffffff`, 6 are `#2c4a8b`.
That is how a semantic system is meant to work. Always pick the token that matches
intent (`color.border.selected`, not `color.text.brand`, for a selected border), because
the alias is what lets a theme diverge later. `tokens:verify` prints the full list.
