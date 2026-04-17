# ══════════════════════════════════════════════════════════════════════════════
# Dockerfile — NexoLibre
# ══════════════════════════════════════════════════════════════════════════════
# Multi-stage build optimizado para producción con pnpm.
#
# Etapas:
#   1. base     — Node.js + corepack (pnpm)
#   2. deps     — Instalar dependencias
#   3. builder  — Build de producción (requiere variables de entorno)
#   4. runner   — Imagen final mínima (~150MB)
#
# Variables de entorno requeridas en build:
#   NEXT_PUBLIC_SUPABASE_URL
#   NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
#
# Uso:
#   docker build \
#     --build-arg NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co \
#     --build-arg NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable__xxx \
#     -t nexolibre .
#
#   docker run -p 3000:3000 \
#     -e NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co \
#     -e NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable__xxx \
#     nexolibre
# ══════════════════════════════════════════════════════════════════════════════


# ── Etapa 1: Base ─────────────────────────────────────────────────────────────
FROM node:20-alpine AS base

# Habilitar corepack para usar pnpm
RUN corepack enable && corepack prepare pnpm@10.31.0 --activate

WORKDIR /app


# ── Etapa 2: Dependencias ─────────────────────────────────────────────────────
FROM base AS deps

# Copiar archivos de lockfile para caché de dependencias
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./

# Instalar dependencias (--frozen-lockfile asegura reproducibilidad)
RUN pnpm install --frozen-lockfile


# ── Etapa 3: Build ────────────────────────────────────────────────────────────
FROM base AS builder

# Variables de entorno públicas — necesarias en BUILD TIME
# porque Next.js las incrusta estáticamente en el bundle del cliente.
ARG NEXT_PUBLIC_SUPABASE_URL
ARG NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
ARG NEXT_PUBLIC_SITE_URL

ENV NEXT_PUBLIC_SUPABASE_URL=${NEXT_PUBLIC_SUPABASE_URL}
ENV NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=${NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY}
ENV NEXT_PUBLIC_SITE_URL=${NEXT_PUBLIC_SITE_URL}

# Desactivar telemetría de Next.js
ENV NEXT_TELEMETRY_DISABLED=1

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Build con pnpm (estricto — no npm, no yarn)
RUN pnpm build


# ── Etapa 4: Runner (producción) ──────────────────────────────────────────────
FROM node:20-alpine AS runner

WORKDIR /app

# Variables de entorno de runtime
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Crear usuario no-root para seguridad
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Copiar artefactos de build
COPY --from=builder /app/public ./public

# Next.js standalone output
# Si standalone no está habilitado, copiar .next completo
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

# Ejecutar con Node.js directamente (standalone mode)
CMD ["node", "server.js"]
