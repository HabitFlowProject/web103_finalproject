import express from "express";
import { getUserById } from "../models/userModel.js";

// Sign-in routes. GitHub redirects back to /github/callback, which then sends
// the browser to the React app (`clientUrl`).
export default function createAuthRouter({ passport, isGithubEnabled, clientUrl }) {
  const router = express.Router();

  router.get("/github", (request, response, next) => {
    if (!isGithubEnabled) {
      return response.status(503).json({ error: "GitHub sign-in is not configured." });
    }
    // No scopes: only the public profile (id, username, avatar) is requested.
    passport.authenticate("github")(request, response, next);
  });

  router.get("/github/callback", (request, response, next) => {
    if (!isGithubEnabled) {
      return response.status(503).json({ error: "GitHub sign-in is not configured." });
    }
    passport.authenticate("github", {
      failureRedirect: `${clientUrl}/login?error=github`,
      successRedirect: `${clientUrl}/`,
    })(request, response, next);
  });

  // The signed-in user, or { user: null } for visitors.
  router.get("/me", async (request, response, next) => {
    try {
      const user = request.user ? await getUserById(request.user.id) : null;
      response.json({ user });
    } catch (error) {
      next(error);
    }
  });

  router.post("/logout", (request, response, next) => {
    request.logout((error) => {
      if (error) {
        return next(error);
      }
      request.session.destroy((destroyError) => {
        if (destroyError) {
          return next(destroyError);
        }
        response.clearCookie("habitflow.sid");
        response.status(204).send();
      });
    });
  });

  return router;
}
