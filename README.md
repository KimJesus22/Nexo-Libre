# NexoLibre

Plataforma modular construida con **Next.js 16**, **Tailwind CSS v4** y **Supabase**.

## Requisitos previos

- **Node.js** ≥ 18
- **pnpm** ≥ 10 (gestor de paquetes exclusivo)

## Inicio rápido

```bash
# 1. Clonar el repositorio
git clone <tu-repositorio> NexoLibre
cd NexoLibre

# 2. Instalar dependencias
pnpm install

# 3. Configurar variables de entorno
#    Copia .env.example a .env.local y rellena las credenciales de Supabase
cp .env.example .env.local

# 4. Arrancar el servidor de desarrollo (con Turbopack)
pnpm dev
```

La aplicación estará disponible en `http://localhost:3000`.

## Scripts disponibles

| Comando            | Descripción                              |
| ------------------ | ---------------------------------------- |
| `pnpm dev`         | Servidor de desarrollo con Turbopack     |
| `pnpm build`       | Compilación optimizada para producción   |
| `pnpm start`       | Servidor de producción                   |
| `pnpm lint`        | Análisis estático con ESLint             |
| `pnpm typecheck`   | Verificación de tipos TypeScript         |

## Estructura del proyecto

```
src/
├── app/                    # App Router de Next.js
│   ├── globals.css         # Sistema de diseño + Tailwind v4
│   ├── layout.tsx          # Layout raíz (idioma: español)
│   ├── page.tsx            # Página principal
│   ├── loading.tsx         # Esqueleto de carga
│   ├── error.tsx           # Página de error
│   └── not-found.tsx       # Página 404
├── components/
│   ├── ui/                 # Componentes reutilizables (botones, inputs...)
│   └── layout/             # Componentes estructurales (cabecera, pie...)
├── hooks/                  # Hooks personalizados de React
├── lib/
│   ├── supabase/
│   │   ├── client.ts       # Cliente público (navegador)
│   │   ├── server.ts       # Cliente privilegiado (servidor)
│   │   ├── proxy.ts        # Manejo de la sesión para el proxy
│   │   ├── types.ts        # Tipos generados de la base de datos
│   │   └── index.ts        # Barrel export
│   ├── constants.ts        # Constantes globales
│   └── utils.ts            # Funciones auxiliares
├── types/                  # Tipos TypeScript compartidos
└── proxy.ts                # Proxy de Next.js 16 (intercepta peticiones)
```

## Autenticación

El proyecto implementa un flujo de autenticación seguro con Supabase usando `@supabase/ssr` en Next.js 16:
- **Magic Links** y **Email + Contraseña** únicamente (sin SMS/teléfono para evitar SIM Swapping).
- Manejo de sesiones automático a través del `proxy.ts`.
- Rutas protegidas bajo el grupo `(protegido)`.
- Server Actions para login, registro y cierre de sesión.

## Supabase

### Configurar credenciales

Edita `.env.local` con las credenciales de tu proyecto Supabase:

```env
NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable__tu-clave-publica
```

### Generar tipos de la base de datos

```bash
pnpm supabase gen types typescript --project-id <tu-project-id> > src/lib/supabase/types.ts
```

### Uso en la aplicación

```tsx
// En un Client Component
import { createClient } from '@/lib/supabase/client'
const supabase = createClient()

// En un Server Component / Server Action / Route Handler
import { createClient } from '@/lib/supabase/server'
const supabase = await createClient()
```

## Tecnologías

- **Next.js 16** — App Router, Server Components, Turbopack
- **React 19** — Server Components, Suspense, use()
- **Tailwind CSS v4** — PostCSS, @theme inline, modo oscuro automático
- **Supabase** — Base de datos, autenticación, almacenamiento
- **TypeScript 5** — Tipado estricto
- **ESLint 9** — Flat config con reglas de Next.js

## Licencia

Pendiente de definir.
