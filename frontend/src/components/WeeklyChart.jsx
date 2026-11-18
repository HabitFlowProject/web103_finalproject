const WEEKDAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function describeDay(day, label) {
  const habits = `${day.habit_completions} habit check-in${day.habit_completions === 1 ? "" : "s"}`;
  const tasks = `${day.tasks_completed} task${day.tasks_completed === 1 ? "" : "s"} completed`;
  return `${label}: ${habits}, ${tasks}`;
}

function Bar({ count, max, className }) {
  return (
    <span
      className={count === 0 ? `weekly-bar ${className} is-zero` : `weekly-bar ${className}`}
      style={{ height: `${(count / max) * 100}%` }}
    >
      {count > 0 && <span className="weekly-bar-value">{count}</span>}
    </span>
  );
}

// Habit check-ins and completed tasks for each day of the week, side by side.
// `days` comes from GET /api/insights/weekly.
export default function WeeklyChart({ days, today }) {
  const max = Math.max(1, ...days.flatMap((day) => [day.habit_completions, day.tasks_completed]));

  return (
    <figure className="weekly-chart">
      <figcaption className="weekly-chart-legend">
        <span className="legend-item">
          <span className="legend-swatch weekly-bar-habits" aria-hidden="true" /> Habit check-ins
        </span>
        <span className="legend-item">
          <span className="legend-swatch weekly-bar-tasks" aria-hidden="true" /> Tasks completed
        </span>
      </figcaption>
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
                <Bar count={day.habit_completions} max={max} className="weekly-bar-habits" />
                <Bar count={day.tasks_completed} max={max} className="weekly-bar-tasks" />
              </div>
              <span className="weekly-chart-label">{label}</span>
            </div>
          );
        })}
      </div>
    </figure>
  );
}
