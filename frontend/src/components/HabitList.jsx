import HabitCard from "./HabitCard.jsx";
import { PlusIcon } from "./Icons.jsx";

const MAX_STAGGER = 8;

// variant "full" shows a grid of cards; "compact" shows dashboard rows.
// With `onAdd`, a dashed "New habit" card is added as the last grid item.
export default function HabitList({
  habits,
  emptyMessage = "No habits yet.",
  busyHabitIds = [],
  variant = "full",
  onToggleToday,
  onEdit,
  onDelete,
  onAdd,
}) {
  if (habits.length === 0 && !onAdd) {
    return <p className="empty-state">{emptyMessage}</p>;
  }

  return (
    <>
      {habits.length === 0 && <p className="empty-state">{emptyMessage}</p>}
      <ul className={variant === "compact" ? "habit-list compact" : "habit-list habit-grid"}>
        {habits.map((habit, index) => (
          <li key={habit.id} style={{ "--i": Math.min(index, MAX_STAGGER) }}>
            <HabitCard
              habit={habit}
              variant={variant}
              isBusy={busyHabitIds.includes(habit.id)}
              onToggleToday={onToggleToday}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          </li>
        ))}
        {onAdd && (
          <li style={{ "--i": Math.min(habits.length, MAX_STAGGER) }}>
            <button type="button" className="habit-add-card" onClick={onAdd}>
              <span className="habit-add-icon" aria-hidden="true">
                <PlusIcon size={28} strokeWidth={1.6} />
              </span>
              <span className="habit-add-title">New habit</span>
              <span className="habit-add-hint">Start tracking something new</span>
            </button>
          </li>
        )}
      </ul>
    </>
  );
}
