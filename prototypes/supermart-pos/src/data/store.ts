/**
 * The store's identity on its receipt (`88:8735`). The frame carries Klakpad's own
 * name, address, phone and email; the designer chose the study's fictional store
 * instead, so every detail here is invented. "Powered by www.klakpad.com" stays: it
 * is the product's credit, not the store's.
 */
export const STORE = {
  name: 'Freshvale Stores',
  businessName: 'Freshvale Stores Ltd',
  address: 'No. 14, Freshvale Arcade, Bodija, Ibadan',
  phone: 'Tel: 0809 000 1414, 0809 000 1415',
  email: 'hello@freshvale.example',
  /** One handle across the four networks the frame draws. */
  handle: 'freshvalestores',
  footnote: 'Goods sold can be exchanged within 7 days with this receipt. Thank you for shopping with Freshvale.',
  credit: 'Powered by www.klakpad.com',
  /** Who is signed in at the till. The frame's "Kuola Ajinde" is placeholder data. */
  salesPerson: 'Adaeze Okafor',
} as const;
