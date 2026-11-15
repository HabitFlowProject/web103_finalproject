import HabitCard from "./HabitCard.jsx";

export default function HabitList({
  habits,
  emptyMessage = "No habits yet.",
  busyHabitIds = [],
  onToggleToday,
  onEdit,
  onDelete,
}) {
  if (habits.length === 0) {
    return <p className="empty-state">{emptyMessage}</p>;
  }

  return (
    <ul className="habit-list">
      {habits.map((habit) => (
        <li key={habit.id}>
          <HabitCard
            habit={habit}
            isBusy={busyHabitIds.includes(habit.id)}
            onToggleToday={onToggleToday}
            onEdit={onEdit}
            onDelete={onDelete}
          />
        </li>
      ))}
    </ul>
  );
}
