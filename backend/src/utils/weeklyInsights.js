// Calculated weekly insights. Dates are "YYYY-MM-DD" strings handled as
// whole calendar days, and weeks run Monday to Sunday.
import { addDays, calculateCurrentStreak } from "./habitStreaks.js";

// Monday = 0 … Sunday = 6.
function weekdayIndex(dateString) {
  const [year, month, day] = dateString.split("-").map(Number);
  return (new Date(Date.UTC(year, month - 1, day)).getUTCDay() + 6) % 7;
}

export function weekDates(today) {
  const monday = addDays(today, -weekdayIndex(today));
  return Array.from({ length: 7 }, (_, index) => addDays(monday, index));
}

function isScheduled(frequency, date) {
  return frequency !== "weekdays" || weekdayIndex(date) < 5;
}

// Share of scheduled check-ins done on `days`. A daily habit is due every
// day, a weekdays habit Monday to Friday, and a weekly habit once per week.
// Days before a habit was created are not counted against it.
function completionRate(habits, days) {
  let scheduled = 0;
  let done = 0;

  for (const habit of habits) {
    const activeDays = days.filter((date) => date >= habit.created_on);
    const completed = new Set(habit.completion_dates);

    if (habit.frequency === "weekly") {
      if (activeDays.length > 0) {
        scheduled += 1;
        done += activeDays.some((date) => completed.has(date)) ? 1 : 0;
      }
      continue;
    }

    for (const date of activeDays) {
      if (isScheduled(habit.frequency, date)) {
        scheduled += 1;
        done += completed.has(date) ? 1 : 0;
      }
    }
  }

  return scheduled === 0 ? null : Math.round((done / scheduled) * 100);
}

// The category with the most tasks, or null when none is used or the top
// spot is tied (so the app never names an arbitrary winner).
function mostUsedCategory([first, second]) {
  if (!first || first.task_count === 0 || first.task_count === second?.task_count) {
    return null;
  }
  return first;
}

/**
 * Builds the weekly insights response.
 *
 * - `habits`: rows with `frequency`, `created_on`, and `completion_dates`.
 * - `tasksCompletedByDay`: { "YYYY-MM-DD": count } for the last two weeks.
 * - `taskCounts`: { overdue, due_this_week, open } already calculated in SQL.
 * - `categories`: rows with task_count and completed_count.
 */
export function buildWeeklyInsights({ today, habits, tasksCompletedByDay, taskCounts, categories }) {
  const thisWeek = weekDates(today);
  const lastWeek = weekDates(addDays(thisWeek[0], -7));
  const elapsed = thisWeek.filter((date) => date <= today);

  const countHabitCompletions = (days) =>
    habits.reduce(
      (total, habit) => total + habit.completion_dates.filter((date) => days.includes(date)).length,
      0,
    );
  const countTasksCompleted = (days) =>
    days.reduce((total, date) => total + (tasksCompletedByDay[date] ?? 0), 0);

  const streaks = habits
    .map((habit) => ({
      id: habit.id,
      name: habit.name,
      frequency: habit.frequency,
      current_streak: calculateCurrentStreak(habit.frequency, habit.completion_dates, today),
      completed_today: habit.completion_dates.includes(today),
    }))
    .sort((a, b) => b.current_streak - a.current_streak || a.name.localeCompare(b.name));

  const rankedCategories = [...categories].sort(
    (a, b) => b.task_count - a.task_count || a.name.localeCompare(b.name),
  );

  return {
    week: { start: thisWeek[0], end: thisWeek[6], today },
    days: thisWeek.map((date) => ({
      date,
      habit_completions: countHabitCompletions([date]),
      tasks_completed: tasksCompletedByDay[date] ?? 0,
    })),
    tasks: {
      completed_this_week: countTasksCompleted(thisWeek),
      completed_last_week: countTasksCompleted(lastWeek),
      overdue: taskCounts.overdue,
      due_this_week: taskCounts.due_this_week,
      open: taskCounts.open,
    },
    habits: {
      total: habits.length,
      completions_this_week: countHabitCompletions(thisWeek),
      completions_last_week: countHabitCompletions(lastWeek),
      completion_rate: completionRate(habits, elapsed),
      active_streaks: streaks.filter((habit) => habit.current_streak > 0).length,
      best_streak: streaks[0]?.current_streak > 0 ? streaks[0] : null,
      streaks,
    },
    categories: rankedCategories,
    most_used_category: mostUsedCategory(rankedCategories),
  };
}
