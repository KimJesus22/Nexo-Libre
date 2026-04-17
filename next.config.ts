import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Genera un directorio standalone optimizado para Docker/self-hosting.
  // Incluye solo los archivos necesarios para producción (~150MB vs ~1GB).
  output: "standalone",
};

export default nextConfig;
