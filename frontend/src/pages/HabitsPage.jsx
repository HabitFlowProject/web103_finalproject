import { useState } from "react";
import { createHabit, updateHabit } from "../api/habits.js";
import ErrorMessage from "../components/ErrorMessage.jsx";
import HabitForm from "../components/HabitForm.jsx";
import HabitList from "../components/HabitList.jsx";
import HeaderAction from "../components/HeaderAction.jsx";
import { PlusIcon } from "../components/Icons.jsx";
import LoadingState from "../components/LoadingState.jsx";
import Modal from "../components/Modal.jsx";
import useHabitActions from "../hooks/useHabitActions.js";
import useHabitList from "../hooks/useHabitList.js";

export default function HabitsPage() {
  const { habits, setHabits, isLoading, error, reload } = useHabitList();
  const { busyHabitIds, actionError, clearActionError, toggleToday, removeHabit, replaceHabit } =
    useHabitActions(setHabits);
  // null when closed, otherwise { habit } (habit is undefined when creating).
  const [formState, setFormState] = useState(null);

  async function handleSubmit(fields) {
    if (formState.habit) {
      replaceHabit(await updateHabit(formState.habit.id, fields));
    } else {
      const created = await createHabit(fields);
      setHabits((current) => [...current, created]);
    }
    setFormState(null);
  }

  function openCreateForm() {
    clearActionError();
    setFormState({});
  }

  const doneToday = habits.filter((habit) => habit.completed_today).length;

  return (
    <section className="page">
      <HeaderAction>
        <button type="button" className="button button-primary header-action" onClick={openCreateForm}>
          <PlusIcon size={16} />
          <span className="header-action-label">New habit</span>
        </button>
      </HeaderAction>

      <div className="page-header">
        <h1>Habits</h1>
        {!isLoading && !error && habits.length > 0 && (
          <p className="page-meta">
            {habits.length} active · {doneToday} done today
          </p>
        )}
      </div>

      {actionError && <ErrorMessage message={actionError} />}

      {isLoading && <LoadingState message="Loading habits..." />}
      {!isLoading && error && (
        <ErrorMessage message="Unable to load habits. Please try again." onRetry={reload} />
      )}
      {!isLoading && !error && (
        <HabitList
          habits={habits}
          emptyMessage="No habits yet. Add your first habit."
          busyHabitIds={busyHabitIds}
          onToggleToday={toggleToday}
          onEdit={(habit) => {
            clearActionError();
            setFormState({ habit });
          }}
          onDelete={removeHabit}
          onAdd={openCreateForm}
        />
      )}

      {formState && (
        <Modal title={formState.habit ? "Edit habit" : "New habit"} onClose={() => setFormState(null)}>
          <HabitForm
            habit={formState.habit}
            onSubmit={handleSubmit}
            onCancel={() => setFormState(null)}
          />
        </Modal>
      )}
    </section>
  );
}
