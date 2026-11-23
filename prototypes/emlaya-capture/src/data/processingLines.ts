/**
 * The processing loader's status lines (4653:68091 redesign).
 *
 * The brief: replace "Extracting the details..." and change it a few times before
 * extraction is done. Each line says what the app is DOING, never what it found: the
 * fields arrive on Review and nowhere earlier (design-engineer, Extraction → Review).
 * "Hunting for the total" is the handbook's settled microcopy. Nothing says verified,
 * checked or confirmed: a purchase receipt is read, not verified (PRV-12).
 *
 * The "..." matches the frame's own "Extracting the details...". Copy is a proposal and
 * needs the owner's sign-off.
 *
 * Emojis are B's, right of the text, at the user's request (they replaced library icons
 * left of it). They are the platform's own emoji font, so they look like Apple's on an
 * iPhone and like Noto or Segoe elsewhere. Not in Figma.
 */

/** A small motion the emoji keeps while its line holds; each suits what the line says. */
export type Idle = 'bob' | 'pulse' | 'search' | 'wiggle' | 'twinkle' | 'none';

export type ProcessingLine = {
  /** A new key is a new line, and gets the swap. */
  key: string;
  text: string;
  emoji: string;
  idle: Idle;
  /** A still line has nothing in progress: no shimmer, and the spinner rests. */
  still?: boolean;
};

export const PROCESSING_LINES: readonly ProcessingLine[] = [
  { key: 'read', text: 'Reading your receipt...', emoji: '🧾', idle: 'bob' },
  { key: 'merchant', text: 'Spotting the merchant...', emoji: '🏪', idle: 'pulse' },
  { key: 'total', text: 'Hunting for the total...', emoji: '🔎', idle: 'search' },
  { key: 'items', text: 'Listing your items...', emoji: '🛒', idle: 'wiggle' },
  // The last line holds for as long as extraction runs past the cadence.
  { key: 'tidy', text: 'Tidying up the details...', emoji: '✨', idle: 'twinkle' },
];

/** B's finish, before the fields arrive. A finishes with the bloom instead. */
export const READY_LINE: ProcessingLine = { key: 'ready', text: 'Ready to review', emoji: '✅', idle: 'none', still: true };

/** Every line B can show, for sizing: the spinner must not move when a longer line arrives. */
export const ALL_LINES: readonly ProcessingLine[] = [...PROCESSING_LINES, READY_LINE];
