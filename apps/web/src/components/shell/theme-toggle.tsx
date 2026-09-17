"use client";

import { Monitor, Moon, Sun } from "lucide-react";
import { useEffect, useSyncExternalStore } from "react";
import { ICON_STROKE } from "./nav-items";

type ThemePreference = "light" | "dark" | "system";

const STORAGE_KEY = "compliance-os-theme";
const CHANGE_EVENT = "compliance-os-theme-change";

const OPTIONS: Array<{ value: ThemePreference; label: string; Icon: typeof Sun }> = [
  { value: "light", label: "Claro", Icon: Sun },
  { value: "dark", label: "Escuro", Icon: Moon },
  { value: "system", label: "Sistema", Icon: Monitor },
];

/** Browser chrome tint (brand §10 base surfaces). The layout renders one meta per scheme. */
const THEME_COLOR = { light: "#f4f4f0", dark: "#0b0d0f" } as const;

function readPreference(): ThemePreference {
  let stored: string | null = null;
  try {
    stored = localStorage.getItem(STORAGE_KEY);
  } catch {
    // Storage may be blocked (private mode, policy); the choice then lasts for the page only.
  }
  return stored === "light" || stored === "dark" || stored === "system" ? stored : "system";
}

function applyTheme(preference: ThemePreference) {
  const dark =
    preference === "dark" ||
    (preference === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);
  document.documentElement.dataset.theme = dark ? "dark" : "light";
  document.documentElement.dataset.themePreference = preference;
  // An explicit choice overrides both metas; "system" hands them back to their media queries.
  for (const meta of document.querySelectorAll<HTMLMetaElement>('meta[name="theme-color"]')) {
    const own = meta.media.includes("dark") ? THEME_COLOR.dark : THEME_COLOR.light;
    meta.content = preference === "system" ? own : THEME_COLOR[dark ? "dark" : "light"];
  }
}

/*
 * One store for every ThemeToggle on the page (sidebar footer and mobile drawer): the preference
 * lives in localStorage, mirrored on <html data-theme-preference> by the layout's bootstrap script.
 * Changes propagate through a window event (same tab) and the storage event (other tabs).
 */
function subscribe(onChange: () => void) {
  window.addEventListener(CHANGE_EVENT, onChange);
  window.addEventListener("storage", onChange);
  return () => {
    window.removeEventListener(CHANGE_EVENT, onChange);
    window.removeEventListener("storage", onChange);
  };
}

function getSnapshot(): ThemePreference {
  const current = document.documentElement.dataset.themePreference;
  return current === "light" || current === "dark" || current === "system" ? current : readPreference();
}

function getServerSnapshot(): ThemePreference {
  return "system";
}

function choose(value: ThemePreference) {
  try {
    localStorage.setItem(STORAGE_KEY, value);
  } catch {
    // See readPreference.
  }
  applyTheme(value);
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

/** Persisted Light / Dark / System control. The bootstrap script applies the stored value before paint. */
export function ThemeToggle({ labels = false }: { labels?: boolean }) {
  const preference = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  useEffect(() => {
    // Another tab changed the choice, or the OS preference moved while on "system".
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const sync = () => applyTheme(readPreference());
    media.addEventListener("change", sync);
    window.addEventListener("storage", sync);
    return () => {
      media.removeEventListener("change", sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  return (
    <fieldset className="flex items-center self-start rounded-md border border-border bg-surface-base p-0.5">
      <legend className="sr-only">Tema da interface</legend>
      {OPTIONS.map(({ value, label, Icon }) => (
        <button
          key={value}
          type="button"
          onClick={() => choose(value)}
          aria-pressed={preference === value}
          aria-label={`Usar tema ${label.toLowerCase()}`}
          title={label}
          className={`flex h-8 items-center justify-center gap-1.5 rounded-sm transition-colors duration-(--duration-fast) ${labels ? "px-2" : "w-9"} ${
            preference === value
              ? "bg-surface-elevated text-text-primary shadow-sm"
              : "text-text-secondary hover:bg-surface-hover hover:text-text-primary"
          }`}
        >
          <Icon aria-hidden size={16} strokeWidth={ICON_STROKE} />
          <span className={labels ? "text-caption font-medium" : "sr-only"}>{label}</span>
        </button>
      ))}
    </fieldset>
  );
}
