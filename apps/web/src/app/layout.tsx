import type { Metadata, Viewport } from "next";
import { headers } from "next/headers";
import { Inter } from "next/font/google";
import { site } from "@/lib/marketing/site";
import "./globals.css";

// Inter is the only family, app and landing (D39, visual-v2 §2.4). 700 only for the marketing H1/H2.
const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
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
    { media: "(prefers-color-scheme: light)", color: "#f5f7fa" },
    { media: "(prefers-color-scheme: dark)", color: "#0b0f14" },
  ],
};

const themeBootstrap = `(() => {
  try {
    const key = "compliance-os-theme";
    const stored = localStorage.getItem(key);
    const preference = stored === "light" || stored === "dark" || stored === "system" ? stored : "dark";
    const isDark = preference === "dark" || (preference === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);
    const root = document.documentElement;
    root.dataset.theme = isDark ? "dark" : "light";
    root.dataset.themePreference = preference;
    if (stored === "light" || stored === "dark") {
      for (const meta of document.querySelectorAll('meta[name="theme-color"]')) meta.content = isDark ? "#0b0f14" : "#f5f7fa";
    }
  } catch (_) {}
})();`;

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const nonce = (await headers()).get("x-nonce") ?? undefined;
  return (
    // Dark is the default (D16 amended by D39): rendered server-side so no-JS visitors get it and
    // there is no flash. suppressHydrationWarning: the bootstrap may switch data-theme before React
    // runs, and browsers hide nonce values from the DOM — both are expected attribute differences.
    <html lang="pt-BR" className={inter.variable} data-theme="dark" suppressHydrationWarning>
      <head>
        <script nonce={nonce} suppressHydrationWarning dangerouslySetInnerHTML={{ __html: themeBootstrap }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
