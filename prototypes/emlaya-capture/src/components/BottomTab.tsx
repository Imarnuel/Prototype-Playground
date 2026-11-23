/**
 * "Bottom tab" (4071:1317), Active=capture — instance 9502:21688.
 *
 * Its destinations are not in this flow, so each tab answers with the notice. Names
 * follow the PRD's vocabulary where the layer names drift: the "Notes" item is a
 * Shopping Note list (layer "Bag", glyph ListChecks); "profile" draws a Bell. Both
 * mismatches are logged in CORRECTIONS.md.
 */
import chartBar from '../assets/figma/tab-chart-bar.svg';
import receipt from '../assets/figma/tab-receipt.svg';
import plus from '../assets/figma/tab-plus.svg';
import listChecks from '../assets/figma/tab-list-checks.svg';
import bell from '../assets/figma/tab-bell.svg';
import { Icon, inert as inertProps } from './ui';
import './BottomTab.css';

export function BottomTab({ className = '', inert, onNotDesigned }: {
  className?: string;
  inert: boolean;
  onNotDesigned: (what: string) => void;
}) {
  return (
    <nav className={`bottomTab ${className}`} aria-label="Main" {...inertProps(inert)}>
      <div className="bottomTab__bar">
        <button type="button" className="tabItem" aria-label="Insights" onClick={() => onNotDesigned('Insights')}>
          <Icon src={chartBar} size={28} />
        </button>
        <button type="button" className="tabItem" aria-label="Receipts" onClick={() => onNotDesigned('Receipts')}>
          <Icon src={receipt} size={28} />
        </button>
        <span className="tabItem__captureSlot">
          <button type="button" className="tabItem tabItem--capture" aria-label="Capture" aria-current="page">
            <Icon src={plus} size={20} />
          </button>
        </span>
        <button type="button" className="tabItem" aria-label="Shopping Notes" onClick={() => onNotDesigned('Shopping Notes')}>
          <Icon src={listChecks} size={28} />
        </button>
        <button type="button" className="tabItem" aria-label="Profile" onClick={() => onNotDesigned('Profile')}>
          <Icon src={bell} size={28} />
        </button>
      </div>
    </nav>
  );
}
