import "./setup.js";
import assert from "node:assert/strict";
import { after, before, beforeEach, describe, it } from "node:test";
import app from "../src/app.js";
import { pool, resetDatabase } from "./helpers/testDatabase.js";

// A fixed "today" keeps the week independent of when tests run.
// 2026-11-11 is a Wednesday, so the week is Mon 2026-11-09 to Sun 2026-11-15.
const TODAY = "2026-11-11";
const Q = `?today=${TODAY}`;

let server;
let baseUrl;

async function request(method, path) {
  const response = await fetch(`${baseUrl}${path}`, { method });
  const text = await response.text();

  return { status: response.status, body: text ? JSON.parse(text) : null };
}

async function getHabitIdByName(name) {
  const result = await pool.query("SELECT id FROM habits WHERE name = $1", [name]);
  return result.rows[0].id;
}

async function addCompletions(habitName, dates) {
  const habitId = await getHabitIdByName(habitName);
  for (const date of dates) {
    await pool.query(
      "INSERT INTO habit_completions (habit_id, completed_on) VALUES ($1, $2)",
      [habitId, date],
    );
  }
}

async function setTask(title, fields) {
  const columns = Object.keys(fields);
  const assignments = columns.map((column, index) => `${column} = $${index + 2}`);
  await pool.query(`UPDATE tasks SET ${assignments.join(", ")} WHERE title = $1`, [
    title,
    ...Object.values(fields),
  ]);
}

before(async () => {
  server = app.listen(0);
  await new Promise((resolve) => server.once("listening", resolve));
  baseUrl = `http://127.0.0.1:${server.address().port}`;
});

beforeEach(async () => {
  await resetDatabase();
  // Seeded habits are created "now"; date them before the test week so every
  // day of it counts toward the completion rate.
  await pool.query("UPDATE habits SET created_at = '2026-11-01'");
});

after(async () => {
  await new Promise((resolve) => server.close(resolve));
  await pool.end();
});

describe("GET /api/insights/weekly", () => {
  beforeEach(async () => {
    await addCompletions("Morning walk", ["2026-11-03", "2026-11-09", "2026-11-10", "2026-11-11"]);
    await addCompletions("Read for 20 minutes", ["2026-11-10"]);

    await setTask("Finish project outline", { due_date: "2026-11-05" });
    await setTask("Review reading notes", { due_date: "2026-11-13" });
    await setTask("Plan workout", { completed: true, completed_at: "2026-11-10 12:00" });
    await setTask("Update resume", { completed_at: "2026-11-04 09:00" });
  });

  it("returns the Monday-to-Sunday week containing today", async () => {
    const response = await request("GET", `/api/insights/weekly${Q}`);

    assert.equal(response.status, 200);
    assert.deepEqual(response.body.week, {
      start: "2026-11-09",
      end: "2026-11-15",
      today: TODAY,
    });
    assert.deepEqual(
      response.body.days.map((day) => day.date),
      ["2026-11-09", "2026-11-10", "2026-11-11", "2026-11-12", "2026-11-13", "2026-11-14", "2026-11-15"],
    );
  });

  it("counts habit completions and task completions per day", async () => {
    const { body } = await request("GET", `/api/insights/weekly${Q}`);

    assert.deepEqual(body.days.slice(0, 3), [
      { date: "2026-11-09", habit_completions: 1, tasks_completed: 0 },
      { date: "2026-11-10", habit_completions: 2, tasks_completed: 1 },
      { date: "2026-11-11", habit_completions: 1, tasks_completed: 0 },
    ]);
  });

  it("summarizes tasks for this week and last week", async () => {
    const { body } = await request("GET", `/api/insights/weekly${Q}`);

    assert.deepEqual(body.tasks, {
      completed_this_week: 1,
      completed_last_week: 1,
      overdue: 1,
      due_this_week: 1,
      open: 2,
    });
  });

  it("summarizes habit completions, completion rate, and streaks", async () => {
    const { body } = await request("GET", `/api/insights/weekly${Q}`);

    assert.equal(body.habits.total, 3);
    assert.equal(body.habits.completions_this_week, 4);
    assert.equal(body.habits.completions_last_week, 1);
    // Mon–Wed: walk 3/3, read 1/3 (weekdays), water 0/3 → 4 of 9 check-ins.
    assert.equal(body.habits.completion_rate, 44);
    assert.equal(body.habits.active_streaks, 2);
    assert.equal(body.habits.best_streak.name, "Morning walk");
    assert.equal(body.habits.best_streak.current_streak, 3);
    assert.equal(body.habits.best_streak.completed_today, true);
    assert.deepEqual(
      body.habits.streaks.map((habit) => [habit.name, habit.current_streak]),
      [
        ["Morning walk", 3],
        ["Read for 20 minutes", 1],
        ["Drink water", 0],
      ],
    );
  });

  it("ranks categories by how many tasks use them", async () => {
    const { body } = await request("GET", `/api/insights/weekly${Q}`);

    assert.equal(body.most_used_category.name, "Career");
    assert.equal(body.most_used_category.task_count, 2);
    assert.equal(body.most_used_category.completed_count, 1);
    assert.equal(body.categories.length, 5);
    const { id: _id, ...finance } = body.categories.find((category) => category.name === "Finance");
    assert.deepEqual(finance, { name: "Finance", color: "#eab308", task_count: 0, completed_count: 0 });
  });

  it("rejects an invalid today parameter", async () => {
    const response = await request("GET", "/api/insights/weekly?today=2026-02-30");

    assert.equal(response.status, 400);
    assert.match(response.body.error, /today/);
  });

  it("rejects unknown query parameters", async () => {
    const response = await request("GET", "/api/insights/weekly?week=2");

    assert.equal(response.status, 400);
    assert.match(response.body.error, /Unknown query parameter/);
  });
});

describe("GET /api/insights/weekly with little data", () => {
  it("reports no completion rate and no best streak when there are no habits", async () => {
    await pool.query("DELETE FROM habits");
    await pool.query("DELETE FROM task_categories");

    const { status, body } = await request("GET", `/api/insights/weekly${Q}`);

    assert.equal(status, 200);
    assert.equal(body.habits.total, 0);
    assert.equal(body.habits.completion_rate, null);
    assert.equal(body.habits.best_streak, null);
    assert.equal(body.most_used_category, null);
  });

  it("does not count days before a habit was created", async () => {
    await pool.query("DELETE FROM habits WHERE name <> 'Drink water'");
    await pool.query("UPDATE habits SET created_at = '2026-11-11 08:00'");
    await addCompletions("Drink water", ["2026-11-11"]);

    const { body } = await request("GET", `/api/insights/weekly${Q}`);

    assert.equal(body.habits.completion_rate, 100);
  });
});
