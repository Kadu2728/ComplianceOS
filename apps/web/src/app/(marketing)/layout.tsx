import { headers } from "next/headers";
import { NAV } from "@/lib/marketing/copy";

// Typography: Inter from the root layout, like the app (D39 — Geist retired, visual-v2 §2.4).

/**
 * Marks the document as scripted so the CSS scroll-reveal may hide elements until they enter
 * the viewport; without JavaScript (or without IntersectionObserver) nothing is ever hidden.
 * Same nonce pattern as the theme bootstrap in the root layout.
 */
const jsFlag = `if ("IntersectionObserver" in window) document.documentElement.classList.add("js");`;

/**
 * Public marketing frame (landing, legal notices). `.theme-light` pins the brand v1 light tokens
 * and `.landing` the v1 radius/type/shadows, so the page ignores the app's theme and palette v2;
 * sections opt into `.theme-dark` themselves.
 */
export default async function MarketingLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const nonce = (await headers()).get("x-nonce") ?? undefined;
  return (
    <div className="landing theme-light bg-surface-base text-text-primary">
      <script nonce={nonce} suppressHydrationWarning dangerouslySetInnerHTML={{ __html: jsFlag }} />
      <a
        href="#conteudo"
        className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 focus:inline-flex focus:h-10 focus:items-center focus:rounded-md focus:border focus:border-text-primary focus:bg-surface-elevated focus:px-4 focus:text-body-sm focus:font-medium focus:text-text-primary"
      >
        {NAV.skip}
      </a>
      {children}
    </div>
  );
}
