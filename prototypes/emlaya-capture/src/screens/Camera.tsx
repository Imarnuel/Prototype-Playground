/**
 * Scan / Camera — Receipt in Frame: live (9502:21686) and captured (9502:21716).
 *
 * One surface with two phases rather than two screens: the frames share the photo, the
 * top row and the hint, and differ only in what sits at the bottom. Keeping one photo
 * element is what lets the capture feel retained, not replaced, and lets the same
 * element carry into processing (the handoff below).
 *
 * The camera is simulated: a live canvas scene (CaptureScene) of a receipt printed from
 * the record, in place of the frame's still stock photo — the user's call.
 */
import type { Ref } from 'react';
import close from '../assets/figma/close.svg';
import lightning from '../assets/figma/lightning.svg';
import lightBulb from '../assets/figma/light-bulb.svg';
import imageSquare from '../assets/figma/image-square.svg';
import folderOpen from '../assets/figma/folder-open.svg';
import cameraAdd from '../assets/figma/camera-add.svg';
import checkContinue from '../assets/figma/check-continue.svg';
import { BottomTab } from '../components/BottomTab';
import { CameraFeed, type CameraFeedHandle } from '../components/capture/CameraFeed';
import { Button, GlassButton, Icon, inert } from '../components/ui';
import './Camera.css';

export type CameraPhase = 'live' | 'captured';

type CameraProps = {
  phase: CameraPhase;
  /** True while Review rises over it; the surface then unmounts. */
  leaving: boolean;
  /** Reduced motion: a still scene, no hand-held drift or focus hunt. */
  still: boolean;
  feedRef: Ref<CameraFeedHandle>;
  /** Bumped on every shutter press, so the flash replays. */
  shot: number;
  onShutter: () => void;
  onRetake: () => void;
  onContinue: () => void;
  onNotDesigned: (what: string) => void;
};

export function Camera({ phase, leaving, still, feedRef, shot, onShutter, onRetake, onContinue, onNotDesigned }: CameraProps) {
  const live = phase === 'live';
  return (
    <section
      className="camera"
      data-theme="dark"
      data-phase={phase}
      data-leaving={leaving ? 'true' : undefined}
      aria-label={live ? 'Camera' : 'Captured receipt'}
    >
      <div className="camera__feed">
        <CameraFeed ref={feedRef} phase={phase} still={still} />

        <div className="camera__hint" aria-hidden={!live} data-departure="Live scene: not in Figma (user request)">
          <Icon src={lightBulb} size={20} />
          <span className="ts-body-small">Position the document in frame</span>
        </div>

        <div className="camera__controls" {...inert(!live)}>
          <GlassButton variant="lg" icon={imageSquare} iconSize={32} label="Choose from photos" onClick={() => onNotDesigned('Choosing from photos')} />
          <button type="button" className="shutter" aria-label="Take photo" onClick={onShutter}>
            <span className="shutter__core" />
          </button>
          <GlassButton variant="lg" icon={folderOpen} iconSize={32} label="Choose a file" onClick={() => onNotDesigned('Choosing a file')} />
        </div>

        {/* Replays on each shot: keyed by the shot count. Not in Figma — see gaps. */}
        {shot > 0 && <div key={shot} className="camera__flash" aria-hidden="true" data-departure="Not in Figma: shutter flash" />}
      </div>

      <div className="camera__topRow">
        <GlassButton
          icon={close}
          iconSize={24}
          label={live ? 'Close camera' : 'Retake'}
          onClick={live ? () => onNotDesigned('Leaving the camera') : onRetake}
        />
        <GlassButton
          className="camera__flashToggle"
          icon={lightning}
          iconSize={24}
          label="Flash"
          {...inert(!live)}
          onClick={() => onNotDesigned('The flash')}
        />
      </div>

      <BottomTab className="camera__tabBar" inert={!live} onNotDesigned={onNotDesigned} />

      <div className="camera__continueBar" {...inert(live)}>
        <GlassButton
          variant="add"
          className="camera__addPage"
          icon={cameraAdd}
          iconSize={32}
          label="Add another page"
          onClick={() => onNotDesigned('Adding another page')}
        />
        <Button hierarchy="primary" className="camera__continue" trailingIcon={checkContinue} onClick={onContinue}>
          Continue
        </Button>
      </div>
    </section>
  );
}
