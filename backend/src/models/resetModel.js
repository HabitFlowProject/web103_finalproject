import { createStarterData } from "./starterData.js";
import { inTransaction } from "./transaction.js";

// Replaces one user's tasks, habits, and check-ins with the starter set, in
// one transaction so the account is either fully reset or left untouched.
// Other users' data is never affected.
export async function resetUserData(userId, today) {
  await inTransaction(async (client) => {
    // Category links and habit completions are removed by ON DELETE CASCADE.
    await client.query("DELETE FROM tasks WHERE user_id = $1", [userId]);
    await client.query("DELETE FROM habits WHERE user_id = $1", [userId]);
    await createStarterData(client, userId, today);
  });
}
