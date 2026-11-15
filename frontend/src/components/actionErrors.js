// Turns an ApiError from a create/update/delete into a message for the user.
// 400 and 409 responses carry the backend's message, which is already
// written for people (e.g. "Task title is required.").
function describeActionError(error, fallback, notFoundMessage) {
  if (error.status === 400 || error.status === 409) {
    return error.message;
  }
  if (error.status === 404) {
    return notFoundMessage;
  }
  if (error.status === 0) {
    return "Unable to reach the server. Please try again.";
  }
  return fallback;
}

export function describeTaskActionError(error, fallback) {
  return describeActionError(error, fallback, "Task not found. It may have been deleted.");
}

export function describeHabitActionError(error, fallback) {
  return describeActionError(error, fallback, "Habit not found. It may have been deleted.");
}
