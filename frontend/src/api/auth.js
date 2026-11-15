import { apiRequest } from "./client.js";

// { user } for the signed-in user, or { user: null } for visitors.
export function getCurrentUser({ signal } = {}) {
  return apiRequest("/api/auth/me", { signal });
}

export function signOut() {
  return apiRequest("/api/auth/logout", { method: "POST" });
}
