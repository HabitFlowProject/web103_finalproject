import express from "express";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import categoryRouter from "./routes/categoryRoutes.js";
import habitRouter from "./routes/habitRoutes.js";
import insightsRouter from "./routes/insightsRoutes.js";
import resetRouter from "./routes/resetRoutes.js";
import taskRouter from "./routes/taskRoutes.js";

const app = express();
const frontendDistPath = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../../frontend/dist",
);

// Only needed when the frontend is hosted on a different origin; the default
// single-service deployment serves the frontend from this app instead.
const allowedOrigin = process.env.CORS_ORIGIN;
if (allowedOrigin) {
  app.use((request, response, next) => {
    if (request.headers.origin === allowedOrigin) {
      response.set({
        "Access-Control-Allow-Origin": allowedOrigin,
        "Access-Control-Allow-Methods": "GET, POST, PATCH, DELETE",
        "Access-Control-Allow-Headers": "Content-Type",
        Vary: "Origin",
      });
    }
    if (request.method === "OPTIONS") {
      return response.status(204).send();
    }
    next();
  });
}

app.use(express.json());

app.get("/api/health", (_request, response) => {
  response.json({ status: "ok" });
});

app.use("/api/tasks", taskRouter);
app.use("/api/categories", categoryRouter);
app.use("/api/habits", habitRouter);
app.use("/api/insights", insightsRouter);
app.use("/api/reset", resetRouter);

app.use("/api", (_request, response) => {
  response.status(404).json({ error: "Route not found." });
});

// In production the built React app is served from here, and every other
// path falls back to index.html so React Router can handle direct links.
if (fs.existsSync(frontendDistPath)) {
  app.use(express.static(frontendDistPath));
  app.get("*", (_request, response) => {
    response.sendFile(path.join(frontendDistPath, "index.html"));
  });
}

app.use((error, _request, response, _next) => {
  // Malformed JSON bodies are client errors, not server failures.
  if (error.type === "entity.parse.failed") {
    return response.status(400).json({ error: "Request body must be valid JSON." });
  }

  // Other body-parser errors (e.g. payload too large) carry a safe 4xx status.
  if (error.expose && error.status >= 400 && error.status < 500) {
    return response.status(error.status).json({ error: error.message });
  }

  console.error(error);
  response.status(500).json({ error: "Internal server error" });
});

export default app;
