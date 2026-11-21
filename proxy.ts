import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { createLocalClient } from "@/lib/dev-db";
import { supabaseConfig } from "@/lib/supabase/config";

// Local UI smoke test only. See lib/dev-db.ts.
const LOCAL = process.env.AETERMIA_LOCAL_DB === "1";

export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = LOCAL
    ? (createLocalClient({
        get: (name) => request.cookies.get(name),
        set: () => {},
      }) as never)
    : buildClient();

  function buildClient() {
    const { url, key } = supabaseConfig();

    return createServerClient(url, key, {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
        },
      },
    });
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const isLogin = request.nextUrl.pathname === "/login";

  if (!user && !isLogin) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.search = "";
    return NextResponse.redirect(url);
  }

  if (user && isLogin) {
    const url = request.nextUrl.clone();
    url.pathname = "/";
    url.search = "";
    return NextResponse.redirect(url);
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|icon.png|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
