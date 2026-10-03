/**
 * Freshvale Supermart design tokens — GENERATED, do not edit.
 *
 * Source: `figma-variables.json`, the verbatim `get_variable_defs` output for
 * Sales point (section) (`88:7008`). Regenerate with `npm run tokens:gen`.
 *
 * Every value here is `[var]` — a real Figma variable, not read off a frame.
 *
 * Known problems in the upstream system are documented in TOKENS.md and are
 * surfaced rather than normalised here (root agreement §3).
 */

export const color = {
  text: {
    default: "#141f33",
    secondary: "#323c52",
    subtle: "#5e6a82",
    subtlest: "#7a8599",
    inverse: "#ffffff",
    selected: "#2c4a8b",
    brand: "#2c4a8b",
    danger: "#c1261a",
    success: "#026e41",
    onDisabled: "#9ea4b3",
    accent: {
      aqua: "#0e6081",
      purple: "#5120ca",
      pink: "#b3146c",
      indigo: "#3133c4"
    }
  },
  icon: {
    default: "#20293c",
    subtle: "#5e6a82",
    subtlest: "#9ea4b3",
    inverse: "#ffffff",
    selected: "#2c4a8b",
    brand: "#2c4a8b",
    success: "#038c4e",
    disabled: "#cfd3d8",
    danger: {
      bolder: "#c1261a"
    },
    accent: {
      aqua: "#0c8dbd",
      pink: "#d42189",
      green: "#038c4e"
    }
  },
  border: {
    default: "#252b3724",
    subtle: "#252b3714",
    selected: "#2c4a8b",
    input: "#cfd3d8",
    inverse: "#ffffff",
    overlay: "#252b3724"
  },
  surface: {
    default: "#ffffff",
    secondary: {
      default: "#f6f7f9"
    },
    tertiary: {
      default: "#f0f2f5"
    },
    overlay: {
      default: "#ffffff"
    }
  },
  container: {
    input: {
      default: "#ffffff"
    },
    brand: {
      default: "#e7edf9",
      bold: {
        default: "#2c4a8b"
      },
      subtle: {
        default: "#f8f9fc"
      },
      hovered: "#cfd9ec"
    },
    neutral: {
      default: "#0c0e180a",
      subtle: {
        default: "#0c0e1805",
        hover: "#0c0e180a"
      },
      lessBold: {
        default: "#f0f2f5"
      },
      bolder: {
        default: "#141f33"
      },
      transparent: {
        default: "#00000000"
      }
    },
    success: {
      default: "#dffceb",
      bold: {
        default: "#038c4e"
      }
    },
    accent: {
      aqua: {
        default: "#e2f5fd"
      },
      pink: {
        default: "#fce9f7"
      },
      purple: {
        default: "#ecebff"
      },
      indigo: {
        default: "#e0ebff"
      }
    },
    inverse: {
      default: "#ffffff"
    },
    disabled: "#0c0e1805",
    blanket: "#0c0e1880"
  },
  alphaNeutral: {
    "50": "#0c0e1880"
  }
} as const;

export const spacing = {
  "0": 0,
  "25": 2,
  "50": 4,
  "100": 6,
  "200": 8,
  "300": 12,
  "400": 16,
  "500": 20,
  "600": 24,
  "700": 32,
  "900": 48
} as const;

export const radius = {
  "0": 0,
  "50": 4,
  "100": 6,
  "200": 8,
  "300": 12,
  "400": 16,
  "500": 20,
  "650": 28,
  full: 9999
} as const;

export const borderWidth = {
  xs: 0.6600000262260437,
  sm: 1,
  md: 2,
  xl: 6
} as const;

/** Raw Figma effect strings, kept verbatim; `shadowCss` has the CSS equivalents. */
export const shadow = {
  xs: "Effect(type: DROP_SHADOW, color: #0A0D120D, offset: (0, 1), radius: 2, spread: 0)",
  lg: "Effect(type: DROP_SHADOW, color: #0A0D1208, offset: (0, 4), radius: 6, spread: 0); Effect(type: DROP_SHADOW, color: #0A0D1214, offset: (0, 12), radius: 16, spread: -2); Effect(type: DROP_SHADOW, color: #00000008, offset: (0, 0), radius: 1, spread: 0.5)",
  xl: "Effect(type: DROP_SHADOW, color: #0A0D1208, offset: (0, 8), radius: 8, spread: -2); Effect(type: DROP_SHADOW, color: #0A0D1214, offset: (0, 20), radius: 24, spread: -2)"
} as const;

export const shadowCss = {
  xs: "0px 1px 2px 0px #0a0d120d",
  lg: "0px 4px 6px 0px #0a0d1208, 0px 12px 16px -2px #0a0d1214, 0px 0px 1px 0.5px #00000008",
  xl: "0px 8px 8px -2px #0a0d1208, 0px 20px 24px -2px #0a0d1214"
} as const;

export type TypeStyle = {
  family: string;
  style: string;
  size: number;
  weight: number;
  /**
   * In px for every style EXCEPT `H/6`, where Figma holds 1.4 — a unitless ratio.
   * Rendering a ratio as px (or px as a ratio) is the line-height trap in the root
   * agreement; `lineHeightCss` resolves it per style instead of at the call site.
   */
  lineHeight: number;
  letterSpacing: number;
  /** True where the style is composed from primitives rather than holding literals. */
  composed: boolean;
};

export const type: Record<string, TypeStyle> = {
  "Display/D1": {
    family: "Inter",
    style: "Semi Bold",
    size: 32,
    weight: 600,
    lineHeight: 40,
    letterSpacing: -0.9599999785423279,
    composed: false
  },
  "Display/D3": {
    family: "Inter",
    style: "Semi Bold",
    size: 24,
    weight: 600,
    lineHeight: 28,
    letterSpacing: -0.6399999856948853,
    composed: false
  },
  "Heading/H1": {
    family: "Inter",
    style: "Semi Bold",
    size: 22,
    weight: 600,
    lineHeight: 28,
    letterSpacing: -0.6399999856948853,
    composed: false
  },
  "Heading/H2": {
    family: "Inter",
    style: "Semi Bold",
    size: 18,
    weight: 600,
    lineHeight: 24,
    letterSpacing: -0.3199999928474426,
    composed: false
  },
  "Heading/H3": {
    family: "Inter",
    style: "Semi Bold",
    size: 16,
    weight: 600,
    lineHeight: 24,
    letterSpacing: -0.3199999928474426,
    composed: false
  },
  "Heading/H4": {
    family: "Inter",
    style: "Semi Bold",
    size: 14,
    weight: 600,
    lineHeight: 20,
    letterSpacing: -0.20000000298023224,
    composed: false
  },
  "H/6": {
    family: "Inter",
    style: "Semi Bold",
    size: 20,
    weight: 600,
    lineHeight: 1.399999976158142,
    letterSpacing: -2,
    composed: false
  },
  "Body/Base": {
    family: "Inter",
    style: "Regular",
    size: 14,
    weight: 400,
    lineHeight: 20,
    letterSpacing: -0.20000000298023224,
    composed: false
  },
  "Body/Large": {
    family: "Inter",
    style: "Regular",
    size: 16,
    weight: 400,
    lineHeight: 24,
    letterSpacing: -0.23999999463558197,
    composed: false
  },
  "Body/Reg/Large": {
    family: "Inter",
    style: "Regular",
    size: 16,
    weight: 400,
    lineHeight: 24,
    letterSpacing: -2,
    composed: false
  },
  "Label/Base": {
    family: "Inter",
    style: "Medium",
    size: 14,
    weight: 500,
    lineHeight: 20,
    letterSpacing: -0.1599999964237213,
    composed: false
  },
  "Label/Large": {
    family: "Inter",
    style: "Medium",
    size: 16,
    weight: 500,
    lineHeight: 24,
    letterSpacing: -0.23999999463558197,
    composed: false
  },
  "Label/Small": {
    family: "Inter",
    style: "Medium",
    size: 12,
    weight: 500,
    lineHeight: 16,
    letterSpacing: 0,
    composed: false
  },
  "Label/Xsmall": {
    family: "Inter",
    style: "Medium",
    size: 11,
    weight: 500,
    lineHeight: 16,
    letterSpacing: -0.20000000298023224,
    composed: false
  },
  "Text xs/Medium": {
    family: "Inter",
    style: "Medium",
    size: 12,
    weight: 500,
    lineHeight: 18,
    letterSpacing: 0,
    composed: false
  },
  "Heading/h4": {
    family: "Inter",
    style: "Semi Bold",
    size: 20,
    weight: 600,
    lineHeight: 24,
    letterSpacing: -0.47999998927116394,
    composed: true
  },
  "Heading/h5": {
    family: "Inter",
    style: "Semi Bold",
    size: 16,
    weight: 600,
    lineHeight: 20,
    letterSpacing: -0.20000000298023224,
    composed: true
  },
  "Body/base": {
    family: "Inter",
    style: "Regular",
    size: 14,
    weight: 400,
    lineHeight: 20,
    letterSpacing: -0.20000000298023224,
    composed: true
  },
  "Body/large": {
    family: "Inter",
    style: "Regular",
    size: 16,
    weight: 400,
    lineHeight: 24,
    letterSpacing: -0.20000000298023224,
    composed: true
  },
  "Label/base": {
    family: "Inter",
    style: "Medium",
    size: 14,
    weight: 500,
    lineHeight: 20,
    letterSpacing: -0.20000000298023224,
    composed: true
  },
  "Label/large": {
    family: "Inter",
    style: "Medium",
    size: 16,
    weight: 500,
    lineHeight: 24,
    letterSpacing: -0.20000000298023224,
    composed: true
  }
};

/**
 * line-height as a CSS value. A value under 4 is treated as a ratio and emitted
 * unitless; everything else is px. The threshold is safe because the smallest px
 * line-height in this system is 16.
 */
export function lineHeightCss(style: TypeStyle): string {
  return style.lineHeight < 4 ? String(style.lineHeight) : `${style.lineHeight}px`;
}

/** Everything needed to render a type style, as a style object. */
export function typeStyle(name: keyof typeof type): {
  fontFamily: string; fontSize: string; fontWeight: number; lineHeight: string; letterSpacing: string;
} {
  const s = type[name];
  return {
    fontFamily: `"${s.family}", -apple-system, system-ui, sans-serif`,
    fontSize: `${s.size}px`,
    fontWeight: s.weight,
    lineHeight: lineHeightCss(s),
    letterSpacing: `${s.letterSpacing}px`,
  };
}

/**
 * Tokens that sit OUTSIDE the semantic `Color/*` system — leftovers from other
 * libraries, kept so a frame referencing one still resolves. Prefer the semantic
 * token with the same value. See TOKENS.md for which to use.
 */
export const legacyColor = {
  brand600: "#2C4A8B",
  brandColour100: "#F0F3FA",
  green600: "#0A9645",
  neutral200: "#BBBBC4",
  neutral400: "#5A5C63",
  neutral500: "#353645",
  omnixNeutral400: "#60676E",
  primaryWhite: "#FFFFFF",
  white: "#FFFFFF",
  graysBlack: "#000000",
  labelsPrimary: "#000000"
} as const;
