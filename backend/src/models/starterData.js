// The tasks and habits every new account starts with, and that "Reset demo
// data" restores. Due dates are relative to `today` so the set always looks
// current.
import { addDays } from "../utils/habitStreaks.js";

export const DEFAULT_CATEGORIES = [
  { name: "Health", color: "#22c55e" },
  { name: "Career", color: "#3b82f6" },
  { name: "Learning", color: "#8b5cf6" },
  { name: "Personal", color: "#f97316" },
  { name: "Finance", color: "#eab308" },
];

export const STARTER_TASKS = [
  {
    title: "Explore HabitFlow",
    description: "Visit the Dashboard, Tasks, Habits, and Insights pages.",
    priority: "high",
    dueInDays: 0,
    categories: ["Learning"],
  },
  {
    title: "Plan your week",
    description: "Add the tasks you want to finish by Sunday.",
    priority: "medium",
    dueInDays: 2,
    categories: ["Personal", "Career"],
  },
  {
    title: "Schedule a workout",
    description: "Pick a time and put it on your calendar.",
    priority: "low",
    dueInDays: 4,
    categories: ["Health"],
  },
  {
    title: "Sign in to HabitFlow",
    description: "Done! This task was completed for you.",
    priority: "low",
    dueInDays: null,
    completed: true,
    categories: ["Personal"],
  },
];

export const STARTER_HABITS = [
  { name: "Drink water", description: "Drink water throughout the day.", frequency: "daily" },
  { name: "Read for 20 minutes", description: "Read a book or course material.", frequency: "weekdays" },
  { name: "Weekly review", description: "Look back at the week and plan the next one.", frequency: "weekly" },
];

// Makes sure the shared categories exist (a fresh production database has
// none until something creates them).
async function ensureDefaultCategories(client) {
  await client.query(
    `INSERT INTO categories (name, color)
     SELECT * FROM unnest($1::text[], $2::text[])
     ON CONFLICT (name) DO NOTHING`,
    [DEFAULT_CATEGORIES.map((c) => c.name), DEFAULT_CATEGORIES.map((c) => c.color)],
  );
}

// Inserts the starter tasks (with their categories) and habits for a user.
// Runs on the caller's client so it can be part of a larger transaction.
export async function createStarterData(client, userId, today) {
  await ensureDefaultCategories(client);

  for (const task of STARTER_TASKS) {
    const dueDate = task.dueInDays === null ? null : addDays(today, task.dueInDays);
    const completed = task.completed ?? false;
    const result = await client.query(
      `INSERT INTO tasks (user_id, title, description, priority, due_date, completed, completed_at)
       VALUES ($1, $2, $3, $4, $5, $6, CASE WHEN $6 THEN NOW() END)
       RETURNING id`,
      [userId, task.title, task.description, task.priority, dueDate, completed],
    );

    await client.query(
      `INSERT INTO task_categories (task_id, category_id)
       SELECT $1, id FROM categories WHERE name = ANY($2::text[])`,
      [result.rows[0].id, task.categories],
    );
  }

  for (const habit of STARTER_HABITS) {
    await client.query(
      `INSERT INTO habits (user_id, name, description, frequency)
       VALUES ($1, $2, $3, $4)`,
      [userId, habit.name, habit.description, habit.frequency],
    );
  }
}
