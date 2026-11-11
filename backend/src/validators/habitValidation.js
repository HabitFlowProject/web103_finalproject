import { HABIT_FREQUENCIES } from "../utils/habitStreaks.js";
import { ValidationError, isValidDateString, isValidId } from "./taskValidation.js";

const CREATABLE_FIELDS = ["name", "description", "frequency", "user_id"];
const UPDATABLE_FIELDS = ["name", "description", "frequency"];

function isPlainObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function rejectUnknownFields(body, allowedFields) {
  const unknownFields = Object.keys(body).filter((field) => !allowedFields.includes(field));

  if (unknownFields.length > 0) {
    throw new ValidationError(`Unknown or read-only field(s): ${unknownFields.join(", ")}.`);
  }
}

export function parseHabitId(value) {
  if (!isValidId(value)) {
    throw new ValidationError("Habit id must be a positive integer.");
  }

  return Number(value);
}

export function parseDate(value, label) {
  if (!isValidDateString(value)) {
    throw new ValidationError(`${label} must be a valid date in YYYY-MM-DD format.`);
  }

  return value;
}

function validateName(name) {
  if (typeof name !== "string" || name.trim().length === 0) {
    throw new ValidationError("Habit name is required.");
  }

  return name.trim();
}

function validateDescription(description) {
  if (typeof description !== "string") {
    throw new ValidationError("Habit description must be a string.");
  }

  return description;
}

function validateFrequency(frequency) {
  if (!HABIT_FREQUENCIES.includes(frequency)) {
    throw new ValidationError(
      `Habit frequency must be one of: ${HABIT_FREQUENCIES.join(", ")}.`,
    );
  }

  return frequency;
}

const FIELD_VALIDATORS = {
  name: validateName,
  description: validateDescription,
  frequency: validateFrequency,
};

export function validateCreateHabitInput(body) {
  if (!isPlainObject(body)) {
    throw new ValidationError("Request body must be a JSON object.");
  }

  rejectUnknownFields(body, CREATABLE_FIELDS);

  if (!isValidId(body.user_id)) {
    throw new ValidationError("Habit user_id must be a positive integer.");
  }

  const habit = {
    name: validateName(body.name),
    description: "",
    frequency: "daily",
    user_id: Number(body.user_id),
  };

  for (const field of ["description", "frequency"]) {
    if (body[field] !== undefined) {
      habit[field] = FIELD_VALIDATORS[field](body[field]);
    }
  }

  return habit;
}

export function validateUpdateHabitInput(body) {
  if (!isPlainObject(body)) {
    throw new ValidationError("Request body must be a JSON object.");
  }

  rejectUnknownFields(body, UPDATABLE_FIELDS);

  const updates = {};

  for (const field of UPDATABLE_FIELDS) {
    if (body[field] !== undefined) {
      updates[field] = FIELD_VALIDATORS[field](body[field]);
    }
  }

  if (Object.keys(updates).length === 0) {
    throw new ValidationError(
      `Provide at least one field to update: ${UPDATABLE_FIELDS.join(", ")}.`,
    );
  }

  return updates;
}

// The body is optional; completed_on defaults to `today`.
export function validateCompletionInput(body, today) {
  const input = body ?? {};

  if (!isPlainObject(input)) {
    throw new ValidationError("Request body must be a JSON object.");
  }

  rejectUnknownFields(input, ["completed_on"]);

  if (input.completed_on === undefined) {
    return today;
  }

  const completedOn = parseDate(input.completed_on, "Habit completed_on");

  if (completedOn > today) {
    throw new ValidationError("Habit completions cannot be in the future.");
  }

  return completedOn;
}

// Optional ?today=YYYY-MM-DD lets the browser supply its own calendar date,
// so streaks match the user's time zone rather than the server's.
export function readTodayQuery(query, fallback) {
  const unknown = Object.keys(query).filter((name) => name !== "today");

  if (unknown.length > 0) {
    throw new ValidationError(
      `Unknown query parameter(s): ${unknown.join(", ")}. Supported: today.`,
    );
  }

  if (query.today === undefined) {
    return fallback;
  }

  if (typeof query.today !== "string") {
    throw new ValidationError('Query parameter "today" must be provided once.');
  }

  return parseDate(query.today, 'Query parameter "today"');
}
