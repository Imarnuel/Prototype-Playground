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

export type ProcessingLine = {
  /** A new key is a new line, and gets the swap. */
  key: string;
  text: string;
  /** B only. Moves with its line and has no motion of its own. */
  emoji: string;
};

export const PROCESSING_LINES: readonly ProcessingLine[] = [
  { key: 'read', text: 'Reading your receipt...', emoji: '🧾' },
  { key: 'merchant', text: 'Spotting the merchant...', emoji: '🏪' },
  { key: 'total', text: 'Hunting for the total...', emoji: '🔎' },
  { key: 'items', text: 'Listing your items...', emoji: '🛒' },
  // The last line holds for as long as extraction runs past the cadence.
  { key: 'tidy', text: 'Tidying up the details...', emoji: '✨' },
];

// No "done" line: extraction reports no progress, only its result, so the loader never
// claims a stage it cannot know (the user removed "Ready to review"). The lines are a
// cadence, not progress; when the result lands, the line simply leaves.
