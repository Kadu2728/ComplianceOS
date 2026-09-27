"use client";

import { useEffect } from "react";

/** Search and bell never stay open together (visual-v2 §5.10): opening one closes the other. */
const EVENT = "cos:popover-open";

export function announceOpen(name: string) {
  window.dispatchEvent(new CustomEvent(EVENT, { detail: name }));
}

export function useCloseOnOtherOpen(name: string, close: () => void) {
  useEffect(() => {
    const handler = (e: Event) => {
      if ((e as CustomEvent<string>).detail !== name) close();
    };
    window.addEventListener(EVENT, handler);
    return () => window.removeEventListener(EVENT, handler);
  }, [name, close]);
}

/** True below 768px, where search and bell become full-screen dialogs. */
export function isPhone(): boolean {
  return window.matchMedia("(width < 48rem)").matches;
}
