import { useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext.jsx";

const links = [
  { to: "/", label: "Dashboard", end: true },
  { to: "/tasks", label: "Tasks" },
  { to: "/habits", label: "Habits" },
  { to: "/insights", label: "Insights" },
];

export default function Navigation() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [signOutError, setSignOutError] = useState(false);

  async function handleSignOut() {
    setIsSigningOut(true);
    setSignOutError(false);
    try {
      await signOut();
      navigate("/login", { replace: true });
    } catch (error) {
      console.error(error);
      setSignOutError(true);
      setIsSigningOut(false);
    }
  }

  return (
    <nav className="nav" aria-label="Main">
      <Link to="/" className="nav-brand">
        HabitFlow
      </Link>
      <ul className="nav-links">
        {links.map(({ to, label, end }) => (
          <li key={to}>
            <NavLink
              to={to}
              end={end}
              className={({ isActive }) => (isActive ? "nav-link active" : "nav-link")}
            >
              {label}
            </NavLink>
          </li>
        ))}
      </ul>
      {user && (
        <div className="nav-user">
          {user.avatar_url && (
            <img className="nav-avatar" src={user.avatar_url} alt="" width="28" height="28" />
          )}
          <span className="nav-username">{user.username ?? user.name}</span>
          <button
            type="button"
            className="button button-quiet"
            onClick={handleSignOut}
            disabled={isSigningOut}
          >
            {isSigningOut ? "Signing out..." : "Sign out"}
          </button>
          {signOutError && (
            <span className="nav-user-error" role="alert">
              Sign out failed. Try again.
            </span>
          )}
        </div>
      )}
    </nav>
  );
}
