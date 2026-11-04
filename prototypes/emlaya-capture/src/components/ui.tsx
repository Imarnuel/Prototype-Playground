/**
 * Emlaya Design library components used in this flow, rebuilt from their Figma
 * definitions (component ladder level b — see CORRECTIONS.md, "Components"). Variant
 * names and props follow the Figma component properties, so an instance here reads
 * like the instance in the file.
 */
import type { ButtonHTMLAttributes, CSSProperties, ReactNode } from 'react';
import './ui.css';

/**
 * `inert` for a phase that is on screen but not live (React 18 has no typed prop for
 * it). Inert content takes no focus, no clicks, and leaves the accessibility tree.
 */
export function inert(on: boolean): Record<string, string> {
  return on ? { inert: '' } : {};
}

export type IconSize = 12 | 16 | 20 | 24 | 28 | 32;

/** An exported Figma icon at its instance size. Decorative unless given a label. */
export function Icon({ src, size, className = '' }: { src: string; size: IconSize; className?: string }) {
  return <img className={`icon icon--${size} ${className}`} src={src} alt="" draggable={false} />;
}

type IconButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  icon: string;
  iconSize: IconSize;
  /** Required: an icon-only control has no other accessible name. */
  label: string;
};

/**
 * The camera's translucent round controls (9502:21712 close, 21714 flash, 21696 gallery,
 * 21700 files, 21724 add page). Not a library component in the file — raw frames —
 * so `variant` names the two sizes that recur: 40 (`sm`) and 56 (`lg`).
 */
export function GlassButton({ icon, iconSize, label, className = '', variant = 'sm', ...rest }: IconButtonProps & { variant?: 'sm' | 'lg' | 'add' }) {
  return (
    <button type="button" aria-label={label} className={`glassButton glassButton--${variant} ${className}`} {...rest}>
      <Icon src={icon} size={iconSize} />
    </button>
  );
}

/**
 * "Button Icon" (4018:816), Hierarchy=inverse, Square=Circle. The file places two
 * Size=default instances at different sizes (40 and 44, 9502:21681/21682); each is
 * kept at its instance size via `size`.
 */
export function HeaderButton({ icon, label, size = 40, flat = false, className = '', ...rest }: Omit<IconButtonProps, 'iconSize'> & { size?: 40 | 44; flat?: boolean }) {
  return (
    <button
      type="button"
      aria-label={label}
      className={`headerButton headerButton--${size} ${flat ? 'headerButton--flat' : ''} ${className}`}
      {...rest}
    >
      <Icon src={icon} size={24} />
    </button>
  );
}

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  /** "Button" (4018:505) Hierarchy. */
  hierarchy: 'primary' | 'secondary';
  children: ReactNode;
  trailingIcon?: string;
  /** Docked buttons are 46 tall (I9502:21685;4018:1211); the rest 48. */
  docked?: boolean;
};

/** "Button" (4018:505), Size=Large, State=Default, Tone=Default. */
export function Button({ hierarchy, children, trailingIcon, docked = false, className = '', ...rest }: ButtonProps) {
  return (
    <button
      type="button"
      className={`button button--${hierarchy} ${docked ? 'button--docked' : ''} ${className}`}
      {...rest}
    >
      <span className="button__label ts-label-bold-base">{children}</span>
      {trailingIcon && <Icon src={trailingIcon} size={20} />}
    </button>
  );
}

type TextFieldProps = {
  label: string;
  value: string;
  /** "Text field" (4064:685) Size=large binds "Large input"; default binds Body/Large. */
  size: 'large' | 'default';
  rightIcon?: string;
  onChange?: (value: string) => void;
  inputMode?: 'text' | 'numeric';
  /** Read-only fields open a picker that is not designed in this flow. */
  onActivate?: () => void;
  className?: string;
  style?: CSSProperties;
};

/** "Text field" (4064:685), Filled=yes, State=default. */
export function TextField({ label, value, size, rightIcon, onChange, inputMode = 'text', onActivate, className = '', style }: TextFieldProps) {
  const valueClass = size === 'large' ? 'ts-large-input' : 'ts-body-large';
  return (
    <label className={`textField textField--${size} ${className}`} style={style}>
      <span className="textField__text">
        <span className="textField__label ts-label-xsmall">{label}</span>
        {onChange ? (
          <input
            className={`textField__value ${valueClass}`}
            value={value}
            inputMode={inputMode}
            onChange={(e) => onChange(e.target.value)}
          />
        ) : (
          <button type="button" className={`textField__value textField__value--button ${valueClass}`} onClick={onActivate}>
            {value}
          </button>
        )}
      </span>
      {rightIcon && <Icon src={rightIcon} size={20} />}
    </label>
  );
}

/**
 * "tag-pill" — two styles in this flow: a tag (9502:21534, brand) and an @mention
 * (9502:21559, neutral). The trailing icon removes the pill.
 */
export function Pill({ text, tone, removeIcon, removeIconSize, onRemove }: {
  text: string;
  tone: 'tag' | 'mention';
  removeIcon: string;
  removeIconSize: 12 | 16;
  onRemove: () => void;
}) {
  return (
    <span className={`pill pill--${tone}`}>
      <span className="pill__text ts-body-base">{text}</span>
      <button type="button" className="pill__remove" aria-label={`Remove ${text}`} onClick={onRemove}>
        <Icon src={removeIcon} size={removeIconSize} />
      </button>
    </span>
  );
}
