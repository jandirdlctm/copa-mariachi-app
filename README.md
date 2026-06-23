# La Copa Mariachi Internacional 7v7 — App de torneo en vivo

Aplicación web de torneo de fútbol 7v7 en vivo para **La Copa Mariachi
Internacional** (Fontana, California · 22–23 de agosto · premio **$20,000**).

Dos lados:

- **Sitio público** (sin login): marcadores en vivo, bracket, tablas de grupo,
  goleadores y el rastreador del premio de $20,000. Todo se actualiza en
  **tiempo real** (~1 s) vía Supabase Realtime, sin recargar.
- **Panel de administración** (`/admin`): el dueño configura equipos y
  calendario; los capturistas por cancha registran marcadores en vivo. Tablas,
  clasificados, bracket, goleadores y el rastreador se **calculan** a partir de
  los resultados — nunca se editan a mano.

## Stack

- Next.js 15 (App Router) + React 19 + TypeScript
- Supabase (Postgres, Row Level Security, Realtime)
- Tailwind CSS
- `@supabase/supabase-js` y `@supabase/ssr`

Todo corre **localmente** (`npm run dev`). No hay configuración de despliegue.

---

## 1. Crear el proyecto de Supabase

1. Entra a [supabase.com](https://supabase.com) → **New project**.
2. Cuando esté listo, ve a **Settings → API** y copia:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public** key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role** key (¡secreta!) → `SUPABASE_SERVICE_ROLE_KEY`

## 2. Variables de entorno

```bash
cp .env.local.example .env.local
```

Edita `.env.local` y pega tus llaves:

```
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
ADMIN_PASSWORD=elige-una-contraseña
SESSION_SECRET=una-cadena-larga-aleatoria
```

> `SUPABASE_SERVICE_ROLE_KEY`, `ADMIN_PASSWORD` y `SESSION_SECRET` **solo** se
> usan en código de servidor y nunca llegan al navegador.

## 3. Correr las migraciones

En el dashboard de Supabase: **SQL Editor → New query**, y ejecuta **en orden**:

1. `supabase/migrations/0001_init.sql` (tablas)
2. `supabase/migrations/0002_rls_realtime.sql` (RLS + publicación Realtime)

Esto habilita RLS (lectura pública, sin escrituras anónimas) y publica las
tablas `games`, `teams`, `scorers` para Realtime.

> Con Supabase CLI: `supabase db push` también aplica las migraciones.

## 4. Instalar y sembrar datos

```bash
npm install
npm run seed     # 1 torneo, 32 equipos (8 grupos), calendario, 3 PINs, goleadores
```

El seed deja el torneo **publicado** para que el sitio público muestre datos al
instante. PINs de capturista creados: **Cancha 1 → 1111**, **Cancha 2 → 2222**,
**Cancha 3 → 3333**.

## 5. Correr la app

```bash
npm run dev
```

- Público: <http://localhost:3000>
- Admin: <http://localhost:3000/admin>

---

## Cómo se usa

### Dueño (`/admin`, contraseña = `ADMIN_PASSWORD`)
- **Equipos**: agrega equipos (nombre, abreviatura, grupo A–H), mueve entre
  grupos o elimina. El color se asigna solo.
- **Calendario**: **Generar calendario** crea el round-robin de cada grupo y
  los partidos de eliminatoria (Octavos → Cuartos → Semifinales → Final con sus
  etiquetas de origen). **Publicar** muestra/oculta el torneo al público.
- **Marcador**: consola de captura para todas las canchas.
- **Tabla**: vista previa de la clasificación (solo lectura).
- **PINs**: crea/ve los PINs por cancha.

### Capturista (`/admin`, con PIN de cancha)
- Solo ve la consola **Marcador en vivo**, filtrada a su cancha.
- Por partido: **Iniciar**, **+ / −** por equipo, **+Gol** (registra goleador),
  minuto, **Finalizar**, **Reabrir / corregir**.
- Cada botón llama a un *server action* que escribe en Supabase; el sitio
  público se actualiza por Realtime.

## Formato del torneo

32 equipos · 8 grupos de 4 · cada equipo juega 3 partidos (round-robin). Los
**2 mejores** de cada grupo avanzan a la **eliminatoria directa**: Octavos de
final (16) → Cuartos → Semifinales → Final. El campeón se lleva los $20,000.

> Las llaves de eliminatoria usan siembra estilo Mundial (1°A vs 2°B, 1°C vs
> 2°D, …). Si un partido de eliminatoria termina empatado no se modela tanda de
> penales: corrige el marcador para definir al ganador.

## Arquitectura (puntos clave)

- **Nada derivado se almacena.** Clasificación, clasificados, avance del
  bracket y el rastreador del premio se calculan en `lib/standings.ts` (puro y
  con pruebas unitarias) desde `games` + `teams`.
- **Realtime.** `components/RealtimeProvider.tsx` se suscribe a
  `postgres_changes` (games/teams/scorers, filtrado por torneo) y re-deriva todo
  al instante.
- **Seguridad.** RLS permite solo lectura pública; **ninguna** escritura
  anónima. Todas las escrituras pasan por *server actions* con el service-role
  key (servidor), validando la contraseña/PIN antes de escribir. El service key
  nunca llega al bundle del cliente (`import "server-only"`).
- **Avance del bracket.** Al **Finalizar** un partido de eliminatoria,
  `lib/advance.ts` escribe los equipos ganadores en la siguiente ronda.

## Pruebas

```bash
npm test          # pruebas unitarias de lib/standings.ts (Vitest)
```

## Verificar tiempo real (criterio de aceptación)

1. Abre el público en una ventana y `/admin/marcador` en otra.
2. Inicia un partido y suma un gol en el admin.
3. El marcador, la tabla, los goleadores y el bracket cambian en el público en
   **~1 segundo**, sin recargar.

## Estructura

```
app/
  (public)/        layout + Partidos (/), bracket, tabla
  admin/           login, equipos, calendario, marcador, pins, tabla, actions.ts
components/        Crest, GameCard, Ticker, StandingsTable, Bracket,
                   PrizeTracker, Scorers, SponsorSlot, ScoreConsole, ...
lib/               standings.ts (+ test), schedule.ts, advance.ts, auth.ts,
                   queries.ts, adminQueries.ts, supabaseClient/Server.ts, types.ts
supabase/migrations/   0001_init.sql, 0002_rls_realtime.sql
scripts/seed.mjs       datos de demostración
public/images/logo.png
```
