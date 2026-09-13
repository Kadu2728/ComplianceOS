"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

/**
 * Client boundary limited to active-state detection (usePathname).
 * The icon arrives already rendered: component references are not serializable
 * across the server → client boundary.
 */
export function NavLink({
  href,
  label,
  icon,
  onNavigate,
}: {
  href: string;
  label: string;
  icon: ReactNode;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();
  const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
  return (
    <Link
      href={href}
      onClick={onNavigate}
      aria-current={active ? "page" : undefined}
      className={[
        "relative flex h-10 items-center gap-3 rounded-md px-3 text-body-sm transition-colors duration-(--duration-fast)",
        "hover:bg-surface-hover",
        active ? "font-medium text-text-primary" : "text-text-secondary",
      ].join(" ")}
    >
      {active ? (
        <span
          aria-hidden
          className="absolute top-2 bottom-2 -left-2 w-0.5 rounded-sm bg-electric-blue"
        />
      ) : null}
      {icon}
      <span>{label}</span>
    </Link>
  );
}
