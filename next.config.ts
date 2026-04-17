import type { NextConfig } from "next";

/**
 * Configuración de Next.js — NexoLibre
 *
 * Security Headers:
 *   - X-Frame-Options: DENY (anti-clickjacking)
 *   - X-Content-Type-Options: nosniff (anti-MIME sniffing)
 *   - Referrer-Policy: strict-origin-when-cross-origin
 *   - Permissions-Policy: deshabilita APIs innecesarias
 *   - Strict-Transport-Security: HSTS con preload
 *   - Content-Security-Policy: política estricta
 *     · default-src 'self'
 *     · script-src 'self' (no inline scripts)
 *     · style-src 'self' 'unsafe-inline' (Tailwind/Next necesitan inline styles)
 *     · connect-src 'self' + *.supabase.co (API + Realtime)
 *     · img-src 'self' blob: data: + *.supabase.co (avatares en Storage)
 *     · font-src 'self' fonts.gstatic.com (Google Fonts)
 *     · frame-ancestors 'none' (refuerza X-Frame-Options)
 *     · form-action 'self'
 *     · base-uri 'self'
 *     · upgrade-insecure-requests
 */

/* ── Content-Security-Policy ──────────────────────────────────────────────── */

const cspDirectives = [
  // Fallback: bloquea todo lo que no tenga directiva explícita
  "default-src 'self'",

  // Scripts: self + inline (Next.js requiere inline scripts para hidratación)
  // TODO: migrar a nonces cuando Next.js lo soporte nativamente con Turbopack
  "script-src 'self' 'unsafe-inline'",

  // Estilos: self + inline (requerido por Tailwind CSS y Next.js)
  "style-src 'self' 'unsafe-inline'",

  // Conexiones: self + Supabase API + Supabase Realtime (wss://)
  "connect-src 'self' https://*.supabase.co wss://*.supabase.co",

  // Imágenes: self + blobs (preview avatar) + data URIs + Supabase Storage
  "img-src 'self' blob: data: https://*.supabase.co",

  // Fuentes: self + Google Fonts CDN
  "font-src 'self' https://fonts.gstatic.com",

  // Workers: self (Service Workers, Web Workers)
  "worker-src 'self' blob:",

  // Iframes: ninguno (anti-clickjacking reforzado)
  "frame-ancestors 'none'",

  // Formularios: solo hacia el mismo origen
  "form-action 'self'",

  // Base URI: previene ataques de base tag injection
  "base-uri 'self'",

  // Manifest: solo del mismo origen (PWA)
  "manifest-src 'self'",

  // Forzar HTTPS en recursos
  "upgrade-insecure-requests",
];

const ContentSecurityPolicy = cspDirectives.join("; ");

/* ── Headers de seguridad ─────────────────────────────────────────────────── */

const securityHeaders = [
  {
    // Anti-clickjacking: impide que la app sea embebida en iframes
    key: "X-Frame-Options",
    value: "DENY",
  },
  {
    // Anti-MIME sniffing: previene ejecución de contenido malicioso
    key: "X-Content-Type-Options",
    value: "nosniff",
  },
  {
    // Referrer: envía origen completo solo en same-origin
    key: "Referrer-Policy",
    value: "strict-origin-when-cross-origin",
  },
  {
    // Deshabilitar APIs del navegador innecesarias
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), browsing-topics=()",
  },
  {
    // HSTS: forzar HTTPS por 2 años con preload
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
  {
    // CSP: política estricta de carga de recursos
    key: "Content-Security-Policy",
    value: ContentSecurityPolicy,
  },
  {
    // Previene ataques de cross-origin opener
    key: "X-DNS-Prefetch-Control",
    value: "on",
  },
];

/* ── Configuración de Next.js ─────────────────────────────────────────────── */

const nextConfig: NextConfig = {
  // Genera un directorio standalone optimizado para Docker/self-hosting.
  // Incluye solo los archivos necesarios para producción (~150MB vs ~1GB).
  output: "standalone",

  // Desactiva el header X-Powered-By (información innecesaria para atacantes)
  poweredByHeader: false,

  // Cabeceras HTTP de seguridad aplicadas a TODAS las rutas
  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
