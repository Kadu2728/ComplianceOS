import { AccountBlock } from "./account-block";
import { ICON_STROKE, navItemsFor } from "./nav-items";
import { NavLink } from "./nav-link";
import { type OrganizationOption, OrgSwitcher } from "./org-switcher";
import { Wordmark } from "./wordmark";

/**
 * Desktop/tablet sidebar (app-shell.md §2). Viewport-height and sticky: the organization at the
 * top frames every page, the navigation scrolls on its own if it ever needs to, and the account
 * block (theme, settings, exit) stays visible at the bottom no matter how long the page is.
 * Server component; NavLink, the switcher, the theme toggle and the exit are the client children.
 */
export function Sidebar({
  currentId,
  organizations,
  userName,
  role,
}: {
  currentId: string;
  organizations: OrganizationOption[];
  userName: string;
  role: string;
}) {
  return (
    <aside className="sticky top-0 hidden h-dvh w-[248px] shrink-0 flex-col self-start border-r border-border bg-surface-elevated md:flex">
      <div className="px-3 pb-3">
        <Wordmark />
        <OrgSwitcher currentId={currentId} organizations={organizations} />
      </div>
      <nav aria-label="Principal" className="flex min-h-0 flex-1 flex-col gap-1 overflow-y-auto px-3 pt-1">
        {navItemsFor(role).map((item) => (
          <NavLink
            key={item.href}
            href={item.href}
            label={item.label}
            icon={<item.icon aria-hidden size={20} strokeWidth={ICON_STROKE} />}
          />
        ))}
      </nav>
      <AccountBlock userName={userName} role={role} />
    </aside>
  );
}
