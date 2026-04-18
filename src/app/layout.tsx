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
    default: "NexoLibre | Privacidad Inquebrantable",
    template: "%s | NexoLibre",
  },
  description:
    "Plataforma de mensajería segura con cifrado de extremo a extremo real. Sin números de teléfono, sin recolección de datos. Tu privacidad no es negociable.",
  metadataBase: new URL("https://nexolibre.app"),
  manifest: "/manifest.json",
  keywords: ["mensajería segura", "privacidad", "e2ee", "chat anónimo", "sin número de teléfono", "cifrado", "opensource"],
  authors: [{ name: "NexoLibre" }],
  creator: "NexoLibre",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },

  /* ── Open Graph ────────────────────────────────────────────────────────── */
  openGraph: {
    type: "website",
    locale: "es_MX",
    url: "https://nexolibre.app",
    siteName: "NexoLibre",
    title: "NexoLibre | Privacidad Inquebrantable",
    description:
      "Plataforma de mensajería segura con cifrado de extremo a extremo real. Sin números de teléfono, sin recolección de datos.",
    images: [
      {
        url: "/api/og", // Ruta dinámica para generación de imagen
        width: 1200,
        height: 630,
        alt: "NexoLibre - Privacidad Inquebrantable",
      },
    ],
  },

  /* ── Twitter Cards ─────────────────────────────────────────────────────── */
  twitter: {
    card: "summary_large_image",
    title: "NexoLibre | Privacidad Inquebrantable",
    description:
      "Plataforma de mensajería segura E2EE. Comunícate de forma verdaderamente privada sin asociar tu número de teléfono.",
    creator: "@NexoLibre",
    images: ["/api/og"],
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
