import { todayDateString } from "../components/taskFormatting.js";
import { apiRequest } from "./client.js";

function jsonRequest(method, body, signal) {
  return {
    method,
    signal,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  };
}

// query: { completed, priority, category, due, sort, order } — empty values are skipped.
export function listTasks(query = {}, { signal } = {}) {
  const params = new URLSearchParams();

  for (const [name, value] of Object.entries(query)) {
    if (value !== undefined && value !== null && value !== "") {
      params.set(name, value);
    }
  }

  // "Overdue" and "due today" depend on which day it is for the user.
  if (params.has("due")) {
    params.set("today", todayDateString());
  }

  const search = params.toString();
  return apiRequest(`/api/tasks${search ? `?${search}` : ""}`, { signal });
}

export function getTask(taskId, { signal } = {}) {
  return apiRequest(`/api/tasks/${encodeURIComponent(taskId)}`, { signal });
}

export function createTask(fields, { signal } = {}) {
  return apiRequest(
    "/api/tasks",
    jsonRequest("POST", fields, signal),
  );
}

export function updateTask(taskId, fields, { signal } = {}) {
  return apiRequest(
    `/api/tasks/${encodeURIComponent(taskId)}`,
    jsonRequest("PATCH", fields, signal),
  );
}

export function deleteTask(taskId, { signal } = {}) {
  return apiRequest(`/api/tasks/${encodeURIComponent(taskId)}`, {
    method: "DELETE",
    signal,
  });
}
