import { Link } from "react-router-dom";
import CategoryTags from "./CategoryTags.jsx";
import { describeDue, formatPriority } from "./taskFormatting.js";

// One task row. Action handlers are optional so the row can also be shown
// read-only or without Edit/Delete (dashboard).
export default function TaskCard({ task, isBusy = false, onToggleComplete, onEdit, onDelete }) {
  const due = describeDue(task);

  return (
    <article className={task.completed ? "task-card completed" : "task-card"}>
      {onToggleComplete && (
        <input
          type="checkbox"
          className="task-card-check"
          checked={task.completed}
          disabled={isBusy}
          onChange={() => onToggleComplete(task)}
          aria-label={task.completed ? `Mark "${task.title}" incomplete` : `Mark "${task.title}" complete`}
        />
      )}
      <div className="task-card-body">
        <h2 className="task-card-title">
          <Link to={`/tasks/${task.id}`}>{task.title}</Link>
        </h2>
        <p className="task-card-meta">
          <span className={due.tone === "overdue" ? "overdue" : undefined}>{due.text}</span>
        </p>
      </div>
      <div className="task-card-tags">
        <CategoryTags categories={task.categories} />
        <span className={`priority-badge priority-${task.priority}`}>{formatPriority(task.priority)}</span>
      </div>
      {(onEdit || onDelete) && (
        <div className="task-card-actions task-row-actions">
          {onEdit && (
            <button type="button" className="button button-small" disabled={isBusy} onClick={() => onEdit(task)}>
              Edit
            </button>
          )}
          {onDelete && (
            <button
              type="button"
              className="button button-small button-danger"
              disabled={isBusy}
              onClick={() => onDelete(task)}
            >
              Delete
            </button>
          )}
        </div>
      )}
    </article>
  );
}
