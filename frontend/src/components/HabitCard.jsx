import { Link } from "react-router-dom";
import { FREQUENCY_LABELS, formatStreak } from "./habitFormatting.js";

// Edit/Delete are optional so the card can be shown compactly (dashboard).
export default function HabitCard({ habit, isBusy = false, onToggleToday, onEdit, onDelete }) {
  return (
    <article className={habit.completed_today ? "habit-card done" : "habit-card"}>
      <div className="habit-card-header">
        <h2 className="habit-card-title">
          <Link to={`/habits/${habit.id}`}>{habit.name}</Link>
        </h2>
        <span className="frequency-badge">{FREQUENCY_LABELS[habit.frequency] ?? habit.frequency}</span>
      </div>
      <p className={habit.current_streak > 0 ? "habit-streak active" : "habit-streak"}>
        {formatStreak(habit)}
      </p>
      <div className="task-card-actions">
        {onToggleToday && (
          <button
            type="button"
            className={habit.completed_today ? "button button-done" : "button button-primary"}
            disabled={isBusy}
            onClick={() => onToggleToday(habit)}
            aria-pressed={habit.completed_today}
          >
            {habit.completed_today ? "✓ Done today (undo)" : "Complete today"}
          </button>
        )}
        {onEdit && (
          <button type="button" className="button" disabled={isBusy} onClick={() => onEdit(habit)}>
            Edit
          </button>
        )}
        {onDelete && (
          <button
            type="button"
            className="button button-danger"
            disabled={isBusy}
            onClick={() => onDelete(habit)}
          >
            Delete
          </button>
        )}
      </div>
    </article>
  );
}
