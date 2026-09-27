"use client";

import { House, ListChecks, Menu, TriangleAlert } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { DrawerButton } from "./mobile-drawer";
import { ICON_STROKE } from "./nav-items";
import { isActivePath } from "./nav-link";

const TABS = [
  { label: "Início", href: "/", icon: House },
  { label: "Riscos", href: "/riscos", icon: TriangleAlert },
  { label: "Ações", href: "/acoes", icon: ListChecks },
] as const;

function TabFace({ active, icon, label }: { active: boolean; icon: ReactNode; label: string }) {
  return (
    <>
      <span
        className={`flex h-7 w-14 items-center justify-center rounded-pill transition-colors duration-(--duration-fast) ${
          active ? "bg-primary-tint text-primary-text" : "text-text-secondary"
        }`}
      >
        {icon}
      </span>
      <span className={active ? "font-semibold text-text-primary" : "text-text-secondary"}>{label}</span>
    </>
  );
}

const TAB = "flex h-16 flex-col items-center justify-center gap-1 text-caption font-medium active:bg-surface-hover";

/**
 * Bottom tab bar below 768 (visual-v2 §3.4, the reference's phone mockup): Início · Riscos · Ações
 * · Mais. "Mais" opens the navigation drawer. Active = pill shape + weight + aria-current.
 */
export function TabBar() {
  const pathname = usePathname();
  const onTab = TABS.some((t) => isActivePath(pathname, t.href));
  return (
    <nav
      aria-label="Atalhos"
      className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-surface-base pb-[env(safe-area-inset-bottom)] md:hidden print:hidden"
    >
      <ul className="grid grid-cols-4">
        {TABS.map((tab) => {
          const active = isActivePath(pathname, tab.href);
          return (
            <li key={tab.href}>
              <Link href={tab.href} aria-current={active ? "page" : undefined} className={TAB}>
                <TabFace active={active} label={tab.label} icon={<tab.icon aria-hidden size={22} strokeWidth={ICON_STROKE} />} />
              </Link>
            </li>
          );
        })}
        <li>
          <DrawerButton className={`${TAB} w-full`}>
            <TabFace active={!onTab} label="Mais" icon={<Menu aria-hidden size={22} strokeWidth={ICON_STROKE} />} />
          </DrawerButton>
        </li>
      </ul>
    </nav>
  );
}
