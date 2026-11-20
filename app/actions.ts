"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { STATUS_ORDER, type TaskStatus } from "@/lib/types";

function text(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

export async function login(formData: FormData) {
  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email: text(formData, "email"),
    password: String(formData.get("password") ?? ""),
  });

  if (error) redirect("/login?error=1");
  redirect("/");
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

export async function setTaskStatus(formData: FormData) {
  const taskId = text(formData, "task_id");
  const projectId = text(formData, "project_id");
  const status = text(formData, "status") as TaskStatus;

  if (!taskId || !STATUS_ORDER.includes(status)) return;
  await patchTask(taskId, projectId, { status });
}

export async function setTaskAssignee(formData: FormData) {
  const taskId = text(formData, "task_id");
  const projectId = text(formData, "project_id");
  const assigneeId = text(formData, "assignee_id");

  if (!taskId) return;
  await patchTask(taskId, projectId, { assignee_id: assigneeId || null });
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

export async function saveNotes(formData: FormData) {
  const taskId = text(formData, "task_id");
  const projectId = text(formData, "project_id");

  if (!taskId) return;
  await patchTask(taskId, projectId, {
    notes: text(formData, "notes") || null,
  });
}
