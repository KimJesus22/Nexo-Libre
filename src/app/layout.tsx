import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";

import "./globals.css";
import RegistroSW from "./_componentes/RegistroSW";
import ScriptAnaliticas from "./_componentes/ScriptAnaliticas";
import { Toaster } from "sonner";

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

/* ── Viewport (PWA) ──────────────────────────────────────────────────────── */
export const viewport: Viewport = {
  themeColor: "#09090b",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
};

/* ── Metadatos globales (SEO + PWA) ──────────────────────────────────────── */
export const metadata: Metadata = {
  title: {
    default: "NexoLibre",
    template: "%s | NexoLibre",
  },
  description:
    "Plataforma de mensajería cifrada de extremo a extremo. Comunicación segura sin intermediarios.",
  metadataBase: new URL("https://nexolibre.app"),
  manifest: "/manifest.json",

  /* ── Open Graph ────────────────────────────────────────────────────────── */
  openGraph: {
    type: "website",
    locale: "es_MX",
    siteName: "NexoLibre",
  },

  /* ── Apple PWA (Safari iOS) ────────────────────────────────────────────── */
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "NexoLibre",
  },

  /* ── Íconos ────────────────────────────────────────────────────────────── */
  icons: {
    icon: [
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
    ],
  },

  /* ── Otros ─────────────────────────────────────────────────────────────── */
  applicationName: "NexoLibre",
  formatDetection: {
    telephone: false,
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
        <Toaster position="top-center" richColors theme="dark" toastOptions={{ "aria-live": "polite" } as Record<string, string>} />
        <RegistroSW />
        <ScriptAnaliticas />
      </body>
    </html>
  );
}
