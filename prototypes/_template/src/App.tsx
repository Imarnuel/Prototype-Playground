import { useState } from 'react';
import {
  DeviceFrame,
  DevToolbar,
  IOS,
  devFlagEnabled,
  type DevToolbarItem,
} from '@playground/shared';
import './App.css';

/**
 * Starting point for a case study, and the harness the device frame's geometry
 * is measured against.
 *
 * There is no design behind this screen. It is deliberately a nav bar and a
 * placeholder body rather than invented UI — CLAUDE.md:40: build a minimal
 * honest placeholder, don't invent a feature set. Replace the body when a Figma
 * frame exists; keep the DeviceFrame/DevToolbar wiring.
 */
type Screen = 'default' | 'empty';

export function App() {
  const [screen, setScreen] = useState<Screen>('default');

  // Every screen and state goes in the toolbar (CLAUDE.md:59).
  const items: DevToolbarItem[] = [
    { label: 'Default', group: 'Screens', onSelect: () => setScreen('default') },
    { label: 'Empty', group: 'States', onSelect: () => setScreen('empty') },
  ];

  return (
    <>
      <DeviceFrame>
        <div className="screen">
          <header className="navbar">
            <h1
              className="navbar__title"
              style={{ fontSize: IOS.navTitleSize, fontWeight: IOS.navTitleWeight }}
            >
              Template
            </h1>
          </header>

          <main className="screen__body">
            {screen === 'default' ? (
              <p className="placeholder">
                No design loaded. Fill in the Project specifics block in CLAUDE.md, then
                build this screen from the frame's design context.
              </p>
            ) : (
              <p className="placeholder placeholder--empty">Nothing here yet.</p>
            )}
          </main>
        </div>
      </DeviceFrame>

      <DevToolbar items={items} enabled={devFlagEnabled()} />
    </>
  );
}
