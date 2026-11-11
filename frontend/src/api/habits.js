import { todayDateString } from "../components/taskFormatting.js";
import { apiRequest } from "./client.js";

// The app has no login yet, so new habits belong to the seeded demo user.
const DEMO_USER_ID = Number(import.meta.env.VITE_DEMO_USER_ID ?? 1);

// Streaks and "completed today" are calculated for the browser's own date.
function withToday(path) {
  return `${path}?today=${todayDateString()}`;
}

function jsonRequest(method, body, signal) {
  return {
    method,
    signal,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  };
}

export function listHabits({ signal } = {}) {
  return apiRequest(withToday("/api/habits"), { signal });
}

export function getHabit(habitId, { signal } = {}) {
  return apiRequest(withToday(`/api/habits/${encodeURIComponent(habitId)}`), { signal });
}

export function createHabit(fields, { signal } = {}) {
  return apiRequest(
    withToday("/api/habits"),
    jsonRequest("POST", { ...fields, user_id: DEMO_USER_ID }, signal),
  );
}

export function updateHabit(habitId, fields, { signal } = {}) {
  return apiRequest(
    withToday(`/api/habits/${encodeURIComponent(habitId)}`),
    jsonRequest("PATCH", fields, signal),
  );
}

export function deleteHabit(habitId, { signal } = {}) {
  return apiRequest(`/api/habits/${encodeURIComponent(habitId)}`, { method: "DELETE", signal });
}

export function listCompletions(habitId, { signal } = {}) {
  return apiRequest(`/api/habits/${encodeURIComponent(habitId)}/completions`, { signal });
}

// Resolves to { completion, habit } with the habit's updated streak.
export function completeHabitToday(habitId, { signal } = {}) {
  return apiRequest(withToday(`/api/habits/${encodeURIComponent(habitId)}/completions`), {
    method: "POST",
    signal,
  });
}

// Resolves to { habit } with the habit's updated streak.
export function undoHabitToday(habitId, { signal } = {}) {
  const today = todayDateString();
  return apiRequest(
    withToday(`/api/habits/${encodeURIComponent(habitId)}/completions/${today}`),
    { method: "DELETE", signal },
  );
}
