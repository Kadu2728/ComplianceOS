import Link from "next/link";
import { BrandSymbol } from "@/components/ui/brand-symbol";

/**
 * Application wordmark: the approved symbol (decision D15 — `public/brand/symbol.png`, added
 * 2026-09-19, rendered as a currentColor mask) in the 24px slot reserved since Phase 1, plus the
 * text. Same height and gap as before, so the shell does not reflow.
 */
export function Wordmark() {
  return (
    <Link href="/" className="flex h-14 items-center gap-2 px-3 text-text-primary">
      <BrandSymbol size={24} />
      <span className="text-[16px] font-semibold tracking-[-0.01em]">Compliance OS</span>
    </Link>
  );
}
