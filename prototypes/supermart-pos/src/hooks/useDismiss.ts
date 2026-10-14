import { useEffect, type RefObject } from 'react';

/**
 * A dropdown's dismissal, shared by every menu built on the file's Dropdown
 * (`88:16379`): a press outside both the menu and the control that opened it closes
 * it, and Escape closes it and hands focus back to that control. Captured, so a
 * sheet's own Escape handler underneath never sees the key.
 */
export function useDismiss(open: boolean, menu: RefObject<HTMLElement>, anchor: RefObject<HTMLElement>, onClose: () => void) {
  useEffect(() => {
    if (!open) return undefined;
    const outside = (e: PointerEvent) => {
      const t = e.target as Node;
      if (!menu.current?.contains(t) && !anchor.current?.contains(t)) onClose();
    };
    const key = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      e.stopPropagation();
      onClose();
      anchor.current?.focus({ preventScroll: true });
    };
    document.addEventListener('pointerdown', outside, true);
    document.addEventListener('keydown', key, true);
    return () => {
      document.removeEventListener('pointerdown', outside, true);
      document.removeEventListener('keydown', key, true);
    };
  }, [open, menu, anchor, onClose]);
}
