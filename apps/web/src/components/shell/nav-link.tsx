"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

/** Same rule for the sidebar, the drawer and the tab bar: `/` is exact, the others by prefix. */
export function isActivePath(pathname: string, href: string): boolean {
  return href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`);
}

/**
 * Nav item v2 (visual-v2 §3.2): active = tinted background + cyan icon + weight + aria-current,
 * so the state is never colour-only. Client boundary limited to active-state detection; the icon
 * arrives already rendered (component references are not serializable server → client).
 */
export function NavLink({
  href,
  label,
  icon,
  onNavigate,
  tall = false,
}: {
  href: string;
  label: string;
  icon: ReactNode;
  onNavigate?: () => void;
  tall?: boolean;
}) {
  const active = isActivePath(usePathname(), href);
  return (
    <Link
      href={href}
      onClick={onNavigate}
      aria-current={active ? "page" : undefined}
      className={[
        "flex items-center gap-3 rounded-md px-3 text-body-sm transition-colors duration-(--duration-fast)",
        tall ? "h-11" : "h-10",
        active
          ? "bg-primary-tint font-medium text-text-primary [&_svg]:text-primary-text"
          : "text-text-secondary hover:bg-surface-hover hover:text-text-primary",
      ].join(" ")}
    >
      {icon}
      <span className="truncate">{label}</span>
    </Link>
  );
}
