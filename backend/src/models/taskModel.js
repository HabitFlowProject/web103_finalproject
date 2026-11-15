import pool from "../../config/db.js";
import { inTransaction } from "./transaction.js";

const TASK_WITH_CATEGORIES_SELECT = `
  SELECT
    t.id,
    t.title,
    t.description,
    t.priority,
    t.due_date,
    t.completed,
    t.completed_at,
    t.user_id,
    t.created_at,
    t.updated_at,
    COALESCE(
      json_agg(
        json_build_object(
          'id', c.id,
          'name', c.name,
          'color', c.color,
          'added_at', tc.added_at
        )
        ORDER BY c.name
      ) FILTER (WHERE c.id IS NOT NULL),
      '[]'::json
    ) AS categories
  FROM tasks AS t
  LEFT JOIN task_categories AS tc ON tc.task_id = t.id
  LEFT JOIN categories AS c ON c.id = tc.category_id
`;

const PRIORITY_RANK = `
  CASE t.priority WHEN 'high' THEN 3 WHEN 'medium' THEN 2 ELSE 1 END
`;

// Sort expressions are chosen from this fixed map, never interpolated from input.
const SORT_DEFINITIONS = {
  due_date: { expression: "t.due_date", defaultOrder: "asc", nulls: "NULLS LAST" },
  priority: { expression: PRIORITY_RANK, defaultOrder: "desc", nulls: "" },
  created_at: { expression: "t.created_at", defaultOrder: "desc", nulls: "" },
  title: { expression: "lower(t.title)", defaultOrder: "asc", nulls: "" },
};

function buildOrderBy(sort, order) {
  if (!sort) {
    return "ORDER BY t.due_date ASC NULLS LAST, t.created_at DESC, t.id DESC";
  }

  const definition = SORT_DEFINITIONS[sort];
  const direction = (order ?? definition.defaultOrder) === "asc" ? "ASC" : "DESC";

  return `ORDER BY ${definition.expression} ${direction} ${definition.nulls}, t.id ${direction}`;
}

// Every query is limited to one user's tasks.
export async function getAllTasks(userId, { filters = {}, sort, order } = {}) {
  const values = [userId];
  const conditions = ["t.user_id = $1"];

  if (filters.completed !== undefined) {
    values.push(filters.completed);
    conditions.push(`t.completed = $${values.length}`);
  }

  if (filters.priority !== undefined) {
    values.push(filters.priority);
    conditions.push(`t.priority = $${values.length}`);
  }

  // Filter with EXISTS so matching tasks still return all of their categories.
  if (filters.category !== undefined) {
    values.push(filters.category);
    conditions.push(`EXISTS (
      SELECT 1
      FROM task_categories AS filter_tc
      JOIN categories AS filter_c ON filter_c.id = filter_tc.category_id
      WHERE filter_tc.task_id = t.id
        AND lower(filter_c.name) = lower($${values.length})
    )`);
  }

  if (filters.due === "none") {
    conditions.push("t.due_date IS NULL");
  } else if (filters.due !== undefined) {
    values.push(filters.today);
    const today = `$${values.length}::date`;
    const dueConditions = {
      overdue: `t.completed = FALSE AND t.due_date < ${today}`,
      today: `t.due_date = ${today}`,
      week: `t.due_date BETWEEN ${today} AND ${today} + 6`,
    };
    conditions.push(dueConditions[filters.due]);
  }

  const whereClause = `WHERE ${conditions.join(" AND ")}`;

  const result = await pool.query(
    `${TASK_WITH_CATEGORIES_SELECT}
     ${whereClause}
     GROUP BY t.id
     ${buildOrderBy(sort, order)}`,
    values,
  );

  return result.rows;
}

export async function getTaskById(taskId, userId) {
  const result = await pool.query(
    `${TASK_WITH_CATEGORIES_SELECT}
     WHERE t.id = $1 AND t.user_id = $2
     GROUP BY t.id`,
    [taskId, userId],
  );

  return result.rows[0] ?? null;
}

export async function allCategoriesExist(categoryIds) {
  if (categoryIds.length === 0) {
    return true;
  }

  const result = await pool.query(
    "SELECT COUNT(*)::int AS count FROM categories WHERE id = ANY($1::int[])",
    [categoryIds],
  );
  return result.rows[0].count === categoryIds.length;
}

// Removes links that are no longer wanted and adds new ones. Links that stay
// are left untouched so they keep their original added_at.
async function replaceTaskCategories(client, taskId, categoryIds) {
  await client.query(
    `DELETE FROM task_categories
     WHERE task_id = $1 AND NOT (category_id = ANY($2::int[]))`,
    [taskId, categoryIds],
  );

  if (categoryIds.length > 0) {
    await client.query(
      `INSERT INTO task_categories (task_id, category_id)
       SELECT $1, unnest($2::int[])
       ON CONFLICT (task_id, category_id) DO NOTHING`,
      [taskId, categoryIds],
    );
  }
}

export async function createTask({
  title,
  description,
  priority,
  due_date,
  completed,
  user_id,
  category_ids = [],
}) {
  const taskId = await inTransaction(async (client) => {
    const result = await client.query(
      `INSERT INTO tasks (title, description, priority, due_date, completed, completed_at, user_id)
       VALUES ($1, $2, $3, $4, $5, CASE WHEN $5 THEN NOW() END, $6)
       RETURNING id`,
      [title, description, priority, due_date, completed, user_id],
    );
    const newTaskId = result.rows[0].id;

    await replaceTaskCategories(client, newTaskId, category_ids);
    return newTaskId;
  });

  return getTaskById(taskId, user_id);
}

// Only columns present in `updates` are written, so PATCH is partial and
// an explicit null (e.g. due_date) clears the column. `category_ids`, when
// present, replaces the task's categories.
export async function updateTask(taskId, userId, updates) {
  const allowedColumns = ["title", "description", "priority", "due_date", "completed"];
  const assignments = [];
  const values = [];

  for (const column of allowedColumns) {
    if (Object.hasOwn(updates, column)) {
      values.push(updates[column]);
      assignments.push(`${column} = $${values.length}`);

      // completed_at records when a task was finished. Re-saving a completed
      // task keeps the original time; marking it incomplete clears it.
      if (column === "completed") {
        assignments.push(
          `completed_at = CASE WHEN $${values.length} THEN COALESCE(completed_at, NOW()) END`,
        );
      }
    }
  }

  const hasCategories = Object.hasOwn(updates, "category_ids");

  if (assignments.length === 0 && !hasCategories) {
    throw new Error("updateTask requires at least one field to update.");
  }

  values.push(taskId, userId);

  const found = await inTransaction(async (client) => {
    const result = await client.query(
      `UPDATE tasks
       SET ${[...assignments, "updated_at = NOW()"].join(", ")}
       WHERE id = $${values.length - 1} AND user_id = $${values.length}
       RETURNING id`,
      values,
    );

    if (result.rowCount === 0) {
      return false;
    }

    if (hasCategories) {
      await replaceTaskCategories(client, taskId, updates.category_ids);
    }
    return true;
  });

  return found ? getTaskById(taskId, userId) : null;
}

export async function deleteTask(taskId, userId) {
  const result = await pool.query("DELETE FROM tasks WHERE id = $1 AND user_id = $2", [
    taskId,
    userId,
  ]);
  return result.rowCount > 0;
}
