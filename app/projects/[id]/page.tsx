import Link from "next/link";
import { notFound } from "next/navigation";
import { createTask } from "@/app/actions";
import { SubmitButton } from "@/app/submit-button";
import { createClient } from "@/lib/supabase/server";
import {
  STATUS_LABELS,
  STATUS_ORDER,
  type Profile,
  type Task,
} from "@/lib/types";
import { TaskCard } from "./task-card";

export default async function ProjectPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { id } = await params;
  const { error } = await searchParams;

  const supabase = await createClient();

  const { data: project } = await supabase
    .from("projects")
    .select("id, name, description")
    .eq("id", id)
    .single();

  if (!project) notFound();

  const { data: tasks } = await supabase
    .from("tasks")
    .select("id, project_id, title, notes, status, assignee_id")
    .eq("project_id", id)
    .order("created_at", { ascending: true });

  const { data: people } = await supabase
    .from("profiles")
    .select("id, display_name")
    .order("display_name", { ascending: true });

  const list = (tasks ?? []) as Task[];
  const team = (people ?? []) as Profile[];

  return (
    <main className="wrap">
      <p className="crumb">
        <Link href="/">Proyectos</Link>
      </p>
      <h1>{project.name}</h1>
      <p className="lede">{project.description ?? "Sin descripción."}</p>

      <section className="section">
        <h2>Nueva tarea</h2>
        <div className="panel">
          {error ? <p className="error">No se pudo crear la tarea.</p> : null}

          <form action={createTask} className="stack">
            <input type="hidden" name="project_id" value={project.id} />
            <div className="two">
              <label>
                Título
                <input name="title" required maxLength={120} />
              </label>
              <label>
                Nota (opcional)
                <input name="notes" maxLength={500} />
              </label>
            </div>
            <SubmitButton className="btn">Agregar tarea</SubmitButton>
          </form>
        </div>
      </section>

      <section className="section">
        <div className="board">
          {STATUS_ORDER.map((status) => {
            const items = list.filter((task) => task.status === status);

            return (
              <div className="col" key={status}>
                <div className="col-head">
                  <span className={`dot ${status}`} aria-hidden="true" />
                  <h3>{STATUS_LABELS[status]}</h3>
                  <span className="count">{items.length}</span>
                </div>

                {items.length === 0 ? (
                  <p className="col-empty">Nada acá.</p>
                ) : (
                  items.map((task) => (
                    <TaskCard
                      key={task.id}
                      task={task}
                      projectId={project.id}
                      people={team}
                    />
                  ))
                )}
              </div>
            );
          })}
        </div>
      </section>
    </main>
  );
}
