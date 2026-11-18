import TaskCard from "./TaskCard.jsx";

// Rows fade in with a short stagger (capped so long lists are not slowed down).
const MAX_STAGGER = 8;

export default function TaskList({
  tasks,
  emptyMessage = "No tasks yet.",
  busyTaskIds = [],
  onToggleComplete,
  onEdit,
  onDelete,
}) {
  if (tasks.length === 0) {
    return <p className="empty-state">{emptyMessage}</p>;
  }

  return (
    <ul className="task-list">
      {tasks.map((task, index) => (
        <li key={task.id} style={{ "--i": Math.min(index, MAX_STAGGER) }}>
          <TaskCard
            task={task}
            isBusy={busyTaskIds.includes(task.id)}
            onToggleComplete={onToggleComplete}
            onEdit={onEdit}
            onDelete={onDelete}
          />
        </li>
      ))}
    </ul>
  );
}
