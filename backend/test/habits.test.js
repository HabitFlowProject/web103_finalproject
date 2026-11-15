import "./setup.js";
import assert from "node:assert/strict";
import { after, before, beforeEach, describe, it } from "node:test";
import app from "../src/app.js";
import { getDemoUserId, pool, resetDatabase } from "./helpers/testDatabase.js";

// A fixed "today" keeps streak results independent of when tests run.
const TODAY = "2026-11-11"; // Wednesday
const Q = `?today=${TODAY}`;

let server;
let baseUrl;
let demoUserId;

async function request(method, path, { body, rawBody } = {}) {
  const response = await fetch(`${baseUrl}${path}`, {
    method,
    headers: { "Content-Type": "application/json" },
    body: rawBody ?? (body === undefined ? undefined : JSON.stringify(body)),
  });
  const text = await response.text();

  return { status: response.status, body: text ? JSON.parse(text) : null };
}

async function getHabitIdByName(name) {
  const result = await pool.query("SELECT id FROM habits WHERE name = $1", [name]);
  return result.rows[0].id;
}

async function addCompletions(habitId, dates) {
  for (const date of dates) {
    await pool.query(
      "INSERT INTO habit_completions (habit_id, completed_on) VALUES ($1, $2)",
      [habitId, date],
    );
  }
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

describe("GET /api/habits", () => {
  it("lists habits with calculated streak fields", async () => {
    const walkId = await getHabitIdByName("Morning walk");
    await addCompletions(walkId, ["2026-11-11", "2026-11-10", "2026-11-09"]);

    const response = await request("GET", `/api/habits${Q}`);

    assert.equal(response.status, 200);
    assert.equal(response.body.length, 3);

    const walk = response.body.find((habit) => habit.name === "Morning walk");
    assert.equal(walk.current_streak, 3);
    assert.equal(walk.completed_today, true);
    assert.equal(walk.last_completed_on, "2026-11-11");
    assert.equal(walk.completion_count, 3);
    assert.equal(walk.completion_dates, undefined);

    const water = response.body.find((habit) => habit.name === "Drink water");
    assert.equal(water.current_streak, 0);
    assert.equal(water.completed_today, false);
    assert.equal(water.last_completed_on, null);
  });

  it("rejects an invalid today parameter", async () => {
    const response = await request("GET", "/api/habits?today=2026-13-01");
    assert.equal(response.status, 400);
  });

  it("rejects unknown query parameters", async () => {
    const response = await request("GET", "/api/habits?sort=name");
    assert.equal(response.status, 400);
  });
});

describe("GET /api/habits/:id", () => {
  it("returns one habit", async () => {
    const habitId = await getHabitIdByName("Read for 20 minutes");
    const response = await request("GET", `/api/habits/${habitId}${Q}`);

    assert.equal(response.status, 200);
    assert.equal(response.body.name, "Read for 20 minutes");
    assert.equal(response.body.frequency, "weekdays");
  });

  it("returns 400 for an invalid id and 404 for a missing habit", async () => {
    assert.equal((await request("GET", "/api/habits/abc")).status, 400);

    const missing = await request("GET", "/api/habits/999999");
    assert.equal(missing.status, 404);
    assert.equal(missing.body.error, "Habit not found.");
  });
});

describe("POST /api/habits", () => {
  it("creates a habit with defaults", async () => {
    const response = await request("POST", "/api/habits", {
      body: { name: "  Stretch  ", user_id: demoUserId },
    });

    assert.equal(response.status, 201);
    assert.equal(response.body.name, "Stretch");
    assert.equal(response.body.frequency, "daily");
    assert.equal(response.body.description, "");
    assert.equal(response.body.current_streak, 0);
  });

  for (const [description, body, message] of [
    ["a blank name", { name: "  " }, "Habit name is required."],
    [
      "an invalid frequency",
      { name: "Run", frequency: "hourly" },
      "Habit frequency must be one of: daily, weekdays, weekly.",
    ],
    ["an unknown field", { name: "Run", streak: 5 }, "Unknown or read-only field(s): streak."],
  ]) {
    it(`rejects ${description} with 400`, async () => {
      const response = await request("POST", "/api/habits", {
        body: { user_id: demoUserId, ...body },
      });

      assert.equal(response.status, 400);
      assert.equal(response.body.error, message);
    });
  }

  it("rejects a user that does not exist", async () => {
    const response = await request("POST", "/api/habits", {
      body: { name: "Run", user_id: 999999 },
    });

    assert.equal(response.status, 400);
  });
});

describe("PATCH /api/habits/:id", () => {
  it("updates only the given fields", async () => {
    const habitId = await getHabitIdByName("Drink water");
    const response = await request("PATCH", `/api/habits/${habitId}${Q}`, {
      body: { frequency: "weekly" },
    });

    assert.equal(response.status, 200);
    assert.equal(response.body.frequency, "weekly");
    assert.equal(response.body.name, "Drink water");
  });

  it("recalculates the streak for the new frequency", async () => {
    const habitId = await getHabitIdByName("Drink water");
    await addCompletions(habitId, ["2026-11-10", "2026-11-03"]);

    const daily = await request("GET", `/api/habits/${habitId}${Q}`);
    const weekly = await request("PATCH", `/api/habits/${habitId}${Q}`, {
      body: { frequency: "weekly" },
    });

    assert.equal(daily.body.current_streak, 1);
    assert.equal(weekly.body.current_streak, 2);
  });

  it("rejects invalid updates and leaves the habit unchanged", async () => {
    const habitId = await getHabitIdByName("Drink water");
    const before = await request("GET", `/api/habits/${habitId}${Q}`);

    for (const body of [{}, { name: "" }, { frequency: "monthly" }, { user_id: 2 }]) {
      const response = await request("PATCH", `/api/habits/${habitId}`, { body });
      assert.equal(response.status, 400, JSON.stringify(body));
    }

    const after = await request("GET", `/api/habits/${habitId}${Q}`);
    assert.deepEqual(after.body, before.body);
  });

  it("returns 404 for a missing habit", async () => {
    const response = await request("PATCH", "/api/habits/999999", { body: { name: "X" } });
    assert.equal(response.status, 404);
  });
});

describe("DELETE /api/habits/:id", () => {
  it("deletes a habit and its completions", async () => {
    const habitId = await getHabitIdByName("Morning walk");
    await addCompletions(habitId, ["2026-11-10"]);

    const response = await request("DELETE", `/api/habits/${habitId}`);
    const completions = await pool.query(
      "SELECT 1 FROM habit_completions WHERE habit_id = $1",
      [habitId],
    );

    assert.equal(response.status, 204);
    assert.equal((await request("GET", `/api/habits/${habitId}`)).status, 404);
    assert.equal(completions.rowCount, 0);
  });

  it("returns 404 for a missing habit", async () => {
    assert.equal((await request("DELETE", "/api/habits/999999")).status, 404);
  });
});

describe("habit completions", () => {
  it("completes a habit for today and returns the updated streak", async () => {
    const habitId = await getHabitIdByName("Morning walk");
    await addCompletions(habitId, ["2026-11-10"]);

    const response = await request("POST", `/api/habits/${habitId}/completions${Q}`);

    assert.equal(response.status, 201);
    assert.equal(response.body.completion.completed_on, TODAY);
    assert.equal(response.body.habit.current_streak, 2);
    assert.equal(response.body.habit.completed_today, true);
  });

  it("accepts a past completed_on date", async () => {
    const habitId = await getHabitIdByName("Morning walk");
    const response = await request("POST", `/api/habits/${habitId}/completions${Q}`, {
      body: { completed_on: "2026-11-10" },
    });

    assert.equal(response.status, 201);
    assert.equal(response.body.completion.completed_on, "2026-11-10");
    assert.equal(response.body.habit.completed_today, false);
  });

  it("prevents duplicate completions with 409", async () => {
    const habitId = await getHabitIdByName("Morning walk");
    await request("POST", `/api/habits/${habitId}/completions${Q}`);
    const duplicate = await request("POST", `/api/habits/${habitId}/completions${Q}`);

    assert.equal(duplicate.status, 409);
    assert.equal(duplicate.body.error, "Habit is already completed for this date.");
  });

  it("rejects future and invalid dates", async () => {
    const habitId = await getHabitIdByName("Morning walk");

    const future = await request("POST", `/api/habits/${habitId}/completions${Q}`, {
      body: { completed_on: "2026-11-12" },
    });
    const invalid = await request("POST", `/api/habits/${habitId}/completions${Q}`, {
      body: { completed_on: "yesterday" },
    });

    assert.equal(future.status, 400);
    assert.equal(future.body.error, "Habit completions cannot be in the future.");
    assert.equal(invalid.status, 400);
  });

  it("returns 404 when completing a missing habit", async () => {
    const response = await request("POST", `/api/habits/999999/completions${Q}`);
    assert.equal(response.status, 404);
  });

  it("lists completion history newest first", async () => {
    const habitId = await getHabitIdByName("Morning walk");
    await addCompletions(habitId, ["2026-11-08", "2026-11-10", "2026-11-09"]);

    const response = await request("GET", `/api/habits/${habitId}/completions`);

    assert.equal(response.status, 200);
    assert.deepEqual(
      response.body.map((completion) => completion.completed_on),
      ["2026-11-10", "2026-11-09", "2026-11-08"],
    );
    assert.equal((await request("GET", "/api/habits/999999/completions")).status, 404);
  });

  it("undoes a completion and lowers the streak", async () => {
    const habitId = await getHabitIdByName("Morning walk");
    await addCompletions(habitId, ["2026-11-11", "2026-11-10"]);

    const response = await request(
      "DELETE",
      `/api/habits/${habitId}/completions/2026-11-11${Q}`,
    );

    assert.equal(response.status, 200);
    assert.equal(response.body.habit.completed_today, false);
    assert.equal(response.body.habit.current_streak, 1);
  });

  it("returns 404 when undoing a completion that does not exist", async () => {
    const habitId = await getHabitIdByName("Morning walk");
    const response = await request(
      "DELETE",
      `/api/habits/${habitId}/completions/2026-11-11${Q}`,
    );

    assert.equal(response.status, 404);
    assert.equal(response.body.error, "Completion not found.");
  });
});
