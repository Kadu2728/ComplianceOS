import { AccountBlock } from "./account-block";
import { NavList } from "./nav-list";
import { type OrganizationOption, OrgSwitcher } from "./org-switcher";
import { Wordmark } from "./wordmark";

/**
 * Sidebar v2 (visual-v2 §3.2), ≥ 1024 only: 240px, viewport-height and sticky. Logo row 64, the
 * organization right below (owner decision 2026-09-17), the grouped nav scrolling on its own, and
 * the compact account block (theme + exit) always visible at the bottom.
 */
export function Sidebar({
  currentId,
  organizations,
  role,
}: {
  currentId: string;
  organizations: OrganizationOption[];
  role: string;
}) {
  return (
    <aside className="sticky top-0 hidden h-dvh w-[240px] shrink-0 flex-col self-start border-r border-border bg-surface-base lg:flex print:hidden">
      <div className="flex h-16 shrink-0 items-center px-6">
        <Wordmark size="lg" />
      </div>
      <div className="px-3 pb-3">
        <OrgSwitcher currentId={currentId} organizations={organizations} />
      </div>
      <nav aria-label="Principal" className="min-h-0 flex-1 overflow-y-auto px-3 pt-1 pb-3">
        <NavList role={role} />
      </nav>
      <AccountBlock variant="compact" userName="" role={role} />
    </aside>
  );
}
