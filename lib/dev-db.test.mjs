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

test("links can be added and removed", async () => {
  const supabase = client();

  await supabase
    .from("links")
    .insert({ project_id: "p1", label: "Deploy", url: "https://x.dev" });

  const { data: before } = await supabase
    .from("links")
    .select("id, label")
    .eq("project_id", "p1");
  assert.equal(before.length, 1);
  assert.equal(before[0].label, "Deploy");

  await supabase.from("links").delete().eq("id", before[0].id);

  const { data: after } = await supabase
    .from("links")
    .select("id")
    .eq("project_id", "p1");
  assert.equal(after.length, 0);
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

test("sheet cells upsert on their two indexes instead of duplicating", async () => {
  const supabase = client();

  const cell = {
    row_index: 3,
    col_index: 2,
    value: "Panadería",
    font_family: "Georgia",
    font_size: 16,
    color: "#030303",
    background: "#eceee8",
  };

  await supabase
    .from("place_cells")
    .upsert(cell, { onConflict: "row_index,col_index" });
  await supabase
    .from("place_cells")
    .upsert({ ...cell, value: "Panadería vieja" }, { onConflict: "row_index,col_index" });

  const { data } = await supabase
    .from("place_cells")
    .select("*")
    .eq("row_index", 3)
    .eq("col_index", 2);

  assert.equal(data.length, 1);
  assert.equal(data[0].value, "Panadería vieja");
  assert.equal(data[0].font_family, "Georgia");
  assert.ok(!("id" in data[0]), "place_cells has no id column in the real schema");
});
