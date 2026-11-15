import { createApp } from "../../src/app.js";
import { getDemoUserId } from "./testDatabase.js";

// Tests sign in without GitHub: each request acts as the demo user unless it
// sends an `X-Test-User-Id` header with another user's id, or "none" to act
// as a visitor who is not signed in. This middleware only exists in tests.
async function signInTestUser(request, _response, next) {
  try {
    const header = request.get("x-test-user-id");

    if (header !== "none") {
      request.user = { id: header ? Number(header) : await getDemoUserId() };
    }
    next();
  } catch (error) {
    next(error);
  }
}

export function createTestApp(options = {}) {
  return createApp({ githubConfig: null, ...options, beforeRoutes: [signInTestUser] });
}
