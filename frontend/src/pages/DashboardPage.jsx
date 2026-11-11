import { useState } from "react";
import { Link } from "react-router-dom";
import { createTask } from "../api/tasks.js";
import ErrorMessage from "../components/ErrorMessage.jsx";
import HabitList from "../components/HabitList.jsx";
import LoadingState from "../components/LoadingState.jsx";
import Modal from "../components/Modal.jsx";
import StatTile from "../components/StatTile.jsx";
import TaskForm from "../components/TaskForm.jsx";
import TaskList from "../components/TaskList.jsx";
import WeeklyChart from "../components/WeeklyChart.jsx";
import { isOverdue, todayDateString } from "../components/taskFormatting.js";
import useHabitActions from "../hooks/useHabitActions.js";
import useHabitList from "../hooks/useHabitList.js";
import useTaskActions from "../hooks/useTaskActions.js";
import useTaskList from "../hooks/useTaskList.js";
import useWeeklyInsights from "../hooks/useWeeklyInsights.js";

const ALL_TASKS = {};

function summarize(tasks, today) {
  const completed = tasks.filter((task) => task.completed).length;
  return {
    total: tasks.length,
    completed,
    incomplete: tasks.length - completed,
    overdue: tasks.filter((task) => isOverdue(task, today)).length,
    completionPercent: tasks.length === 0 ? 0 : Math.round((completed / tasks.length) * 100),
  };
}

export default function DashboardPage() {
  const { tasks, setTasks, isLoading, error, reload } = useTaskList(ALL_TASKS);
  const { busyTaskIds, actionError, toggleComplete } = useTaskActions(setTasks);
  const habitList = useHabitList();
  const habitActions = useHabitActions(habitList.setHabits);
  const weekly = useWeeklyInsights();
  const [isAdding, setIsAdding] = useState(false);

  const today = todayDateString();
  const stats = summarize(tasks, today);
  // Incomplete tasks that are overdue or due today. Tasks arrive sorted by
  // due date, so this list is too.
  const focusTasks = tasks.filter(
    (task) => !task.completed && task.due_date !== null && task.due_date <= today,
  );

  async function handleCreate(fields) {
    await createTask(fields);
    setIsAdding(false);
    reload();
  }

  // Completing something on this page also changes this week's chart.
  async function handleToggleTask(task) {
    await toggleComplete(task);
    weekly.reload();
  }

  async function handleToggleHabit(habit) {
    await habitActions.toggleToday(habit);
    weekly.reload();
  }

  return (
    <section className="page">
      <div className="page-header">
        <h1>Dashboard</h1>
        <button type="button" className="button button-primary" onClick={() => setIsAdding(true)}>
          Add task
        </button>
      </div>

      {isLoading && <LoadingState message="Loading your dashboard..." />}
      {!isLoading && error && (
        <ErrorMessage message="Unable to load tasks. Please try again." onRetry={reload} />
      )}
      {!isLoading && !error && (
        <>
          <div className="stat-grid">
            <StatTile label="Total tasks" value={stats.total} />
            <StatTile label="Completed" value={stats.completed} tone="good" />
            <StatTile label="Incomplete" value={stats.incomplete} />
            <StatTile label="Overdue" value={stats.overdue} tone={stats.overdue > 0 ? "bad" : undefined} />
            <StatTile label="Completion" value={`${stats.completionPercent}%`} />
            <StatTile
              label="Active habit streaks"
              value={
                habitList.isLoading || habitList.error
                  ? "–"
                  : habitList.habits.filter((habit) => habit.current_streak > 0).length
              }
            />
          </div>

          <div className="dashboard-columns">
            <div className="panel">
              <div className="panel-header">
                <h2>Due today and overdue</h2>
                <Link to="/tasks">All tasks →</Link>
              </div>
              {actionError && <ErrorMessage message={actionError} />}
              <TaskList
                tasks={focusTasks}
                emptyMessage="Nothing due today or overdue."
                busyTaskIds={busyTaskIds}
                onToggleComplete={handleToggleTask}
              />
            </div>

            <div className="panel">
              <div className="panel-header">
                <h2>Habits</h2>
                <Link to="/habits">Habits →</Link>
              </div>
              {habitList.isLoading && <LoadingState message="Loading habits..." />}
              {!habitList.isLoading && habitList.error && (
                <ErrorMessage
                  message="Unable to load habits. Please try again."
                  onRetry={habitList.reload}
                />
              )}
              {habitActions.actionError && <ErrorMessage message={habitActions.actionError} />}
              {!habitList.isLoading && !habitList.error && (
                <HabitList
                  habits={habitList.habits}
                  emptyMessage="No habits yet."
                  busyHabitIds={habitActions.busyHabitIds}
                  onToggleToday={handleToggleHabit}
                />
              )}
            </div>
          </div>

          <div className="panel dashboard-week">
            <div className="panel-header">
              <h2>This week</h2>
              <Link to="/insights">Insights →</Link>
            </div>
            {weekly.isLoading && !weekly.insights && <LoadingState message="Loading this week..." />}
            {!weekly.isLoading && weekly.error && (
              <ErrorMessage message="Unable to load this week's progress." onRetry={weekly.reload} />
            )}
            {weekly.insights && !weekly.error && (
              <WeeklyChart days={weekly.insights.days} today={weekly.insights.week.today} />
            )}
          </div>
        </>
      )}

      {isAdding && (
        <Modal title="Add task" onClose={() => setIsAdding(false)}>
          <TaskForm onSubmit={handleCreate} onCancel={() => setIsAdding(false)} />
        </Modal>
      )}
    </section>
  );
}
