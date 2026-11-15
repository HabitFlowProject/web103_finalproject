import { apiRequest } from "./client.js";

// Restores every table to the seeded demo data.
export function resetDemoData() {
  return apiRequest("/api/reset", { method: "POST" });
}
