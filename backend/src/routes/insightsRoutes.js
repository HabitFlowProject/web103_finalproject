import { Router } from "express";
import { getWeeklyInsights } from "../controllers/insightsController.js";

const insightsRouter = Router();

insightsRouter.get("/weekly", getWeeklyInsights);

export default insightsRouter;
