"use client";

import {
  assignToMe,
  saveNotes,
  setTaskAssignee,
  setTaskStatus,
} from "@/app/actions";
import {
  STATUS_LABELS,
  STATUS_ORDER,
  type Profile,
  type Task,
} from "@/lib/types";

function submitOnChange(event: React.ChangeEvent<HTMLSelectElement>) {
  event.currentTarget.form?.requestSubmit();
}

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

      <div className="row">
        <form action={setTaskStatus} className="grow">
          <input type="hidden" name="task_id" value={task.id} />
          <input type="hidden" name="project_id" value={projectId} />
          <select
            name="status"
            defaultValue={task.status}
            onChange={submitOnChange}
            aria-label="Estado"
          >
            {STATUS_ORDER.map((status) => (
              <option key={status} value={status}>
                {STATUS_LABELS[status]}
              </option>
            ))}
          </select>
        </form>

        <form action={setTaskAssignee} className="grow">
          <input type="hidden" name="task_id" value={task.id} />
          <input type="hidden" name="project_id" value={projectId} />
          <select
            name="assignee_id"
            defaultValue={task.assignee_id ?? ""}
            onChange={submitOnChange}
            aria-label="Asignado a"
          >
            <option value="">Sin asignar</option>
            {people.map((person) => (
              <option key={person.id} value={person.id}>
                {person.display_name}
              </option>
            ))}
          </select>
        </form>
      </div>

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
