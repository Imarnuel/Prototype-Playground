/**
 * Customer records for the Select customer sheet.
 *
 * The names come from the design's own populated frame (`88:12043`) rather than
 * being invented, so the prototype matches what the deck shows.
 *
 * TWO EXCEPTIONS, flagged rather than silently normalised (root agreement §3): the
 * frame's last two rows read "Location" instead of a customer name — leftover
 * placeholder text. They are replaced here with names in the same style, because a
 * row labelled "Location" in a customer list reads as a bug in a demo.
 */
export type Customer = {
  id: string;
  name: string;
};

export const CUSTOMERS: readonly Customer[] = [
  { id: 'cus-afolabi', name: 'Afolabi Adeyemi' },
  { id: 'cus-tunde', name: 'Tunde Ojo' },
  { id: 'cus-nneoma', name: 'Nneoma Okoro' },
  { id: 'cus-chinonso', name: 'Chinonso Agu' },
  { id: 'cus-kunle', name: 'Kunle Adeniyi' },
  { id: 'cus-folake', name: 'Folake Adebayo' },
  { id: 'cus-ifeanyi', name: 'Ifeanyi Okonkwo' },
  { id: 'cus-omolara', name: 'Omolara Ogunbiyi' },
  { id: 'cus-abdulrahman', name: 'Abdulrahman Suleiman' },
  { id: 'cus-chiamaka', name: 'Chiamaka Nwosu' },
  // Replacing the frame's two "Location" placeholder rows.
  { id: 'cus-ngozi', name: 'Ngozi Eze' },
  { id: 'cus-babatunde', name: 'Babatunde Oyelaran' },
];

export function findCustomer(id: string): Customer | undefined {
  return CUSTOMERS.find((c) => c.id === id);
}
