import Link from "next/link";
import { BrandSymbol } from "@/components/ui/brand-symbol";

/**
 * Application wordmark v2 (visual-v2 §3.2–§3.3): the owner's real symbol (D15, a currentColor
 * mask) in cyan `primary-text` — the mockup hexagon is a placeholder, never used — plus the name
 * in text-primary. `lg` = sidebar (28 + 18px), `md` = top bars (24 + 16px). No glow, no gradient.
 */
export function Wordmark({ size = "md", onNavigate }: { size?: "md" | "lg"; onNavigate?: () => void }) {
  return (
    <Link href="/" onClick={onNavigate} className="flex items-center gap-2.5 text-text-primary">
      <span className="text-primary-text">
        <BrandSymbol size={size === "lg" ? 28 : 24} />
      </span>
      <span className={`${size === "lg" ? "text-[18px]" : "text-[16px]"} font-semibold tracking-[-0.012em] whitespace-nowrap`}>
        Compliance OS
      </span>
    </Link>
  );
}
