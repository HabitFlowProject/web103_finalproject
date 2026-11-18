import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { FlameIcon } from "./Icons.jsx";
import { FREQUENCY_LABELS, streakUnit } from "./habitFormatting.js";

// True for a moment right after the habit is completed, so the flame can
// animate once (not on every render or page load).
function useJustCompleted(completedToday) {
  const [justCompleted, setJustCompleted] = useState(false);
  const previous = useRef(completedToday);

  useEffect(() => {
    const wasCompleted = previous.current;
    previous.current = completedToday;
    if (!completedToday || wasCompleted) {
      return undefined;
    }
    setJustCompleted(true);
    const timer = setTimeout(() => setJustCompleted(false), 600);
    return () => clearTimeout(timer);
  }, [completedToday]);

  return justCompleted;
}

function StreakLine({ habit, compact }) {
  if (habit.current_streak === 0) {
    return <p className="habit-streak">{compact ? "Not started" : "No streak yet"}</p>;
  }
  return (
    <p className="habit-streak active">
      <FlameIcon size={compact ? 14 : 34} />
      <span className="habit-streak-count">{habit.current_streak}</span>{" "}
      {/* Singular as an adjective: "5 day streak". */}
      <span className="habit-streak-unit">{streakUnit(habit, 1)} streak</span>
    </p>
  );
}

// variant: "full" (Habits page card) or "compact" (dashboard row).
// Edit/Delete are optional.
export default function HabitCard({
  habit,
  isBusy = false,
  variant = "full",
  onToggleToday,
  onEdit,
  onDelete,
}) {
  const compact = variant === "compact";
  const justCompleted = useJustCompleted(habit.completed_today);
  const classes = [
    "habit-card",
    compact && "compact",
    habit.completed_today && "done",
    habit.current_streak > 0 && "has-streak",
    justCompleted && "just-completed",
  ]
    .filter(Boolean)
    .join(" ");

  const doneLabel = compact ? "✓ Done" : "✓ Done today (undo)";

  return (
    <article className={classes}>
      <div className="habit-card-header">
        <div className="habit-card-heading">
          <h2 className="habit-card-title">
            <Link to={`/habits/${habit.id}`}>{habit.name}</Link>
          </h2>
          {compact ? (
            <StreakLine habit={habit} compact />
          ) : (
            <span className="frequency-badge">{FREQUENCY_LABELS[habit.frequency] ?? habit.frequency}</span>
          )}
        </div>
        {(onEdit || onDelete) && (
          <div className="habit-card-tools">
            {onEdit && (
              <button type="button" className="button button-small" disabled={isBusy} onClick={() => onEdit(habit)}>
                Edit
              </button>
            )}
            {onDelete && (
              <button
                type="button"
                className="button button-small button-danger"
                disabled={isBusy}
                onClick={() => onDelete(habit)}
              >
                Delete
              </button>
            )}
          </div>
        )}
        {compact && onToggleToday && (
          <button
            type="button"
            className={habit.completed_today ? "button button-done button-small" : "button button-primary button-small"}
            disabled={isBusy}
            onClick={() => onToggleToday(habit)}
            aria-pressed={habit.completed_today}
            aria-label={habit.completed_today ? `Undo ${habit.name} for today` : `Complete ${habit.name} today`}
          >
            {habit.completed_today ? doneLabel : "Complete"}
          </button>
        )}
      </div>

      {!compact && <StreakLine habit={habit} />}

      {!compact && onToggleToday && (
        <div className="task-card-actions">
          <button
            type="button"
            className={habit.completed_today ? "button button-done button-block" : "button button-primary button-block"}
            disabled={isBusy}
            onClick={() => onToggleToday(habit)}
            aria-pressed={habit.completed_today}
          >
            {habit.completed_today ? doneLabel : "Complete today"}
          </button>
        </div>
      )}
    </article>
  );
}
