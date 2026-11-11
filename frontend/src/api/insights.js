import { todayDateString } from "../components/taskFormatting.js";
import { apiRequest } from "./client.js";

// The week is calculated for the browser's own date.
export function getWeeklyInsights({ signal } = {}) {
  return apiRequest(`/api/insights/weekly?today=${todayDateString()}`, { signal });
}
