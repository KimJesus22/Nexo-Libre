import type { MetadataRoute } from "next";

/**
 * Web App Manifest — NexoLibre PWA
 *
 * Configuración nativa de Next.js para el manifest.
 * Se genera automáticamente en /manifest.webmanifest.
 *
 * Display: standalone → sin barra de direcciones del navegador.
 * Colores: fondo oscuro (#09090b) + acento esmeralda/cian (#10b981).
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "NexoLibre — Chat Seguro",
    short_name: "NexoLibre",
    description:
      "Plataforma de mensajería cifrada de extremo a extremo. Comunicación segura sin intermediarios.",
    start_url: "/panel",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    theme_color: "#09090b",
    background_color: "#09090b",
    categories: ["social", "security", "communication"],
    lang: "es-MX",
    dir: "ltr",
    icons: [
      {
        src: "/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
    screenshots: [],
    shortcuts: [
      {
        name: "Chat",
        short_name: "Chat",
        url: "/chat",
        icons: [{ src: "/icon-192.png", sizes: "192x192" }],
      },
      {
        name: "Ajustes",
        short_name: "Ajustes",
        url: "/ajustes",
        icons: [{ src: "/icon-192.png", sizes: "192x192" }],
      },
    ],
  };
}
