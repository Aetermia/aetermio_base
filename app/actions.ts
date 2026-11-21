"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  CELL_MAX,
  SHEET_COLS,
  SHEET_FONTS,
  SHEET_ROWS,
  SHEET_SIZES,
  STATUS_ORDER,
  toEmail,
  type CellInput,
  type PlaceCell,
  type TaskStatus,
} from "@/lib/types";

function text(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

export async function login(formData: FormData) {
  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email: toEmail(text(formData, "email")),
    password: String(formData.get("password") ?? ""),
  });

  if (error) redirect("/login?error=1");
  redirect("/?welcome=1");
}

export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}

export async function createProject(formData: FormData) {
  const name = text(formData, "name");
  if (!name) redirect("/?error=1");

  const supabase = await createClient();
  const { error } = await supabase.from("projects").insert({
    name,
    description: text(formData, "description") || null,
  });

  if (error) redirect("/?error=1");
  revalidatePath("/");
}

export async function createTask(formData: FormData) {
  const projectId = text(formData, "project_id");
  const title = text(formData, "title");
  const back = `/projects/${projectId}`;

  if (!projectId || !title) redirect(`${back}?error=1`);

  const supabase = await createClient();
  const { error } = await supabase.from("tasks").insert({
    project_id: projectId,
    title,
    notes: text(formData, "notes") || null,
  });

  if (error) redirect(`${back}?error=1`);
  revalidatePath(back);
}

async function patchTask(
  taskId: string,
  projectId: string,
  patch: Record<string, unknown>,
) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("tasks")
    .update({ ...patch, updated_at: new Date().toISOString() })
    .eq("id", taskId);

  // Surface the failure: an unchecked write leaves the select showing a value
  // the database never accepted.
  if (error) redirect(`/projects/${projectId}?error=1`);
  revalidatePath(`/projects/${projectId}`);
}

export async function updateProject(formData: FormData) {
  const projectId = text(formData, "project_id");
  const name = text(formData, "name");
  const back = `/projects/${projectId}`;

  if (!projectId || !name) redirect(`${back}?error=1`);

  const supabase = await createClient();
  const { error } = await supabase
    .from("projects")
    .update({ name, description: text(formData, "description") || null })
    .eq("id", projectId);

  if (error) redirect(`${back}?error=1`);
  revalidatePath("/");
  revalidatePath(back);
}

export async function saveTask(formData: FormData) {
  const taskId = text(formData, "task_id");
  const projectId = text(formData, "project_id");
  const status = text(formData, "status") as TaskStatus;
  const assigneeId = text(formData, "assignee_id");

  if (!taskId || !STATUS_ORDER.includes(status)) return;
  await patchTask(taskId, projectId, {
    status,
    assignee_id: assigneeId || null,
  });
}

export async function assignToMe(formData: FormData) {
  const taskId = text(formData, "task_id");
  const projectId = text(formData, "project_id");

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!taskId || !user) return;
  await patchTask(taskId, projectId, { assignee_id: user.id });
}

export async function updateTask(formData: FormData) {
  const taskId = text(formData, "task_id");
  const projectId = text(formData, "project_id");
  const title = text(formData, "title");

  if (!taskId || !title) redirect(`/projects/${projectId}?error=1`);

  await patchTask(taskId, projectId, {
    title,
    notes: text(formData, "notes") || null,
  });
}

function isHttpUrl(value: string) {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

export async function createLink(formData: FormData) {
  const projectId = text(formData, "project_id");
  const label = text(formData, "label");
  const url = text(formData, "url");
  const back = `/projects/${projectId}`;

  if (!projectId || !label || !isHttpUrl(url)) redirect(`${back}?error=1`);

  const supabase = await createClient();
  const { error } = await supabase
    .from("links")
    .insert({ project_id: projectId, label, url });

  if (error) redirect(`${back}?error=1`);
  revalidatePath(back);
}

export async function deleteLink(formData: FormData) {
  const linkId = text(formData, "link_id");
  const projectId = text(formData, "project_id");

  if (!linkId) return;

  const supabase = await createClient();
  const { error } = await supabase.from("links").delete().eq("id", linkId);

  if (error) redirect(`/projects/${projectId}?error=1`);
  revalidatePath(`/projects/${projectId}`);
}

function hexColor(value: string | null) {
  return value && /^#[0-9a-f]{6}$/i.test(value) ? value : null;
}

// Called on every cell blur, so it deliberately does not revalidate: a refresh
// per keystroke would churn the router for data the client already has.
export async function saveCell(input: CellInput) {
  const row = Math.trunc(Number(input.row));
  const col = Math.trunc(Number(input.col));

  if (!(row >= 0 && row < 500) || !(col >= 0 && col < 60)) {
    return { ok: false };
  }

  const size = Number(input.font_size);
  const font = String(input.font_family ?? "");

  const supabase = await createClient();
  const { error } = await supabase.from("place_cells").upsert(
    {
      row_index: row,
      col_index: col,
      value: String(input.value ?? "").slice(0, CELL_MAX),
      font_family: SHEET_FONTS.some((item) => item.value === font) && font ? font : null,
      font_size: SHEET_SIZES.includes(size) ? size : null,
      color: hexColor(input.color),
      background: hexColor(input.background),
      updated_at: new Date().toISOString(),
    },
    { onConflict: "row_index,col_index" },
  );

  return { ok: !error };
}

async function sheet() {
  const supabase = await createClient();
  const { data } = await supabase.from("place_cells").select("*");
  return { supabase, cells: (data ?? []) as PlaceCell[] };
}

// The grid has no stored size: it is as big as the lowest empty row, and the
// minimums keep a sheet worth looking at on day one.
function size(cells: PlaceCell[]) {
  return {
    rows: Math.max(SHEET_ROWS, ...cells.map((cell) => cell.row_index + 1)),
    cols: Math.max(SHEET_COLS, ...cells.map((cell) => cell.col_index + 1)),
  };
}

function asRow(cell: PlaceCell) {
  return {
    row_index: cell.row_index,
    col_index: cell.col_index,
    value: String(cell.value ?? "").slice(0, CELL_MAX),
    font_family: cell.font_family,
    font_size: cell.font_size,
    color: cell.color,
    background: cell.background,
    updated_at: new Date().toISOString(),
  };
}

function emptyLine(row: number, col: number): PlaceCell {
  return {
    row_index: row,
    col_index: col,
    value: "",
    font_family: null,
    font_size: null,
    color: null,
    background: null,
  };
}

export async function addSheetRow() {
  const { supabase, cells } = await sheet();
  const { rows, cols } = size(cells);
  const line = Array.from({ length: cols }, (_, col) =>
    asRow(emptyLine(rows, col)),
  );

  await supabase
    .from("place_cells")
    .upsert(line, { onConflict: "row_index,col_index" });
  revalidatePath("/lugares");
}

export async function addSheetCol() {
  const { supabase, cells } = await sheet();
  const { rows, cols } = size(cells);
  const line = Array.from({ length: rows }, (_, row) =>
    asRow(emptyLine(row, cols)),
  );

  await supabase
    .from("place_cells")
    .upsert(line, { onConflict: "row_index,col_index" });
  revalidatePath("/lugares");
}

// Removing a row closes the gap: everything below moves up one index. Every
// row from the deleted one down is dropped first, then the moved cells are
// written back, so a half empty row cannot leave a copy of itself behind.
export async function removeSheetRow(row: number) {
  const at = Math.trunc(Number(row));
  const { supabase, cells } = await sheet();
  if (!cells.some((cell) => cell.row_index === at)) return;

  const moved = cells
    .filter((cell) => cell.row_index > at)
    .map((cell) => asRow({ ...cell, row_index: cell.row_index - 1 }));

  await supabase.from("place_cells").delete().gte("row_index", at);

  if (moved.length) {
    await supabase
      .from("place_cells")
      .upsert(moved, { onConflict: "row_index,col_index" });
  }

  revalidatePath("/lugares");
}

export async function removeSheetCol(col: number) {
  const at = Math.trunc(Number(col));
  const { supabase, cells } = await sheet();
  if (!cells.some((cell) => cell.col_index === at)) return;

  const moved = cells
    .filter((cell) => cell.col_index > at)
    .map((cell) => asRow({ ...cell, col_index: cell.col_index - 1 }));

  await supabase.from("place_cells").delete().gte("col_index", at);

  if (moved.length) {
    await supabase
      .from("place_cells")
      .upsert(moved, { onConflict: "row_index,col_index" });
  }

  revalidatePath("/lugares");
}
