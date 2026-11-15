import { useState } from "react";
import { completeHabitToday, deleteHabit, undoHabitToday } from "../api/habits.js";
import { describeHabitActionError } from "../components/actionErrors.js";

// Same-page habit actions (complete today, undo, delete) that update the
// list held by useHabitList. Failures are shown through `actionError`.
export default function useHabitActions(setHabits) {
  const [busyHabitIds, setBusyHabitIds] = useState([]);
  const [actionError, setActionError] = useState(null);

  async function runForHabit(habitId, action, fallbackMessage) {
    setBusyHabitIds((ids) => [...ids, habitId]);
    setActionError(null);

    try {
      await action();
    } catch (error) {
      console.error(error);
      setActionError(describeHabitActionError(error, fallbackMessage));
    } finally {
      setBusyHabitIds((ids) => ids.filter((id) => id !== habitId));
    }
  }

  function replaceHabit(updatedHabit) {
    setHabits((habits) =>
      habits.map((habit) => (habit.id === updatedHabit.id ? updatedHabit : habit)),
    );
  }

  function toggleToday(habit) {
    return runForHabit(
      habit.id,
      async () => {
        const result = habit.completed_today
          ? await undoHabitToday(habit.id)
          : await completeHabitToday(habit.id);
        replaceHabit(result.habit);
      },
      "Unable to update the habit. Please try again.",
    );
  }

  function removeHabit(habit) {
    if (!window.confirm(`Delete "${habit.name}" and its history? This cannot be undone.`)) {
      return Promise.resolve();
    }

    return runForHabit(
      habit.id,
      async () => {
        await deleteHabit(habit.id);
        setHabits((habits) => habits.filter((existing) => existing.id !== habit.id));
      },
      "Unable to delete the habit. Please try again.",
    );
  }

  return {
    busyHabitIds,
    actionError,
    clearActionError: () => setActionError(null),
    toggleToday,
    removeHabit,
    replaceHabit,
  };
}
