/**
 * Emlaya — receipt capture to the "Receipt saved" milestone.
 * Figma LPXddONZ7IMNlIowbz161x, flow node 9502:21986 (+ processing 4653:68091).
 *
 * Capture (9502:21686) → Captured (9502:21716) → Processing (4653:68091) →
 * Review (9502:21324) → Saved (9502:21212, the first MilestoneCelebration).
 */
import { useCallback, useEffect, useState } from 'react';
import {
  DevToolbar,
  DeviceFrame,
  devFlagEnabled,
  failNextRequest,
  setLatencyScale,
  type DevToolbarItem,
} from '@playground/shared';
import starBadge from './assets/figma/star-badge.svg';
import { Camera } from './screens/Camera';
import { Review, type ReviewStatus } from './screens/Review';
import { CheckBadge, MilestoneCard, MilestoneCelebration } from './components/celebration/MilestoneCelebration';
import { Layer } from './components/Layer';
import { Notice } from './components/Notice';
import { extractReceipt, saveReceipt } from './api/emlaya';
import { extractedDraft, milestoneFor, records, resetRecords, type Milestone, type PurchaseReceipt } from './data/records';
import { formatDayMonth, formatNaira, ordinal } from './data/format';
import { ForceReducedMotion, useReducedMotion } from './state/motion';
import { tokenMs } from './tokens/read';

type Screen = 'camera' | 'captured' | 'processing' | 'review' | 'extractError' | 'saved';

/** How long extraction is held when the presenter wants to talk over it. */
const HOLD_SCALE = 1000;

export function App() {
  const [forceReduced, setForceReduced] = useState(false);
  return (
    <ForceReducedMotion.Provider value={forceReduced}>
      <Prototype forceReduced={forceReduced} setForceReduced={setForceReduced} />
    </ForceReducedMotion.Provider>
  );
}

function Prototype({ forceReduced, setForceReduced }: { forceReduced: boolean; setForceReduced: (v: boolean) => void }) {
  // The hosted preview has no address bar to add ?dev=1 to; its build sets VITE_SHOWCASE.
  const dev = devFlagEnabled() || import.meta.env.VITE_SHOWCASE === '1';
  const reduced = useReducedMotion();
  const [screen, setScreen] = useState<Screen>('camera');
  const [shot, setShot] = useState(0);
  const [draft, setDraft] = useState<PurchaseReceipt | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState<PurchaseReceipt | null>(null);
  const [milestone, setMilestone] = useState<Milestone | null>(null);
  const [replay, setReplay] = useState(0);
  const [notice, setNotice] = useState<string | null>(null);
  const [hold, setHold] = useState(false);
  const [harness, setHarness] = useState(() => new URLSearchParams(window.location.search).get('frame') === 'figma');
  const [showDepartures, setShowDepartures] = useState(false);
  const [extractRun, setExtractRun] = useState(0);

  const notDesigned = useCallback((what: string) => setNotice(`${what} is not part of this flow.`), []);
  const clearNotice = useCallback(() => setNotice(null), []);

  useEffect(() => setLatencyScale(hold ? HOLD_SCALE : 1), [hold]);

  // Extraction runs whenever the flow enters processing; a stale run is ignored.
  useEffect(() => {
    if (screen !== 'processing') return;
    let live = true;
    extractReceipt()
      .then((d) => {
        if (!live) return;
        setDraft(d);
        setScreen('review');
      })
      .catch(() => live && setScreen('extractError'));
    return () => {
      live = false;
    };
  }, [screen, extractRun]);

  const startProcessing = () => {
    setExtractRun((n) => n + 1);
    setScreen('processing');
  };

  const commitSave = (record: PurchaseReceipt) => {
    setSaved(record);
    setMilestone(milestoneFor(record));
    setScreen('saved');
  };

  const save = () => {
    if (!draft || saving) return;
    setSaving(true);
    saveReceipt(draft)
      .then(commitSave)
      .catch(() => setNotice('The save failed. A save-error state is not designed.'))
      .finally(() => setSaving(false));
  };

  const done = () => {
    setScreen('camera');
    setDraft(null);
  };

  // --- Dev toolbar: every screen and state in one tap (CLAUDE.md §6) ---------------
  const jumpReview = () => {
    setDraft(extractedDraft());
    setScreen('review');
  };
  const jumpSaved = () => {
    // Saving is the only way into the milestone, so a jump saves too — the figures on
    // the card are then the store's, as they are at the end of the real flow.
    const d = draft ?? extractedDraft();
    records.push(d);
    setDraft(d);
    commitSave(d);
    setReplay((n) => n + 1);
  };
  const replayCelebration = () => {
    if (screen === 'saved') setReplay((n) => n + 1);
    else jumpSaved();
  };

  const items: DevToolbarItem[] = [
    { group: 'Screens', label: 'Camera', onSelect: () => setScreen('camera') },
    { group: 'Screens', label: 'Captured', onSelect: () => setScreen('captured') },
    { group: 'Screens', label: 'Processing', onSelect: startProcessing },
    { group: 'Screens', label: 'Review', onSelect: jumpReview },
    { group: 'Screens', label: 'Receipt saved', onSelect: jumpSaved },
    { group: 'States', label: 'Extraction error', onSelect: () => setScreen('extractError') },
    { group: 'States', label: 'Fail next request', onSelect: failNextRequest },
    { group: 'States', label: 'Hold processing', pressed: hold, onSelect: () => setHold((v) => !v) },
    { group: 'States', label: 'Not-designed notice', onSelect: () => notDesigned('This control') },
    { group: 'Presenting', label: 'Replay celebration', onSelect: replayCelebration },
    { group: 'Presenting', label: 'Reduced motion', pressed: forceReduced, onSelect: () => setForceReduced(!forceReduced) },
    { group: 'Presenting', label: 'Show departures', pressed: showDepartures, onSelect: () => setShowDepartures((v) => !v) },
    { group: 'Presenting', label: 'Figma frame 402x874', pressed: harness, onSelect: () => setHarness((v) => !v) },
    { group: 'Presenting', label: 'Reset records', onSelect: resetRecords },
  ];

  const onCamera = screen === 'camera' || screen === 'captured';
  const reviewStatus: ReviewStatus = screen === 'processing' ? 'processing' : screen === 'extractError' ? 'error' : 'ready';
  const fade = tokenMs('--motion-duration-base');
  const handoff = tokenMs('--motion-duration-slow');

  return (
    <div
      className="app"
      data-reduced-motion={reduced ? 'true' : 'false'}
      data-show-departures={showDepartures || undefined}
      data-harness={harness || undefined}
    >
      <DeviceFrame
        showBody={!harness}
        statusBar={onCamera ? 'light' : 'dark'}
        homeIndicator={onCamera ? 'light' : 'dark'}
      >
        <div className="stage">
          <Layer open={!onCamera} exitMs={fade} className="layer--review">
            <Review
              status={reviewStatus}
              draft={draft}
              onDraftChange={setDraft}
              saving={saving}
              onSave={save}
              onRetry={startProcessing}
              onNotDesigned={notDesigned}
            />
          </Layer>

          <Layer open={onCamera} exitMs={handoff} className="layer--camera">
            <Camera
              phase={screen === 'captured' ? 'captured' : 'live'}
              leaving={!onCamera}
              shot={shot}
              onShutter={() => {
                setShot((n) => n + 1);
                setScreen('captured');
              }}
              onRetake={() => setScreen('camera')}
              onContinue={startProcessing}
              onNotDesigned={notDesigned}
            />
          </Layer>

          {saved && milestone && (
            <MilestoneCelebration
              key={replay}
              open={screen === 'saved'}
              title="Receipt saved"
              body={`${saved.merchant} • ${formatNaira(saved.amount)} • ${formatDayMonth(saved.date)}`}
              icon={<CheckBadge />}
              primaryAction={{ label: 'Done', onPress: done }}
            >
              <MilestoneCard
                icon={starBadge}
                headline={
                  <>
                    This is your <span className="milestoneCard__emphasis">{ordinal(milestone.ordinal)}</span> purchase from{' '}
                    {saved.merchant}
                  </>
                }
                detail={
                  <>
                    <span className="milestoneCard__figure ts-label-bold-small">{formatNaira(milestone.merchantTotal)}</span>{' '}
                    there so far. <span className="milestoneCard__emphasis">{milestone.topCategory}</span> is your top category
                  </>
                }
              />
            </MilestoneCelebration>
          )}

          <Notice message={notice} onDone={clearNotice} />
        </div>
      </DeviceFrame>

      {dev && (
        <aside className="showcase" aria-label="Presentation controls">
          <button type="button" className="showcase__button ts-label-bold-base" onClick={replayCelebration}>
            Replay celebration
          </button>
        </aside>
      )}

      <DevToolbar items={items} enabled={dev} />
    </div>
  );
}
