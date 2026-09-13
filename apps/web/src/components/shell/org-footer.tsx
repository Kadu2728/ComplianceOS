import { Building2, CircleUser } from "lucide-react";
import { LogoutButton } from "./logout-button";
import { ICON_STROKE } from "./nav-items";

export function OrgFooter({ organizationName, userName }: { organizationName: string; userName: string }) {
  return (
    <div className="mt-auto flex flex-col gap-1 border-t border-border p-3">
      <div className="flex h-10 items-center gap-3 px-3 text-body-sm font-medium text-text-primary">
        <Building2 aria-hidden size={20} strokeWidth={ICON_STROKE} />
        <span className="truncate">{organizationName}</span>
      </div>
      <div className="flex h-10 items-center gap-3 px-3 text-body-sm text-text-secondary">
        <CircleUser aria-hidden size={20} strokeWidth={ICON_STROKE} />
        <span className="truncate">{userName}</span>
      </div>
      <LogoutButton />
    </div>
  );
}
