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
