import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  completeHabitToday,
  deleteHabit,
  getHabit,
  listCompletions,
  undoHabitToday,
  updateHabit,
} from "../api/habits.js";
import { describeHabitActionError } from "../components/actionErrors.js";
import ErrorMessage from "../components/ErrorMessage.jsx";
import HabitForm from "../components/HabitForm.jsx";
import { FREQUENCY_LABELS, formatStreak } from "../components/habitFormatting.js";
import LoadingState from "../components/LoadingState.jsx";
import Modal from "../components/Modal.jsx";
import { formatDueDate } from "../components/taskFormatting.js";

function isRetryable(error) {
  return error.status === 0 || error.status === undefined || error.status >= 500;
}

export default function HabitDetailsPage() {
  const { habitId } = useParams();
  const navigate = useNavigate();
  const [habit, setHabit] = useState(null);
  const [completions, setCompletions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [isEditing, setIsEditing] = useState(false);
  const [isBusy, setIsBusy] = useState(false);
  const [actionError, setActionError] = useState(null);

  useEffect(() => {
    const controller = new AbortController();
    const { signal } = controller;

    setIsLoading(true);
    setError(null);

    Promise.all([getHabit(habitId, { signal }), listCompletions(habitId, { signal })])
      .then(([loadedHabit, loadedCompletions]) => {
        setHabit(loadedHabit);
        setCompletions(loadedCompletions);
        setIsLoading(false);
      })
      .catch((loadError) => {
        if (loadError.name === "AbortError") {
          return;
        }
        if (isRetryable(loadError)) {
          console.error(loadError);
        }
        setError(loadError);
        setIsLoading(false);
      });

    return () => controller.abort();
  }, [habitId, reloadKey]);

  async function runAction(action, fallbackMessage) {
    setIsBusy(true);
    setActionError(null);
    try {
      await action();
    } catch (actionFailure) {
      console.error(actionFailure);
      setActionError(describeHabitActionError(actionFailure, fallbackMessage));
    } finally {
      setIsBusy(false);
    }
  }

  function handleToggleToday() {
    return runAction(async () => {
      const result = habit.completed_today
        ? await undoHabitToday(habit.id)
        : await completeHabitToday(habit.id);
      setHabit(result.habit);
      setCompletions(await listCompletions(habit.id));
    }, "Unable to update the habit. Please try again.");
  }

  function handleDelete() {
    if (!window.confirm(`Delete "${habit.name}" and its history? This cannot be undone.`)) {
      return;
    }
    runAction(async () => {
      await deleteHabit(habit.id);
      navigate("/habits", { replace: true });
    }, "Unable to delete the habit. Please try again.");
  }

  async function handleEdit(fields) {
    setHabit(await updateHabit(habit.id, fields));
    setIsEditing(false);
  }

  const notFound = error && (error.status === 404 || error.status === 400);

  return (
    <section className="page">
      <p>
        <Link to="/habits">← Back to habits</Link>
      </p>
      {isLoading && <LoadingState message="Loading habit..." />}
      {!isLoading && error && (
        <ErrorMessage
          message={notFound ? "Habit not found." : "Unable to load this habit. Please try again."}
          onRetry={isRetryable(error) ? () => setReloadKey((key) => key + 1) : undefined}
        />
      )}
      {!isLoading && !error && habit && (
        <article className="task-details">
          <div className="task-card-header">
            <h1>{habit.name}</h1>
            <span className="frequency-badge">
              {FREQUENCY_LABELS[habit.frequency] ?? habit.frequency}
            </span>
          </div>
          <p className={habit.current_streak > 0 ? "habit-streak active large" : "habit-streak large"}>
            {formatStreak(habit)}
          </p>
          <dl className="task-details-fields">
            <dt>Today</dt>
            <dd>{habit.completed_today ? "Completed" : "Not completed yet"}</dd>
            <dt>Description</dt>
            <dd>{habit.description || "No description."}</dd>
            <dt>Total check-ins</dt>
            <dd>{habit.completion_count}</dd>
          </dl>

          {actionError && <ErrorMessage message={actionError} />}
          <div className="task-card-actions">
            <button
              type="button"
              className={habit.completed_today ? "button button-done" : "button button-primary"}
              disabled={isBusy}
              onClick={handleToggleToday}
            >
              {habit.completed_today ? "✓ Done today (undo)" : "Complete today"}
            </button>
            <button
              type="button"
              className="button"
              disabled={isBusy}
              onClick={() => {
                setActionError(null);
                setIsEditing(true);
              }}
            >
              Edit
            </button>
            <button type="button" className="button button-danger" disabled={isBusy} onClick={handleDelete}>
              Delete
            </button>
          </div>

          <h2 className="history-heading">Completion history</h2>
          {completions.length === 0 ? (
            <p className="empty-state">No check-ins yet.</p>
          ) : (
            <ul className="completion-history">
              {completions.map((completion) => (
                <li key={completion.id}>✓ {formatDueDate(completion.completed_on)}</li>
              ))}
            </ul>
          )}
        </article>
      )}
      {isEditing && habit && (
        <Modal title="Edit habit" onClose={() => setIsEditing(false)}>
          <HabitForm habit={habit} onSubmit={handleEdit} onCancel={() => setIsEditing(false)} />
        </Modal>
      )}
    </section>
  );
}
