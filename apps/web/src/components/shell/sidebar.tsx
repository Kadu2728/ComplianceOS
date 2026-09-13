import { ICON_STROKE, NAV_ITEMS } from "./nav-items";
import { NavLink } from "./nav-link";
import { OrgFooter } from "./org-footer";
import { Wordmark } from "./wordmark";

/** Desktop/tablet sidebar. Server component; NavLink is the only client child. */
export function Sidebar({
  organizationName,
  userName,
}: {
  organizationName: string;
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
      <OrgFooter organizationName={organizationName} userName={userName} />
    </aside>
  );
}
