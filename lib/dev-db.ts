// Local stand-in for Supabase so the UI can be clicked without a project.
// shortcut: no RLS, no GoTrue, no profile trigger, data resets on restart.
// Enabled with AETERMIA_LOCAL_DB=1. Vercel never sets it, so prod stays real.

type Row = Record<string, unknown>;
type Table = "profiles" | "projects" | "tasks";

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

    globals.__aetermiaDb = {
      profiles: [],
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
    };
  }

  return globals.__aetermiaDb;
}

type Op = "select" | "insert" | "update";

function builder(table: Table, op: Op, payload: Row = {}) {
  const filters: ((row: Row) => boolean)[] = [];
  let orderBy: string | null = null;
  let ascending = true;
  let one = false;

  function exec() {
    const rows = store()[table];

    if (op === "insert") {
      const row: Row = {
        id: crypto.randomUUID(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        archived: false,
        status: "todo",
        assignee_id: null,
        notes: null,
        description: null,
        ...payload,
      };
      rows.push(row);
      return { data: row, error: null };
    }

    if (op === "update") {
      const hit = rows.filter((row) => filters.every((filter) => filter(row)));
      for (const row of hit) Object.assign(row, payload);
      return { data: hit, error: null };
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
        update: (values: Row) => builder(table, "update", values),
      };
    },
  };
}
