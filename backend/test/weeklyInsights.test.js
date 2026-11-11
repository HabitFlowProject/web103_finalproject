import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { buildWeeklyInsights, weekDates } from "../src/utils/weeklyInsights.js";

const NO_TASKS = { overdue: 0, due_this_week: 0, open: 0 };

function insightsFor(today, habits) {
  return buildWeeklyInsights({
    today,
    habits,
    tasksCompletedByDay: {},
    taskCounts: NO_TASKS,
    categories: [],
  });
}

describe("weekDates", () => {
  it("starts the week on Monday", () => {
    assert.deepEqual(weekDates("2026-11-11"), [
      "2026-11-09",
      "2026-11-10",
      "2026-11-11",
      "2026-11-12",
      "2026-11-13",
      "2026-11-14",
      "2026-11-15",
    ]);
  });

  it("keeps Sunday in the week that started the Monday before", () => {
    assert.equal(weekDates("2026-11-15")[0], "2026-11-09");
  });

  it("spans a month boundary", () => {
    assert.deepEqual(weekDates("2026-12-01").slice(0, 2), ["2026-11-30", "2026-12-01"]);
  });
});

describe("buildWeeklyInsights: completion rate", () => {
  it("only expects weekdays habits Monday to Friday", () => {
    const habit = {
      id: 1,
      name: "Read",
      frequency: "weekdays",
      created_on: "2026-11-01",
      completion_dates: ["2026-11-13", "2026-11-12", "2026-11-11", "2026-11-10", "2026-11-09"],
    };

    // Sunday: all five weekdays done; Saturday and Sunday are not scheduled.
    assert.equal(insightsFor("2026-11-15", [habit]).habits.completion_rate, 100);
  });

  it("expects a weekly habit once per week", () => {
    const habit = {
      id: 1,
      name: "Review budget",
      frequency: "weekly",
      created_on: "2026-11-01",
      completion_dates: ["2026-11-10"],
    };

    assert.equal(insightsFor("2026-11-11", [habit]).habits.completion_rate, 100);
  });

  it("is null when nothing was scheduled yet", () => {
    const habit = {
      id: 1,
      name: "New habit",
      frequency: "daily",
      created_on: "2026-11-12",
      completion_dates: [],
    };

    assert.equal(insightsFor("2026-11-11", [habit]).habits.completion_rate, null);
  });
});

describe("buildWeeklyInsights: most used category", () => {
  const category = (id, name, taskCount) => ({ id, name, color: "#000", task_count: taskCount, completed_count: 0 });
  const withCategories = (categories) =>
    buildWeeklyInsights({
      today: "2026-11-11",
      habits: [],
      tasksCompletedByDay: {},
      taskCounts: NO_TASKS,
      categories,
    });

  it("picks the category used by the most tasks", () => {
    const insights = withCategories([category(1, "Health", 1), category(2, "Career", 3)]);

    assert.equal(insights.most_used_category.name, "Career");
    assert.deepEqual(insights.categories.map((item) => item.name), ["Career", "Health"]);
  });

  it("is null when the top spot is tied", () => {
    assert.equal(withCategories([category(1, "Health", 2), category(2, "Career", 2)]).most_used_category, null);
  });

  it("is null when no task uses a category", () => {
    assert.equal(withCategories([category(1, "Health", 0)]).most_used_category, null);
  });
});
