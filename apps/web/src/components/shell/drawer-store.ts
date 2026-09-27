"use client";

import { useSyncExternalStore } from "react";

/**
 * One navigation drawer, several triggers (tablet menu button, the tab bar's "Mais"): the drawer
 * owns the <dialog>, the triggers only ask it to open and mirror its state for aria-expanded.
 */
let open = false;
const listeners = new Set<() => void>();
const OPEN_EVENT = "cos:open-drawer";

export function setDrawerOpen(value: boolean) {
  open = value;
  for (const l of listeners) l();
}

export function requestDrawer() {
  window.dispatchEvent(new Event(OPEN_EVENT));
}

export function onDrawerRequest(handler: () => void): () => void {
  window.addEventListener(OPEN_EVENT, handler);
  return () => window.removeEventListener(OPEN_EVENT, handler);
}

export function useDrawerOpen(): boolean {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    () => open,
    () => false,
  );
}
