import { useRef } from 'react';

/**
 * Text that ticks into place when its value changes — a price, a total, a count.
 * Re-keying on the value restarts the CSS animation (motion.css); the first render
 * is marked so a screen does not animate every number as it appears.
 */
export function AnimatedText({ value, className }: { value: string; className?: string }) {
  const first = useRef(true);
  const isFirst = first.current;
  first.current = false;
  return (
    <span key={value} className={className ? `animatedText ${className}` : 'animatedText'} data-first={isFirst}>
      {value}
    </span>
  );
}
