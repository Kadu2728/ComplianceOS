import { ArrowRight, ArrowUpRight } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";

type Variant = "primary" | "outline" | "tertiary";
type Size = "sm" | "md" | "lg";

/** Landing buttons v2 (landing-v2 §4.2): cyan fill with dark text; one filled per viewport. */
const VARIANT: Record<Variant, string> = {
  primary: "bg-primary text-primary-foreground hover:bg-primary-hover active:bg-primary-active",
  outline: "border border-outline text-text-primary hover:bg-outline-hover active:border-primary",
  tertiary: "text-primary-text underline decoration-1 underline-offset-2 hover:text-primary-text-hover",
};

const SIZE: Record<Size, string> = {
  sm: "h-10 px-4 text-body-sm max-lg:min-h-11",
  md: "h-11 px-5 text-body-sm",
  lg: "h-12 px-6 text-body",
};

export function ctaClass(variant: Variant, size: Size, extra = ""): string {
  const box = variant === "tertiary" ? "" : `rounded-md ${SIZE[size]}`;
  return `group inline-flex items-center justify-center gap-2 font-medium whitespace-nowrap transition-colors duration-(--duration-fast) ${box} ${VARIANT[variant]} ${extra}`;
}

/**
 * Next `Link` for routes, plain `<a>` for same-page anchors (native scroll, no router work),
 * `mailto:` and external `http(s)` URLs (Kiwify checkouts), which the router must not handle.
 * `arrow="forward"` moves 2px on hover; `arrow="external"` also says so to screen readers.
 */
export function CtaLink({
  href,
  variant = "primary",
  size = "md",
  arrow,
  className = "",
  children,
  onClick,
}: {
  href: string;
  variant?: Variant;
  size?: Size;
  arrow?: "forward" | "external";
  className?: string;
  children: ReactNode;
  onClick?: () => void;
}) {
  const cls = ctaClass(variant, size, className);
  const iconSize = size === "lg" ? 18 : 16;
  const content = (
    <>
      {children}
      {arrow === "forward" ? (
        <ArrowRight aria-hidden size={iconSize} strokeWidth={1.5} className="transition-transform duration-(--duration-fast) group-hover:translate-x-0.5" />
      ) : null}
      {arrow === "external" ? (
        <>
          <ArrowUpRight aria-hidden size={iconSize} strokeWidth={1.5} />
          <span className="sr-only"> (abre em outro site)</span>
        </>
      ) : null}
    </>
  );
  if (href.startsWith("#") || href.startsWith("mailto:") || /^https?:\/\//.test(href)) {
    return (
      <a href={href} className={cls} onClick={onClick}>
        {content}
      </a>
    );
  }
  return (
    <Link href={href} className={cls} onClick={onClick}>
      {content}
    </Link>
  );
}
