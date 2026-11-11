import {
  getCategoryUsage,
  getHabitsWithCompletions,
  getTaskCounts,
  getTasksCompletedByDay,
} from "../models/insightsModel.js";
import { addDays, serverToday } from "../utils/habitStreaks.js";
import { buildWeeklyInsights, weekDates } from "../utils/weeklyInsights.js";
import { readTodayQuery } from "../validators/habitValidation.js";
import { ValidationError } from "../validators/taskValidation.js";

// GET /api/insights/weekly — a calculated summary of the current week
// (Monday to Sunday) compared with the week before.
export async function getWeeklyInsights(request, response, next) {
  try {
    const today = readTodayQuery(request.query, serverToday());
    const thisWeek = weekDates(today);

    const [habits, tasksCompletedByDay, taskCounts, categories] = await Promise.all([
      getHabitsWithCompletions(),
      getTasksCompletedByDay(addDays(thisWeek[0], -7), thisWeek[6]),
      getTaskCounts(today, thisWeek[6]),
      getCategoryUsage(),
    ]);

    response.json(
      buildWeeklyInsights({ today, habits, tasksCompletedByDay, taskCounts, categories }),
    );
  } catch (error) {
    if (error instanceof ValidationError) {
      return response.status(400).json({ error: error.message });
    }
    next(error);
  }
}
