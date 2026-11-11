import {
  addCompletion,
  createHabit as insertHabit,
  deleteHabit as removeHabit,
  getAllHabits,
  getCompletions,
  getHabitById,
  habitExists,
  removeCompletion,
  updateHabit as modifyHabit,
} from "../models/habitModel.js";
import { userExists } from "../models/taskModel.js";
import { calculateCurrentStreak, serverToday } from "../utils/habitStreaks.js";
import { ValidationError } from "../validators/taskValidation.js";
import {
  parseDate,
  parseHabitId,
  readTodayQuery,
  validateCompletionInput,
  validateCreateHabitInput,
  validateUpdateHabitInput,
} from "../validators/habitValidation.js";

const HABIT_NOT_FOUND = { error: "Habit not found." };

function handleError(error, response, next) {
  if (error instanceof ValidationError) {
    return response.status(400).json({ error: error.message });
  }

  return next(error);
}

// Adds calculated fields and drops the raw completion list.
function toHabitResponse({ completion_dates: dates, ...habit }, today) {
  return {
    ...habit,
    current_streak: calculateCurrentStreak(habit.frequency, dates, today),
    completed_today: dates.includes(today),
    last_completed_on: dates[0] ?? null,
    completion_count: dates.length,
  };
}

export async function listHabits(request, response, next) {
  try {
    const today = readTodayQuery(request.query, serverToday());
    const habits = await getAllHabits();
    response.json(habits.map((habit) => toHabitResponse(habit, today)));
  } catch (error) {
    handleError(error, response, next);
  }
}

export async function getHabit(request, response, next) {
  try {
    const habitId = parseHabitId(request.params.id);
    const today = readTodayQuery(request.query, serverToday());
    const habit = await getHabitById(habitId);

    if (!habit) {
      return response.status(404).json(HABIT_NOT_FOUND);
    }

    response.json(toHabitResponse(habit, today));
  } catch (error) {
    handleError(error, response, next);
  }
}

export async function createHabit(request, response, next) {
  try {
    const habitInput = validateCreateHabitInput(request.body);

    if (!(await userExists(habitInput.user_id))) {
      throw new ValidationError("Habit user_id does not match an existing user.");
    }

    const habit = await insertHabit(habitInput);
    response.status(201).json(toHabitResponse(habit, serverToday()));
  } catch (error) {
    handleError(error, response, next);
  }
}

export async function updateHabit(request, response, next) {
  try {
    const habitId = parseHabitId(request.params.id);
    const today = readTodayQuery(request.query, serverToday());
    const updates = validateUpdateHabitInput(request.body);
    const habit = await modifyHabit(habitId, updates);

    if (!habit) {
      return response.status(404).json(HABIT_NOT_FOUND);
    }

    response.json(toHabitResponse(habit, today));
  } catch (error) {
    handleError(error, response, next);
  }
}

export async function deleteHabit(request, response, next) {
  try {
    const habitId = parseHabitId(request.params.id);

    if (!(await removeHabit(habitId))) {
      return response.status(404).json(HABIT_NOT_FOUND);
    }

    response.status(204).send();
  } catch (error) {
    handleError(error, response, next);
  }
}

export async function listCompletions(request, response, next) {
  try {
    const habitId = parseHabitId(request.params.id);

    if (!(await habitExists(habitId))) {
      return response.status(404).json(HABIT_NOT_FOUND);
    }

    response.json(await getCompletions(habitId));
  } catch (error) {
    handleError(error, response, next);
  }
}

// Responds with the new completion and the habit's updated streak.
export async function completeHabit(request, response, next) {
  try {
    const habitId = parseHabitId(request.params.id);
    const today = readTodayQuery(request.query, serverToday());
    const completedOn = validateCompletionInput(request.body, today);

    if (!(await habitExists(habitId))) {
      return response.status(404).json(HABIT_NOT_FOUND);
    }

    const completion = await addCompletion(habitId, completedOn);

    if (!completion) {
      return response
        .status(409)
        .json({ error: "Habit is already completed for this date." });
    }

    const habit = await getHabitById(habitId);
    response.status(201).json({ completion, habit: toHabitResponse(habit, today) });
  } catch (error) {
    handleError(error, response, next);
  }
}

// Undoes a completion; responds with the habit's updated streak.
export async function uncompleteHabit(request, response, next) {
  try {
    const habitId = parseHabitId(request.params.id);
    const completedOn = parseDate(request.params.date, "Completion date");
    const today = readTodayQuery(request.query, serverToday());

    if (!(await habitExists(habitId))) {
      return response.status(404).json(HABIT_NOT_FOUND);
    }

    if (!(await removeCompletion(habitId, completedOn))) {
      return response.status(404).json({ error: "Completion not found." });
    }

    const habit = await getHabitById(habitId);
    response.json({ habit: toHabitResponse(habit, today) });
  } catch (error) {
    handleError(error, response, next);
  }
}
