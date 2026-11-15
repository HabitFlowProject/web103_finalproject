import pool from "../../config/db.js";
import { serverToday } from "../utils/habitStreaks.js";
import { createStarterData } from "./starterData.js";
import { inTransaction } from "./transaction.js";

const USER_SELECT = `
  SELECT u.id, u.name, gp.username, gp.avatar_url, gp.profile_url
  FROM users AS u
  LEFT JOIN github_profiles AS gp ON gp.user_id = u.id
`;

export async function getUserById(userId) {
  const result = await pool.query(`${USER_SELECT} WHERE u.id = $1`, [userId]);
  return result.rows[0] ?? null;
}

// Called after GitHub confirms who the user is. Returns the matching user,
// creating one (with its GitHub profile and the starter tasks and habits) on
// their first sign-in. Later sign-ins refresh the stored GitHub details.
export async function findOrCreateGithubUser(profile, today = serverToday()) {
  const githubId = String(profile.id);
  const username = profile.username;
  const avatarUrl = profile.photos?.[0]?.value ?? null;
  const profileUrl = profile.profileUrl ?? null;

  const userId = await inTransaction(async (client) => {
    const existing = await client.query(
      `UPDATE github_profiles
       SET username = $2, avatar_url = $3, profile_url = $4, updated_at = NOW()
       WHERE github_id = $1
       RETURNING user_id`,
      [githubId, username, avatarUrl, profileUrl],
    );

    if (existing.rowCount > 0) {
      return existing.rows[0].user_id;
    }

    const user = await client.query(
      "INSERT INTO users (name) VALUES ($1) RETURNING id",
      [profile.displayName || username],
    );
    const newUserId = user.rows[0].id;

    await client.query(
      `INSERT INTO github_profiles (user_id, github_id, username, avatar_url, profile_url)
       VALUES ($1, $2, $3, $4, $5)`,
      [newUserId, githubId, username, avatarUrl, profileUrl],
    );
    await createStarterData(client, newUserId, today);
    return newUserId;
  });

  return getUserById(userId);
}
