/**
 * Receipt Details (9564:21987) — the saved purchase receipt, reached from the
 * celebration's Done. RP-08 (a record and its evidence), RP-13/RP-14 (a suggested link,
 * confirmed or turned down in one tap).
 *
 * Reads the record that was saved (one source of truth): edits made on Review — the
 * merchant, the amount, a removed tag — show here.
 */
import { useRef, useState } from 'react';
import caretLeft from '../assets/figma/caret-left.svg';
import dotsThree from '../assets/figma/dots-three.svg';
import receipt16 from '../assets/figma/receipt-16.svg';
import dot3 from '../assets/figma/dot-3.svg';
import tag16 from '../assets/figma/tag-16.svg';
import user16 from '../assets/figma/user-16.svg';
import minusCircleTag from '../assets/figma/minus-circle-tag.svg';
import minusCircleShare from '../assets/figma/minus-circle-share.svg';
import xClose12 from '../assets/figma/x-close-12.svg';
import link16 from '../assets/figma/link-16.svg';
import moneyWavy from '../assets/figma/money-wavy.svg';
import plusCircle from '../assets/figma/plus-circle.svg';
import { HeaderButton, Icon, Pill } from '../components/ui';
import { EvidenceRow, ItemRow, MetaBlock } from '../components/record/RecordParts';
import { dismissedSuggestions, suggestedPaymentFor, type PurchaseReceipt } from '../data/records';
import { formatDayMonthTime, formatLongDateTime, formatNaira, formatWeekdayDateTime } from '../data/format';
import { usePresence } from '../state/usePresence';
import { tokenMs } from '../tokens/read';
import './ReceiptDetails.css';

type Props = {
  record: PurchaseReceipt;
  onRecordChange: (next: PurchaseReceipt) => void;
  onBack: () => void;
  onNotDesigned: (what: string) => void;
};

export function ReceiptDetails({ record, onRecordChange, onBack, onNotDesigned }: Props) {
  const [suggestion, setSuggestion] = useState(() => suggestedPaymentFor(record));
  const { mounted: suggestionShown, state: suggestionState } = usePresence(suggestion !== null, tokenMs('--motion-duration-base'));
  // The card keeps showing the suggestion it had while it animates out.
  const lastSuggestion = useRef(suggestion);
  if (suggestion) lastSuggestion.current = suggestion;
  const shownSuggestion = lastSuggestion.current;

  const set = <K extends keyof PurchaseReceipt>(key: K, value: PurchaseReceipt[K]) => onRecordChange({ ...record, [key]: value });

  return (
    <section className="details" data-theme="light" aria-label={`Receipt from ${record.merchant}`}>
      <div className="details__scroll">
        <div className="details__content">
          {/* 9564:21999 */}
          <div className="details__summary">
            <div className="card details__summaryCard">
              <p className="details__amount ts-display-d2">{formatNaira(record.amount)}</p>
              <p className="details__kind">
                <span className="details__kindType">
                  <Icon src={receipt16} size={16} />
                  <span className="ts-body-base">Purchase</span>
                </span>
                <img className="details__dot" src={dot3} alt="" />
                <span className="ts-body-base">{formatWeekdayDateTime(record.date, record.time)}</span>
              </p>
            </div>
          </div>

          {/* 9564:22011 — the same rows as Review */}
          <section className="details__items" aria-labelledby="details-items">
            <h2 id="details-items" className="details__sectionTitle ts-label-base">Items</h2>
            <ul className="card details__list">
              {record.items.map((item) => <ItemRow key={item.id} item={item} />)}
            </ul>
          </section>

          {/* 9564:22206 Other details */}
          <div className="details__other">
            <dl className="card details__otherCard">
              <DetailRow label="Merchant" value={record.merchant} />
              <DetailRow label="Date" value={formatLongDateTime(record.date, record.time)} />
              <DetailRow label="Address" value={record.address} last />
            </dl>
          </div>

          {/* 9564:22213 — the same blocks as Review */}
          <div className="details__meta">
            <div className="card details__metaCard">
              <MetaBlock icon={tag16} title="Tags" onOpen={() => onNotDesigned('Editing tags')}>
                {record.tags.map((t) => (
                  <Pill key={t} tone="tag" text={t} removeIcon={minusCircleTag} removeIconSize={16} onRemove={() => set('tags', record.tags.filter((x) => x !== t))} />
                ))}
              </MetaBlock>
              <MetaBlock icon={user16} title="Shared with" onOpen={() => onNotDesigned('Choosing who to @mention')} last>
                {record.sharedWith.map((m, i) => (
                  <Pill
                    key={m}
                    tone="mention"
                    text={m}
                    removeIcon={i === 0 ? minusCircleShare : xClose12}
                    removeIconSize={i === 0 ? 16 : 12}
                    onRemove={() => set('sharedWith', record.sharedWith.filter((x) => x !== m))}
                  />
                ))}
              </MetaBlock>
            </div>
          </div>

          {/* 9564:22276 */}
          <div className="details__evidence">
            <EvidenceRow record={record} caret onOpen={() => onNotDesigned('Viewing the original')} />
          </div>

          {/* 9564:22307 Linked records */}
          <section className="details__links" aria-labelledby="details-links">
            <h2 id="details-links" className="details__sectionTitle ts-label-base">Linked records</h2>
            {suggestionShown && shownSuggestion && (
              <div className="suggestion__collapse" data-state={suggestionState}>
              <div className="suggestion" role="group" aria-label="Suggested link">
                <span className="suggestion__head">
                  <Icon src={link16} size={16} />
                  <span className="ts-label-base">Suggested link</span>
                </span>
                <div className="suggestion__body">
                  <div className="suggestion__record">
                    <span className="suggestion__tile"><Icon src={moneyWavy} size={20} /></span>
                    <span className="suggestion__text">
                      <span className="suggestion__name ts-label-base">{shownSuggestion.name}</span>
                      <span className="suggestion__meta ts-body-small">
                        Payment · {formatNaira(shownSuggestion.amount)} · {formatDayMonthTime(shownSuggestion.date, shownSuggestion.time)}
                      </span>
                    </span>
                  </div>
                  <div className="suggestion__actions">
                    <button
                      type="button"
                      className="smallButton smallButton--quiet ts-label-bold-small"
                      onClick={() => {
                        dismissedSuggestions.add(`${record.id}:${shownSuggestion.id}`);
                        setSuggestion(suggestedPaymentFor(record));
                      }}
                    >
                      Not this
                    </button>
                    {/* The linked state is designed elsewhere in the file (4729:26790), not here. */}
                    <button type="button" className="smallButton smallButton--strong ts-label-bold-small" onClick={() => onNotDesigned('Linking')}>
                      Link
                    </button>
                  </div>
                </div>
              </div>
              </div>
            )}
            <div className="details__linkRows">
              <button type="button" className="linkRow" onClick={() => onNotDesigned('Linking a payment')}>
                <Icon src={plusCircle} size={20} />
                <span className="ts-label-base">Link payment</span>
              </button>
              <button type="button" className="linkRow" onClick={() => onNotDesigned('Linking a Shopping Note')}>
                <Icon src={plusCircle} size={20} />
                <span className="ts-label-base">Link shopping notes</span>
              </button>
            </div>
          </section>
        </div>
      </div>

      {/* 9564:21989 */}
      <header className="details__header">
        <div className="details__headerRow">
          <HeaderButton icon={caretLeft} label="Back" onClick={onBack} />
          <h1 className="details__title ts-heading-h3">{record.merchant}</h1>
          <HeaderButton icon={dotsThree} label="More" onClick={() => onNotDesigned('More options')} />
        </div>
      </header>
    </section>
  );
}

/** "Lists" rows of 9564:22209: a label, and its value on the right. */
function DetailRow({ label, value, last = false }: { label: string; value: string; last?: boolean }) {
  return (
    <div className="detailRow" data-last={last || undefined}>
      <dt className="ts-label-base">{label}</dt>
      <dd className="detailRow__value ts-body-base">{value}</dd>
    </div>
  );
}
