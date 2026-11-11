import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import pool from "../../config/db.js";

const sqlDirectory = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../sql");

// Empties every table and re-runs seed.sql inside one transaction, so the
// app is either fully restored to its demo state or left untouched.
// RESTART IDENTITY makes the seeded demo user id 1 again.
export async function resetToSeedData() {
  const [schemaSql, seedSql] = await Promise.all([
    fs.readFile(path.join(sqlDirectory, "schema.sql"), "utf8"),
    fs.readFile(path.join(sqlDirectory, "seed.sql"), "utf8"),
  ]);
  const client = await pool.connect();

  try {
    await client.query("BEGIN");
    await client.query(schemaSql);
    await client.query(`
      TRUNCATE task_categories, habit_completions, tasks, habits, categories, users
      RESTART IDENTITY CASCADE
    `);
    await client.query(seedSql);
    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}
