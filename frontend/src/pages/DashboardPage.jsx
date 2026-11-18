import { useState } from "react";
import { Link } from "react-router-dom";
import { createTask } from "../api/tasks.js";
import { useAuth } from "../auth/AuthContext.jsx";
import ErrorMessage from "../components/ErrorMessage.jsx";
import HabitList from "../components/HabitList.jsx";
import HeaderAction from "../components/HeaderAction.jsx";
import {
  AlertIcon,
  ArrowRightIcon,
  CheckIcon,
  FlameIcon,
  ListIcon,
  PlusIcon,
  StarIcon,
} from "../components/Icons.jsx";
import LoadingState from "../components/LoadingState.jsx";
import Modal from "../components/Modal.jsx";
import ProgressRing from "../components/ProgressRing.jsx";
import Scene from "../components/Scene.jsx";
import StatTile from "../components/StatTile.jsx";
import TaskForm from "../components/TaskForm.jsx";
import TaskList from "../components/TaskList.jsx";
import WeeklyChart from "../components/WeeklyChart.jsx";
import { STREAK_MILESTONES, nextMilestone, streakUnit } from "../components/habitFormatting.js";
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

function greetingFor(date) {
  const hour = date.getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

function firstName(user) {
  const name = (user?.name || user?.username || "").trim();
  return name.split(/\s+/)[0] ?? "";
}

function plural(count, word) {
  return `${count} ${word}${count === 1 ? "" : "s"}`;
}

function heroSubtitle(done, total) {
  if (total === 0) return "Add a habit to start building a streak.";
  if (done === total) return "Everything's done for today. Nice work.";
  if (done === 0) return "A fresh day. Start with one small win.";
  const left = total - done;
  return `${left} to go. Keep the momentum going.`;
}

// The habit with the longest current streak, or null when no streak is active.
function findBestStreak(habits) {
  return habits.reduce(
    (best, habit) => (habit.current_streak > (best?.current_streak ?? 0) ? habit : best),
    null,
  );
}

function badgeText(streak, unitHabit) {
  const next = nextMilestone(streak);
  if (next === null) return "Every badge earned";
  const remaining = next - streak;
  return `Next badge in ${remaining} ${streakUnit(unitHabit, remaining)}`;
}

function StreakCard({ best }) {
  const streak = best?.current_streak ?? 0;
  const next = nextMilestone(streak);
  const progress = next === null ? 1 : streak / next;

  return (
    <section className="streak-card" aria-labelledby="streak-card-title">
      <p className="eyebrow" id="streak-card-title">
        Best streak
      </p>
      <p className="streak-card-value">
        <FlameIcon size={52} />
        <span className="streak-card-number">{streak}</span>
        <span className="streak-card-unit">{best ? streakUnit(best) : "days"}</span>
      </p>
      <p className="streak-card-habit">{best ? best.name : "Complete a habit to start a streak."}</p>
      <p className="streak-card-next">{best ? badgeText(streak, best) : "First badge at 7 days"}</p>
      <div
        className="streak-progress"
        role="progressbar"
        aria-label="Progress to next badge"
        aria-valuemin={0}
        aria-valuemax={next ?? streak}
        aria-valuenow={streak}
      >
        <span style={{ width: `${Math.round(progress * 100)}%` }} />
      </div>
      <ol className="streak-milestones" aria-label="Badges">
        {STREAK_MILESTONES.map((milestone) => (
          <li key={milestone} className={streak >= milestone ? "reached" : undefined}>
            <span aria-hidden="true">{milestone}</span>
            <span className="visually-hidden">
              {milestone}: {streak >= milestone ? "earned" : "not yet"}
            </span>
          </li>
        ))}
      </ol>
    </section>
  );
}

export default function DashboardPage() {
  const { user } = useAuth();
  const { tasks, setTasks, isLoading, error, reload } = useTaskList(ALL_TASKS);
  const { busyTaskIds, actionError, toggleComplete } = useTaskActions(setTasks);
  const habitList = useHabitList();
  const habitActions = useHabitActions(habitList.setHabits);
  const weekly = useWeeklyInsights();
  const [isAdding, setIsAdding] = useState(false);

  const now = new Date();
  const today = todayDateString();
  const stats = summarize(tasks, today);
  // Incomplete tasks that are overdue or due today. Tasks arrive sorted by
  // due date, so this list is too.
  const focusTasks = tasks.filter(
    (task) => !task.completed && task.due_date !== null && task.due_date <= today,
  );

  const habitsReady = !habitList.isLoading && !habitList.error;
  const habits = habitList.habits;
  const habitsDone = habits.filter((habit) => habit.completed_today).length;
  const activeStreaks = habits.filter((habit) => habit.current_streak > 0).length;
  const best = findBestStreak(habits);
  const name = firstName(user);

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
    <section className="page dashboard">
      <HeaderAction>
        <button type="button" className="button button-primary header-action" onClick={() => setIsAdding(true)}>
          <PlusIcon size={16} />
          <span className="header-action-label">Add task</span>
        </button>
      </HeaderAction>

      <div className="page-header greeting">
        <div>
          <h1>
            {greetingFor(now)}
            {name && `, ${name}`}
          </h1>
          <p className="page-subtitle">
            {now.toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" })}
            {!isLoading && !error && (
              <>
                {" · "}
                {focusTasks.length === 0
                  ? "Nothing needs attention"
                  : `${plural(focusTasks.length, "task")} ${focusTasks.length === 1 ? "needs" : "need"} attention`}
              </>
            )}
          </p>
        </div>
      </div>

      {isLoading && <LoadingState message="Loading your dashboard..." />}
      {!isLoading && error && (
        <ErrorMessage message="Unable to load tasks. Please try again." onRetry={reload} />
      )}
      {!isLoading && !error && (
        <>
          <section className="hero" aria-labelledby="hero-title">
            <Scene height={360} sunX={0.6} sunY={0.5} sunRadius={52} className="hero-scene" />
            <div className="hero-content">
              <div className="hero-copy">
                <span className="hero-pill">
                  <span className="hero-pill-dot" aria-hidden="true" /> Today&apos;s focus
                </span>
                <h2 id="hero-title" className="hero-title">
                  {habitsReady ? `${habitsDone} of ${plural(habits.length, "habit")} done` : "Your habits today"}
                </h2>
                <p className="hero-subtitle">
                  {habitsReady ? heroSubtitle(habitsDone, habits.length) : "Loading your habits..."}
                </p>
              </div>
              {habitsReady && habits.length > 0 && (
                <div className="hero-panel glass">
                  <ProgressRing value={habitsDone} max={habits.length} size={104} stroke={10} className="hero-ring">
                    <span className="visually-hidden">Habits done today: </span>
                    {habitsDone}/{habits.length}
                  </ProgressRing>
                  <div className="hero-panel-text">
                    <p className="eyebrow">Best streak</p>
                    <p className="hero-streak">
                      <FlameIcon size={30} />
                      {best ? `${best.current_streak} ${streakUnit(best)}` : "None yet"}
                    </p>
                    <p className="hero-panel-note">
                      {best ? badgeText(best.current_streak, best) : "Complete a habit to start one"}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </section>

          <div className="stat-grid dashboard-stats">
            <StatTile
              icon={<ListIcon size={20} />}
              label="Total tasks"
              value={stats.total}
              detail={`${stats.incomplete} open`}
            />
            <StatTile
              icon={<CheckIcon size={20} />}
              label="Completed"
              value={stats.completed}
              detail={`${stats.completionPercent}% of all tasks`}
            />
            <StatTile
              icon={<AlertIcon size={20} />}
              label="Overdue"
              value={stats.overdue}
              tone={stats.overdue > 0 ? "bad" : undefined}
            />
            <StatTile
              icon={<StarIcon size={20} />}
              label="Active streaks"
              value={habitsReady ? activeStreaks : "–"}
            />
          </div>

          <div className="dashboard-columns">
            <div className="panel">
              <div className="panel-header">
                <h2>Due today and overdue</h2>
                <Link to="/tasks" className="panel-link">
                  All tasks <ArrowRightIcon size={16} />
                </Link>
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
                <h2>Today&apos;s habits</h2>
                <Link to="/habits" className="panel-link">
                  All <ArrowRightIcon size={16} />
                </Link>
              </div>
              {habitList.isLoading && <LoadingState message="Loading habits..." />}
              {!habitList.isLoading && habitList.error && (
                <ErrorMessage
                  message="Unable to load habits. Please try again."
                  onRetry={habitList.reload}
                />
              )}
              {habitActions.actionError && <ErrorMessage message={habitActions.actionError} />}
              {habitsReady && (
                <HabitList
                  habits={habits}
                  variant="compact"
                  emptyMessage="No habits yet."
                  busyHabitIds={habitActions.busyHabitIds}
                  onToggleToday={handleToggleHabit}
                />
              )}
            </div>

            {habitsReady && <StreakCard best={best} />}
          </div>

          <div className="panel dashboard-week">
            <div className="panel-header">
              <h2>This week</h2>
              <Link to="/insights" className="panel-link">
                Insights <ArrowRightIcon size={16} />
              </Link>
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
