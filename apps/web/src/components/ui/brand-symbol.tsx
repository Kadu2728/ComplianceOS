import type { CSSProperties } from "react";

/** Intrinsic size of `public/brand/symbol.png` (decision D15): Off-white on transparent. */
const RATIO = 663 / 708;
const SYMBOL_URL = "url(/brand/symbol.png)";

/**
 * The approved symbol rendered as a CSS mask filled with `currentColor`, so one PNG reads as
 * Obsidian on Off-white or Off-white on Obsidian (brand §7). Decorative by default; pass `label`
 * when the symbol stands alone. Never a background, watermark or section icon (brand §23).
 */
export function BrandSymbol({ size = 24, label, className = "" }: { size?: number; label?: string; className?: string }) {
  const style: CSSProperties = {
    height: size,
    width: Math.round(size * RATIO * 100) / 100,
    backgroundColor: "currentColor",
    maskImage: SYMBOL_URL,
    maskSize: "contain",
    maskRepeat: "no-repeat",
    maskPosition: "center",
    WebkitMaskImage: SYMBOL_URL,
    WebkitMaskSize: "contain",
    WebkitMaskRepeat: "no-repeat",
    WebkitMaskPosition: "center",
  };
  return (
    <span
      role={label ? "img" : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      className={`inline-block shrink-0 ${className}`}
      style={style}
    />
  );
}

/**
 * Symbol + "Compliance OS" (Inter 600, tracking −0.01em) as one link to the site root. A plain
 * anchor on purpose: `next/link` would prefetch `/` from the landing, and prefetches bypass the
 * middleware rewrite — an anonymous visitor would cache the application's redirect to /entrar.
 */
export function Lockup({ size = 24, href = "/", symbolOnlyBelowSm = false }: { size?: 24 | 32; href?: string; symbolOnlyBelowSm?: boolean }) {
  return (
    <a href={href} aria-label="Compliance OS — início" className="inline-flex items-center gap-2 text-text-primary">
      <BrandSymbol size={size} />
      <span className={`${size === 32 ? "text-[20px]" : "text-[16px]"} font-semibold tracking-[-0.01em] whitespace-nowrap ${symbolOnlyBelowSm ? "hidden sm:inline" : ""}`}>
        Compliance OS
      </span>
    </a>
  );
}
