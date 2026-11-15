import { Navigate, Outlet } from "react-router-dom";
import ErrorMessage from "../components/ErrorMessage.jsx";
import LoadingState from "../components/LoadingState.jsx";
import { useAuth } from "./AuthContext.jsx";

// Wraps every page that needs a signed-in user; visitors go to /login.
export default function RequireAuth() {
  const { user, status, retry } = useAuth();

  if (status === "loading") {
    return (
      <main className="app-main">
        <LoadingState message="Checking your sign-in..." />
      </main>
    );
  }

  if (status === "error") {
    return (
      <main className="app-main">
        <ErrorMessage message="Unable to reach the server. Please try again." onRetry={retry} />
      </main>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}
