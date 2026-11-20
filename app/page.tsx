import Link from "next/link";
import { createProject } from "@/app/actions";
import { SubmitButton } from "@/app/submit-button";
import { Welcome } from "@/app/welcome";
import { createClient } from "@/lib/supabase/server";
import type { Project } from "@/lib/types";

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; welcome?: string }>;
}) {
  const { error, welcome } = await searchParams;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name")
    .eq("id", user!.id)
    .single();

  const name = profile?.display_name ?? user?.email?.split("@")[0] ?? "";

  const { data: projects } = await supabase
    .from("projects")
    .select("id, name, description")
    .eq("archived", false)
    .order("created_at", { ascending: true });

  const { data: openTasks } = await supabase
    .from("tasks")
    .select("project_id")
    .in("status", ["todo", "in_progress"]);

  const openByProject = new Map<string, number>();
  for (const task of (openTasks ?? []) as { project_id: string }[]) {
    openByProject.set(
      task.project_id,
      (openByProject.get(task.project_id) ?? 0) + 1,
    );
  }

  return (
    <Welcome name={name} intro={welcome === "1"}>
      <main className="wrap">
        <h1>Bienvenido</h1>
        <p className="lede">Estos son los proyectos activos del grupo.</p>

        <section>
          {projects && projects.length > 0 ? (
            <div className="grid">
              {(projects as Project[]).map((project) => (
                <Link
                  className="project"
                  key={project.id}
                  href={`/projects/${project.id}`}
                >
                  <strong>{project.name}</strong>
                  {project.description ? <p>{project.description}</p> : null}
                  <span className="meta">
                    {openByProject.get(project.id) ?? 0} abiertas
                  </span>
                </Link>
              ))}
            </div>
          ) : (
            <p className="empty">
              Todavía no hay proyectos. Creá el primero abajo.
            </p>
          )}
        </section>

        <section className="section">
          <h2>Nuevo proyecto</h2>
          <div className="panel">
            {error ? (
              <p className="error">No se pudo crear el proyecto.</p>
            ) : null}

            <form action={createProject} className="stack">
              <div className="two">
                <label>
                  Nombre
                  <input name="name" required maxLength={80} />
                </label>
                <label>
                  Descripción (opcional)
                  <input name="description" maxLength={200} />
                </label>
              </div>
              <SubmitButton className="btn">Crear proyecto</SubmitButton>
            </form>
          </div>
        </section>
      </main>
    </Welcome>
  );
}
