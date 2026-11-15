import "./setup.js";
import assert from "node:assert/strict";
import { after, before, beforeEach, describe, it } from "node:test";
import { findOrCreateGithubUser } from "../src/models/userModel.js";
import { STARTER_HABITS, STARTER_TASKS } from "../src/models/starterData.js";
import { createTestApp } from "./helpers/testApp.js";
import { getTaskIdByTitle, pool, resetDatabase } from "./helpers/testDatabase.js";

const TODAY = "2026-11-11";
const FAKE_GITHUB = {
  clientID: "test-client-id",
  clientSecret: "test-client-secret",
  callbackURL: "http://localhost:3000/api/auth/github/callback",
};

function githubProfile(overrides = {}) {
  return {
    id: "4242",
    username: "octo-dev",
    displayName: "Octo Dev",
    profileUrl: "https://github.com/octo-dev",
    photos: [{ value: "https://avatars.githubusercontent.com/u/4242" }],
    ...overrides,
  };
}

const servers = [];

async function startServer(app) {
  const server = app.listen(0);
  await new Promise((resolve) => server.once("listening", resolve));
  servers.push(server);
  return `http://127.0.0.1:${server.address().port}`;
}

let baseUrl;

// `as`: a user id, or "none" for a visitor who is not signed in. Without it
// the request acts as the seeded demo user.
async function request(method, path, { body, as, url = baseUrl } = {}) {
  const headers = { "Content-Type": "application/json" };
  if (as !== undefined) {
    headers["X-Test-User-Id"] = String(as);
  }
  const response = await fetch(`${url}${path}`, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
    redirect: "manual",
  });
  const text = await response.text();
  const isJson = (response.headers.get("content-type") ?? "").includes("application/json");

  return {
    status: response.status,
    headers: response.headers,
    body: text && isJson ? JSON.parse(text) : null,
  };
}

before(async () => {
  baseUrl = await startServer(createTestApp());
});

beforeEach(async () => {
  await resetDatabase();
});

after(async () => {
  await Promise.all(servers.map((server) => new Promise((resolve) => server.close(resolve))));
  await pool.end();
});

describe("signed-out visitors", () => {
  for (const [method, path] of [
    ["GET", "/api/tasks"],
    ["POST", "/api/tasks"],
    ["GET", "/api/tasks/1"],
    ["GET", "/api/habits"],
    ["POST", "/api/habits/1/completions"],
    ["GET", "/api/insights/weekly"],
    ["POST", "/api/reset"],
  ]) {
    it(`get 401 from ${method} ${path}`, async () => {
      const body = method === "GET" ? undefined : {};
      const response = await request(method, path, { as: "none", body });

      assert.equal(response.status, 401);
      assert.equal(response.body.error, "Please sign in to continue.");
    });
  }

  it("can still load health and categories", async () => {
    assert.equal((await request("GET", "/api/health", { as: "none" })).status, 200);
    assert.equal((await request("GET", "/api/categories", { as: "none" })).status, 200);
  });

  it("get { user: null } from GET /api/auth/me", async () => {
    const response = await request("GET", "/api/auth/me", { as: "none" });

    assert.equal(response.status, 200);
    assert.deepEqual(response.body, { user: null });
  });
});

describe("GET /api/auth/me", () => {
  it("returns the signed-in user with their GitHub profile", async () => {
    const user = await findOrCreateGithubUser(githubProfile(), TODAY);
    const response = await request("GET", "/api/auth/me", { as: user.id });

    assert.equal(response.status, 200);
    assert.deepEqual(response.body.user, {
      id: user.id,
      name: "Octo Dev",
      username: "octo-dev",
      avatar_url: "https://avatars.githubusercontent.com/u/4242",
      profile_url: "https://github.com/octo-dev",
    });
  });
});

describe("POST /api/auth/logout", () => {
  it("responds with 204", async () => {
    const response = await request("POST", "/api/auth/logout");
    assert.equal(response.status, 204);
  });
});

describe("GitHub sign-in routes", () => {
  it("return 503 when GitHub is not configured", async () => {
    for (const path of ["/api/auth/github", "/api/auth/github/callback"]) {
      const response = await request("GET", path, { as: "none" });
      assert.equal(response.status, 503, path);
    }
  });

  it("redirect to GitHub's authorize page when configured", async () => {
    const url = await startServer(createTestApp({ githubConfig: FAKE_GITHUB }));
    const response = await request("GET", "/api/auth/github", { as: "none", url });
    const location = new URL(response.headers.get("location"));

    assert.equal(response.status, 302);
    assert.equal(location.origin + location.pathname, "https://github.com/login/oauth/authorize");
    assert.equal(location.searchParams.get("client_id"), "test-client-id");
    assert.equal(location.searchParams.get("redirect_uri"), FAKE_GITHUB.callbackURL);
  });
});

describe("findOrCreateGithubUser (first sign-in)", () => {
  it("creates a user, a one-to-one GitHub profile, and the starter data", async () => {
    const user = await findOrCreateGithubUser(githubProfile(), TODAY);

    const profiles = await pool.query("SELECT * FROM github_profiles WHERE user_id = $1", [user.id]);
    assert.equal(profiles.rowCount, 1);
    assert.equal(profiles.rows[0].github_id, "4242");

    const tasks = await request("GET", "/api/tasks", { as: user.id });
    assert.deepEqual(
      tasks.body.map((task) => task.title).sort(),
      STARTER_TASKS.map((task) => task.title).sort(),
    );
    const workout = tasks.body.find((task) => task.title === "Schedule a workout");
    assert.equal(workout.due_date, "2026-11-15");
    assert.deepEqual(workout.categories.map((category) => category.name), ["Health"]);
    const signIn = tasks.body.find((task) => task.title === "Sign in to HabitFlow");
    assert.equal(signIn.completed, true);
    assert.ok(signIn.completed_at);

    const habits = await request("GET", "/api/habits", { as: user.id });
    assert.deepEqual(
      habits.body.map((habit) => habit.name),
      STARTER_HABITS.map((habit) => habit.name),
    );
  });

  it("returns the same user on later sign-ins without duplicating data", async () => {
    const first = await findOrCreateGithubUser(githubProfile(), TODAY);
    const second = await findOrCreateGithubUser(
      githubProfile({ username: "octo-renamed", photos: [] }),
      TODAY,
    );

    assert.equal(second.id, first.id);
    assert.equal(second.username, "octo-renamed");
    assert.equal(second.avatar_url, null);

    const tasks = await pool.query("SELECT COUNT(*)::int AS count FROM tasks WHERE user_id = $1", [
      first.id,
    ]);
    assert.equal(tasks.rows[0].count, STARTER_TASKS.length);
  });

  it("adds the default categories when the database has none", async () => {
    await pool.query("DELETE FROM categories");
    const user = await findOrCreateGithubUser(githubProfile(), TODAY);

    const categories = await request("GET", "/api/categories", { as: user.id });
    assert.equal(categories.body.length, 5);
  });
});

describe("each user only sees their own data", () => {
  let otherUserId;
  let demoTaskId;
  let demoHabitId;

  beforeEach(async () => {
    otherUserId = (await findOrCreateGithubUser(githubProfile(), TODAY)).id;
    demoTaskId = await getTaskIdByTitle("Finish project outline");
    const habit = await pool.query("SELECT id FROM habits WHERE name = 'Morning walk'");
    demoHabitId = habit.rows[0].id;
  });

  it("lists only the user's own tasks and habits", async () => {
    const tasks = await request("GET", "/api/tasks", { as: otherUserId });
    const habits = await request("GET", "/api/habits", { as: otherUserId });

    assert.ok(tasks.body.every((task) => task.user_id === otherUserId));
    assert.ok(!tasks.body.some((task) => task.title === "Finish project outline"));
    assert.ok(habits.body.every((habit) => habit.user_id === otherUserId));
  });

  it("returns 404 for another user's task on GET, PATCH, and DELETE", async () => {
    const path = `/api/tasks/${demoTaskId}`;

    assert.equal((await request("GET", path, { as: otherUserId })).status, 404);
    assert.equal(
      (await request("PATCH", path, { as: otherUserId, body: { title: "Hacked" } })).status,
      404,
    );
    assert.equal((await request("DELETE", path, { as: otherUserId })).status, 404);

    const stillThere = await request("GET", path);
    assert.equal(stillThere.body.title, "Finish project outline");
  });

  it("returns 404 for another user's habit and its completions", async () => {
    const path = `/api/habits/${demoHabitId}`;

    assert.equal((await request("GET", path, { as: otherUserId })).status, 404);
    assert.equal(
      (await request("PATCH", path, { as: otherUserId, body: { name: "Hacked" } })).status,
      404,
    );
    assert.equal(
      (await request("POST", `${path}/completions`, { as: otherUserId, body: {} })).status,
      404,
    );
    assert.equal((await request("GET", `${path}/completions`, { as: otherUserId })).status, 404);
    assert.equal((await request("DELETE", path, { as: otherUserId })).status, 404);
  });

  it("creates new tasks and habits for the signed-in user", async () => {
    const task = await request("POST", "/api/tasks", { as: otherUserId, body: { title: "Mine" } });
    const habit = await request("POST", "/api/habits", { as: otherUserId, body: { name: "Mine" } });

    assert.equal(task.body.user_id, otherUserId);
    assert.equal(habit.body.user_id, otherUserId);
  });

  it("counts only the user's own data in weekly insights", async () => {
    const response = await request("GET", `/api/insights/weekly?today=${TODAY}`, {
      as: otherUserId,
    });

    assert.equal(response.status, 200);
    const usedCategories = response.body.categories
      .filter((category) => category.task_count > 0)
      .map((category) => category.name)
      .sort();
    assert.deepEqual(usedCategories, ["Career", "Health", "Learning", "Personal"]);
    const totalTaskLinks = response.body.categories.reduce((sum, c) => sum + c.task_count, 0);
    assert.equal(totalTaskLinks, 5);
  });
});
