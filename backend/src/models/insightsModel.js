import pool from "../../config/db.js";

// Habits with the dates they were completed (newest first) and the day they
// were created, so days before a habit existed don't count against it.
export async function getHabitsWithCompletions() {
  const result = await pool.query(`
    SELECT
      h.id,
      h.name,
      h.frequency,
      h.created_at::date::text AS created_on,
      COALESCE(
        array_agg(hc.completed_on::text ORDER BY hc.completed_on DESC)
          FILTER (WHERE hc.id IS NOT NULL),
        '{}'
      ) AS completion_dates
    FROM habits AS h
    LEFT JOIN habit_completions AS hc ON hc.habit_id = h.id
    GROUP BY h.id
    ORDER BY h.created_at ASC, h.id ASC
  `);
  return result.rows;
}

// { "YYYY-MM-DD": count } of tasks completed on each day in the range.
export async function getTasksCompletedByDay(startDate, endDate) {
  const result = await pool.query(
    `SELECT completed_at::date::text AS day, COUNT(*)::int AS count
     FROM tasks
     WHERE completed AND completed_at::date BETWEEN $1 AND $2
     GROUP BY day`,
    [startDate, endDate],
  );
  return Object.fromEntries(result.rows.map((row) => [row.day, row.count]));
}

export async function getTaskCounts(today, weekEnd) {
  const result = await pool.query(
    `SELECT
       COUNT(*) FILTER (WHERE NOT completed AND due_date < $1)::int AS overdue,
       COUNT(*) FILTER (WHERE NOT completed AND due_date BETWEEN $1 AND $2)::int AS due_this_week,
       COUNT(*) FILTER (WHERE NOT completed)::int AS open
     FROM tasks`,
    [today, weekEnd],
  );
  return result.rows[0];
}

// Every category with how many tasks use it and how many of those are done.
export async function getCategoryUsage() {
  const result = await pool.query(`
    SELECT
      c.id,
      c.name,
      c.color,
      COUNT(t.id)::int AS task_count,
      COUNT(t.id) FILTER (WHERE t.completed)::int AS completed_count
    FROM categories AS c
    LEFT JOIN task_categories AS tc ON tc.category_id = c.id
    LEFT JOIN tasks AS t ON t.id = tc.task_id
    GROUP BY c.id
  `);
  return result.rows;
}
