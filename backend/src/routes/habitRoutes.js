import { Router } from "express";
import {
  completeHabit,
  createHabit,
  deleteHabit,
  getHabit,
  listCompletions,
  listHabits,
  uncompleteHabit,
  updateHabit,
} from "../controllers/habitController.js";

const habitRouter = Router();

habitRouter.get("/", listHabits);
habitRouter.get("/:id", getHabit);
habitRouter.post("/", createHabit);
habitRouter.patch("/:id", updateHabit);
habitRouter.delete("/:id", deleteHabit);
habitRouter.get("/:id/completions", listCompletions);
habitRouter.post("/:id/completions", completeHabit);
habitRouter.delete("/:id/completions/:date", uncompleteHabit);

export default habitRouter;
