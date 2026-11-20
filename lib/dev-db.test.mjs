// Self-check for the local Supabase stand-in. Run: node --test lib/dev-db.test.mjs
import assert from "node:assert/strict";
import test from "node:test";
import { createLocalClient, decodeUser, USER_COOKIE } from "./dev-db.ts";

function client() {
  let jar;
  return createLocalClient({
    get: (name) => (name === USER_COOKIE && jar ? { value: jar } : undefined),
    set: (name, value) => {
      if (name === USER_COOKIE) jar = value;
    },
  });
}

test("decodeUser round-trips an accented name", () => {
  const user = decodeUser("user-ana|Ana%20Mar%C3%ADa|ana%40a.dev");
  assert.equal(user.id, "user-ana");
  assert.equal(user.user_metadata.full_name, "Ana María");
  assert.equal(user.email, "ana@a.dev");
  assert.equal(decodeUser(""), null);
  assert.equal(decodeUser(undefined), null);
});

test("login cookie drives getUser and creates the profile", async () => {
  const supabase = client();

  assert.equal((await supabase.auth.getUser()).data.user, null);

  const { error } = await supabase.auth.signInWithPassword({
    email: "ezequiel@aetermia.dev",
    password: "x",
  });
  assert.equal(error, null);

  const { data } = await supabase.auth.getUser();
  assert.equal(data.user.user_metadata.full_name, "Ezequiel");

  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name")
    .eq("id", data.user.id)
    .single();
  assert.equal(profile.display_name, "Ezequiel");

  await supabase.auth.signOut();
  assert.equal((await supabase.auth.getUser()).data.user, null);
});

test("empty credentials do not log in", async () => {
  const supabase = client();
  const { error } = await supabase.auth.signInWithPassword({
    email: "",
    password: "",
  });
  assert.ok(error);
});

test("seeded board has one project with the four statuses", async () => {
  const supabase = client();

  const { data: projects } = await supabase
    .from("projects")
    .select("id, name")
    .eq("archived", false)
    .order("created_at", { ascending: true });
  assert.equal(projects.length, 1);

  const { data: tasks } = await supabase
    .from("tasks")
    .select("status")
    .eq("project_id", projects[0].id);
  assert.deepEqual(
    tasks.map((task) => task.status).sort(),
    ["cancelled", "done", "in_progress", "todo"],
  );

  const { data: open } = await supabase
    .from("tasks")
    .select("project_id")
    .in("status", ["todo", "in_progress"]);
  assert.equal(open.length, 2);
});

test("insert and update move a task between columns", async () => {
  const supabase = client();
  const projectId = "proyecto-fijo";

  const { error } = await supabase.from("tasks").insert({
    project_id: projectId,
    title: "Una tarea nueva",
    notes: "con nota",
  });
  assert.equal(error, null);

  const { data: created } = await supabase
    .from("tasks")
    .select("id, status, notes")
    .eq("project_id", projectId)
    .single();
  assert.equal(created.status, "todo");
  assert.equal(created.notes, "con nota");

  await supabase
    .from("tasks")
    .update({ status: "done", assignee_id: "user-ana" })
    .eq("id", created.id);

  const { data: moved } = await supabase
    .from("tasks")
    .select("status, assignee_id")
    .eq("id", created.id)
    .single();
  assert.equal(moved.status, "done");
  assert.equal(moved.assignee_id, "user-ana");
});

test("eq on a missing id yields null, not an error", async () => {
  const supabase = client();
  const { data, error } = await supabase
    .from("projects")
    .select("id")
    .eq("id", "no-existe")
    .single();
  assert.equal(data, null);
  assert.equal(error, null);
});
