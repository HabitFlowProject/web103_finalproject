import { formatStreak } from "./habitFormatting.js";

function plural(count, word) {
  return `${count} ${word}${count === 1 ? "" : "s"}`;
}

// "Nov 9 – Nov 15" for a { start, end } week of "YYYY-MM-DD" dates.
export function formatWeekRange({ start, end }) {
  const format = (date) => {
    const [year, month, day] = date.split("-").map(Number);
    return new Date(year, month - 1, day).toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
    });
  };
  return `${format(start)} – ${format(end)}`;
}

// "3 more than last week", "same as last week", …
export function compareWithLastWeek(thisWeek, lastWeek) {
  const difference = thisWeek - lastWeek;
  if (difference === 0) {
    return "Same as last week";
  }
  return `${Math.abs(difference)} ${difference > 0 ? "more" : "fewer"} than last week`;
}

// Short observations calculated from the weekly numbers (no AI involved).
export function buildHighlights(insights) {
  const { tasks, habits, most_used_category: topCategory } = insights;
  const highlights = [];

  if (habits.total === 0) {
    highlights.push("Add a habit to start tracking streaks and weekly consistency.");
  } else if (habits.completion_rate !== null) {
    if (habits.completion_rate >= 80) {
      highlights.push(
        `Great consistency: ${habits.completion_rate}% of this week's scheduled habit check-ins are done.`,
      );
    } else if (habits.completion_rate < 50) {
      highlights.push(
        `Only ${habits.completion_rate}% of this week's scheduled habit check-ins are done. Focusing on one or two habits can help.`,
      );
    } else {
      highlights.push(`${habits.completion_rate}% of this week's scheduled habit check-ins are done.`);
    }
  }

  if (habits.best_streak) {
    highlights.push(`Longest active streak: ${habits.best_streak.name} (${formatStreak(habits.best_streak)}).`);
  }

  const atRisk = habits.streaks.filter((habit) => habit.current_streak > 0 && !habit.completed_today);
  if (atRisk.length > 0) {
    highlights.push(
      `Complete ${atRisk.map((habit) => habit.name).join(", ")} today to keep ${atRisk.length === 1 ? "its streak" : "their streaks"} going.`,
    );
  }

  if (tasks.overdue > 0) {
    highlights.push(`${plural(tasks.overdue, "task")} ${tasks.overdue === 1 ? "is" : "are"} overdue. Finish or reschedule ${tasks.overdue === 1 ? "it" : "them"} first.`);
  }

  if (tasks.completed_this_week > tasks.completed_last_week) {
    highlights.push(`You completed ${plural(tasks.completed_this_week, "task")} this week, up from ${tasks.completed_last_week} last week.`);
  }

  if (topCategory) {
    highlights.push(`${topCategory.name} is your most-used category (${plural(topCategory.task_count, "task")}).`);
  }

  return highlights;
}
