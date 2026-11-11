import "./setup.js";
import assert from "node:assert/strict";
import { after, before, beforeEach, describe, it } from "node:test";
import app from "../src/app.js";
import { getDemoUserId, getTaskIdByTitle, pool, resetDatabase } from "./helpers/testDatabase.js";

const TODAY = "2026-11-11";

let server;
let baseUrl;
let demoUserId;

async function request(method, path, { body } = {}) {
  const response = await fetch(`${baseUrl}${path}`, {
    method,
    headers: { "Content-Type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const text = await response.text();

  return { status: response.status, body: text ? JSON.parse(text) : null };
}

function titlesOf(tasks) {
  return tasks.map((task) => task.title).sort();
}

before(async () => {
  server = app.listen(0);
  await new Promise((resolve) => server.once("listening", resolve));
  baseUrl = `http://127.0.0.1:${server.address().port}`;
});

beforeEach(async () => {
  await resetDatabase();
  demoUserId = await getDemoUserId();
});

after(async () => {
  await new Promise((resolve) => server.close(resolve));
  await pool.end();
});

describe("POST /api/reset", () => {
  it("restores the seeded tasks, habits, and categories", async () => {
    await request("POST", "/api/tasks", { body: { title: "Temporary", user_id: demoUserId } });
    const walk = await pool.query("SELECT id FROM habits WHERE name = 'Morning walk'");
    await pool.query(
      "INSERT INTO habit_completions (habit_id, completed_on) VALUES ($1, $2)",
      [walk.rows[0].id, TODAY],
    );
    await pool.query("DELETE FROM habits WHERE name = 'Drink water'");

    const response = await request("POST", "/api/reset");

    assert.equal(response.status, 200);
    assert.deepEqual(response.body, { status: "reset" });

    const tasks = await request("GET", "/api/tasks");
    assert.deepEqual(titlesOf(tasks.body), [
      "Finish project outline",
      "Plan workout",
      "Review reading notes",
    ]);

    const habits = await request("GET", "/api/habits");
    assert.deepEqual(habits.body.map((habit) => habit.name).sort(), [
      "Drink water",
      "Morning walk",
      "Read for 20 minutes",
    ]);
    assert.ok(habits.body.every((habit) => habit.completion_count === 0));

    const categories = await request("GET", "/api/categories");
    assert.equal(categories.body.length, 5);
  });

  it("restarts ids so the demo user is id 1 again", async () => {
    await request("POST", "/api/reset");

    assert.equal(await getDemoUserId(), 1);
    const created = await request("POST", "/api/tasks", { body: { title: "After reset", user_id: 1 } });
    assert.equal(created.status, 201);
  });
});

describe("GET /api/tasks?due=", () => {
  beforeEach(async () => {
    await pool.query("UPDATE tasks SET due_date = '2026-11-05' WHERE title = 'Finish project outline'");
    await pool.query("UPDATE tasks SET due_date = '2026-11-11' WHERE title = 'Review reading notes'");
    await pool.query("UPDATE tasks SET due_date = '2026-11-17' WHERE title = 'Plan workout'");
  });

  it("returns incomplete tasks that are past due", async () => {
    const response = await request("GET", `/api/tasks?due=overdue&today=${TODAY}`);

    assert.equal(response.status, 200);
    assert.deepEqual(titlesOf(response.body), ["Finish project outline"]);
  });

  it("does not treat completed tasks as overdue", async () => {
    await pool.query("UPDATE tasks SET completed = TRUE WHERE title = 'Finish project outline'");

    const response = await request("GET", `/api/tasks?due=overdue&today=${TODAY}`);

    assert.deepEqual(response.body, []);
  });

  it("returns tasks due today", async () => {
    const response = await request("GET", `/api/tasks?due=today&today=${TODAY}`);

    assert.deepEqual(titlesOf(response.body), ["Review reading notes"]);
  });

  it("returns tasks due within the next seven days", async () => {
    const response = await request("GET", `/api/tasks?due=week&today=${TODAY}`);

    assert.deepEqual(titlesOf(response.body), ["Plan workout", "Review reading notes"]);
  });

  it("returns tasks without a due date", async () => {
    const response = await request("GET", "/api/tasks?due=none");

    assert.deepEqual(titlesOf(response.body), ["Update resume"]);
  });

  it("combines with other filters", async () => {
    const response = await request("GET", `/api/tasks?due=week&today=${TODAY}&priority=low`);

    assert.deepEqual(titlesOf(response.body), ["Plan workout"]);
  });

  it("rejects an unknown due value", async () => {
    const response = await request("GET", "/api/tasks?due=soon");

    assert.equal(response.status, 400);
    assert.match(response.body.error, /"due" must be one of/);
  });

  it("rejects an invalid today value", async () => {
    const response = await request("GET", "/api/tasks?due=today&today=11-11-2026");

    assert.equal(response.status, 400);
    assert.match(response.body.error, /"today"/);
  });
});

describe("task completed_at", () => {
  it("is null for a new incomplete task and set for a new completed one", async () => {
    const open = await request("POST", "/api/tasks", { body: { title: "Open", user_id: demoUserId } });
    const done = await request("POST", "/api/tasks", {
      body: { title: "Done", user_id: demoUserId, completed: true },
    });

    assert.equal(open.body.completed_at, null);
    assert.ok(done.body.completed_at);
  });

  it("is set when completed, kept on re-save, and cleared when reopened", async () => {
    const taskId = await getTaskIdByTitle("Plan workout");

    const completed = await request("PATCH", `/api/tasks/${taskId}`, { body: { completed: true } });
    assert.ok(completed.body.completed_at);

    const resaved = await request("PATCH", `/api/tasks/${taskId}`, {
      body: { completed: true, title: "Plan workout!" },
    });
    assert.equal(resaved.body.completed_at, completed.body.completed_at);

    const reopened = await request("PATCH", `/api/tasks/${taskId}`, { body: { completed: false } });
    assert.equal(reopened.body.completed_at, null);
  });

  it("is untouched by updates that do not change completion", async () => {
    const taskId = await getTaskIdByTitle("Update resume");
    await pool.query("UPDATE tasks SET completed_at = '2026-11-04 09:00' WHERE id = $1", [taskId]);
    const before = await request("GET", `/api/tasks/${taskId}`);

    const renamed = await request("PATCH", `/api/tasks/${taskId}`, { body: { title: "Update CV" } });

    assert.equal(renamed.body.completed_at, before.body.completed_at);
  });
});
