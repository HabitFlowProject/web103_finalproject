import { Navigate, useSearchParams } from "react-router-dom";
import { API_BASE_URL } from "../api/client.js";
import { useAuth } from "../auth/AuthContext.jsx";
import ErrorMessage from "../components/ErrorMessage.jsx";
import { CheckIcon, GitHubIcon, HabitsIcon, StarIcon } from "../components/Icons.jsx";
import LoadingState from "../components/LoadingState.jsx";
import Logo from "../components/Logo.jsx";
import Scene from "../components/Scene.jsx";
import ThemeToggle from "../components/ThemeToggle.jsx";

const FEATURES = [
  { label: "Tasks", Icon: CheckIcon },
  { label: "Habits", Icon: HabitsIcon },
  { label: "Streaks", Icon: StarIcon },
];

export default function LoginPage() {
  const { user, status, retry } = useAuth();
  const [searchParams] = useSearchParams();

  if (status === "ready" && user) {
    return <Navigate to="/" replace />;
  }

  return (
    <main className="login-page">
      <Scene height={900} sunX={0.8} sunY={0.62} sunRadius={68} className="login-scene" />
      <ThemeToggle className="login-theme-toggle" />

      <section className="login-card glass" aria-labelledby="login-title">
        <div className="login-brand">
          <Logo height={52} />
        </div>
        <h1 id="login-title">Build habits that stick.</h1>
        <p className="login-intro">
          Track tasks and daily habits, keep your streaks going, and see how your week is
          going. Your first sign-in comes with a few starter tasks and habits to explore.
        </p>

        <ul className="login-features" aria-label="What you can do">
          {FEATURES.map(({ label, Icon }) => (
            <li key={label}>
              <Icon size={20} />
              <span>{label}</span>
            </li>
          ))}
        </ul>

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
            <span className="login-button-icon" aria-hidden="true">
              <GitHubIcon size={18} />
            </span>
            Sign in with GitHub
          </a>
        )}
        <p className="login-note">
          HabitFlow only reads your public GitHub profile (username and avatar).
        </p>
      </section>

      <p className="login-footer">HabitFlow · a calmer way to get things done</p>
    </main>
  );
}
