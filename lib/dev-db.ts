// Local stand-in for Supabase so the UI can be clicked without a project.
// shortcut: no RLS, no GoTrue, no profile trigger, data resets on restart.
// Enabled with AETERMIA_LOCAL_DB=1. Vercel never sets it, so prod stays real.

type Row = Record<string, unknown>;
type Table = "profiles" | "projects" | "tasks" | "links" | "place_cells";

export type CookieIO = {
  get: (
    name: string,
  ) =>
    | { value: string }
    | undefined
    | Promise<{ value: string } | undefined>;
  set: (name: string, value: string) => unknown;
};

export const USER_COOKIE = "aetermia_user";

type User = {
  id: string;
  email: string;
  user_metadata: { full_name: string };
};

export function decodeUser(raw: string | undefined): User | null {
  if (!raw) return null;

  const [id, name, email] = raw.split("|").map(decodeURIComponent);
  if (!id || !name) return null;

  return { id, email: email ?? "", user_metadata: { full_name: name } };
}

function encodeUser(user: User) {
  return [user.id, user.user_metadata.full_name, user.email]
    .map(encodeURIComponent)
    .join("|");
}

// On globalThis so every route bundle shares one store in the dev server.
const globals = globalThis as unknown as { __aetermiaDb?: Record<Table, Row[]> };

function store(): Record<Table, Row[]> {
  if (!globals.__aetermiaDb) {
    const now = new Date().toISOString();
    const projectId = crypto.randomUUID();
    const task = (title: string, status: string, notes: string | null = null) => ({
      id: crypto.randomUUID(),
      project_id: projectId,
      title,
      notes,
      status,
      assignee_id: null,
      created_at: now,
      updated_at: now,
    });
    const cell = (col: number, value: string, background: string | null = null) => ({
      row_index: 0,
      col_index: col,
      value,
      font_family: null,
      font_size: 14,
      color: null,
      background,
      updated_at: now,
    });

    globals.__aetermiaDb = {
      profiles: [],
      links: [],
      projects: [
        {
          id: projectId,
          name: "Proyecto de prueba",
          description: "Datos locales, se borran al reiniciar el servidor.",
          archived: false,
          created_at: now,
        },
      ],
      tasks: [
        task("Tarea pendiente", "todo"),
        task("Tarea en progreso", "in_progress", "Esta tarea tiene una nota."),
        task("Tarea completada", "done"),
        task("Tarea anulada", "cancelled"),
      ],
      place_cells: [
        cell(0, "Local", "#eceee8"),
        cell(1, "Dónde está", "#eceee8"),
        cell(2, "Folletos", "#eceee8"),
        cell(3, "Anotado", "#eceee8"),
        { ...cell(0, "Panadería La Esquina"), row_index: 1 },
        { ...cell(1, "Rivadavia 1234"), row_index: 1 },
        { ...cell(2, "Sí, 50"), row_index: 1 },
        { ...cell(3, "Volver en marzo"), row_index: 1 },
      ],
    };
  }

  return globals.__aetermiaDb;
}

// Only the columns each table really has. The stand-in used to spray every
// column over every table, which hid inserts the real schema would reject.
function defaultsFor(table: Table): Row {
  if (table === "place_cells") return {};

  const now = new Date().toISOString();
  const base = { id: crypto.randomUUID(), created_at: now };

  if (table === "projects") {
    return { ...base, archived: false, description: null };
  }

  if (table === "tasks") {
    return { ...base, updated_at: now, status: "todo", assignee_id: null, notes: null };
  }

  return base;
}

type Op = "select" | "insert" | "update" | "delete" | "upsert";

function builder(table: Table, op: Op, payload: Row = {}, conflict = "id") {
  const filters: ((row: Row) => boolean)[] = [];
  let orderBy: string | null = null;
  let ascending = true;
  let one = false;

  function exec() {
    const rows = store()[table];

    if (op === "upsert") {
      const keys = conflict.split(",").map((key) => key.trim());
      const hit = rows.find((row) =>
        keys.every((key) => row[key] === payload[key]),
      );
      if (hit) {
        Object.assign(hit, payload);
        return { data: hit, error: null };
      }
    }

    if (op === "insert" || op === "upsert") {
      const row: Row = { ...defaultsFor(table), ...payload };
      rows.push(row);
      return { data: row, error: null };
    }

    if (op === "update") {
      const hit = rows.filter((row) => filters.every((filter) => filter(row)));
      for (const row of hit) Object.assign(row, payload);
      return { data: hit, error: null };
    }

    if (op === "delete") {
      for (let index = rows.length - 1; index >= 0; index--) {
        if (filters.every((filter) => filter(rows[index]))) rows.splice(index, 1);
      }
      return { data: null, error: null };
    }

    let out = rows.filter((row) => filters.every((filter) => filter(row)));
    if (orderBy) {
      const column = orderBy;
      out = [...out].sort(
        (a, b) =>
          String(a[column]).localeCompare(String(b[column])) *
          (ascending ? 1 : -1),
      );
    }

    return { data: one ? (out[0] ?? null) : out, error: null };
  }

  const api = {
    eq(column: string, value: unknown) {
      filters.push((row) => row[column] === value);
      return api;
    },
    in(column: string, values: unknown[]) {
      filters.push((row) => values.includes(row[column]));
      return api;
    },
    order(column: string, options?: { ascending?: boolean }) {
      orderBy = column;
      ascending = options?.ascending ?? true;
      return api;
    },
    single() {
      one = true;
      return api;
    },
    then<T>(
      onFulfilled: (value: ReturnType<typeof exec>) => T,
      onRejected?: (reason: unknown) => T,
    ) {
      return Promise.resolve(exec()).then(onFulfilled, onRejected);
    },
  };

  return api;
}

export function createLocalClient(cookies: CookieIO) {
  async function currentUser() {
    const cookie = await cookies.get(USER_COOKIE);
    return decodeUser(cookie?.value);
  }

  return {
    auth: {
      async getUser() {
        return { data: { user: await currentUser() } };
      },

      async signInWithPassword({
        email,
        password,
      }: {
        email: string;
        password: string;
      }) {
        if (!email || !password) {
          return { error: { message: "Email y contraseña son obligatorios." } };
        }

        const name = (email.split("@")[0] || "Usuario").replace(
          /^./,
          (char) => char.toUpperCase(),
        );
        const user: User = {
          id: `user-${name.toLowerCase()}`,
          email,
          user_metadata: { full_name: name },
        };

        await cookies.set(USER_COOKIE, encodeUser(user));

        const db = store();
        if (!db.profiles.some((profile) => profile.id === user.id)) {
          db.profiles.push({
            id: user.id,
            display_name: name,
            created_at: new Date().toISOString(),
          });
        }

        return { error: null };
      },

      async signOut() {
        await cookies.set(USER_COOKIE, "");
        return { error: null };
      },
    },

    from(table: Table) {
      return {
        select: () => builder(table, "select"),
        insert: (values: Row) => builder(table, "insert", values),
        upsert: (values: Row, options?: { onConflict?: string }) =>
          builder(table, "upsert", values, options?.onConflict),
        update: (values: Row) => builder(table, "update", values),
        delete: () => builder(table, "delete"),
      };
    },
  };
}
