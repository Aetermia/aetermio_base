import Image from "next/image";
import Link from "next/link";
import { logout } from "@/app/actions";
import { NavTabs } from "@/app/nav-tabs";
import { createClient } from "@/lib/supabase/server";

export async function Header() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name")
    .eq("id", user.id)
    .single();

  const name = profile?.display_name ?? user.email?.split("@")[0] ?? "";

  return (
    <header className="bar">
      <Link className="brand" href="/" aria-label="Aetermia">
        <Image src="/logo-mark.png" alt="" width={30} height={30} priority />
        <span>AETERMIA</span>
      </Link>

      <NavTabs />

      <div className="bar-right">
        <span className="greeting">Saludos, {name}</span>
        <form action={logout}>
          <button className="ghost" type="submit">
            Salir
          </button>
        </form>
      </div>
    </header>
  );
}
