// Streak calculation for habits. Dates are "YYYY-MM-DD" strings and are
// handled as whole calendar days (no time zones involved).

export const HABIT_FREQUENCIES = ["daily", "weekdays", "weekly"];

const MS_PER_DAY = 24 * 60 * 60 * 1000;

function toDayNumber(dateString) {
  const [year, month, day] = dateString.split("-").map(Number);
  return Date.UTC(year, month - 1, day) / MS_PER_DAY;
}

// Day 0 (1970-01-01) was a Thursday.
function isWeekend(dayNumber) {
  const weekday = (dayNumber + 4) % 7; // 0 = Sunday
  return weekday === 0 || weekday === 6;
}

// Weeks start on Monday.
function toWeekNumber(dayNumber) {
  return Math.floor((dayNumber + 3) / 7);
}

function previousWeekday(dayNumber) {
  let candidate = dayNumber - 1;
  while (isWeekend(candidate)) {
    candidate -= 1;
  }
  return candidate;
}

// Counts consecutive periods with a completion, walking back from `start`.
function countBack(done, start, step) {
  let streak = 0;
  for (let period = start; done.has(period); period = step(period)) {
    streak += 1;
  }
  return streak;
}

// The streak stays alive until a whole period is missed: a daily habit done
// yesterday but not yet today still has its streak.
export function calculateCurrentStreak(frequency, completionDates, today) {
  const todayNumber = toDayNumber(today);
  const days = completionDates.map(toDayNumber).filter((day) => day <= todayNumber);

  if (frequency === "weekly") {
    const weeks = new Set(days.map(toWeekNumber));
    const thisWeek = toWeekNumber(todayNumber);
    const start = weeks.has(thisWeek) ? thisWeek : thisWeek - 1;
    return countBack(weeks, start, (week) => week - 1);
  }

  if (frequency === "weekdays") {
    const weekdays = new Set(days.filter((day) => !isWeekend(day)));
    const start =
      !isWeekend(todayNumber) && weekdays.has(todayNumber)
        ? todayNumber
        : previousWeekday(todayNumber);
    return countBack(weekdays, start, previousWeekday);
  }

  const daySet = new Set(days);
  const start = daySet.has(todayNumber) ? todayNumber : todayNumber - 1;
  return countBack(daySet, start, (day) => day - 1);
}

// Today's date as "YYYY-MM-DD" in the server's local time zone.
export function serverToday() {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${now.getFullYear()}-${month}-${day}`;
}

export function addDays(dateString, amount) {
  const date = new Date(toDayNumber(dateString) * MS_PER_DAY + amount * MS_PER_DAY);
  return date.toISOString().slice(0, 10);
}
