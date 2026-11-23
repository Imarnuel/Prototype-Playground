/**
 * Review details — processing (4653:68091) resolving into review (9502:21324).
 *
 * RP-07 / RP-08 (review an extraction before it is saved). Processing is not in the
 * flow node: 4653:68091 is the same flow's processing state in the sibling section
 * 4810:31333 ("Scanning a purchase receipt — High confidence matching"), used because
 * the brief's Processing step has no frame inside 9502:21986. CORRECTIONS.md, "Flow".
 *
 * The skeleton is drawn the way the frame draws it: the real layout with its text at
 * opacity 0 inside filled boxes, so its geometry is the review's own.
 */
import type { CSSProperties } from 'react';
import caretLeft from '../assets/figma/caret-left.svg';
import dotsThree from '../assets/figma/dots-three.svg';
import calendarBlank from '../assets/figma/calendar-blank.svg';
import clock from '../assets/figma/clock.svg';
import tag16 from '../assets/figma/tag-16.svg';
import user16 from '../assets/figma/user-16.svg';
import minusCircleTag from '../assets/figma/minus-circle-tag.svg';
import minusCircleShare from '../assets/figma/minus-circle-share.svg';
import xClose12 from '../assets/figma/x-close-12.svg';
import circleNotch from '../assets/figma/circle-notch.svg';
import { Button, HeaderButton, Icon, Pill, TextField, inert } from '../components/ui';
import { EvidenceRow, ItemRow, MetaBlock } from '../components/record/RecordParts';
import type { LineItem, PurchaseReceipt } from '../data/records';
import { formatFieldDate, formatNaira } from '../data/format';
import './Review.css';

export type ReviewStatus = 'processing' | 'ready' | 'error';

type ReviewProps = {
  status: ReviewStatus;
  draft: PurchaseReceipt | null;
  onDraftChange: (next: PurchaseReceipt) => void;
  saving: boolean;
  onSave: () => void;
  onRetry: () => void;
  onNotDesigned: (what: string) => void;
};

export function Review({ status, draft, onDraftChange, saving, onSave, onRetry, onNotDesigned }: ReviewProps) {
  const ready = status === 'ready' && draft !== null;
  return (
    <section className="review" data-theme="light" data-status={status} aria-label="Review details" aria-busy={status === 'processing'}>
      <div className="review__layer review__layer--skeleton" aria-hidden="true" {...inert(ready)}>
        <SkeletonReview />
      </div>

      {ready && <ReadyReview draft={draft} onDraftChange={onDraftChange} saving={saving} onSave={onSave} onNotDesigned={onNotDesigned} />}

      {/* 4653:68317: the veil and its pill, over the skeleton. */}
      <div className="review__veil" {...inert(status !== 'processing')}>
        <div className="review__pill" role="status">
          <Icon src={circleNotch} size={24} className="review__spinner" />
          <span className="ts-label-base">Extracting the details...</span>
        </div>
      </div>

      {status === 'error' && (
        // Error / Could Not Extract Details (4142:9167) exists in the file but could
        // not be inspected this session (Figma MCP unavailable), so this is a minimal
        // placeholder in its words, not a rebuild of it. RP-04 vocabulary.
        <div className="review__error" role="alert" data-departure="Placeholder for 4142:9167 (not inspected)">
          <div className="review__errorCard">
            <span className="review__errorBadge ts-label-xsmall">Needs design input</span>
            <h2 className="ts-heading-h3">Could not extract the details</h2>
            <p className="ts-body-base">The photo saved, but nothing on it reads as a purchase or payment.</p>
            <Button hierarchy="primary" onClick={onRetry}>Try again</Button>
          </div>
        </div>
      )}

      <div className="review__announce" aria-live="polite">
        {status === 'ready' ? 'Details extracted. Review them, then save.' : ''}
      </div>
    </section>
  );
}

/** Fields arrive here and nowhere earlier, one after another (design-engineer, motion). */
function stagger(i: number): CSSProperties {
  return { '--i': i } as CSSProperties;
}

/* --- Ready -------------------------------------------------------------------------- */

function ReadyReview({ draft, onDraftChange, saving, onSave, onNotDesigned }: {
  draft: PurchaseReceipt;
  onDraftChange: (next: PurchaseReceipt) => void;
  saving: boolean;
  onSave: () => void;
  onNotDesigned: (what: string) => void;
}) {
  const set = <K extends keyof PurchaseReceipt>(key: K, value: PurchaseReceipt[K]) => onDraftChange({ ...draft, [key]: value });

  return (
    <div className="review__layer review__layer--ready">
      <div className="review__scroll">
        <div className="review__content">
          {/* 5359:8681, the yellow receipt-actions rail, is removed at the user's request. */}
          {/* 9502:21326 */}
          <div className="review__topCard">
            <TextField
              size="large"
              label="Amount"
              value={formatNaira(draft.amount)}
              inputMode="numeric"
              onChange={(v) => {
                const digits = v.replace(/\D/g, '');
                set('amount', digits === '' ? 0 : Number(digits));
              }}
              className="stagger"
              style={stagger(0)}
            />
            <TextField size="large" label="Merchant" value={draft.merchant} onChange={(v) => set('merchant', v)} className="stagger" style={stagger(1)} />
            <div className="review__row stagger" style={stagger(2)}>
              <TextField size="default" label="Date" value={formatFieldDate(draft.date)} rightIcon={calendarBlank} onActivate={() => onNotDesigned('The date picker')} className="review__half" />
              <TextField size="default" label="Time" value={draft.time} rightIcon={clock} onActivate={() => onNotDesigned('The time picker')} className="review__half" />
            </div>
          </div>

          <div className="review__sections">
            {/* 9502:21338 */}
            <section className="review__items stagger" style={stagger(3)} aria-labelledby="items-heading">
              <h2 id="items-heading" className="review__sectionTitle ts-label-base">Items</h2>
              <ul className="card review__list">
                {draft.items.map((item) => <ItemRow key={item.id} item={item} />)}
              </ul>
            </section>

            {/* 9502:21506 */}
            <div className="review__meta stagger" style={stagger(4)}>
              <div className="card review__metaCard">
                <MetaBlock icon={tag16} title="Tags" onOpen={() => onNotDesigned('Editing tags')}>
                  {draft.tags.map((t) => (
                    <Pill key={t} tone="tag" text={t} removeIcon={minusCircleTag} removeIconSize={16} onRemove={() => set('tags', draft.tags.filter((x) => x !== t))} />
                  ))}
                </MetaBlock>
                <MetaBlock icon={user16} title="Shared with" onOpen={() => onNotDesigned('Choosing who to @mention')} last>
                  {draft.sharedWith.map((m, i) => (
                    // The file gives the two @mentions different remove glyphs (MinusCircle
                    // 16, x-close 12). Kept as drawn; logged.
                    <Pill
                      key={m}
                      tone="mention"
                      text={m}
                      removeIcon={i === 0 ? minusCircleShare : xClose12}
                      removeIconSize={i === 0 ? 16 : 12}
                      onRemove={() => set('sharedWith', draft.sharedWith.filter((x) => x !== m))}
                    />
                  ))}
                </MetaBlock>
              </div>
            </div>

            {/* 9502:21644 — the original evidence. 9502:21569, a second Tags/Shared card
                with tag names in the @mention row, is a duplicated placeholder: omitted. */}
            <div className="review__evidence stagger" style={stagger(5)}>
              {/* "Shoprite 16 Aug · 3 pages · 2.4 MB" in the frame describes another
                  document; these are this capture's. */}
              <EvidenceRow record={draft} onOpen={() => onNotDesigned('Viewing the original')} />
            </div>
          </div>
        </div>
      </div>

      <ReviewHeader more onNotDesigned={onNotDesigned} />

      {/* 9502:21685 .Docked button */}
      <div className="review__dock">
        <Button hierarchy="primary" docked onClick={onSave} disabled={saving} aria-busy={saving}>
          Save
        </Button>
      </div>
    </div>
  );
}

function ReviewHeader({ more, onNotDesigned }: { more: boolean; onNotDesigned?: (what: string) => void }) {
  return (
    <header className="review__header" data-variant={more ? 'review' : 'processing'}>
      <div className="review__headerRow">
        <HeaderButton icon={caretLeft} label="Back" onClick={() => onNotDesigned?.('Leaving without saving')} />
        <h1 className="review__title ts-heading-h3">Review details</h1>
        {more ? (
          <HeaderButton icon={dotsThree} label="More" size={44} onClick={() => onNotDesigned?.('More options')} />
        ) : (
          // 4653:68103: a 44 slot whose button is at opacity 0 — kept as the spacer it is.
          <span className="review__headerSpacer" />
        )}
      </div>
    </header>
  );
}

/* --- Processing --------------------------------------------------------------------- */

/** The skeleton's placeholder rows, as the frame has them (5 x "Whole milk 2 x ₦2,000"). */
const SKELETON_ROW: LineItem = { id: 'sk', name: 'Whole milk', quantity: 2, unitPrice: 2000 };

function SkeletonReview() {
  return (
    <div className="review__scroll review__scroll--skeleton">
      {/* 4653:68094: the header lives inside the top card here. */}
      <div className="review__skTop">
        <ReviewHeader more={false} />
        <div className="review__skFields">
          <SkeletonField />
          <SkeletonField />
        </div>
      </div>
      <div className="review__skSections">
        <section className="review__items review__items--skeleton">
          <span className="review__sectionTitle ts-label-base">Items</span>
          <ul className="card review__list">
            {Array.from({ length: 5 }, (_, i) => <ItemRow key={i} item={SKELETON_ROW} skeleton />)}
          </ul>
        </section>
        <div className="review__meta review__meta--skeleton">
          <div className="card review__metaCard">
            <MetaBlock icon={tag16} title="Tags" skeleton>
              {['Essentials', 'Organic', 'Snacks'].map((t) => <SkeletonPill key={t} text={t} />)}
            </MetaBlock>
            <MetaBlock icon={user16} title="Shared with" skeleton last>
              {['Essentials', 'Organic', 'Snacks'].map((t) => <SkeletonPill key={t} text={t} />)}
            </MetaBlock>
          </div>
        </div>
      </div>
    </div>
  );
}

function SkeletonField() {
  return <div className="textField textField--large review__skField" />;
}

function SkeletonPill({ text }: { text: string }) {
  return (
    <span className="pill pill--tag review__skPill">
      <span className="ts-body-base">{text}</span>
      <Icon src={xClose12} size={12} />
    </span>
  );
}
