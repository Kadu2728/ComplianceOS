import { Settings } from "lucide-react";
import Link from "next/link";
import { ROLE_LABEL } from "@/lib/domain/labels";
import { LogoutButton } from "./logout-button";
import { ICON_STROKE } from "./nav-items";
import { ThemeToggle } from "./theme-toggle";

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  const first = parts[0]?.[0] ?? "";
  const last = parts.length > 1 ? (parts[parts.length - 1]?.[0] ?? "") : "";
  return (first + last).toUpperCase() || "?";
}

/**
 * Account block pinned to the bottom of the shell (sidebar and drawer): who you are and your
 * role, the theme, a direct way to Configurações and the exit. Always on screen — the sidebar is
 * viewport-height and sticky — so nothing about the account is ever "below the page".
 */
export function AccountBlock({
  userName,
  role,
  onNavigate,
}: {
  userName: string;
  role: string;
  onNavigate?: () => void;
}) {
  return (
    <div className="flex flex-col gap-2 border-t border-border p-3">
      <div className="flex items-center gap-3 px-1">
        <span
          aria-hidden
          className="flex size-8 shrink-0 items-center justify-center rounded-pill bg-surface-hover text-caption font-semibold text-text-primary"
        >
          {initials(userName)}
        </span>
        <span className="flex min-w-0 flex-1 flex-col">
          <span className="truncate text-body-sm font-medium text-text-primary">{userName}</span>
          <span className="truncate text-caption text-text-secondary">{ROLE_LABEL[role] ?? role}</span>
        </span>
        <Link
          href="/configuracoes"
          onClick={onNavigate}
          aria-label="Configurações"
          title="Configurações"
          className="flex size-9 shrink-0 items-center justify-center rounded-md text-text-secondary transition-colors duration-(--duration-fast) hover:bg-surface-hover hover:text-text-primary"
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
