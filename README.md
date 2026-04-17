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
│   ├── id-publico.ts       # Conversión UUID → base62 / hex corto
│   ├── constants.ts        # Constantes globales
│   └── utils.ts            # Funciones auxiliares
├── types/                  # Tipos TypeScript compartidos
└── proxy.ts                # Proxy de Next.js 16 (intercepta peticiones)
```

## Perfiles de usuario

El esquema SQL para gestionar perfiles está en `supabase/migrations/001_perfiles_usuario.sql`. Incluye:
- Tabla `public.perfiles` vinculada a `auth.users` con `ON DELETE CASCADE`.
- Trigger automático que crea el perfil al registrarse.
- **RLS inflexible**: `ENABLE` + `FORCE`, políticas granulares por operación, INSERT y DELETE bloqueados.
- Funciones `SECURITY DEFINER` en esquema `privado` (no expuesto por la API).
- Restricciones `CHECK` para validar formato de nombre de usuario, URLs y longitudes.
- Política RLS **restrictiva** para 2FA: exige `aal2` si el usuario tiene TOTP activado.
- Migración **idempotente** (segura de ejecutar múltiples veces).

## Identificadores públicos (`IdPublico`)

Componente React y utilidad para generar IDs cortos y estéticos a partir de UUIDs:

```tsx
import { IdPublico } from '@/components/ui'

<IdPublico uuid={user.id} />                  // → "4kFz9wXq"
<IdPublico uuid={user.id} prefijo="NX-" />    // → "NX-4kFz9wXq"
<IdPublico uuid={user.id} formato="hex" />    // → "550e8400"
```

Matemática: UUID (128 bits) → BigInt → división sucesiva ÷ 62 → 8 caracteres base62 (62⁸ ≈ 218 billones de combinaciones).

## Autenticación

El proyecto implementa un flujo de autenticación seguro con Supabase usando `@supabase/ssr` en Next.js 16:
- **Magic Links** y **Email + Contraseña** únicamente (sin SMS/teléfono para evitar SIM Swapping).
- Rutas protegidas bajo el grupo `(protegido)`.
- Server Actions para login, registro y cierre de sesión.

### Proxy de seguridad (`proxy.ts`)

El proxy (middleware de Next.js 16) valida sesiones server-side **antes** de renderizar cualquier ruta:

- **`getUser()` obligatorio** — valida el JWT contra el servidor de Supabase Auth (no `getSession()` que solo decodifica localmente).
- **Purga de cookies** — si el token es inválido/manipulado, elimina todas las cookies `sb-*` para evitar loops de redirección.
- **Whitelist explícita** — solo las rutas públicas listadas son accesibles sin sesión.
- **Redirección de usuarios autenticados** — login/registro redirigen a `/verificar-2fa` si ya hay sesión.
- **Headers de seguridad** — `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy`.

## Autenticación en dos pasos (2FA TOTP)

Integración de 2FA vía TOTP (Google Authenticator, Authy, etc.) usando la API de MFA de Supabase:

- **Opt-in**: el usuario activa el 2FA desde su panel de configuración.
- **Enrolamiento**: genera QR code SVG + secret manual, verifica con `challenge()` + `verify()`.
- **Post-login**: si el usuario tiene 2FA, se redirige a `/verificar-2fa` para ingresar el código TOTP.
- **RLS restrictiva**: los usuarios con 2FA activado **deben** tener `aal2` en su JWT para acceder a datos.

Flujo: Login → `/verificar-2fa` → (sin 2FA → `/panel` | con 2FA → código TOTP → `/panel`)

## Dashboard

El panel de control (`/panel`) muestra métricas de identidad y seguridad con gráficos animados:

- **Score de seguridad**: progreso radial SVG animado (geometría polar: `x = cx + r·cos(θ)`)
- **Checklist de identidad**: email verificado, 2FA activo, sesión vigente, sin teléfono vinculado
- **Gráfico de barras**: actividad semanal con IntersectionObserver y easing cúbico
- **Curva suavizada**: sesiones mensuales con splines Catmull-Rom → Bézier (C¹ continua)
- **Contadores animados**: smoothstep de Hermite `f(t) = 3t² − 2t³` para transiciones suaves

## Documentos legales

Modal interactivo (`ModalLegal`) para Términos y Condiciones y Aviso de Privacidad:

- **Scroll obligatorio**: el botón "Aceptar" permanece bloqueado hasta que el usuario haga scroll hasta el final absoluto del documento (`scrollTop + clientHeight >= scrollHeight - 2px`).
- **Barra de progreso**: indicador visual del porcentaje de lectura.
- **Timestamp de aceptación**: se registra la fecha/hora exacta de aceptación de cada documento.
- **Integrado en registro**: el formulario de crear cuenta requiere aceptar ambos documentos antes de habilitar el envío.
- **Contenido jurídico**: 9 cláusulas de T&C (objeto, definiciones, capacidad legal, uso aceptable, propiedad intelectual, limitación de responsabilidad, legislación aplicable) y 8 secciones de Aviso de Privacidad (identidad del responsable, datos recabados, finalidades, medidas de seguridad, derechos ARCO, transferencias).

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
- **Tailwind CSS v4** — PostCSS, @theme inline, modo oscuro forzado

## Diseño visual

Landing page en **modo oscuro** con paleta de alto contraste institucional:

- **Fondo**: carbón `#09090b` con gradientes radiales sutiles y grid decorativo
- **Acento**: esmeralda `#10b981` → cyan → azul (gradiente animado en el Hero)
- **Navegación**: barra sticky con glassmorphism (blur + transparencia)
- **Hero**: título tipográfico contundente, badge animado, indicadores de confianza (0 datos biométricos, 0 números telefónicos, 100% código abierto)
- **Características**: 6 tarjetas con hover glow esmeralda y micro-animaciones
- **Animaciones**: `fade-in-up` secuencial, `pulse-glow`, `gradient-shift`
- **Supabase** — Base de datos, autenticación, almacenamiento
- **TypeScript 5** — Tipado estricto
- **ESLint 9** — Flat config con reglas de Next.js

## Licencia

Pendiente de definir.
