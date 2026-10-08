import type { IconName } from '../components/Icon';
import access from '../assets/banks/access.svg';
import moniepoint from '../assets/banks/moniepoint.svg';
import opay from '../assets/banks/opay.svg';
import palmpay from '../assets/banks/palmpay.png';
import { STORE } from './store';

/**
 * Payment methods, in the order of Select payment method (`88:14105`). Cash, Bank
 * transfer and POS are built; the other three are listed as drawn and raise a "not
 * designed yet" notice when picked (the designer's call).
 */
export type MethodId = 'cash' | 'bank' | 'pos' | 'balance' | 'complimentary' | 'split';

/**
 * Paid into one of the shop's accounts. POS has no frames of its own; it works exactly
 * as Bank transfer does (the designer: "POS basically means bank" — a card terminal
 * settles into the shop's bank account). Both name the account, both go through
 * Select bank, and both must be the total exactly.
 */
export type AccountMethod = 'bank' | 'pos';
export type PayMethod = 'cash' | AccountMethod;
export function paysIntoAccount(method: MethodId): method is AccountMethod {
  return method === 'bank' || method === 'pos';
}

export const METHODS: readonly { id: MethodId; label: string; icon: IconName; designed: boolean }[] = [
  { id: 'cash', label: 'Cash', icon: 'bank-note-02', designed: true },
  { id: 'bank', label: 'Bank transfer', icon: 'bank', designed: true },
  { id: 'pos', label: 'POS', icon: 'credit-card-02', designed: true },
  { id: 'balance', label: 'Customer balance', icon: 'wallet-04', designed: false },
  { id: 'complimentary', label: 'Complimentary', icon: 'gift-02', designed: false },
  { id: 'split', label: 'Payment split', icon: 'rows-03', designed: false },
];

export function methodLabel(id: MethodId): string {
  return METHODS.find((m) => m.id === id)!.label;
}

/**
 * The shop's receiving accounts, from Select bank (`88:14794`). The banks and their
 * logos are the frame's own. The frame's holder, "Theresa Ventures", is replaced by
 * the store's business name, and its numbers made distinct — Palmpay and Moniepoint
 * shared 8018826172 (BUILD-PLAN). The two Opay accounts are as drawn.
 */
export type BankAccount = { id: string; bank: string; short: string; number: string; holder: string; logo: string };

export const BANK_ACCOUNTS: readonly BankAccount[] = [
  { id: 'access', bank: 'Access bank plc.', short: 'Access bank', number: '0676430810', holder: STORE.businessName, logo: access },
  { id: 'palmpay', bank: 'Palmpay', short: 'Palmpay', number: '8018826172', holder: STORE.businessName, logo: palmpay },
  { id: 'moniepoint', bank: 'Moniepoint', short: 'Moniepoint', number: '8027715063', holder: STORE.businessName, logo: moniepoint },
  { id: 'opay-1', bank: 'Opay Ltd.', short: 'Opay', number: '8018026192', holder: STORE.businessName, logo: opay },
  { id: 'opay-2', bank: 'Opay Ltd.', short: 'Opay', number: '8516026122', holder: STORE.businessName, logo: opay },
];

export function bankAccount(id: string): BankAccount {
  const a = BANK_ACCOUNTS.find((x) => x.id === id);
  if (!a) throw new Error(`no such bank account: ${id}`);
  return a;
}
