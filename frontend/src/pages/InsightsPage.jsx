import { Link } from "react-router-dom";
import ErrorMessage from "../components/ErrorMessage.jsx";
import LoadingState from "../components/LoadingState.jsx";
import StatTile from "../components/StatTile.jsx";
import WeeklyChart from "../components/WeeklyChart.jsx";
import { FREQUENCY_LABELS, formatStreak } from "../components/habitFormatting.js";
import {
  buildHighlights,
  compareWithLastWeek,
  formatWeekRange,
} from "../components/insightFormatting.js";
import useWeeklyInsights from "../hooks/useWeeklyInsights.js";

function StreakList({ streaks }) {
  if (streaks.length === 0) {
    return <p className="empty-state">No habits yet.</p>;
  }

  return (
    <ul className="insight-list">
      {streaks.map((habit) => (
        <li key={habit.id} className="insight-row">
          <Link to={`/habits/${habit.id}`}>{habit.name}</Link>
          <span className="frequency-badge">{FREQUENCY_LABELS[habit.frequency] ?? habit.frequency}</span>
          <span className={habit.current_streak > 0 ? "habit-streak" : "insight-muted"}>
            {formatStreak(habit)}
          </span>
        </li>
      ))}
    </ul>
  );
}

function CategoryUsage({ categories, mostUsed }) {
  const max = Math.max(1, ...categories.map((category) => category.task_count));

  return (
    <ul className="insight-list">
      {categories.map((category) => (
        <li key={category.id} className="insight-row category-usage">
          <span className="category-usage-name">
            <span className="category-dot" style={{ background: category.color }} aria-hidden="true" />
            {category.name}
            {mostUsed?.id === category.id && <span className="most-used-badge">Most used</span>}
          </span>
          <span className="category-usage-bar" aria-hidden="true">
            <span style={{ width: `${(category.task_count / max) * 100}%`, background: category.color }} />
          </span>
          <span className="insight-muted">
            {category.completed_count}/{category.task_count} done
          </span>
        </li>
      ))}
    </ul>
  );
}

export default function InsightsPage() {
  const { insights, isLoading, error, reload } = useWeeklyInsights();

  return (
    <section className="page">
      <div className="page-header">
        <div>
          <h1>Weekly Insights</h1>
          {insights && (
            <p className="page-subtitle">
              {formatWeekRange(insights.week)} · calculated from your tasks and habits
            </p>
          )}
        </div>
      </div>

      {isLoading && <LoadingState message="Calculating this week's insights..." />}
      {!isLoading && error && (
        <ErrorMessage message="Unable to load insights. Please try again." onRetry={reload} />
      )}
      {!isLoading && !error && insights && (
        <>
          <div className="stat-grid">
            <StatTile
              label="Tasks completed"
              value={insights.tasks.completed_this_week}
              detail={compareWithLastWeek(insights.tasks.completed_this_week, insights.tasks.completed_last_week)}
              tone="good"
            />
            <StatTile
              label="Habit check-ins"
              value={insights.habits.completions_this_week}
              detail={compareWithLastWeek(
                insights.habits.completions_this_week,
                insights.habits.completions_last_week,
              )}
            />
            <StatTile
              label="Habit consistency"
              value={insights.habits.completion_rate === null ? "–" : `${insights.habits.completion_rate}%`}
              detail="of scheduled check-ins so far"
            />
            <StatTile label="Active streaks" value={insights.habits.active_streaks} />
            <StatTile
              label="Overdue tasks"
              value={insights.tasks.overdue}
              tone={insights.tasks.overdue > 0 ? "bad" : undefined}
            />
            <StatTile label="Due this week" value={insights.tasks.due_this_week} detail="still open" />
          </div>

          <div className="panel">
            <div className="panel-header">
              <h2>Highlights</h2>
            </div>
            <ul className="highlight-list">
              {buildHighlights(insights).map((highlight) => (
                <li key={highlight}>{highlight}</li>
              ))}
            </ul>
          </div>

          <div className="panel">
            <div className="panel-header">
              <h2>This week</h2>
            </div>
            <WeeklyChart days={insights.days} today={insights.week.today} />
          </div>

          <div className="dashboard-columns insight-columns">
            <div className="panel">
              <div className="panel-header">
                <h2>Habit streaks</h2>
                <Link to="/habits">Habits →</Link>
              </div>
              <StreakList streaks={insights.habits.streaks} />
            </div>
            <div className="panel">
              <div className="panel-header">
                <h2>Categories</h2>
                <Link to="/tasks">Tasks →</Link>
              </div>
              <CategoryUsage categories={insights.categories} mostUsed={insights.most_used_category} />
            </div>
          </div>
        </>
      )}
    </section>
  );
}
