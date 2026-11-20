export type TaskStatus = "todo" | "in_progress" | "done" | "cancelled";

export const STATUS_ORDER: TaskStatus[] = [
  "todo",
  "in_progress",
  "done",
  "cancelled",
];

export const STATUS_LABELS: Record<TaskStatus, string> = {
  todo: "Pendiente",
  in_progress: "En progreso",
  done: "Completada",
  cancelled: "Anulada",
};

export type Profile = {
  id: string;
  display_name: string;
};

export type Project = {
  id: string;
  name: string;
  description: string | null;
};

export type Task = {
  id: string;
  project_id: string;
  title: string;
  notes: string | null;
  status: TaskStatus;
  assignee_id: string | null;
};
