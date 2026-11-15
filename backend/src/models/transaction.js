import pool from "../../config/db.js";

// Runs `work(client)` inside a transaction, so everything it writes is saved
// together or not at all.
export async function inTransaction(work) {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");
    const result = await work(client);
    await client.query("COMMIT");
    return result;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}
