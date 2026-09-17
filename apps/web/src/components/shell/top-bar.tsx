import { MobileDrawer } from "./mobile-drawer";
import type { OrganizationOption } from "./org-switcher";
import { Wordmark } from "./wordmark";

/** Mobile-only top bar (< md). On larger screens the sidebar carries the wordmark. */
export function TopBar({
  currentId,
  organizations,
  role,
}: {
  currentId: string;
  organizations: OrganizationOption[];
  role: string;
}) {
  return (
    <header className="flex h-14 items-center justify-between border-b border-border bg-surface-elevated pr-2 md:hidden">
      <Wordmark />
      <MobileDrawer currentId={currentId} organizations={organizations} role={role} />
    </header>
  );
}
