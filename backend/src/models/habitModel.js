import pool from "../../config/db.js";

// completion_dates (newest first) feed the streak calculation in the controller.
const HABIT_WITH_COMPLETIONS_SELECT = `
  SELECT
    h.id,
    h.name,
    h.description,
    h.frequency,
    h.user_id,
    h.created_at,
    h.updated_at,
    COALESCE(
      array_agg(hc.completed_on::text ORDER BY hc.completed_on DESC)
        FILTER (WHERE hc.id IS NOT NULL),
      '{}'
    ) AS completion_dates
  FROM habits AS h
  LEFT JOIN habit_completions AS hc ON hc.habit_id = h.id
`;

export async function getAllHabits() {
  const result = await pool.query(
    `${HABIT_WITH_COMPLETIONS_SELECT}
     GROUP BY h.id
     ORDER BY h.created_at ASC, h.id ASC`,
  );
  return result.rows;
}

export async function getHabitById(habitId) {
  const result = await pool.query(
    `${HABIT_WITH_COMPLETIONS_SELECT}
     WHERE h.id = $1
     GROUP BY h.id`,
    [habitId],
  );
  return result.rows[0] ?? null;
}

export async function createHabit({ name, description, frequency, user_id }) {
  const result = await pool.query(
    `INSERT INTO habits (name, description, frequency, user_id)
     VALUES ($1, $2, $3, $4)
     RETURNING id`,
    [name, description, frequency, user_id],
  );
  return getHabitById(result.rows[0].id);
}

export async function updateHabit(habitId, updates) {
  const allowedColumns = ["name", "description", "frequency"];
  const assignments = [];
  const values = [];

  for (const column of allowedColumns) {
    if (Object.hasOwn(updates, column)) {
      values.push(updates[column]);
      assignments.push(`${column} = $${values.length}`);
    }
  }

  if (assignments.length === 0) {
    throw new Error("updateHabit requires at least one column to update.");
  }

  values.push(habitId);
  const result = await pool.query(
    `UPDATE habits
     SET ${assignments.join(", ")}, updated_at = NOW()
     WHERE id = $${values.length}
     RETURNING id`,
    values,
  );

  return result.rowCount === 0 ? null : getHabitById(habitId);
}

export async function deleteHabit(habitId) {
  const result = await pool.query("DELETE FROM habits WHERE id = $1", [habitId]);
  return result.rowCount > 0;
}

export async function habitExists(habitId) {
  const result = await pool.query("SELECT 1 FROM habits WHERE id = $1", [habitId]);
  return result.rowCount > 0;
}

export async function getCompletions(habitId) {
  const result = await pool.query(
    `SELECT id, habit_id, completed_on::text AS completed_on, created_at
     FROM habit_completions
     WHERE habit_id = $1
     ORDER BY completed_on DESC`,
    [habitId],
  );
  return result.rows;
}

// Returns the new completion, or null if one already exists for that date.
export async function addCompletion(habitId, completedOn) {
  const result = await pool.query(
    `INSERT INTO habit_completions (habit_id, completed_on)
     VALUES ($1, $2)
     ON CONFLICT (habit_id, completed_on) DO NOTHING
     RETURNING id, habit_id, completed_on::text AS completed_on, created_at`,
    [habitId, completedOn],
  );
  return result.rows[0] ?? null;
}

export async function removeCompletion(habitId, completedOn) {
  const result = await pool.query(
    "DELETE FROM habit_completions WHERE habit_id = $1 AND completed_on = $2",
    [habitId, completedOn],
  );
  return result.rowCount > 0;
}
