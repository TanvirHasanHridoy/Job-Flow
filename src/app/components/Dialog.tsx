'use client';

import React, { useEffect, useRef } from 'react';

/**
 * Shared modal shell. Renders the overlay element itself (pass the overlay's
 * classes via `className`) and adds what every hand-rolled modal was missing:
 *  - role="dialog" + aria-modal
 *  - Esc closes the top-most open dialog only
 *  - focus moves into the dialog on open, is trapped with Tab, and is restored on close
 */

// Stack of open dialogs so Esc only closes the top-most one.
const openStack: symbol[] = [];

const FOCUSABLE =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]):not([type="hidden"]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

interface DialogProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'role'> {
  onClose: () => void;
  /** id of the element that names the dialog */
  labelledBy?: string;
  /** Accessible name when there is no visible title element */
  label?: string;
  /** Set false to keep the dialog open on Esc (e.g. while a request is running). */
  closeOnEsc?: boolean;
  children: React.ReactNode;
}

export default function Dialog({
  onClose,
  labelledBy,
  label,
  closeOnEsc = true,
  className,
  children,
  ...rest
}: DialogProps) {
  const ref = useRef<HTMLDivElement>(null);
  const onCloseRef = useRef(onClose);
  const closeOnEscRef = useRef(closeOnEsc);

  useEffect(() => {
    onCloseRef.current = onClose;
    closeOnEscRef.current = closeOnEsc;
  });

  useEffect(() => {
    const id = Symbol('dialog');
    openStack.push(id);
    const previouslyFocused = document.activeElement as HTMLElement | null;

    // Move focus into the dialog unless something inside already has it (autoFocus).
    const node = ref.current;
    if (node && !node.contains(document.activeElement)) {
      const first = node.querySelector<HTMLElement>(FOCUSABLE);
      (first ?? node).focus({ preventScroll: true });
    }

    const onKeyDown = (e: KeyboardEvent) => {
      if (openStack[openStack.length - 1] !== id) return;
      if (e.key === 'Escape') {
        if (!closeOnEscRef.current) return;
        e.stopPropagation();
        onCloseRef.current();
        return;
      }
      if (e.key === 'Tab' && ref.current) {
        const items = Array.from(ref.current.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
          el => el.offsetParent !== null || el === document.activeElement
        );
        if (items.length === 0) return;
        const first = items[0];
        const last = items[items.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };

    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      const idx = openStack.indexOf(id);
      if (idx !== -1) openStack.splice(idx, 1);
      if (previouslyFocused && document.contains(previouslyFocused)) {
        previouslyFocused.focus({ preventScroll: true });
      }
    };
  }, []);

  return (
    <div
      ref={ref}
      role="dialog"
      aria-modal="true"
      aria-labelledby={labelledBy}
      aria-label={labelledBy ? undefined : label}
      tabIndex={-1}
      className={`outline-none ${className ?? ''}`}
      {...rest}
    >
      {children}
    </div>
  );
}
