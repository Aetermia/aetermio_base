# Aetermia — internal project/task board

Objective: a small web app for a three-person dev group to track active projects and their tasks, so nothing gets lost in chat.
Branch: `feat/aetermia` (from `main`). Delivery: `single-pr` (feature is small enough for one PR).
Test runner: `node --test` for pure logic; `next build` + manual click-through for UI.

## Specs

S1. Every screen except login requires authentication. Supabase Auth email + password. Public signup is disabled; the three users are created by hand in the Supabase dashboard.

S2. The greeting `Aetermio saludos, {nombre}` belongs to the post-login intro, not to the landing screen: a green panel wipes down from the top to fill the viewport, the white logo appears centered, and the greeting renders below it. The landing screen headline reads exactly `Bienvenido`. "Aetermio/a" is an internal joke and must be kept verbatim.

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

S13. A project can be renamed and its description edited after creation, from the project screen.

S14. A status or assignee change must be persisted. When the write fails, the screen must say so instead of leaving the control showing a value the database never accepted.

S15. Task statuses are tabs, not side-by-side columns. Changing a status must visibly remove the task from the current tab and increase the count of its target tab, at every viewport. A stacked column layout hides the move below the fold on a phone, which reads as "it did nothing".

S16. Status and assignee selects never clip their text, at any viewport width.

S17. A project has links: a label the group recognizes plus a URL, listed on the project screen between the edit block and the new-task form. Only http and https targets are accepted. A link can be removed.

## Tasks

- [x] T1 — Scaffold Next.js (App Router, TypeScript, no Tailwind, plain CSS). `S9` — inline. Evidence: Next 16.4.6, `next.config.ts` with cache flags off.
- [x] T2 — Supabase schema, trigger for profiles, and the single RLS policy. `S1,S8` — inline. Evidence: `supabase/schema.sql`.
- [x] T3 — Auth: login page, `proxy.ts` session refresh, redirect guard. `S1` — inline. Evidence: `GET /` without a session returns 307; `GET /login` returns 200.
- [x] T4 — Projects list + create. `S2,S4` — inline. Evidence: `app/page.tsx`.
- [x] T5 — Task board per project: status columns, create, edit status, assign, self-assign, notes. `S5,S6,S7,S11` — inline. Evidence: `app/projects/[id]/page.tsx`, `task-card.tsx`.
- [x] T6 — Brand layer: palette, header banner, logos, favicon. `S3,S9,S10` — inline. Evidence: `public/logo-mark.png` keyed from the supplied JPEG, `app/icon.png`, `app/globals.css`.
- [x] T7 — Build, typecheck, lint, click-through, README with the two manual Supabase steps. `S12` — inline. Evidence: `npm run build` OK, `npm run lint` OK, HTTP smoke test OK. Authenticated screens still need a real Supabase project.
- [x] T8 — Mobile header and login accessibility. `S10` — inline. Evidence: brand wordmark hidden below 480px, `aria-label` keeps the link named; login gets a visually hidden `h1`. `npm run build` and `npm run lint` pass. Not visually measured yet (no Supabase project).
- [x] T9 — Local stand-in so the UI can be reviewed without a Supabase project. `S1,S4,S5,S7,S11` — inline. Evidence: `lib/dev-db.ts`, self-check `lib/dev-db.test.mjs` (6/6 pass), full HTTP click-through recorded in L12.
- [x] T10 — Edit project name and description. `S13` — inline. Evidence: `updateProject` in `app/actions.ts`, `Editar proyecto` details block on the project screen. Clicked in the browser: renamed to "Tablero Aetermia" with a corrected description, and the home grid showed both.
- [x] T12 — Post-login intro overlay and `Bienvenido` headline. `S2` — inline. Evidence: `app/welcome.tsx`, `.welcome` rules in `globals.css`, login action redirects to `/?welcome=1`. Screenshot at the end of the wipe: green fills the viewport, white mark centered at a 280px box, greeting below. After the timer the overlay unmounts and the URL is cleaned.
- [x] T13 — Project links: `links` table, create and remove actions, list UI. `S17` — inline. Evidence: `createLink`/`deleteLink` with an http/https check, `supabase/schema.sql`, `links` in `lib/dev-db.ts` with a delete op (7/7 self-checks). Added `Deploy de pruebas` in the browser, list rendered with the real href, `Quitar` returned to the empty state.
- [x] T14 — Status tabs replacing the four columns. `S15` — inline. Evidence: `task-board.tsx`. Changing a task from the Pendiente tab left the panel reading `Nada acá` and moved the counts 1→0 and 1→2 without scrolling.
- [x] T15 — Full-width selects on narrow screens. `S16` — inline. Evidence: at 390px each select measured 328px with `scrollWidth` equal to `clientWidth` and labels `Completada` / `Sin asignar` unclipped.


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

L10 (verification, resume): the repo already contains every task from prompts L1 and L2, committed in `4709a1b`. Brand green sampled from `logo sin nombre y verde.jpg` is exactly `rgb(45,92,76)` = `#2D5C4C`, matching S9. Two defects fixed in T8: the header had no breakpoint (the greeting wrapped onto two lines around 360px) and the login page had no heading.

L11 (blocker): without `.env.local` every route throws, because `createClient` receives undefined credentials. `docker` is not installed, so no local Supabase either. The only unverified part of the feature is the authenticated click-through. That needs a real Supabase project.

L12 (verification, click-through): `docker`, `psql` and WSL distros are all absent, so `supabase start` is not an option on this machine. Instead `lib/dev-db.ts` implements the slice of the Supabase client the app uses, behind `AETERMIA_LOCAL_DB=1`. Click-through against the dev server, action by action: `GET /` 307 to `/login`; `GET /login` 200 with the form; login action 303 with the session cookie; `GET /` 200 rendering `Aetermio saludos, Ezequiel` and `Saludos, Ezequiel`; seeded project page renders the four columns with 4 `Asignarme` buttons, 1 note chip, 1 `Ver nota`, 3 `Agregar nota`; create task 200 and the task appears (5 cards, 2 chips); status to `done` moves it (column counts 1/1/2/1); `Asignarme` sets the assignee; `saveNotes` overwrites the note text; create project 200 and the grid grows to 2; second login as `ana@aetermia.dev` renders `Aetermio saludos, Ana` and the assignee dropdown lists both names; logout 303 to `/login` with an empty cookie. No errors or warnings in the dev server log.

L13 (limit of T9): the stand-in returns full rows and ignores the `select` column list, has no RLS, no GoTrue and no profile trigger, and keeps data in a `globalThis` map that dies on restart. It is a UI harness. The real Supabase path is still unexercised (L11).

L14 (user, verbatim): "Bien, falta que se pueda editar los proyectos (por si olvidé algo en la descripción o cambio el titulo) y que caudno cambio de estado una tarea esta cambie realmente"

L15 (verification, browser): the status change was already working. In a real browser session, moving `Tarea pendiente` from Pendiente to Completada moved the card to the other column with no reload (Pendiente went to 0 and rendered "Nada acá", Completada to 2), and a follow-up read of the same project confirmed `data-status="done"` persisted. The failure the user feared is real but different: `patchTask` ignored the Supabase error and the select is uncontrolled, so a rejected write would leave the control showing a value the database rejected. T11 closes that.

L16 (gotcha): changing the status requires hydration. A select fired before React attaches its `onChange` does nothing and the page keeps the old value, which looks exactly like a broken write. Uncontrolled selects were left as they are for server-action forms; making them controlled would reset the value before `requestSubmit` serializes it.

L17 (user, verbatim): "Bien, ahora quiero dos cosas: Primero, una vez que haces el login y está correcto tiene que hacer un fundido que venga desde arriba del color verde que llene la pagina, de ahi que aparezca en el medio el logo (en blanco para que haga contraste) y debajo del logo diga \"Aetermiosaludos, X\" siendo X el nombre del que entra. Ya una vez dentro en donde ponia lo de \"Aetermiosaludos...\" ponga solo bienvenido. Tambien me gustaria que en los proyectos haya una zona entre el editar y la nueva tarea haya una zona de \"Enlaces\" ... Lo que decia de las tareas es que al cambiar cualquiera de las opciones \"Completado, en progres, etc.\" no lo cambia de solapa. Y fijate que no se ve bien del todo, tipo \"Completado\" se corta y \"En progreso\" tambien"

L18 (diagnosis): the status change did persist, but the board stacked its four columns vertically below 600px, so the card moved out of the viewport instead of visibly moving. That is why it read as "no cambia de solapa". T14 replaced the columns with tabs; the counts change in place and the card leaves the visible panel.

L19 (gotcha, intro): `window.history.replaceState` on mount is the wrong way to clean `?welcome=1`. Next patches history, re-renders the route without the param, and the overlay unmounts in the same frame, so it never appears. The cleanup now runs through `router.replace("/")` when the timer ends.

L20 (copy): the request wrote `Aetermiosaludos` with no space. Kept `Aetermio saludos, {nombre}`, matching S2 and L3, where the joke is "Aetermio saludos" as a greeting.

L21 (limit): the intro motion was verified by freezing the finished frame in the browser, not frame by frame. The wipe and fade timings are deterministic CSS keyframes and were not captured mid-flight. Under `prefers-reduced-motion: reduce` the overlay is hidden entirely, so it cannot get stuck without its animation.

