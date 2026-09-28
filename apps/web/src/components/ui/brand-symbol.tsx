import { SYMBOL_PATH, SYMBOL_RATIO, SYMBOL_VIEWBOX } from "./brand-geometry";

/**
 * The symbol filled with `currentColor`, so it follows the theme. Decorative by default; pass
 * `label` when it stands alone. Never a background, watermark or section icon (brand §23).
 */
export function BrandSymbol({ size = 24, label, className = "" }: { size?: number; label?: string; className?: string }) {
  return (
    <svg
      viewBox={SYMBOL_VIEWBOX}
      width={Math.round(size * SYMBOL_RATIO * 100) / 100}
      height={size}
      fill="currentColor"
      role={label ? "img" : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      focusable="false"
      className={`shrink-0 ${className}`}
    >
      <path fillRule="evenodd" d={SYMBOL_PATH} />
    </svg>
  );
}

/**
 * Horizontal lockup sizes (brand-system §07): wordmark cap height ≈ 0.45 × symbol height; "OS"
 * at 0.6 of the wordmark, never under 9px, its cap top aligned with the wordmark's.
 */
const LOGO_SIZES = {
  md: { symbol: 24, gap: "gap-2.5", word: "text-[15px]", os: "text-[9px]" },
  lg: { symbol: 28, gap: "gap-3", word: "text-[17px]", os: "text-[10px]" },
  xl: { symbol: 40, gap: "gap-3.5", word: "text-[23px]", os: "text-[13px]" },
} as const;

export type LogoSize = keyof typeof LOGO_SIZES;

/**
 * The official logo, horizontal: symbol + "COMPLIANCE" (Inter 700, caps) + superscript "OS" in
 * the accent. Symbol and name in text-primary, "OS" in `primary-text` — the owner's sheet with
 * the v2 cyan in place of its blue. Screen readers get one plain "Compliance OS".
 * `symbolOnlyNarrow`: symbol alone under 390px, where the landing header cannot fit the name
 * beside its CTA and menu button.
 */
export function BrandLogo({ size = "md", symbolOnlyNarrow = false }: { size?: LogoSize; symbolOnlyNarrow?: boolean }) {
  const s = LOGO_SIZES[size];
  return (
    <span className={`inline-flex items-center ${s.gap} text-text-primary`}>
      <BrandSymbol size={s.symbol} />
      <span aria-hidden className={`${symbolOnlyNarrow ? "hidden min-[390px]:inline-flex" : "inline-flex"} items-start leading-none whitespace-nowrap`}>
        <span className={`${s.word} font-bold uppercase tracking-[-0.005em]`}>Compliance</span>
        {/* mt 0.09em drops "OS" so its cap top meets the wordmark's (Inter at line-height 1). */}
        <span className={`${s.os} mt-[0.09em] ml-[0.3em] font-bold text-primary-text`}>OS</span>
      </span>
      <span className="sr-only">Compliance OS</span>
    </span>
  );
}

/**
 * The logo as one link to the site root, for the landing. A plain anchor on purpose: `next/link`
 * would prefetch `/` from the landing, and prefetches bypass the middleware rewrite — an
 * anonymous visitor would cache the application's redirect to /entrar.
 */
export function Lockup({ size = "md", href = "/", symbolOnlyNarrow = false }: { size?: LogoSize; href?: string; symbolOnlyNarrow?: boolean }) {
  return (
    <a href={href} aria-label="Compliance OS — início" className="inline-flex items-center">
      <BrandLogo size={size} symbolOnlyNarrow={symbolOnlyNarrow} />
    </a>
  );
}
