import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";

import "./globals.css";

/* ── Tipografías ─────────────────────────────────────────────────────────── */
const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

/* ── Metadatos globales (SEO) ────────────────────────────────────────────── */
export const metadata: Metadata = {
  title: {
    default: "NexoLibre",
    template: "%s | NexoLibre",
  },
  description:
    "Plataforma modular construida con Next.js y Supabase.",
  metadataBase: new URL("https://nexolibre.app"),
  openGraph: {
    type: "website",
    locale: "es_MX",
    siteName: "NexoLibre",
  },
};

/* ── Layout raíz ─────────────────────────────────────────────────────────── */
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="es"
      className={`dark ${geistSans.variable} ${geistMono.variable}`}
      data-scroll-behavior="smooth"
      suppressHydrationWarning
    >
      <body>
        {children}
      </body>
    </html>
  );
}
