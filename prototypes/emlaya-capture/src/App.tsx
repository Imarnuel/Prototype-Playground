/**
 * Emlaya — receipt capture to the "Receipt saved" milestone.
 * Figma LPXddONZ7IMNlIowbz161x, flow node 9502:21986 (+ processing 4653:68091).
 *
 * Capture (9502:21686) → Captured (9502:21716) → Processing (4653:68091) →
 * Review (9502:21324) → Saved (9502:21212, the first MilestoneCelebration).
 */
import { useCallback, useEffect, useRef, useState } from 'react';
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
import { captureFontsReady, type CameraFeedHandle } from './components/capture/CameraFeed';
import { scanDocument } from './components/capture/CaptureScene';
import { printedLines } from './data/receiptDocument';
import { Review, type ReviewStatus } from './screens/Review';
import { ReceiptDetails } from './screens/ReceiptDetails';
import { CheckBadge, MilestoneCard, MilestoneCelebration } from './components/celebration/MilestoneCelebration';
import { Layer } from './components/Layer';
import { Notice } from './components/Notice';
import { extractReceipt, saveReceipt } from './api/emlaya';
import { extractedDraft, milestoneFor, records, resetRecords, type Evidence, type Milestone, type PurchaseReceipt } from './data/records';
import { formatDayMonth, formatNaira, ordinal } from './data/format';
import { ForceReducedMotion, useReducedMotion } from './state/motion';
import { tokenMs } from './tokens/read';

type Screen = 'camera' | 'captured' | 'processing' | 'review' | 'extractError' | 'saved' | 'details';

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
  const [evidence, setEvidence] = useState<Evidence | null>(null);
  const [cameraLit, setCameraLit] = useState(true);
  const feedRef = useRef<CameraFeedHandle>(null);

  const notDesigned = useCallback((what: string) => setNotice(`${what} is not part of this flow.`), []);
  const clearNotice = useCallback(() => setNotice(null), []);

  useEffect(() => setLatencyScale(hold ? HOLD_SCALE : 1), [hold]);

  // Extraction runs whenever the flow enters processing; a stale run is ignored.
  useEffect(() => {
    if (screen !== 'processing') return;
    let live = true;
    evidenceOrScan()
      .then(extractReceipt)
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

  /** The shot's scanned document; a toolbar jump that skipped the camera scans one. */
  const evidenceOrScan = async (): Promise<Evidence> => {
    if (evidence) return evidence;
    await captureFontsReady();
    const scan = { ...scanDocument(printedLines()), pages: 1 };
    setEvidence(scan);
    return scan;
  };

  const shoot = () => {
    const scan = feedRef.current?.capture();
    if (scan) setEvidence({ ...scan, pages: 1 });
    setShot((n) => n + 1);
    setScreen('captured');
  };

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

  /** Done (and ×) on the celebration: on to the saved receipt (9564:21987). */
  const done = () => setScreen('details');

  /** Back from Receipt Details: the flow starts over at the camera. */
  const restart = () => {
    setScreen('camera');
    setDraft(null);
    setEvidence(null);
  };

  /** Edits on Receipt Details write the saved record itself (one source of truth). */
  const updateSaved = (next: PurchaseReceipt) => {
    const i = records.findIndex((r) => r.id === next.id && r === saved);
    if (i >= 0) records[i] = next;
    setSaved(next);
  };

  // --- Dev toolbar: every screen and state in one tap (CLAUDE.md §6) ---------------
  const jumpReview = async () => {
    setDraft(extractedDraft(await evidenceOrScan()));
    setScreen('review');
  };
  const jumpSaved = async () => {
    // Saving is the only way into the milestone, so a jump saves too — the figures on
    // the card are then the store's, as they are at the end of the real flow.
    const d = draft ?? extractedDraft(await evidenceOrScan());
    records.push(d);
    setDraft(d);
    commitSave(d);
    setReplay((n) => n + 1);
  };
  const jumpDetails = async () => {
    if (!saved) await jumpSaved();
    setScreen('details');
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
    { group: 'Screens', label: 'Receipt details', onSelect: jumpDetails },
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
  const sheet = tokenMs('--motion-duration-slow');

  // The status bar stays light until Review has fully risen over the dark camera.
  useEffect(() => {
    if (onCamera) {
      setCameraLit(true);
      return;
    }
    const t = window.setTimeout(() => setCameraLit(false), sheet);
    return () => window.clearTimeout(t);
  }, [onCamera, sheet]);
  const onReview = screen === 'processing' || screen === 'review' || screen === 'extractError' || screen === 'saved';
  const reviewStatus: ReviewStatus = screen === 'processing' ? 'processing' : screen === 'extractError' ? 'error' : 'ready';
  const fade = tokenMs('--motion-duration-base');

  return (
    <div
      className="app"
      data-reduced-motion={reduced ? 'true' : 'false'}
      data-show-departures={showDepartures || undefined}
      data-harness={harness || undefined}
    >
      <DeviceFrame
        showBody={!harness}
        statusBar={cameraLit ? 'light' : 'dark'}
        homeIndicator={cameraLit ? 'light' : 'dark'}
      >
        <div className="stage">
          <Layer open={onCamera} exitMs={sheet} className="layer--camera">
            <Camera
              phase={screen === 'captured' ? 'captured' : 'live'}
              leaving={!onCamera}
              still={reduced}
              feedRef={feedRef}
              shot={shot}
              onShutter={shoot}
              onRetake={() => setScreen('camera')}
              onContinue={startProcessing}
              onNotDesigned={notDesigned}
            />
          </Layer>

          {/* Review rises over the shot as a sheet (no zoom); it fades when it leaves. */}
          <Layer open={onReview} exitMs={fade} className="layer--review">
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

          {/* Under the celebration, so Done's exit reveals it. */}
          <Layer open={screen === 'details' && saved !== null} exitMs={fade} className="layer--details">
            {saved && <ReceiptDetails key={saved.id} record={saved} onRecordChange={updateSaved} onBack={restart} onNotDesigned={notDesigned} />}
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
