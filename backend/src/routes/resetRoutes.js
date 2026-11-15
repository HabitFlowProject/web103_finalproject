import { Router } from "express";
import { resetDatabase } from "../controllers/resetController.js";

const resetRouter = Router();

resetRouter.post("/", resetDatabase);

export default resetRouter;
