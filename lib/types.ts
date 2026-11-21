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

export type ProjectLink = {
  id: string;
  label: string;
  url: string;
};

export type PlaceCell = {
  row_index: number;
  col_index: number;
  value: string;
  font_family: string | null;
  font_size: number | null;
  color: string | null;
  background: string | null;
};

export type CellInput = {
  row: number;
  col: number;
  value: string;
  font_family: string | null;
  font_size: number | null;
  color: string | null;
  background: string | null;
};

// An allowlist, not a free text field: these land in inline CSS after coming
// back from the browser.
export const SHEET_FONTS = [
  { value: "", label: "Predeterminada" },
  { value: "Manrope", label: "Sans" },
  { value: "Georgia", label: "Con serifa" },
  { value: "Courier New", label: "Monoespaciada" },
  { value: "Arial", label: "Arial" },
];

export const SHEET_SIZES = [12, 14, 16, 20, 24];
export const SHEET_ROWS = 12;
export const SHEET_COLS = 6;
export const CELL_MAX = 200;

// Supabase signs in by email, the group signs in by name. The three accounts
// live on this domain, so a bare user name is turned into one before the call.
export const USER_DOMAIN = "aetermia.app";

export function toEmail(value: string) {
  const clean = value.trim().toLowerCase();
  return clean.includes("@") ? clean : `${clean}@${USER_DOMAIN}`;
}
