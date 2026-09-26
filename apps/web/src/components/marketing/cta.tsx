import Link from "next/link";
import type { ReactNode } from "react";

type Variant = "primary" | "secondary" | "tertiary";
type Size = "sm" | "md" | "lg";

/** Same color rules as `components/ui/button.tsx` (brand §41, tokens.md §2); marketing adds sizes. */
const VARIANT: Record<Variant, string> = {
  primary: "bg-electric-blue text-white hover:bg-primary-hover active:bg-primary-active",
  secondary: "border border-text-primary bg-surface-elevated text-text-primary hover:bg-surface-hover",
  tertiary: "text-info-text underline decoration-1 underline-offset-2 hover:text-info-fill",
};

const SIZE: Record<Size, string> = {
  sm: "h-9 px-3 text-body-sm",
  md: "h-11 px-5 text-body-sm",
  lg: "h-12 px-6 text-body",
};

export function ctaClass(variant: Variant, size: Size, extra = ""): string {
  return `inline-flex items-center justify-center gap-2 rounded-md font-medium whitespace-nowrap transition-colors duration-(--duration-fast) ${VARIANT[variant]} ${SIZE[size]} ${extra}`;
}

/**
 * Next `Link` for routes, plain `<a>` for same-page anchors (native scroll, no router work),
 * `mailto:` and external `http(s)` URLs (Kiwify checkouts), which the router must not handle.
 */
export function CtaLink({
  href,
  variant = "primary",
  size = "md",
  className = "",
  children,
  onClick,
}: {
  href: string;
  variant?: Variant;
  size?: Size;
  className?: string;
  children: ReactNode;
  onClick?: () => void;
}) {
  const cls = ctaClass(variant, size, className);
  if (href.startsWith("#") || href.startsWith("mailto:") || /^https?:\/\//.test(href)) {
    return (
      <a href={href} className={cls} onClick={onClick}>
        {children}
      </a>
    );
  }
  return (
    <Link href={href} className={cls} onClick={onClick}>
      {children}
    </Link>
  );
}
