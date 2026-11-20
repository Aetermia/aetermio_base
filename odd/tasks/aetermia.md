# Aetermia — internal project/task board

Objective: a small web app for a three-person dev group to track active projects and their tasks, so nothing gets lost in chat.
Branch: `feat/aetermia` (from `main`). Delivery: `single-pr` (feature is small enough for one PR).
Test runner: `node --test` for pure logic; `next build` + manual click-through for UI.

## Specs

S1. Every screen except login requires authentication. Supabase Auth email + password. Public signup is disabled; the three users are created by hand in the Supabase dashboard.

S2. After a user logs in, the landing screen shows exactly: `Aetermio saludos, {nombre}` — where `{nombre}` is the user's display name. "Aetermio/a" is an internal joke and must be kept verbatim, including the "o".

S3. The header banner shows exactly: `Saludos, {nombre}`.

S4. The landing screen lists active projects and allows creating a new one (name + optional description).

S5. A project screen lists its tasks grouped by status: `todo`, `in_progress`, `done`, `cancelled` (user's words: "Completadas, en progreso, anuladas" plus the implicit pending state).

S6. A task has: title (required), notes (optional free text, used as "detalles"), status, and an optional assignee.

S7. Any user can assign any task to any user. There is also a one-click "Asignarme" action on each task, because the real workflow is "solemos ver todo lo que hay que hacer y cada uno elige algo".

S8. All authenticated users have identical, full read/write rights on all data ("Los tres deberiamos tener los mismo derechos, estilo superadmin y editar cualquier cosa"). Implemented as a single RLS policy for `authenticated` on every table. No roles table, no per-user permissions.

S9. Brand comes from the supplied assets in the repo root:
- `logo.jpg` (mark + AETERMIA wordmark) for the login screen and empty states.
- `logo sin nombre y verde.jpg` (white mark on green) for the header and favicon.
- Core palette: green `#2D5C4C`, white, near-black `#030303`. No other hues.
- Contrast is verified: white on green = 7.6:1, green on white = 7.6:1. Black on green (2.75:1) is forbidden.

S10. Visual direction: ENERGY 2 / RHYTHM 1 / MOTION 1. The brand carries the character; layout stays dense and predictable. Motion only on hover and focus. Status uses the brand family only: `todo` neutral, `in_progress` green outline, `done` green filled, `cancelled` grey strikethrough.

S11. When a task has notes, its card shows a visible indicator and the detail view shows the full text.

S12. Target hosting: Vercel (app) + Supabase (database and auth). No other services.

## Tasks

- [x] T1 — Scaffold Next.js (App Router, TypeScript, no Tailwind, plain CSS). `S9` — inline. Evidence: Next 16.4.6, `next.config.ts` with cache flags off.
- [x] T2 — Supabase schema, trigger for profiles, and the single RLS policy. `S1,S8` — inline. Evidence: `supabase/schema.sql`.
- [x] T3 — Auth: login page, `proxy.ts` session refresh, redirect guard. `S1` — inline. Evidence: `GET /` without a session returns 307; `GET /login` returns 200.
- [x] T4 — Projects list + create. `S2,S4` — inline. Evidence: `app/page.tsx`.
- [x] T5 — Task board per project: status columns, create, edit status, assign, self-assign, notes. `S5,S6,S7,S11` — inline. Evidence: `app/projects/[id]/page.tsx`, `task-card.tsx`.
- [x] T6 — Brand layer: palette, header banner, logos, favicon. `S3,S9,S10` — inline. Evidence: `public/logo-mark.png` keyed from the supplied JPEG, `app/icon.png`, `app/globals.css`.
- [x] T7 — Build, typecheck, lint, click-through, README with the two manual Supabase steps. `S12` — inline. Evidence: `npm run build` OK, `npm run lint` OK, HTTP smoke test OK. Authenticated screens still need a real Supabase project.


## Log

L1 (user, verbatim): "Buenas, vamos a construir una app rapida, la idea seria que armemos la idea entre los dos y una vez definida la armamos. La cosa es asi: Tenemos un grupo de desarrollo con unos amigos y no está pasando que con un proyecto como nos manejamos por mensaje, se nos pierde lo que hay que hacer, las cosas que hizo uno y asi. La idea (se me ocurre) sea algo que primero habria que logear cada uno y de ahi se vean los proyectos activos actuales, de ahi se podria desplegar y ver tareas (Completadas, en progreso, anuladas), dividir roles (Los tres deberiamos tener los mismo derechos, estilo superadmin y editar cualquier cosa), y basicamente eso. La idea seria hostearlo en vercel y supabase ya que lo usamos nosotros nada mas."

L2 (user, verbatim): "Osea la idea seria poder asignar a cualquiera, normalmente solemos ver todo lo que hay que hacer y cada uno elije algo, pero en todo caso tambien poder "asignar" a otros, por que quizá en persona etsamos con otro y decimos "che poneme x cosa". Estaria bueno lo de notas tambien, como detalles, que cuando haya una nota. Lo quiero como algo intermedio, que tenga un poco de personalidad pero practico mas que nada, en la carpeta hay dos imagenes, el logo con nombre y sin, además de la paleta en el mismo logo. LO QUE SI: Importante: Cuando un usuario logea, tiene que decir "Aetermio saludos, X" siendo la X el nombre del usuario. Y que en el banner diga "Saludos, X""

L3 (user, verbatim): "Es correcto, es un chiste interno decir "Aetermio/a" tal cosa y asi. Si queres hacelos .svg, justo ahora no lo tengo a mano."

L4 (decision): Roles collapsed into a single `authenticated` RLS policy. A roles table for three trusting users is pure overhead. Recorded in S8.

L5 (decision): Notes are one `notes text` column on `tasks`, not a comments table. It covers "detalles" without history. Upgrade path: `task_comments` if dated authorship is ever needed.

L6 (decision): Next 16 renames middleware to `proxy.ts` and the scaffold enables `cacheComponents` + `partialPrefetching`. Both cache flags were removed: three users need no PPR, and the flags force Suspense boundaries around every authenticated read.

L7 (decision): Status and assignee selects submit on change through a small client component. No drag and drop, no modal, no client-side data layer.

L8 (verification): `npm run build` passes (TypeScript included), `npm run lint` passes, and an HTTP smoke test against the production server returned `GET /login` 200 with the form, `GET /` 307 (auth guard), `GET /icon.png` 200. Authenticated screens were not click-tested: they need a real Supabase project and the three users.

L9 (pending, user): create the Supabase project, run `supabase/schema.sql`, disable signup, create the three users, and put the URL and anon key in `.env.local`.

