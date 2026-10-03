import type { CSSProperties, ReactNode } from 'react';
import {
  BEZEL,
  BODY,
  BODY_RADIUS,
  DYNAMIC_ISLAND,
  SAFE_AREA,
  SCREEN,
  SCREEN_RADIUS,
} from './device';

type DeviceFrameProps = {
  children: ReactNode;
  /**
   * Scales the whole device uniformly. The screen stays 393x852 in CSS pixels
   * so every measurement inside matches the Figma frame 1:1 — only the outer
   * transform changes. Measure the screen, not the scaled box.
   */
  scale?: number;
  /** Hidden for a frame-less screenshot that should match a Figma export exactly. */
  showBody?: boolean;
};

/**
 * iPhone 15 Pro shell. A Figma frame is the screen, not the device (CLAUDE.md:128)
 * — the body, bezel and Dynamic Island are built here, not exported from a design.
 */
export function DeviceFrame({ children, scale = 1, showBody = true }: DeviceFrameProps) {
  // Custom properties only. Setting --vars does not create a stacking context,
  // unlike an inline z-index or translate (CLAUDE.md:117).
  const vars = {
    '--device-body-w': `${BODY.width}px`,
    '--device-body-h': `${BODY.height}px`,
    '--device-body-radius': `${BODY_RADIUS}px`,
    '--device-bezel': `${BEZEL}px`,
    '--device-screen-w': `${SCREEN.width}px`,
    '--device-screen-h': `${SCREEN.height}px`,
    '--device-screen-radius': `${SCREEN_RADIUS}px`,
    '--device-island-w': `${DYNAMIC_ISLAND.width}px`,
    '--device-island-h': `${DYNAMIC_ISLAND.height}px`,
    '--device-island-top': `${DYNAMIC_ISLAND.top}px`,
    '--device-island-radius': `${DYNAMIC_ISLAND.radius}px`,
    '--device-safe-top': `${SAFE_AREA.top}px`,
    '--device-safe-bottom': `${SAFE_AREA.bottom}px`,
    '--device-scale': String(scale),
  } as CSSProperties;

  return (
    <div className="device" data-body={showBody ? 'on' : 'off'} style={vars}>
      <div className="device__body">
        <div className="device__screen" data-testid="device-screen">
          {children}
          {/* The island lives inside the screen, not the body: it is a display
              feature, and CLAUDE.md:136 specifies its 11pt offset against the
              screen. Positioned against the body it resolves against the body's
              padding box and lands one bezel (16.6px) too high, on the bezel
              itself. Painting order is DOM order, so it sits above `children`
              without an inline z-index (CLAUDE.md:117). */}
          {showBody && <div className="device__island" data-testid="device-island" aria-hidden="true" />}
        </div>
      </div>
    </div>
  );
}
