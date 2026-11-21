// The canonical names carry the NEXT_PUBLIC_ prefix, but nothing here ever
// reaches the browser: every Supabase call happens on the server. So the plain
// names are accepted too, which is what this project ended up with.
const NAMES = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_SUPABASE_URL",
  "SUPABASE_URL",
];

const KEYS = [
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "NEXT_SUPABASE_ANON_KEY",
  "SUPABASE_ANON_KEY",
];

function first(names: string[]) {
  for (const name of names) {
    const value = process.env[name];
    if (value) return { name, value };
  }
  return null;
}

export function supabaseConfig() {
  const url = first(NAMES);
  const key = first(KEYS);

  if (!url || !key) {
    throw new Error(
      `Supabase is not configured for this deployment: none of ${NAMES.join(", ")} and none of ${KEYS.join(", ")} is set. Environment changes on Vercel only apply to a new deployment.`,
    );
  }

  return { url: url.value, key: key.value };
}
