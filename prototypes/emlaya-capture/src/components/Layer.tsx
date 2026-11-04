import type { ReactNode } from 'react';
import { usePresence } from '../state/usePresence';

/** A screen layer that cross-fades in and out — exits included (CLAUDE.md §5). */
export function Layer({ open, exitMs, className = '', children }: { open: boolean; exitMs: number; className?: string; children: ReactNode }) {
  const { mounted, state } = usePresence(open, exitMs);
  if (!mounted) return null;
  return <div className={`layer ${className}`} data-state={state}>{children}</div>;
}
