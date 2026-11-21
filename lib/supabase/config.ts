// Both runtimes need this: a missing variable used to surface as the library's
// own message, which says nothing about where the value is supposed to come from.
export function supabaseConfig() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    throw new Error(
      "Supabase is not configured for this deployment: NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY must exist in the Vercel project for Production, and environment changes only apply to a new deployment.",
    );
  }

  return { url, key };
}
