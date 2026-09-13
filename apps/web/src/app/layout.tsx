import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

// Inter only in the app (docs/design/tokens.md §3). Weights per brand §13; 700 deliberately absent.
const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  display: "swap",
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: { default: "Compliance OS", template: "%s · Compliance OS" },
  description: "Plataforma de operações de compliance.",
};

export const viewport: Viewport = {
  themeColor: "#f4f4f0",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR" className={inter.variable}>
      <body>{children}</body>
    </html>
  );
}
