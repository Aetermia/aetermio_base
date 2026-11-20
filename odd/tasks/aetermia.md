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

S15. Task statuses live in the four-column board, side by side and visible at once; the columns scroll horizontally on a narrow screen instead of stacking, because a stacked layout hid the moved card below the fold and read as "it did nothing".

S16. Status and assignee selects never clip their text. A board column is about 230px wide, so the two selects stack inside the card.

S17. A project has links: a label the group recognizes plus a URL, listed on the project screen between the edit block and the new-task form. Only http and https targets are accepted. A link can be removed.

S18. A status or assignee change is applied by an explicit `Guardar` button inside the task card, not on select change. After it saves, the control shows the stored value without a reload: an uncontrolled select keeps whatever the user last picked, so it must be keyed on the stored value.

S19. A task's title and note are editable from the card through an `Editar` block. Notes and title save together; there is no separate note editor.

S20. The intro must dismiss even if no JavaScript ever runs. Its timings are CSS animations, and the page reveals itself from a CSS rule, so a failed or slow hydration cannot leave the app green forever.

S21. The banner carries two tabs, `Proyectos` and `Lugares`, and the current one is marked. Both stay reachable from every screen, including a phone, where the tabs move to a second row of the banner instead of shrinking.

S22. `Lugares` is a spreadsheet: labelled columns, numbered rows, one cell per input. A cell holds a value plus a font, a size, a text colour and a background colour, and it saves when the cell is left. Cells outside the stored range are empty; the grid can be grown with `Agregar fila` and `Agregar columna`.

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
- [x] T12 — Post-login intro overlay and `Bienvenido` headline. `S2` — inline. Evidence: `app/welcome.tsx`, login redirects to `/?welcome=1`. The overlay renders the page as children and mounts them only at the reveal, so nothing of the app is visible during the fade: sampled in the browser at 150ms intervals, `overlay: true, page: false` for the whole intro, then the page appears. Screenshot of the green frame with the white mark and the greeting.
- [x] T13 — Project links: `links` table, create and remove actions, list UI. `S17` — inline. Evidence: `createLink`/`deleteLink` with an http/https check, `supabase/schema.sql`, `links` in `lib/dev-db.ts` with a delete op (7/7 self-checks). Added `Deploy de pruebas` in the browser, list rendered with the real href, `Quitar` returned to the empty state.
- [x] T14 — Four-column board restored, horizontally scrollable under 760px. `S15` — inline. Evidence: at 390px the board measured 350px wide with 962px of scroll width; at 1280px the four columns show at once.
- [x] T15 — Selects stacked inside the card so labels never clip. `S16` — inline. Evidence: 0 of 8 selects report `scrollWidth > clientWidth` at 390px, and the desktop board shows `Completada`, `En progreso`, `Sin asignar` in full.
- [x] T16 — Explicit `Guardar` in the task card, replacing the `onChange` auto-submit. `S18` — inline. Evidence: select changed to Completada without saving left the columns untouched; pressing `Guardar` moved the card (Pendiente 1→0, Completada 1→2). Same for the assignee: `Ezequiel` persisted and the control showed it without a reload.
- [x] T17 — Edit a task's title and note from the card. `S19` — inline. Evidence: `updateTask` replaces `saveNotes`; the `Editar` block swapped the separate note editor. Renamed `Tarea pendiente` to `Tarea renombrada` in the browser and the column re-rendered with the new title.
- [x] T18 — Intro dismissal moved to CSS. `S20` — inline. Evidence: with `.welcome` and `.page` injected into a live page and no React involved, the page computed `visibility: hidden` at t=0 and `visible` at t=2600 while the overlay went to `hidden`. Full login run: overlay visible and page hidden at the start, overlay out of the DOM, page visible, URL cleaned.
- [x] T19 — Banner tabs with the active section marked. `S21` — inline. Evidence: `nav-tabs.tsx` reads the pathname; `Proyectos*` on `/` with `h1` Bienvenido, `Lugares*` on `/lugares`. At 390px the banner measured 112px tall with the two tabs on a second row, 178x44 each, no page overflow.
- [x] T20 — The `Lugares` sheet. `S22` — inline. Evidence: `place_cells` in `supabase/schema.sql` with `(row_index, col_index)` as primary key, `saveCell` upserting on that pair, 8/8 self-checks including the upsert. Typed into A4, set Georgia 20, red text and a green background, reloaded, and the cell came back with all four. `Agregar fila` and `Agregar columna` grew the grid 12x6 to 13x7.


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

L22 (user, verbatim): "Bien, que salga el fundido primero y RECIEN ahi se vea la pagina. Sigue sin funcionar lo de las tareas, lo que te digo es que no cambia cuando le doy otro estado. Y me gustaba es tablero que habias armado antes que salian las tareas al lado e iban poniendose segun dond van. Hagamos asi para los estados de las tareas, que cuando lo cambio tenga que \"guardar\" en la misma tarea asi se ejecuta el cambio"

L23 (root cause of "no cambia"): the write was fine, the control was lying. `TaskCard` is a client component and both selects were uncontrolled with `defaultValue`, so React never re-applied the stored value after a save. The status looked right only because a changed status moves the card to another column, which remounts it; the assignee kept showing `Sin asignar` until a full reload. Proven in the browser: after `Asignarme` the select still read `Sin asignar`, and a page reload showed `Ezequiel`. Fixed with `key` on both selects, keyed on the stored value.

L24 (decision): the auto-submit on `select` change is gone. Saving is an explicit `Guardar` inside the card, which also removes the hydration race that made a change silently do nothing right after load. One form now saves status and assignee together; `Asignarme` remains a one-click shortcut.

L25 (tabs rolled back): T14 shipped status tabs and the user asked for the board back. The board is restored. The original "no cambia" was the stale control, not the layout, so the reason I wrote for the tabs (L18) was incomplete.

L26 (user, verbatim): "Bien, falta que las tareas tengan un botón de editar e IMPORTANTE, el fundido aparece al logar pero NO SE VA"

L27 (intro): could not reproduce a stuck overlay. A sampling run installed before the login click recorded the real timeline: `/?welcome=1` with the overlay visible and the page hidden, page visible at +2050ms, overlay gone at +2350ms, URL cleaned right after. But that dismissal depended on React hydration and on `router.replace`, so a failed hydration or a stale dev bundle would leave the green screen forever with no way out. The timing now lives in CSS: `.welcome` fades itself to `visibility: hidden` at 2500ms and `.page` reveals itself at 2500ms through `page-in`. The JS only removes the overlay and cleans the URL. Verified with `.welcome` and `.page` injected outside React: hidden at t=0, visible at t=2600.

L28 (reduced motion): the global `animation: none !important` would have left `.page` hidden forever, since its only reveal is an animation. The reduced-motion block sets `.page { visibility: visible }` and hides the overlay, so that path also cannot strand the page.

L29 (user, verbatim): "Bien, ahora quiero añadir un ultimo detalle. Que arriba en el banner haya dos solapas tipo pestaña, una sea esta de \"Proyectos\" y otra de \"Lugares\", al entrar tiene que mostrar una planilla estilo Excel, la idea seria que la editiemos (Edición sencilla, tipos de letra, tamaño y color de letra y fondo) y ahi pongamos lo que son los locales que fuimos, donde estan, si mandamos folletos y asi"

L30 (sheet storage): one row per touched cell, keyed on `(row_index, col_index)`. The grid has no stored size: its height and width come from the highest stored indexes, so `Agregar fila` is view state only and the first write to a new row is what persists it. A cell that was never touched has no row at all, which is why an empty grid costs nothing.

L31 (colours): the first version only wrote on blur, and a colour picker does not reliably blur when its native dialog closes. Changing a colour and reloading lost it. Colours now write 500ms after the last pick, and still on blur. Verified: red text and a green background survived a reload.

L32 (provenance): font, size and colours arrive from the browser and end up in inline CSS, so they are allowlisted in `saveCell` instead of trusted: fonts must be one of `SHEET_FONTS`, sizes one of `SHEET_SIZES`, colours a `#rrggbb` string.

L33 (stand-in child defaults): the local stand-in used to spray `id`, `status`, `notes`, `archived` and friends into every insert, so an insert the real schema would reject looked fine locally. Defaults are now per table, and `place_cells` has none: it has no `id` column at all.

