import { useEffect, useState, type CSSProperties } from 'react';
import {
  BODY, DURATION, DeviceFrame, DevToolbar, EASING, PRESS_SCALE, devFlagEnabled, duration, useReducedMotion,
  type DevToolbarItem,
} from '@playground/shared';
import { EXTRACTION_PACE, getExtractionPace, setExtractionPace, type ExtractionPace } from './api/extract';
import { GLOW_PALETTES, type GlowPalette } from './components/GlowShader';
import { ExtractionScreen, type Variant } from './screens/ExtractionScreen';
import { useExtractionRun, type Pinned } from './state/run';
import { SHIMMER, VEIL_BLUR } from './timing';
import { color, font, shadow } from './tokens';
import './App.css';
import './loader.css';

type Show = 'both' | Variant;

const CAPTION: Record<Variant, { title: string; note: string }> = {
  a: { title: 'A — After the reference', note: 'Blur, rotating lines, shader glow, bloom to finish' },
  b: { title: 'B — Calm', note: 'Blur, rotating lines with an icon each, no shader' },
};

/** `?show=a` / `?show=b` presents one prototype alone, e.g. on a phone-sized window. */
function initialShow(): Show {
  const v = new URLSearchParams(window.location.search).get('show');
  return v === 'a' || v === 'b' ? v : 'both';
}

/** Fit the devices to the window's height (and width, side by side). Never above 1. */
function useFitScale(count: number): number {
  const compute = () => {
    const byHeight = (window.innerHeight - 120) / BODY.height;
    const byWidth = (window.innerWidth - 48 - (count - 1) * 48) / (BODY.width * count);
    return Math.max(0.4, Math.min(1, byHeight, byWidth));
  };
  const [scale, setScale] = useState(compute);
  useEffect(() => {
    const on = () => setScale(compute());
    on();
    window.addEventListener('resize', on);
    return () => window.removeEventListener('resize', on);
  }, [count]);
  return scale;
}

export function App() {
  const reducedMotion = useReducedMotion();
  const [pinned, setPinned] = useState<Pinned>(null);
  const [pace, setPace] = useState<ExtractionPace>(getExtractionPace());
  const [palette, setPalette] = useState<GlowPalette>('reference');
  const [show, setShow] = useState<Show>(initialShow);
  const { run, replay } = useExtractionRun(pinned);
  const variants: Variant[] = show === 'both' ? ['a', 'b'] : [show];
  const scale = useFitScale(variants.length);

  const restart = (next: Pinned) => {
    setPinned(next);
    replay();
  };

  // Motion and colour tokens as custom properties, so CSS reuses the same set.
  const vars = {
    '--dur-instant': `${duration(DURATION.instant, reducedMotion)}ms`,
    '--dur-fast': `${duration(DURATION.fast, reducedMotion)}ms`,
    '--dur-base': `${duration(DURATION.base, reducedMotion)}ms`,
    '--dur-slow': `${duration(DURATION.slow, reducedMotion)}ms`,
    '--dur-launch': `${duration(DURATION.launch, reducedMotion)}ms`,
    '--ease-out': EASING.out,
    '--ease-in': EASING.in,
    '--ease-inout': EASING.inOut,
    '--ease-launch': EASING.launch,
    '--press-scale': String(PRESS_SCALE),
    '--shimmer-delay': `${SHIMMER.delay}ms`,
    '--shimmer-cycle': `${SHIMMER.cycle}ms`,
    '--veil-blur': `${VEIL_BLUR}px`,
    '--surface-default': color.surfaceDefault,
    '--surface-secondary': color.surfaceSecondary,
    '--surface-overlay-default': color.surfaceOverlayDefault,
    '--container-inverse': color.containerInverse,
    '--container-neutral-subtle': color.containerNeutralSubtle,
    '--container-neutral': color.containerNeutral,
    '--container-brand': color.containerBrand,
    '--container-brand-bold': color.containerBrandBold,
    '--border-subtle': color.borderSubtle,
    '--border-brand': color.borderBrand,
    '--button-highlight': color.buttonHighlight,
    '--text-default': color.textDefault,
    '--text-secondary': color.textSecondary,
    '--text-subtle': color.textSubtle,
    '--icon-brand': color.iconBrand,
    '--shimmer-band': 'rgba(82, 74, 55, 0.16)', // textSecondary at 16%: the reference's near-white band
    '--shadow-card': shadow.card,
    '--shadow-button-icon': shadow.buttonIcon,
    '--shadow-xs': shadow.xs,
    '--shadow-pill': shadow.pill,
    '--font-body': font.body,
    '--font-heading': font.heading,
  } as CSSProperties;

  const items: DevToolbarItem[] = [
    { label: 'Replay', group: 'Run', onSelect: () => restart(null) },
    { label: 'Hold on the loader', group: 'Run', onSelect: () => restart('extracting') },
    { label: 'Jump to review details', group: 'Run', onSelect: () => restart('ready') },
    { label: 'Unable to process', group: 'Run', onSelect: () => restart('failed') },
    ...(Object.keys(EXTRACTION_PACE) as ExtractionPace[])
      .filter((p) => p !== 'hold')
      .map((p) => ({
        label: `${p[0].toUpperCase()}${p.slice(1)} (${(EXTRACTION_PACE[p] / 1000).toFixed(1)}s)`,
        group: 'Extraction pace',
        pressed: pace === p,
        onSelect: () => {
          setExtractionPace(p);
          setPace(p);
          restart(null);
        },
      })),
    ...(Object.keys(GLOW_PALETTES) as GlowPalette[]).map((p) => ({
      label: p === 'reference' ? 'Reference palette' : 'Emlaya amber',
      group: 'Glow (A)',
      pressed: palette === p,
      onSelect: () => setPalette(p),
    })),
    { label: 'Both side by side', group: 'Show', pressed: show === 'both', onSelect: () => setShow('both') },
    { label: 'A only', group: 'Show', pressed: show === 'a', onSelect: () => setShow('a') },
    { label: 'B only', group: 'Show', pressed: show === 'b', onSelect: () => setShow('b') },
  ];

  return (
    <>
      <div className="stage" style={vars} data-show={show}>
        {variants.map((v) => (
          <figure key={v} className="variant">
            <figcaption className="variant__caption">
              <span className="variant__title">{CAPTION[v].title}</span>
              <span className="variant__note">{CAPTION[v].note}</span>
            </figcaption>
            <div className="variant__device" style={{ width: BODY.width * scale, height: BODY.height * scale }}>
              <DeviceFrame scale={scale}>
                <ExtractionScreen
                  variant={v}
                  run={run}
                  palette={palette}
                  reducedMotion={reducedMotion}
                  onBack={() => restart(null)}
                  onRetake={() => restart(null)}
                />
              </DeviceFrame>
            </div>
          </figure>
        ))}
      </div>
      <DevToolbar items={items} enabled={devFlagEnabled()} />
    </>
  );
}
