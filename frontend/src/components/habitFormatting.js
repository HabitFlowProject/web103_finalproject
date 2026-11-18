export const FREQUENCY_LABELS = {
  daily: "Daily",
  weekdays: "Weekdays",
  weekly: "Weekly",
};

const STREAK_UNITS = { daily: "day", weekdays: "weekday", weekly: "week" };

export function formatStreak(habit) {
  const unit = STREAK_UNITS[habit.frequency] ?? "day";
  const count = habit.current_streak;
  return count === 0 ? "No streak yet" : `${count}-${unit} streak`;
}

// "day" / "weekday" / "week", pluralised for the count.
export function streakUnit(habit, count = habit.current_streak) {
  const unit = STREAK_UNITS[habit.frequency] ?? "day";
  return count === 1 ? unit : `${unit}s`;
}

// Streak badges, counted in the habit's own unit (days, weekdays or weeks).
export const STREAK_MILESTONES = [7, 14, 30];

// The next badge to earn, or null once every badge is earned.
export function nextMilestone(streak) {
  return STREAK_MILESTONES.find((milestone) => milestone > streak) ?? null;
}
