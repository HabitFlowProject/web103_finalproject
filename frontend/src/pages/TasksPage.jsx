import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { createTask, updateTask } from "../api/tasks.js";
import ErrorMessage from "../components/ErrorMessage.jsx";
import HeaderAction from "../components/HeaderAction.jsx";
import { PlusIcon } from "../components/Icons.jsx";
import LoadingState from "../components/LoadingState.jsx";
import Modal from "../components/Modal.jsx";
import TaskFilters, { FILTER_NAMES } from "../components/TaskFilters.jsx";
import TaskForm from "../components/TaskForm.jsx";
import TaskList from "../components/TaskList.jsx";
import { isOverdue } from "../components/taskFormatting.js";
import useTaskActions from "../hooks/useTaskActions.js";
import useTaskList from "../hooks/useTaskList.js";

function plural(count, word) {
  return `${count} ${word}${count === 1 ? "" : "s"}`;
}

// Client-side title/description search over the tasks already loaded.
function matchesSearch(task, search) {
  const needle = search.trim().toLowerCase();
  if (needle === "") {
    return true;
  }
  return (
    task.title.toLowerCase().includes(needle) ||
    (task.description ?? "").toLowerCase().includes(needle)
  );
}

export default function TasksPage() {
  // Filters live in the URL so a filtered view can be refreshed or shared.
  const [searchParams, setSearchParams] = useSearchParams();
  const filters = Object.fromEntries(
    FILTER_NAMES.map((name) => [name, searchParams.get(name) ?? ""]),
  );

  const { tasks, setTasks, isLoading, error, reload } = useTaskList(filters);
  const { busyTaskIds, actionError, clearActionError, toggleComplete, removeTask, replaceTask } =
    useTaskActions(setTasks);
  // null when closed, otherwise { task } (task is undefined when creating).
  const [formState, setFormState] = useState(null);
  const [search, setSearch] = useState("");

  function updateFilter(name, value) {
    const next = new URLSearchParams(searchParams);
    if (value === "") {
      next.delete(name);
    } else {
      next.set(name, value);
    }
    // The backend only accepts "order" together with "sort".
    if (name === "sort" && value === "") {
      next.delete("order");
    }
    setSearchParams(next, { replace: true });
  }

  async function handleSubmit(fields) {
    if (formState.task) {
      replaceTask(await updateTask(formState.task.id, fields));
    } else {
      await createTask(fields);
      reload();
    }
    setFormState(null);
  }

  const hasFilters = FILTER_NAMES.some((name) => filters[name] !== "");
  const visibleTasks = tasks.filter((task) => matchesSearch(task, search));
  const overdueCount = tasks.filter((task) => isOverdue(task)).length;

  let emptyMessage = "No tasks yet. Add your first task.";
  if (search.trim() !== "") {
    emptyMessage = "No tasks match your search.";
  } else if (hasFilters) {
    emptyMessage = "No tasks match these filters.";
  }

  return (
    <section className="page">
      <HeaderAction>
        <button
          type="button"
          className="button button-primary header-action"
          onClick={() => {
            clearActionError();
            setFormState({});
          }}
        >
          <PlusIcon size={16} />
          <span className="header-action-label">Add task</span>
        </button>
      </HeaderAction>

      <div className="page-header">
        <h1>Tasks</h1>
        {!isLoading && !error && (
          <p className="page-meta">
            {plural(tasks.length, "task")}
            {overdueCount > 0 && ` · ${overdueCount} overdue`}
          </p>
        )}
      </div>

      <TaskFilters
        values={filters}
        onChange={updateFilter}
        onClear={() => setSearchParams({}, { replace: true })}
        search={search}
        onSearchChange={setSearch}
      />

      {actionError && <ErrorMessage message={actionError} />}

      {isLoading && <LoadingState message="Loading tasks..." />}
      {!isLoading && error && (
        <ErrorMessage
          message={
            error.status === 400 ? error.message : "Unable to load tasks. Please try again."
          }
          onRetry={error.status === 400 ? undefined : reload}
        />
      )}
      {!isLoading && !error && (
        <>
          <div className="panel task-panel">
            <TaskList
              tasks={visibleTasks}
              emptyMessage={emptyMessage}
              busyTaskIds={busyTaskIds}
              onToggleComplete={toggleComplete}
              onEdit={(task) => {
                clearActionError();
                setFormState({ task });
              }}
              onDelete={removeTask}
            />
          </div>
          {tasks.length > 0 && (
            <p className="list-footer">
              Showing {visibleTasks.length} of {plural(tasks.length, "task")}
            </p>
          )}
        </>
      )}

      {formState && (
        <Modal title={formState.task ? "Edit task" : "Add task"} onClose={() => setFormState(null)}>
          <TaskForm
            task={formState.task}
            onSubmit={handleSubmit}
            onCancel={() => setFormState(null)}
          />
        </Modal>
      )}
    </section>
  );
}
