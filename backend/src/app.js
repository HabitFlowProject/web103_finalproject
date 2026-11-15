import connectPgSimple from "connect-pg-simple";
import express from "express";
import session from "express-session";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import pool from "../config/db.js";
import { createPassport, githubConfigFromEnv, requireUser } from "./auth/passport.js";
import createAuthRouter from "./routes/authRoutes.js";
import categoryRouter from "./routes/categoryRoutes.js";
import habitRouter from "./routes/habitRoutes.js";
import insightsRouter from "./routes/insightsRoutes.js";
import resetRouter from "./routes/resetRoutes.js";
import taskRouter from "./routes/taskRoutes.js";

const frontendDistPath = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../../frontend/dist",
);

const PgSessionStore = connectPgSimple(session);
const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

// Login sessions are stored in Postgres so they survive server restarts.
function createSession(isProduction) {
  const secret = process.env.SESSION_SECRET;

  if (!secret && isProduction) {
    throw new Error("SESSION_SECRET must be set in production.");
  }

  return session({
    name: "habitflow.sid",
    store: new PgSessionStore({ pool, tableName: "session" }),
    secret: secret || "habitflow-development-only-secret",
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      sameSite: "lax",
      secure: isProduction,
      maxAge: THIRTY_DAYS_MS,
    },
  });
}

// Options:
// - githubConfig: GitHub OAuth settings (default: from the environment).
// - clientUrl: where the React app runs. In production it is served by this
//   app; in development it is the Vite server.
// - beforeRoutes: extra middleware run before the API routes (tests only).
export function createApp({
  githubConfig = githubConfigFromEnv(),
  clientUrl = process.env.CLIENT_URL ??
    (process.env.NODE_ENV === "production" ? "" : "http://localhost:5173"),
  beforeRoutes = [],
} = {}) {
  const isProduction = process.env.NODE_ENV === "production";
  const app = express();
  const passport = createPassport(githubConfig);

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

  // Render runs the app behind a proxy; trusting it lets secure cookies work.
  app.set("trust proxy", 1);
  app.use(createSession(isProduction));
  app.use(passport.initialize());
  app.use(passport.session());

  // Tests use this to sign a user in without going through GitHub.
  for (const middleware of beforeRoutes) {
    app.use(middleware);
  }

  app.get("/api/health", (_request, response) => {
    response.json({ status: "ok" });
  });

  app.use(
    "/api/auth",
    createAuthRouter({ passport, isGithubEnabled: githubConfig !== null, clientUrl }),
  );
  app.use("/api/categories", categoryRouter);

  // Everything below holds a user's own data, so it requires signing in.
  app.use("/api/tasks", requireUser, taskRouter);
  app.use("/api/habits", requireUser, habitRouter);
  app.use("/api/insights", requireUser, insightsRouter);
  app.use("/api/reset", requireUser, resetRouter);

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

  return app;
}

export default createApp();
