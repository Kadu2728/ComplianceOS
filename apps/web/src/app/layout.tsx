import type { Metadata, Viewport } from "next";
import { headers } from "next/headers";
import { Inter } from "next/font/google";
import { site } from "@/lib/marketing/site";
import "./globals.css";

// Inter only in the app (docs/design/tokens.md §3). Weights per brand §13; 700 deliberately absent.
const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  display: "swap",
  variable: "--font-inter",
});

export const metadata: Metadata = {
  // Absolute base for the file-convention icons and Open Graph image (NEXT_PUBLIC_SITE_URL, D3).
  metadataBase: new URL(site.siteUrl),
  title: { default: "Compliance OS", template: "%s · Compliance OS" },
  description: "Plataforma de operações de compliance.",
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f4f4f0" },
    { media: "(prefers-color-scheme: dark)", color: "#0b0d0f" },
  ],
};

const themeBootstrap = `(() => {
  try {
    const key = "compliance-os-theme";
    const stored = localStorage.getItem(key);
    const preference = stored === "light" || stored === "dark" || stored === "system" ? stored : "system";
    const isDark = preference === "dark" || (preference === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);
    const root = document.documentElement;
    root.dataset.theme = isDark ? "dark" : "light";
    root.dataset.themePreference = preference;
  } catch (_) {}
})();`;

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const nonce = (await headers()).get("x-nonce") ?? undefined;
  return (
    // suppressHydrationWarning: the bootstrap sets data-theme on <html> before React runs, and
    // browsers hide nonce values from the DOM — both are expected attribute differences.
    <html lang="pt-BR" className={inter.variable} suppressHydrationWarning>
      <head>
        <script nonce={nonce} suppressHydrationWarning dangerouslySetInnerHTML={{ __html: themeBootstrap }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
