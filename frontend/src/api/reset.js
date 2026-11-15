import { todayDateString } from "../components/taskFormatting.js";
import { apiRequest } from "./client.js";

// Replaces the signed-in user's tasks and habits with the starter set. Due
// dates in the starter set are based on the browser's date.
export function resetDemoData() {
  return apiRequest(`/api/reset?today=${todayDateString()}`, { method: "POST" });
}
