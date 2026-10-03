import { useState } from 'react';
import { DeviceFrame, DevToolbar, devFlagEnabled, type DevToolbarItem } from '@playground/shared';
import { SalesPoint } from './screens/SalesPoint';
import { PENDING_ICONS } from './components/AssetSlot';
import './App.css';

type Forced = 'loading' | 'error' | 'empty' | undefined;

export function App() {
  const [forced, setForced] = useState<Forced>(undefined);
  // Bumping this remounts the screen. "Sales point" has to return a CLEAN screen
  // while presenting: clearing the forced state alone leaves whatever search text
  // and category the last demo left behind, so the default screen can come back
  // showing nothing at all.
  const [resetNonce, setResetNonce] = useState(0);

  // Every screen and state reachable in one tap while presenting (root agreement §6).
  const items: DevToolbarItem[] = [
    {
      label: 'Sales point',
      group: 'Screens',
      onSelect: () => { setForced(undefined); setResetNonce((n) => n + 1); },
    },
    { label: 'Loading (skeleton)', group: 'States', onSelect: () => setForced('loading') },
    { label: 'Empty', group: 'States', onSelect: () => setForced('empty') },
    { label: 'Error', group: 'States', onSelect: () => setForced('error') },
    {
      label: `${PENDING_ICONS.length} icons pending`,
      group: 'Assets',
      onSelect: () => console.info('Awaiting from Figma:', PENDING_ICONS.join(', ')),
    },
  ];

  return (
    <>
      <DeviceFrame>
        <SalesPoint key={resetNonce} forceState={forced} />
      </DeviceFrame>
      <DevToolbar items={items} enabled={devFlagEnabled()} />
    </>
  );
}
