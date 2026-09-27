import { ChevronRight } from "lucide-react";
import Link from "next/link";
import { ROLE_LABEL } from "@/lib/domain/labels";
import type { Radar } from "@/lib/domain/queries";
import { Avatar } from "./account-block";
import { Bell } from "./bell";
import { MenuButton } from "./mobile-drawer";
import { ICON_STROKE } from "./nav-items";
import { HeaderSearch } from "./search";
import { Wordmark } from "./wordmark";

/**
 * One header for every width (visual-v2 §3.1, §3.3), sticky at the top of the main column:
 * - < 768: logo · search button · bell (the tab bar carries the navigation);
 * - 768–1023: menu (drawer) · logo · inline search · bell · avatar link;
 * - ≥ 1024: inline search · bell · user block (the sidebar carries logo and navigation).
 * No blur or glass: a solid surface with a 1px bottom border.
 */
export function AppHeader({
  orgId,
  radar,
  userName,
  role,
}: {
  orgId: string;
  radar: Radar | null;
  userName: string;
  role: string;
}) {
  const roleLabel = ROLE_LABEL[role] ?? role;
  return (
    <header className="sticky top-0 z-30 border-b border-border bg-surface-base print:hidden">
      <div className="mx-auto flex h-14 w-full max-w-[1200px] items-center gap-2 px-4 sm:px-6 md:h-16 md:gap-4 lg:px-8 2xl:max-w-[1504px]">
        <div className="hidden md:block lg:hidden">
          <MenuButton />
        </div>
        <div className="shrink-0 lg:hidden">
          <Wordmark />
        </div>
        <div className="ml-auto flex min-w-0 items-center gap-1 md:ml-0 md:flex-1 md:gap-4">
          {/* keyed by organization: a switch must never show the previous organization's results */}
          <HeaderSearch key={`search-${orgId}`} orgId={orgId} />
          <div className="flex items-center gap-2 md:ml-auto">
            <Bell key={`bell-${orgId}`} orgId={orgId} initial={radar} />
            <Link
              href="/configuracoes"
              className="hidden h-10 items-center gap-2.5 rounded-md pr-2 pl-1 transition-colors duration-(--duration-fast) hover:bg-surface-hover md:flex"
            >
              <Avatar name={userName} />
              <span className="flex max-w-[160px] min-w-0 flex-col leading-tight max-xl:sr-only">
                <span className="truncate text-body-sm font-medium text-text-primary">{userName}</span>
                <span className="truncate text-caption text-text-secondary">{roleLabel}</span>
              </span>
              <span className="sr-only"> — Configurações</span>
              <ChevronRight aria-hidden size={16} strokeWidth={ICON_STROKE} className="text-text-muted" />
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}
