import { Navigate, useSearchParams } from "react-router-dom";
import { API_BASE_URL } from "../api/client.js";
import { useAuth } from "../auth/AuthContext.jsx";
import ErrorMessage from "../components/ErrorMessage.jsx";
import LoadingState from "../components/LoadingState.jsx";

export default function LoginPage() {
  const { user, status, retry } = useAuth();
  const [searchParams] = useSearchParams();

  if (status === "ready" && user) {
    return <Navigate to="/" replace />;
  }

  return (
    <main className="login-page">
      <section className="login-card">
        <p className="login-brand">HabitFlow</p>
        <h1>Build steady habits and finish what matters</h1>
        <p className="login-intro">
          Track tasks and daily habits, keep your streaks going, and see how your week is
          going. Your first sign-in comes with a few starter tasks and habits to explore.
        </p>

        {searchParams.get("error") === "github" && (
          <ErrorMessage message="GitHub sign-in did not finish. Please try again." />
        )}
        {status === "error" && (
          <ErrorMessage message="Unable to reach the server. Please try again." onRetry={retry} />
        )}

        {status === "loading" ? (
          <LoadingState message="Checking your sign-in..." />
        ) : (
          // A full page navigation (not fetch): the server redirects to GitHub.
          <a className="button button-primary login-button" href={`${API_BASE_URL}/api/auth/github`}>
            Sign in with GitHub
          </a>
        )}
        <p className="login-note">
          HabitFlow only reads your public GitHub profile (username and avatar).
        </p>
      </section>
    </main>
  );
}
