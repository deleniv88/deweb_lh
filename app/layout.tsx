import type { Metadata, Viewport } from "next";
import { Urbanist, Manrope, Inter_Tight } from "next/font/google";
import "./globals.css";

/* Шрифти вантажаться з самого сайту (next/font) — без запитів до Google, швидше і краще для GDPR */
const urbanist = Urbanist({ subsets: ["latin", "latin-ext"], weight: ["400", "500", "600", "700"], variable: "--font-urbanist", display: "swap" });
const manrope = Manrope({ subsets: ["latin", "latin-ext"], weight: ["300", "400", "500"], variable: "--font-manrope", display: "swap" });
const interTight = Inter_Tight({ subsets: ["latin", "latin-ext"], weight: ["500", "700"], variable: "--font-inter-tight", display: "swap" });

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: "Deweb studio — Websites that turn visitors into clients",
  description: "Design, code and AI in one place: scalable websites built to feed your marketing.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${urbanist.variable} ${manrope.variable} ${interTight.variable}`}>
      <body>{children}</body>
    </html>
  );
}
