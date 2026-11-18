const PRIORITY_LABELS = { low: "Low", medium: "Medium", high: "High" };

export function formatPriority(priority) {
  return PRIORITY_LABELS[priority] ?? priority;
}

// due_date arrives as "YYYY-MM-DD". Parse it as a local calendar date so it
// is not shifted a day by the browser's timezone.
export function formatDueDate(dueDate) {
  if (!dueDate) {
    return "No due date";
  }

  const [year, month, day] = dueDate.split("-").map(Number);
  return new Date(year, month - 1, day).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

// added_at is a full timestamp, so the browser's timezone is correct here.
export function formatAddedAt(timestamp) {
  return new Date(timestamp).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

// Today's date as "YYYY-MM-DD" in the user's local timezone.
export function todayDateString() {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${now.getFullYear()}-${month}-${day}`;
}

// "YYYY-MM-DD" strings compare correctly as plain strings.
export function isOverdue(task, today = todayDateString()) {
  return !task.completed && task.due_date !== null && task.due_date < today;
}

// "Nov 13" (adds the year only when it is not this year).
export function formatShortDate(dueDate) {
  const [year, month, day] = dueDate.split("-").map(Number);
  const options = { month: "short", day: "numeric" };
  if (year !== new Date().getFullYear()) {
    options.year = "numeric";
  }
  return new Date(year, month - 1, day).toLocaleDateString(undefined, options);
}

// The short status line under a task title, e.g. "Overdue · Nov 13" or "Due today".
// tone: "overdue" | "done" | undefined
export function describeDue(task, today = todayDateString()) {
  if (task.completed) {
    return { text: task.due_date ? `Done · was due ${formatShortDate(task.due_date)}` : "Done", tone: "done" };
  }
  if (task.due_date === null) {
    return { text: "No due date" };
  }
  if (task.due_date < today) {
    return { text: `Overdue · ${formatShortDate(task.due_date)}`, tone: "overdue" };
  }
  if (task.due_date === today) {
    return { text: "Due today" };
  }
  return { text: `Due ${formatShortDate(task.due_date)}` };
}
