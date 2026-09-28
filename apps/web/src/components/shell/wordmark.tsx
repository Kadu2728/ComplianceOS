import Link from "next/link";
import { BrandLogo } from "@/components/ui/brand-symbol";

/**
 * Application logo link (visual-v2 §3.2–§3.3): the official lockup — symbol and "COMPLIANCE" in
 * text-primary, superscript "OS" in cyan (brand-system §07). `lg` = sidebar, `md` = top bars,
 * drawer, auth and public pages. No glow, no gradient.
 */
export function Wordmark({ size = "md", onNavigate }: { size?: "md" | "lg"; onNavigate?: () => void }) {
  return (
    <Link href="/" onClick={onNavigate} className="flex items-center">
      <BrandLogo size={size} />
    </Link>
  );
}
