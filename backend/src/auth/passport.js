import { Passport } from "passport";
import { Strategy as GitHubStrategy } from "passport-github2";
import { findOrCreateGithubUser, getUserById } from "../models/userModel.js";

// GitHub OAuth settings from the environment, or null when any is missing
// (GitHub sign-in is then switched off and /api/auth/github returns 503).
export function githubConfigFromEnv(env = process.env) {
  const { GITHUB_CLIENT_ID, GITHUB_CLIENT_SECRET, GITHUB_CALLBACK_URL } = env;

  if (!GITHUB_CLIENT_ID || !GITHUB_CLIENT_SECRET || !GITHUB_CALLBACK_URL) {
    return null;
  }

  return {
    clientID: GITHUB_CLIENT_ID,
    clientSecret: GITHUB_CLIENT_SECRET,
    callbackURL: GITHUB_CALLBACK_URL,
  };
}

// A Passport instance per app (rather than the global one) so tests can
// build apps with different settings.
export function createPassport(githubConfig) {
  const passport = new Passport();

  if (githubConfig) {
    passport.use(
      new GitHubStrategy(githubConfig, async (_accessToken, _refreshToken, profile, done) => {
        try {
          done(null, await findOrCreateGithubUser(profile));
        } catch (error) {
          done(error);
        }
      }),
    );
  }

  // Only the user id is stored in the session; the user is reloaded from the
  // database on each request. A deleted user simply ends up signed out.
  passport.serializeUser((user, done) => done(null, user.id));
  passport.deserializeUser(async (userId, done) => {
    try {
      done(null, (await getUserById(userId)) ?? false);
    } catch (error) {
      done(error);
    }
  });

  return passport;
}

// Blocks API requests from visitors who are not signed in.
export function requireUser(request, response, next) {
  if (!request.user) {
    return response.status(401).json({ error: "Please sign in to continue." });
  }
  next();
}
