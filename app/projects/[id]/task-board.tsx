"use client";

import { useState } from "react";
import {
  STATUS_LABELS,
  STATUS_ORDER,
  type Profile,
  type Task,
  type TaskStatus,
} from "@/lib/types";
import { TaskCard } from "./task-card";

export function TaskBoard({
  tasks,
  projectId,
  people,
}: {
  tasks: Task[];
  projectId: string;
  people: Profile[];
}) {
  const [active, setActive] = useState<TaskStatus>("todo");

  const items = tasks.filter((task) => task.status === active);

  // The moves make the result of a status change visible: the card leaves the
  // current tab and the target tab count goes up.
  function onKeyDown(event: React.KeyboardEvent<HTMLDivElement>) {
    const index = STATUS_ORDER.indexOf(active);
    const last = STATUS_ORDER.length - 1;
    let next = index;

    if (event.key === "ArrowRight") next = index === last ? 0 : index + 1;
    else if (event.key === "ArrowLeft") next = index === 0 ? last : index - 1;
    else if (event.key === "Home") next = 0;
    else if (event.key === "End") next = last;
    else return;

    event.preventDefault();
    setActive(STATUS_ORDER[next]);
    document.getElementById(`tab-${STATUS_ORDER[next]}`)?.focus();
  }

  return (
    <div>
      <div
        className="tabs"
        role="tablist"
        aria-label="Estado de las tareas"
        onKeyDown={onKeyDown}
      >
        {STATUS_ORDER.map((status) => (
          <button
            key={status}
            type="button"
            role="tab"
            id={`tab-${status}`}
            aria-selected={active === status}
            aria-controls="task-panel"
            tabIndex={active === status ? 0 : -1}
            className="tab"
            onClick={() => setActive(status)}
          >
            {STATUS_LABELS[status]}
            <span className="tab-count">
              {tasks.filter((task) => task.status === status).length}
            </span>
          </button>
        ))}
      </div>

      <div
        id="task-panel"
        role="tabpanel"
        aria-labelledby={`tab-${active}`}
        className="tab-panel"
      >
        {items.length === 0 ? (
          <p className="col-empty">Nada acá.</p>
        ) : (
          items.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              projectId={projectId}
              people={people}
            />
          ))
        )}
      </div>
    </div>
  );
}
