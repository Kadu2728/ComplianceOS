"use client";

import { useEffect } from "react";

/**
 * Keeps the 15-minute access cookie alive while the tab is open by rotating the refresh
 * token (decision D3). On 401 the session is gone (expired, revoked or reuse-detected):
 * send the user to the login page instead of letting the next navigation fail.
 */
const INTERVAL_MS = 10 * 60 * 1000;

export function SessionRefresher() {
  useEffect(() => {
    let cancelled = false;
    const refresh = async () => {
      try {
        const res = await fetch("/api/v1/auth/refresh", { method: "POST", credentials: "same-origin" });
        if (!cancelled && res.status === 401) window.location.assign("/entrar");
      } catch {
        // Offline or server restarting: keep the page usable; the next tick retries.
      }
    };
    const id = window.setInterval(refresh, INTERVAL_MS);
    const onVisible = () => {
      if (document.visibilityState === "visible") void refresh();
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      cancelled = true;
      window.clearInterval(id);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, []);
  return null;
}
