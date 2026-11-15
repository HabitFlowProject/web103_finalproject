const WEEKDAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function describeDay(day, label) {
  const habits = `${day.habit_completions} habit check-in${day.habit_completions === 1 ? "" : "s"}`;
  const tasks = `${day.tasks_completed} task${day.tasks_completed === 1 ? "" : "s"} completed`;
  return `${label}: ${habits}, ${tasks}`;
}

// Habit check-ins and completed tasks for each day of the week, side by side.
// `days` comes from GET /api/insights/weekly.
export default function WeeklyChart({ days, today }) {
  const max = Math.max(1, ...days.flatMap((day) => [day.habit_completions, day.tasks_completed]));
  const height = (count) => `${(count / max) * 100}%`;

  return (
    <figure className="weekly-chart">
      <div className="weekly-chart-bars">
        {days.map((day, index) => {
          const label = WEEKDAY_LABELS[index];
          return (
            <div
              key={day.date}
              className={day.date === today ? "weekly-chart-day is-today" : "weekly-chart-day"}
              title={describeDay(day, label)}
            >
              <div className="weekly-chart-pair" role="img" aria-label={describeDay(day, label)}>
                <span className="weekly-bar weekly-bar-habits" style={{ height: height(day.habit_completions) }}>
                  {day.habit_completions > 0 && day.habit_completions}
                </span>
                <span className="weekly-bar weekly-bar-tasks" style={{ height: height(day.tasks_completed) }}>
                  {day.tasks_completed > 0 && day.tasks_completed}
                </span>
              </div>
              <span className="weekly-chart-label">{label}</span>
            </div>
          );
        })}
      </div>
      <figcaption className="weekly-chart-legend">
        <span className="legend-item">
          <span className="legend-swatch weekly-bar-habits" aria-hidden="true" /> Habit check-ins
        </span>
        <span className="legend-item">
          <span className="legend-swatch weekly-bar-tasks" aria-hidden="true" /> Tasks completed
        </span>
      </figcaption>
    </figure>
  );
}
