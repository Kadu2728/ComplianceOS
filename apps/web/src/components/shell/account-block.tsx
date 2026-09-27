import { Settings } from "lucide-react";
import Link from "next/link";
import { ROLE_LABEL } from "@/lib/domain/labels";
import { LogoutButton } from "./logout-button";
import { ICON_STROKE } from "./nav-items";
import { ThemeToggle } from "./theme-toggle";

export function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  const first = parts[0]?.[0] ?? "";
  const last = parts.length > 1 ? (parts[parts.length - 1]?.[0] ?? "") : "";
  return (first + last).toUpperCase() || "?";
}

/** Initials avatar (no photos in the product, visual-v2 §3.3). Decorative: the name is always next to it. */
export function Avatar({ name }: { name: string }) {
  return (
    <span
      aria-hidden
      className="flex size-8 shrink-0 items-center justify-center rounded-pill bg-primary-tint text-caption font-semibold text-primary-text"
    >
      {initials(name)}
    </span>
  );
}

/**
 * Account block pinned to the bottom of the shell (visual-v2 §3.2). `compact` (sidebar ≥ 1024):
 * theme + exit only — identity lives in the header user block and Configurações in the nav, so
 * nothing shows twice. `full` (drawer): identity, Configurações, theme and exit, as in v1.
 */
export function AccountBlock({
  userName,
  role,
  onNavigate,
  variant = "full",
}: {
  userName: string;
  role: string;
  onNavigate?: () => void;
  variant?: "full" | "compact";
}) {
  if (variant === "compact") {
    return (
      <div className="flex items-center justify-between gap-2 border-t border-border p-3">
        {/* Icons only: three labelled options + exit do not fit in 240px (labels stay as sr-only/title). */}
        <ThemeToggle />
        <LogoutButton compact />
      </div>
    );
  }
  return (
    <div className="flex flex-col gap-2 border-t border-border p-3">
      <div className="flex items-center gap-3 px-1">
        <Avatar name={userName} />
        <span className="flex min-w-0 flex-1 flex-col">
          <span className="truncate text-body-sm font-medium text-text-primary">{userName}</span>
          <span className="truncate text-caption text-text-secondary">{ROLE_LABEL[role] ?? role}</span>
        </span>
        <Link
          href="/configuracoes"
          onClick={onNavigate}
          aria-label="Configurações"
          title="Configurações"
          className="flex size-11 shrink-0 items-center justify-center rounded-md text-text-secondary transition-colors duration-(--duration-fast) hover:bg-surface-hover hover:text-text-primary"
        >
          <Settings aria-hidden size={18} strokeWidth={ICON_STROKE} />
        </Link>
      </div>
      <div className="flex items-center justify-between gap-2">
        <ThemeToggle labels />
        <LogoutButton compact />
      </div>
    </div>
  );
}
