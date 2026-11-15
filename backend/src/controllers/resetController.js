import { resetUserData } from "../models/resetModel.js";
import { serverToday } from "../utils/habitStreaks.js";
import { readTodayQuery } from "../validators/habitValidation.js";
import { ValidationError } from "../validators/taskValidation.js";

// POST /api/reset — restores the signed-in user's data to the starter set.
export async function resetDatabase(request, response, next) {
  try {
    const today = readTodayQuery(request.query, serverToday());
    await resetUserData(request.user.id, today);
    response.json({ status: "reset" });
  } catch (error) {
    if (error instanceof ValidationError) {
      return response.status(400).json({ error: error.message });
    }
    next(error);
  }
}
