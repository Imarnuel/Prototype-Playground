import { useState } from 'react';
import {
  DeviceFrame,
  DevToolbar,
  IOS,
  devFlagEnabled,
  type DevToolbarItem,
} from '@playground/shared';
import { BRANDS, CATEGORIES, PRODUCTS, formatPrice, fullName } from './data/catalogue';
import './App.css';

/**
 * No Figma file is attached to this study yet, so there are no screens.
 *
 * This is deliberately a catalogue readout rather than invented POS UI — root
 * agreement §40: build a minimal honest placeholder, don't invent a feature set.
 * It earns its place by proving the data layer is wired and consumable from the
 * app, and by making the seeded states visible before any screen exists.
 *
 * Replace the body once frames exist. Keep the DeviceFrame/DevToolbar wiring.
 */
type View = 'summary' | 'states';

const withoutPhoto = PRODUCTS.filter((p) => p.image === null);
const outOfStock = PRODUCTS.filter((p) => p.stock === 0);
const discounted = PRODUCTS.filter((p) => p.wasPriceMinor !== undefined);
const longest = PRODUCTS.reduce((a, b) => (b.name.length > a.name.length ? b : a));
const cheapest = PRODUCTS.reduce((a, b) => (b.priceMinor < a.priceMinor ? b : a));
const dearest = PRODUCTS.reduce((a, b) => (b.priceMinor > a.priceMinor ? b : a));

export function App() {
  const [view, setView] = useState<View>('summary');

  const items: DevToolbarItem[] = [
    { label: 'Catalogue summary', group: 'Screens', onSelect: () => setView('summary') },
    { label: 'Seeded states', group: 'States', onSelect: () => setView('states') },
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
              Freshvale
            </h1>
          </header>

          <main className="screen__body">
            <p className="notice">
              No design attached. Catalogue is seeded and verified; screens come once a
              Figma file is recorded in this study&rsquo;s CLAUDE.md.
            </p>

            {view === 'summary' ? (
              <dl className="readout">
                <div><dt>Products</dt><dd>{PRODUCTS.length}</dd></div>
                <div><dt>Categories</dt><dd>{CATEGORIES.length}</dd></div>
                <div><dt>Price range</dt><dd>{formatPrice(cheapest.priceMinor)} – {formatPrice(dearest.priceMinor)}</dd></div>
                <div><dt>Brands</dt><dd>{BRANDS.length}</dd></div>
                <div><dt>Photos needed</dt><dd>{PRODUCTS.length - withoutPhoto.length}</dd></div>
                {CATEGORIES.map((c) => (
                  <div key={c.name}><dt>{c.name}</dt><dd>{c.count}</dd></div>
                ))}
              </dl>
            ) : (
              <dl className="readout">
                <div><dt>No photo</dt><dd>{withoutPhoto.map(fullName).join(', ')}</dd></div>
                <div><dt>Out of stock</dt><dd>{outOfStock.map(fullName).join(', ')}</dd></div>
                <div><dt>Discounted</dt><dd>{discounted.map((p) => `${p.name} ${formatPrice(p.priceMinor)}`).join(', ')}</dd></div>
                <div><dt>Longest name</dt><dd>{longest.name.length} chars — {longest.name}</dd></div>
              </dl>
            )}
          </main>
        </div>
      </DeviceFrame>

      <DevToolbar items={items} enabled={devFlagEnabled()} />
    </>
  );
}
