/**
 * The parts a purchase receipt is drawn from, shared by Review (9502:21324) and Receipt
 * Details (9564:21987): the item rows, the Tags / Shared with blocks and the original's
 * evidence row. One definition, so the two screens cannot drift apart.
 */
import type { ReactNode } from 'react';
import caretRight16 from '../../assets/figma/caret-right-16.svg';
import caretRightAttachment from '../../assets/figma/caret-right-attachment.svg';
import { Icon } from '../ui';
import type { LineItem, PurchaseReceipt } from '../../data/records';
import { formatDayMonth, formatNaira, formatPagesSize } from '../../data/format';
import './RecordParts.css';

export function ItemRow({ item, skeleton = false }: { item: LineItem; skeleton?: boolean }) {
  return (
    <li className="itemRow" data-skeleton={skeleton || undefined}>
      <div className="itemRow__content">
        <div className="itemRow__left">
          <span className="itemRow__name ts-label-large"><span className="itemRow__text">{item.name}</span></span>
          <span className="itemRow__qtyRow">
            <span className="itemRow__qty ts-body-base"><span className="itemRow__text">{item.quantity}</span></span>
            <span className="itemRow__x ts-body-small"><span className="itemRow__text">x</span></span>
            <span className="itemRow__unit ts-body-base"><span className="itemRow__text">{formatNaira(item.unitPrice)}</span></span>
          </span>
        </div>
        <span className="itemRow__total ts-label-large"><span className="itemRow__text">{formatNaira(item.quantity * item.unitPrice)}</span></span>
      </div>
    </li>
  );
}

export function MetaBlock({ icon, title, onOpen, last = false, skeleton = false, children }: {
  icon: string;
  title: string;
  onOpen?: () => void;
  last?: boolean;
  skeleton?: boolean;
  children: ReactNode;
}) {
  return (
    <div className="metaBlock" data-last={last || undefined}>
      <button type="button" className="metaBlock__head" onClick={onOpen} tabIndex={skeleton ? -1 : undefined}>
        <span className="metaBlock__title">
          <Icon src={icon} size={16} />
          <span className="ts-body-base">{title}</span>
        </span>
        <Icon src={caretRight16} size={16} />
      </button>
      <div className="metaBlock__pills" data-skeleton={skeleton || undefined}>{children}</div>
    </div>
  );
}

/**
 * The original evidence (RP-07, §1.2): the scan, with what it is. Review's row has no
 * caret (9502:21674 exports with no visible layers); Receipt Details' has one (9564:22306).
 */
export function EvidenceRow({ record, onOpen, caret = false }: { record: PurchaseReceipt; onOpen: () => void; caret?: boolean }) {
  return (
    <button type="button" className="card evidenceRow" onClick={onOpen}>
      <span className="evidenceRow__thumb">
        <img src={record.evidence.src} alt="" />
      </span>
      <span className="evidenceRow__text">
        <span className="ts-label-base">{record.merchant} {formatDayMonth(record.date)}</span>
        <span className="evidenceRow__meta ts-body-small">{formatPagesSize(record.evidence.pages, record.evidence.bytes)}</span>
      </span>
      {caret && <Icon src={caretRightAttachment} size={16} className="evidenceRow__caret" />}
    </button>
  );
}
