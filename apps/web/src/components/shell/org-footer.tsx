import { CircleUser } from "lucide-react";
import { LogoutButton } from "./logout-button";
import { ICON_STROKE } from "./nav-items";
import { type OrganizationOption, OrgSwitcher } from "./org-switcher";
import { ThemeToggle } from "./theme-toggle";

export function OrgFooter({
  currentId,
  organizations,
  userName,
}: {
  currentId: string;
  organizations: OrganizationOption[];
  userName: string;
}) {
  return (
    <div className="mt-auto flex flex-col gap-1 border-t border-border p-3">
      <OrgSwitcher currentId={currentId} organizations={organizations} />
      <ThemeToggle />
      <div className="flex h-10 items-center gap-3 px-3 text-body-sm text-text-secondary">
        <CircleUser aria-hidden size={20} strokeWidth={ICON_STROKE} />
        <span className="truncate">{userName}</span>
      </div>
      <LogoutButton />
    </div>
  );
}
