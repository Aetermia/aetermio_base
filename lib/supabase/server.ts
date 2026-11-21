import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { createLocalClient } from "@/lib/dev-db";
import { supabaseConfig } from "@/lib/supabase/config";

// Server Components cannot write cookies; the proxy refreshes the session.
export async function createClient() {
  const cookieStore = await cookies();

  // Local UI smoke test only. See lib/dev-db.ts.
  if (process.env.AETERMIA_LOCAL_DB === "1") {
    return createLocalClient(cookieStore) as never;
  }

  const { url, key } = supabaseConfig();

  return createServerClient(url, key, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options),
          );
        } catch {
          // Called from a Server Component. Session refresh happens in proxy.ts.
        }
      },
    },
  });
}
