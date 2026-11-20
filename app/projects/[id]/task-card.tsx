"use client";

import { assignToMe, saveNotes, saveTask } from "@/app/actions";
import {
  STATUS_LABELS,
  STATUS_ORDER,
  type Profile,
  type Task,
} from "@/lib/types";

export function TaskCard({
  task,
  projectId,
  people,
}: {
  task: Task;
  projectId: string;
  people: Profile[];
}) {
  return (
    <article className="task" data-status={task.status}>
      <div className="task-head">
        <h4 className="task-title">{task.title}</h4>
        {task.notes ? <span className="chip">nota</span> : null}
      </div>

      <form action={saveTask} className="stack">
        <input type="hidden" name="task_id" value={task.id} />
        <input type="hidden" name="project_id" value={projectId} />

        <div className="row">
          {/* Keyed on the saved value: an uncontrolled select keeps whatever it had,
              so without this the control lies until a full reload. */}
          <select
            key={`status-${task.status}`}
            className="grow"
            name="status"
            defaultValue={task.status}
            aria-label="Estado"
          >
            {STATUS_ORDER.map((status) => (
              <option key={status} value={status}>
                {STATUS_LABELS[status]}
              </option>
            ))}
          </select>

          <select
            key={`assignee-${task.assignee_id ?? "none"}`}
            className="grow"
            name="assignee_id"
            defaultValue={task.assignee_id ?? ""}
            aria-label="Asignado a"
          >
            <option value="">Sin asignar</option>
            {people.map((person) => (
              <option key={person.id} value={person.id}>
                {person.display_name}
              </option>
            ))}
          </select>
        </div>

        <button className="save" type="submit">
          Guardar
        </button>
      </form>

      <div className="row">
        <form action={assignToMe}>
          <input type="hidden" name="task_id" value={task.id} />
          <input type="hidden" name="project_id" value={projectId} />
          <button className="mini" type="submit">
            Asignarme
          </button>
        </form>
      </div>

      <details>
        <summary>{task.notes ? "Ver nota" : "Agregar nota"}</summary>
        <form action={saveNotes} className="stack">
          <input type="hidden" name="task_id" value={task.id} />
          <input type="hidden" name="project_id" value={projectId} />
          <textarea
            name="notes"
            defaultValue={task.notes ?? ""}
            maxLength={500}
            aria-label="Nota"
          />
          <button className="mini" type="submit">
            Guardar nota
          </button>
        </form>
      </details>
    </article>
  );
}
