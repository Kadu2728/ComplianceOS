import { ICON_STROKE, NAV_ITEMS } from "./nav-items";
import { NavLink } from "./nav-link";
import { OrgFooter } from "./org-footer";
import type { OrganizationOption } from "./org-switcher";
import { Wordmark } from "./wordmark";

/** Desktop/tablet sidebar. Server component; NavLink and the switcher are the client children. */
export function Sidebar({
  currentId,
  organizations,
  userName,
}: {
  currentId: string;
  organizations: OrganizationOption[];
  userName: string;
}) {
  return (
    <aside className="hidden w-[248px] shrink-0 flex-col border-r border-border bg-surface-elevated md:flex">
      <Wordmark />
      <nav aria-label="Principal" className="flex flex-col gap-1 px-3 pt-2">
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.href}
            href={item.href}
            label={item.label}
            icon={<item.icon aria-hidden size={20} strokeWidth={ICON_STROKE} />}
          />
        ))}
      </nav>
      <OrgFooter currentId={currentId} organizations={organizations} userName={userName} />
    </aside>
  );
}
