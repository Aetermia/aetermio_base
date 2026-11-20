import { Sheet } from "@/app/lugares/sheet";
import { createClient } from "@/lib/supabase/server";
import type { PlaceCell } from "@/lib/types";

export default async function PlacesPage() {
  const supabase = await createClient();
  const { data } = await supabase.from("place_cells").select("*");

  return (
    <main className="wrap">
      <h1>Lugares</h1>
      <p className="lede">
        Los locales, dónde están y si dejamos folletos. Cada celda se guarda sola
        al salir de ella.
      </p>

      <Sheet cells={(data ?? []) as PlaceCell[]} />
    </main>
  );
}
