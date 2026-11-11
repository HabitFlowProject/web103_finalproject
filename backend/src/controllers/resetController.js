import { resetToSeedData } from "../models/resetModel.js";

// POST /api/reset — restores the database to its default seeded state.
export async function resetDatabase(_request, response, next) {
  try {
    await resetToSeedData();
    response.json({ status: "reset" });
  } catch (error) {
    next(error);
  }
}
