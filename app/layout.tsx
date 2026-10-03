import type { Metadata, Viewport } from "next";
import { Urbanist, Manrope, Inter_Tight, Onest } from "next/font/google";
import "./globals.css";

/* Шрифти вантажаться з самого сайту (next/font) — без запитів до Google, швидше і краще для GDPR */
const urbanist = Urbanist({ subsets: ["latin", "latin-ext"], weight: ["400", "500", "600", "700"], variable: "--font-urbanist", display: "swap" });
const manrope = Manrope({ subsets: ["latin", "latin-ext", "cyrillic"], weight: ["300", "400", "500"], variable: "--font-manrope", display: "swap" });
const interTight = Inter_Tight({ subsets: ["latin", "latin-ext", "cyrillic"], weight: ["500", "700"], variable: "--font-inter-tight", display: "swap" });
/* Urbanist не має кирилиці — для української версії заголовки набираються Onest (схожий геометричний шрифт) */
const onest = Onest({ subsets: ["latin", "cyrillic"], weight: ["300", "400", "500", "600", "700"], variable: "--font-onest", display: "swap" });

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: "Deweb studio — Websites that turn visitors into clients",
  description: "Design, code and AI in one place: websites that bring your business clients, not just visitors.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${urbanist.variable} ${manrope.variable} ${interTight.variable} ${onest.variable}`}>
      <body>{children}</body>
    </html>
  );
}
