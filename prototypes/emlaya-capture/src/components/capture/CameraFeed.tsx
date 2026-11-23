/**
 * The live feed under the camera's controls: a canvas the CaptureScene paints. Live in
 * the `live` phase; frozen on the shot in `captured`; refocuses on Retake.
 */
import { forwardRef, useEffect, useImperativeHandle, useRef } from 'react';
import { CaptureScene } from './CaptureScene';
import { printedLines } from '../../data/receiptDocument';
import { tokenMs, tokenNumber, tokenString } from '../../tokens/read';

export type CameraFeedHandle = {
  /** The scanned document at the moment of the shot. */
  capture: () => { src: string; bytes: number } | null;
};

/** The receipt's typeface must be loaded before the paper is painted, or it prints in a fallback. */
export async function captureFontsReady(): Promise<void> {
  const family = tokenString('--capture-font');
  const size = tokenNumber('--capture-paper-text');
  await Promise.all([document.fonts.load(`500 ${size}px ${family}`), document.fonts.load(`700 ${size}px ${family}`)]);
}

export const CameraFeed = forwardRef<CameraFeedHandle, { phase: 'live' | 'captured'; still: boolean }>(
  function CameraFeed({ phase, still }, ref) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const sceneRef = useRef<CaptureScene | null>(null);
    const phaseRef = useRef(phase);
    phaseRef.current = phase;

    useImperativeHandle(ref, () => ({ capture: () => sceneRef.current?.documentImage() ?? null }), []);

    useEffect(() => {
      let cancelled = false;
      let observer: ResizeObserver | null = null;
      // Painted after the frame the camera mounts on, so a transition running then (the
      // celebration's exit, on Done) is not held up by the scene's setup.
      const afterPaint = () => new Promise<void>((r) => requestAnimationFrame(() => setTimeout(r, tokenMs('--motion-duration-fast'))));
      Promise.all([captureFontsReady(), afterPaint()]).then(() => {
        if (cancelled || !canvasRef.current) return;
        const scene = new CaptureScene(canvasRef.current, printedLines(), still);
        sceneRef.current = scene;
        scene.resize();
        if (phaseRef.current === 'live') scene.start();
        else scene.freeze();
        observer = new ResizeObserver(() => scene.resize());
        observer.observe(canvasRef.current);
      });
      return () => {
        cancelled = true;
        observer?.disconnect();
        sceneRef.current?.stop();
        sceneRef.current = null;
      };
    }, [still]);

    useEffect(() => {
      const scene = sceneRef.current;
      if (!scene) return;
      if (phase === 'captured') scene.freeze();
      else scene.resume();
    }, [phase]);

    return <canvas ref={canvasRef} className="camera__photo" role="img" aria-label={phase === 'live' ? 'Camera view' : 'The captured receipt'} />;
  },
);
