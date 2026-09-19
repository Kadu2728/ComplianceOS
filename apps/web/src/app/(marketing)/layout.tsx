import { Geist } from "next/font/google";
import { headers } from "next/headers";
import { NAV } from "@/lib/marketing/copy";

// Geist only here (docs/design/tokens.md §3: display family is marketing-only). Two weights,
// latin subset; exposed as `--font-geist`, consumed by the `font-display` utility.
const geist = Geist({
  subsets: ["latin"],
  weight: ["500", "600"],
  display: "swap",
  variable: "--font-geist",
});

/**
 * Marks the document as scripted so the CSS scroll-reveal may hide elements until they enter
 * the viewport; without JavaScript (or without IntersectionObserver) nothing is ever hidden.
 * Same nonce pattern as the theme bootstrap in the root layout.
 */
const jsFlag = `if ("IntersectionObserver" in window) document.documentElement.classList.add("js");`;

/**
 * Public marketing frame (landing, interim legal notices). `.theme-light` pins the light tokens
 * so the page ignores the app's theme choice; sections opt into `.theme-dark` themselves.
 */
export default async function MarketingLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const nonce = (await headers()).get("x-nonce") ?? undefined;
  return (
    <div className={`landing theme-light ${geist.variable} bg-surface-base text-text-primary`}>
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
