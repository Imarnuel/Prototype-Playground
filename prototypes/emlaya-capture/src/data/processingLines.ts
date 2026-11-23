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
 * Icons are the library's Phosphor set (page 4022:9650), Format=Stroke, Weight=Regular,
 * exported whole from each variant node named below. Only B draws them.
 */
import receipt from '../assets/figma/line-receipt.svg';
import storefront from '../assets/figma/line-storefront.svg';
import magnifyingGlass from '../assets/figma/line-magnifying-glass.svg';
import listChecks from '../assets/figma/line-list-checks.svg';
import sparkle from '../assets/figma/line-sparkle.svg';
import checkCircle from '../assets/figma/line-check-circle.svg';

/** A small motion the icon keeps while its line holds; each suits what the line says. */
export type Idle = 'bob' | 'pulse' | 'search' | 'wiggle' | 'twinkle' | 'none';

export type ProcessingLine = {
  /** A new key is a new line, and gets the swap. */
  key: string;
  text: string;
  icon: string;
  idle: Idle;
  /** A still line has nothing in progress: no shimmer. */
  still?: boolean;
};

export const PROCESSING_LINES: readonly ProcessingLine[] = [
  { key: 'read', text: 'Reading your receipt...', icon: receipt, idle: 'bob' }, // Receipt 4022:69406
  { key: 'merchant', text: 'Spotting the merchant...', icon: storefront, idle: 'pulse' }, // Storefront 4022:70414
  { key: 'total', text: 'Hunting for the total...', icon: magnifyingGlass, idle: 'search' }, // MagnifyingGlass 4022:50448
  { key: 'items', text: 'Listing your items...', icon: listChecks, idle: 'wiggle' }, // ListChecks 4022:60178
  // The last line holds for as long as extraction runs past the cadence.
  { key: 'tidy', text: 'Tidying up the details...', icon: sparkle, idle: 'twinkle' }, // Sparkle 4022:14946
];

/** B's finish, before the fields arrive. A finishes with the bloom instead. */
export const READY_LINE: ProcessingLine = {
  key: 'ready',
  text: 'Ready to review',
  icon: checkCircle, // CheckCircle 4022:47464
  idle: 'none',
  still: true,
};
