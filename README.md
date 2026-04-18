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

## Progressive Web App (PWA)

NexoLibre funciona como app nativa sin tiendas. Configuración:

- **`manifest.json`**: `display: standalone`, `theme_color: #09090b`, íconos 192/512, shortcuts a `/chat` y `/ajustes`
- **`sw.js`**: Service Worker con caché dual:
  - **Cache-First**: assets estáticos (`/_next/static/`, fuentes, íconos)
  - **Network-First**: páginas HTML y contenido dinámico
  - **Excluye**: Supabase API, auth callbacks, extensiones
- **`RegistroSW.tsx`**: registra el SW solo en producción, comprueba actualizaciones cada hora
- **Meta tags**: `apple-mobile-web-app-capable`, `theme-color`, `apple-touch-icon`
- **CSP**: `manifest-src 'self'` + `worker-src 'self' blob:`


## Cabeceras HTTP de seguridad (`next.config.ts`)

Todas las rutas (`/:path*`) reciben las siguientes cabeceras:

| Cabecera | Valor | Propósito |
|----------|-------|-----------|
| `X-Frame-Options` | `DENY` | Anti-clickjacking |
| `X-Content-Type-Options` | `nosniff` | Anti-MIME sniffing |
| `Strict-Transport-Security` | `max-age=63072000; includeSubDomains; preload` | HSTS 2 años |
| `Referrer-Policy` | `strict-origin-when-cross-origin` | Control de referrer |
| `Permissions-Policy` | `camera=(), microphone=(), geolocation=()` | APIs deshabilitadas |
| `Content-Security-Policy` | Ver detalle abajo | Política estricta |

**Directivas CSP:**
- `default-src 'self'` — bloquea todo lo no explícito
- `script-src 'self'` — solo scripts del mismo origen
- `style-src 'self' 'unsafe-inline'` — inline requerido por Tailwind/Next
- `connect-src 'self' https://*.supabase.co wss://*.supabase.co` — API + Realtime
- `img-src 'self' blob: data: https://*.supabase.co` — avatares en Storage
- `frame-ancestors 'none'` — refuerza X-Frame-Options
- `upgrade-insecure-requests` — fuerza HTTPS

## Validación server-side (Zod)

Módulo en `src/lib/validacion.ts` — toda entrada del usuario pasa por Zod **antes** de tocar Supabase:

| Esquema | Campos | Reglas |
|---------|--------|--------|
| `esquemaMagicLink` | email | RFC 5322, trim, lowercase, max 254 |
| `esquemaInicioSesion` | email + password | Email validado + password 8-128 chars |
| `esquemaRegistro` | email + password | Idéntico a login |
| `esquemaContenidoMensaje` | texto | Max 5000 chars, sin `<script>`, `<iframe>`, `on*=`, `javascript:` |
| `esquemaUsername` | seudónimo | Regex `^[a-z0-9_]{3,30}$` |

**Anti-XSS**: regex `REGEX_HTML_PELIGROSO` rechaza etiquetas `script|iframe|object|embed|form|link|meta|base|svg`, atributos `on*=`, URIs `javascript:` y `data:text/html`.

### Anti-Open-Redirect (`/auth/callback`)

El callback de Magic Link valida el parámetro `next` antes de redirigir:

- **Whitelist estática**: solo `/panel`, `/chat`, `/ajustes` son destinos permitidos
- **Rechaza**: URLs absolutas, `//evil.com`, `\evil.com`, protocolos embebidos
- **`getBaseUrl()`**: lee `NEXT_PUBLIC_SITE_URL` server-side, valida HTTPS en producción, retorna solo `origin` (sin path/query/hash)
- **Fallback**: `/panel` si el destino no pasa la validación

## Hardening PostgreSQL (`004_hardening_constraints.sql`)

CHECK constraints nativos de la DB que actúan como **última línea de defensa** independientemente del frontend:

| Tabla | Constraint | Qué rechaza |
|-------|-----------|-------------|
| `mensajes` | `contenido_sin_html_peligroso` | `<script>`, `<iframe>`, `<object>`, `<embed>` |
| `mensajes` | `contenido_sin_event_handlers` | `onerror=`, `onclick=`, `onload=`, etc. |
| `mensajes` | `contenido_sin_uri_peligrosa` | `javascript:`, `data:` URIs |
| `perfiles` | `nombre_completo_sin_html` | HTML peligroso en nombre |
| `perfiles` | `biografia_sin_html` / `biografia_sin_uri_peligrosa` | HTML y URIs en bio |
| `chats` | `nombre_chat_sin_html` | HTML peligroso en nombre de grupo |

**Políticas RLS restrictivas adicionales**:
- `mensajes_insert_contenido_valido` — rechaza INSERT con contenido null/vacío/whitespace/> 5000 chars
- `perfiles_update_campos_seguros` — solo el propietario, con username ≥ 3 chars

**Auditoría de clientes Supabase**: los 3 clientes (browser, server, proxy) usan exclusivamente `PUBLISHABLE_KEY` (anon). No existe `service_role` en el código — todas las operaciones pasan por RLS.

## Panel de Administración (`/live-stats`)

Se ha implementado una ruta `/live-stats` exclusiva para administradores. 
- **Validación de Admin**: La ruta compara el correo electrónico del usuario activo contra la variable de entorno `ADMIN_EMAIL` (por defecto `admin@nexolibre.com`).
- **Terminal Cibernética**: Muestra un contador gigante de usuarios activos empleando `Supabase Realtime Presence` sobre el canal `presencia-global`. Emite logs de conexión simulados y cuenta con animaciones CRT con Tailwind CSS.

## Botón de Pánico (Anti-Snooping)

La interfaz de chat cuenta con un **Botón de Pánico** para situaciones donde el usuario necesite ocultar inmediatamente la aplicación.
- **Activación**: Se activa presionando el botón rojo flotante o simplemente presionando la tecla `Escape` (Esc) en el teclado.
- **Reacción Instantánea**: Aplica un filtro visual `backdrop-blur-3xl` a pantalla completa en el mismo frame para ocultar el contenido.
- **Borrado Local**: Destruye sincrónicamente los tokens de sesión en `localStorage` y las claves de cifrado en `sessionStorage`.
- **Redirección Invisible**: Ejecuta `window.location.replace('https://duckduckgo.com')` en menos de 100ms para evadir el historial (back button).



## Mensajes Efímeros y Autodestrucción

Los usuarios pueden optar por enviar mensajes con tiempo de expiración.
- **Base de Datos**: Se utiliza la columna `expira_en` (tipo `timestamptz`) en la tabla `mensajes`.
- **Limpieza Física**: Un cron job de Postgres (`pg_cron`) programado para correr cada minuto ejecuta la consulta `DELETE FROM public.mensajes WHERE expira_en <= now()`. Esto garantiza la destrucción irreversible de la información en el servidor.
- **Interfaz (UI)**: El menú desplegable dentro de la caja de chat permite seleccionar si el mensaje desaparece en "1 hora", "24 horas" o se conserva permanentemente.

## Envoltorio Anti-Capturas de Pantalla (Anti-Screenshot Wrapper)

Se implementó un componente `AntiScreenshotWrapper.tsx` que envuelve el texto de los mensajes en el chat para dificultar la toma de capturas de pantalla o fotografías con el teléfono móvil:
- **Ruido SVG Inyectado**: Utiliza un filtro `<feTurbulence>` nativo de SVG combinado con la directiva CSS `mix-blend-overlay` para superponer estática estocástica sobre la tipografía de forma invisible al escáner tradicional pero altamente intrusiva en capturas fotográficas.
- **Patrón Moiré CSS**: Implementa una cuadrícula fina repetitiva animada con `mix-blend-difference` a una opacidad del 15%. Este patrón engaña a los algoritmos de autoenfoque y añade artefactos visuales severos (Banding de Moiré) cuando se fotografía desde la pantalla.
- **Parpadeo de Alta Frecuencia (Flicker)**: Mediante animaciones de fotograma clave (keyframes), el elemento oscila a una alta frecuencia imperceptible conscientemente para el humano, pero lo suficiente como para arruinar capturas instantáneas (que capturan fotogramas oscuros o lavados).
- **Prevención de Copia**: Utiliza `select-none` y `pointer-events-none` para evitar el subrayado natural del texto en SO y prevenir copiado/pegado básico de forma nativa.


## Invitaciones seguras (`005_invitaciones.sql`)

Sistema de invitaciones de un solo uso con token criptográfico:

- **Token**: `crypto.randomBytes(32)` → 64 hex chars, validado por CHECK `^[a-f0-9]{64}$`
- **Expiración**: 24 horas (`caduca_en = now() + interval '24 hours'`)
- **Un solo uso**: función atómica `privado.consumir_invitacion()` (SECURITY DEFINER) marca `usado = true` + `usado_por` + `usado_en` en un solo UPDATE con WHERE
- **Límite**: máximo 5 invitaciones activas por usuario (validado server-side)
- **RLS**: solo el creador puede ver sus invitaciones, UPDATE bloqueado desde el cliente
- **Ruta**: `/join/[token]` — pública, muestra CTA para registro si no autenticado
- **UI**: `PanelInvitaciones` con generación, copia al portapapeles, historial con estados

## Perfiles de usuario

El esquema SQL para gestionar perfiles está en `supabase/migrations/001_perfiles_usuario.sql`. Incluye:
- Tabla `public.perfiles` vinculada a `auth.users` con `ON DELETE CASCADE`.
- Trigger automático que crea el perfil al registrarse.
- **RLS inflexible**: `ENABLE` + `FORCE`, políticas granulares por operación, INSERT y DELETE bloqueados.
- Funciones `SECURITY DEFINER` en esquema `privado` (no expuesto por la API).
- Restricciones `CHECK` para validar formato de nombre de usuario, URLs y longitudes.
- Política RLS **restrictiva** para 2FA: exige `aal2` si el usuario tiene TOTP activado.
- Migración **idempotente** (segura de ejecutar múltiples veces).

## Sistema de chat en tiempo real

Esquema SQL en `supabase/migrations/002_sistema_chat.sql`. Arquitectura:

```
auth.users ─┬─ participantes_chat ─── chats
             │         │
             └──── mensajes ──────────┘ (Realtime)
```

- **3 tablas**: `chats` (conversaciones), `participantes_chat` (pivote M:N), `mensajes` (con Realtime)
- **Supabase Realtime**: habilitado en `mensajes` via `alter publication supabase_realtime add table public.mensajes`
- **Replica Identity Full**: envía el row completo en eventos UPDATE/DELETE
- **RLS estricta por participación**: un usuario solo puede leer/insertar mensajes en chats donde es participante
- **Anti-suplantación**: `(select auth.uid()) = autor_id` en INSERT impide enviar mensajes como otro usuario
- **Trigger**: actualiza `chats.actualizado_en` al enviar mensaje (para ordenar por último mensaje)
- **Permisos por columna**: `grant update (contenido, editado)` en mensajes, `grant update (nombre)` en chats

### Interfaz de chat

Ruta protegida `/chat` con layout split-view responsive:

- **Desktop (md+)**: sidebar fija 320px + ventana de chat `flex-1` side-by-side
- **Mobile (<md)**: alterna entre lista y ventana con botón "volver"
- **Burbujas**: mensajes propios en esmeralda (`accent`), ajenos en `surface-elevated`, agrupados por autor
- **Textarea**: auto-resize hasta 120px, `Enter` envía, `Shift+Enter` salto de línea
- **Datos demo**: si no hay chats en la DB, muestra conversaciones de ejemplo

### Cliente Realtime (`useChatRealtime`)

Hook que conecta la UI con Supabase en `src/app/(protegido)/chat/_componentes/useChatRealtime.ts`:

- **Suscripción INSERT**: `supabase.channel().on('postgres_changes', { event: 'INSERT', table: 'mensajes', filter: 'chat_id=eq.X' })`
- **Optimistic updates**: el mensaje aparece al instante; si el INSERT falla, se hace rollback
- **Deduplicación**: evita duplicados entre el update optimista y el evento Realtime
- **Auto-scroll inteligente**: solo scrollea si el usuario está dentro de 150px del fondo (`behavior: 'smooth'`)
- **Cache de nombres**: resuelve `autor_id → nombre` una vez y cachea en `useRef`
- **Cleanup**: `supabase.removeChannel()` al cambiar de chat o desmontar

### Skeleton Loaders

Componentes en `src/app/(protegido)/chat/_componentes/`:

- **`SkeletonChats`**: 6 filas con avatar circular + líneas de texto shimmer, replica la estructura exacta de la sidebar
- **`SkeletonMensajes`**: header + 8 burbujas alternadas izquierda/derecha con anchos variados + input inferior
- **Condiciones**: sidebar muestra skeleton mientras `cargandoChats === true`; ventana muestra skeleton cuando `cargando && mensajes.length === 0`
- **Animación**: `animate-pulse` nativo de Tailwind con capas `bg-surface-elevated` a distintas opacidades

### Cifrado end-to-end (E2EE)

Módulo en `src/lib/crypto/e2ee.ts`. Supabase **nunca ve texto plano** — solo ciphertext:

- **Algoritmo**: AES-256-GCM (cifrado autenticado: confidencialidad + integridad)
- **IV**: 12 bytes aleatorios por mensaje (NIST SP 800-38D), nunca reutilizado
- **Payload**: `e2ee:base64url(iv).base64url(ciphertext)` — prefijo permite compatibilidad con mensajes legacy
- **Almacenamiento de claves**: protegidas en localStorage con PBKDF2 (600k iteraciones SHA-256 + sal)
- **Integración**: el hook cifra antes de `INSERT` y descifra al cargar y al recibir via Realtime

### Presencia en tiempo real (Presence)

Hook en `src/app/(protegido)/chat/_componentes/usePresencia.ts`:

- **Online/Offline**: canal `presencia-global` con `userId` como key, punto verde con animación `pulse` en el avatar de la sidebar
- **Escribiendo...**: canal `escribiendo-{chatId}` con `track({ escribiendo: true })`, auto-reset a `false` tras 2s sin teclear
- **Header dinámico**: muestra "escribiendo" con dots animados (`bounce` con delay escalonado), "En línea" en verde, o "Desconectado" en gris
- **Cleanup**: `untrack()` + `removeChannel()` al cambiar de chat o desmontar

### Buscador seguro de usuarios

Componente en `src/components/ui/BuscadorUsuarios/BuscadorUsuarios.tsx`:

- **Anti-filtración**: NO permite búsqueda por nombre — solo por ID público (base62) o correo electrónico exacto
- **Debounce**: 400ms de espera antes de consultar Supabase
- **Validación de formato**: regex para email (`^[^\s@]+@[^\s@]+\.[^\s@]+$`) e ID alfanumérico (`^[0-9a-zA-Z]{6,32}$`)
- **Auto-exclusión**: el usuario actual y participantes existentes se filtran de los resultados
- **Ayuda contextual**: mensaje de privacidad visible cuando el input está vacío

## Ajustes de privacidad

Ruta protegida `/ajustes` con controles de privacidad local:

- **Modo Efímero**: al cerrar sesión, purga automática de claves E2EE, caches y sessionStorage
- **Borrar al cerrar**: limpia mensajes visibles al abandonar la app (activado automáticamente por Modo Efímero)
- **Ocultar previsualizaciones**: reemplaza contenido en sidebar por "Mensaje nuevo"
- **Purga manual**: botón destructivo para borrar datos locales inmediatamente
- **Toggle accesible**: `role="switch"` con `aria-checked`, animación `cubic-bezier(0.4,0,0.2,1)`
- **Integración**: `BotonCerrarSesion` ejecuta `ejecutarPurgaSiEfimero()` client-side antes del Server Action

## Onboarding de primer inicio de sesión

Modal no-dismissable que aparece cuando `nombre_usuario` es `null` en la tabla `perfiles`:

- **Detección server-side**: el layout protegido consulta `perfiles.nombre_usuario` y pasa `requiereOnboarding` al provider client
- **Username**: validación en tiempo real con regex (`^[a-z0-9_]{3,30}$`), debounce 400ms para verificar unicidad en DB
- **Avatar**: upload a Supabase Storage bucket `avatares`, ruta `{userId}/avatar.{ext}`, límite 2MB, preview instantáneo
- **Migración SQL** (`003_storage_avatares.sql`): bucket público con RLS que confina cada usuario a su carpeta `userId/*`

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

- **Next.js 16** — App Router, Server Components, Turbopack, Proxy (middleware)
- **React 19** — Server Components, Suspense, use()
- **Tailwind CSS v4** — PostCSS, @theme inline, modo oscuro forzado
- **Supabase** — Base de datos PostgreSQL, Auth (MFA/TOTP), RLS
- **TypeScript 5** — Tipado estricto, target ES2020
- **ESLint 9** — Flat config con reglas de Next.js
- **pnpm 10** — Gestor de paquetes (obligatorio)

## Diseño visual

Landing page en **modo oscuro** con paleta de alto contraste institucional:

- **Fondo**: carbón `#09090b` con gradientes radiales sutiles y grid decorativo
- **Acento**: esmeralda `#10b981` → cyan → azul (gradiente animado en el Hero)
- **Navegación**: barra sticky con glassmorphism (blur + transparencia)
- **Hero**: título tipográfico contundente, badge animado, indicadores de confianza (0 datos biométricos, 0 números telefónicos, 100% código abierto)
- **Características**: 6 tarjetas con hover glow esmeralda y micro-animaciones
- **Animaciones**: `fade-in-up` secuencial, `pulse-glow`, `gradient-shift`

### Mejoras de UX y Accesibilidad (WCAG)

- **Optimización Táctil**: Alturas mínimas de `44px` en botones de auth y casillas de verificación grandes (`h-5 w-5`) para cumplir con los estándares de usabilidad móvil.
- **Feedback Visual Inmediato**: Implementación de Toasts modernos mediante `sonner` (con `aria-live="polite"`) para retroalimentación instantánea (p.ej. envío de Magic Link).
- **Contraste de Texto Mejorado**: Uso sistemático de colores legibles (`text-gray-200` y `text-gray-400`) sobre fondos oscuros, garantizando un alto ratio de contraste.
- **Navegación por Teclado**: Elementos interactivos y tarjetas informativas (`tabIndex={0}`) incluyen bordes de foco contrastantes (`focus:ring-2 focus:ring-accent focus:ring-offset-2 focus:ring-offset-black`).
- **Semántica en Íconos**: Atributo `aria-hidden="true"` implementado en gráficos decorativos (SVGs) para evitar ruido semántico en lectores de pantallas.
- **Onboarding Guiado**: Flujo de bienvenida opcional con componente `OnboardingTour` interactivo y desenfoque de fondo (`backdrop-blur`).
- **Dashboard Mobile-First**: Reestructuración de métricas y gráficos para pantallas pequeñas (`flex-col`, `overflow-x-auto`), manteniendo el *layout* intacto sin colapsos de texto.
- **Métricas Estandarizadas**: Componente `StatusCard` global para presentar estados de seguridad (Activo/Inactivo) con iconografía accesible y paleta WCAG.

## Despliegue

### Requisitos previos

- **Node.js** ≥ 18.0.0
- **pnpm** 10.x (obligatorio — no usar npm ni yarn)
- Proyecto en Supabase con Email Auth habilitado

### Variables de entorno

| Variable | Tipo | Descripción |
|----------|------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Build + Runtime | URL de tu proyecto Supabase |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Build + Runtime | Clave pública (publishable key) |
| `NEXT_PUBLIC_SITE_URL` | Runtime | URL de tu dominio en producción |

> **⚠️ Importante**: las variables `NEXT_PUBLIC_*` se incrustan **estáticamente en el bundle del cliente** durante `pnpm build`. Deben estar disponibles en build time, no solo en runtime. Son seguras de exponer porque solo permiten operaciones que RLS autoriza.

### Opción 1: Vercel (recomendado)

1. Importa el repositorio en [vercel.com/new](https://vercel.com/new)
2. En **Settings → General**:
   - Framework Preset: **Next.js**
   - Build Command: **`pnpm build`**
   - Install Command: **`pnpm install --frozen-lockfile`**
3. En **Settings → Environment Variables**, agrega:
   ```
   NEXT_PUBLIC_SUPABASE_URL = https://xxx.supabase.co
   NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = sb_publishable__xxx
   NEXT_PUBLIC_SITE_URL = https://tu-dominio.vercel.app
   ```
4. En el dashboard de Supabase → **Authentication → URL Configuration**:
   - Site URL: `https://tu-dominio.vercel.app`
   - Redirect URLs: `https://tu-dominio.vercel.app/auth/callback`

### Opción 2: Docker

El proyecto incluye un `Dockerfile` multi-stage optimizado:

```bash
# Build de la imagen (las NEXT_PUBLIC_* van como build-args)
docker build \
  --build-arg NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co \
  --build-arg NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable__xxx \
  --build-arg NEXT_PUBLIC_SITE_URL=https://tu-dominio.com \
  -t nexolibre .

# Ejecutar el contenedor
docker run -p 3000:3000 \
  -e NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co \
  -e NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable__xxx \
  -e NEXT_PUBLIC_SITE_URL=https://tu-dominio.com \
  nexolibre
```

El Dockerfile:
- Usa `pnpm install --frozen-lockfile` (reproducibilidad exacta)
- Build multi-stage de 4 etapas (base → deps → builder → runner)
- Imagen final `node:20-alpine` (~150MB)
- Usuario no-root (`nextjs:nodejs`)
- Telemetría de Next.js desactivada
- Output `standalone` para mínimo tamaño

### Opción 3: VPS / Self-hosting

```bash
# 1. Clonar e instalar
git clone https://github.com/KimJesus22/Nexo-Libre.git
cd Nexo-Libre
pnpm install --frozen-lockfile

# 2. Configurar variables de entorno
cp .env.example .env.local
# Editar .env.local con tus credenciales reales

# 3. Build de producción (con pnpm obligatoriamente)
pnpm build

# 4. Ejecutar
pnpm start
# La app estará en http://localhost:3000
```

Para servir con un reverse proxy (nginx/Caddy), apunta al puerto 3000.

### Configurar Supabase para producción

1. **Dashboard → Authentication → Providers** → Habilitar Email
2. **Dashboard → Authentication → URL Configuration**:
   - Site URL: tu dominio de producción
   - Redirect URLs: `https://tu-dominio.com/auth/callback`
3. **Dashboard → SQL Editor** → Ejecutar `supabase/migrations/001_perfiles_usuario.sql`
4. **Dashboard → Authentication → MFA** → Verificar que TOTP esté habilitado

## Licencia

Pendiente de definir.
