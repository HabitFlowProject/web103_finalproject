import { useEffect, useId, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext.jsx";

// The avatar button in the header. It opens a small popover with the
// username and Sign out (the sign-out logic moved here from Navigation).
export default function UserMenu() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [signOutError, setSignOutError] = useState(false);
  const containerRef = useRef(null);
  const triggerRef = useRef(null);
  const menuId = useId();

  useEffect(() => {
    if (!isOpen) {
      return undefined;
    }

    function onKeyDown(event) {
      if (event.key === "Escape") {
        setIsOpen(false);
        triggerRef.current?.focus();
      }
    }
    function onPointerDown(event) {
      if (!containerRef.current?.contains(event.target)) {
        setIsOpen(false);
      }
    }

    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("pointerdown", onPointerDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("pointerdown", onPointerDown);
    };
  }, [isOpen]);

  if (!user) {
    return null;
  }

  const displayName = user.username ?? user.name ?? "You";
  const initial = displayName.trim().charAt(0).toUpperCase() || "?";

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
    <div className="user-menu" ref={containerRef}>
      <button
        ref={triggerRef}
        type="button"
        className="avatar-button"
        aria-label={`Account menu for ${displayName}`}
        aria-expanded={isOpen}
        aria-controls={menuId}
        onClick={() => setIsOpen((open) => !open)}
      >
        {user.avatar_url ? (
          <img className="nav-avatar" src={user.avatar_url} alt="" width="44" height="44" />
        ) : (
          <span className="avatar-initial" aria-hidden="true">
            {initial}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="user-menu-popover" id={menuId}>
          <p className="user-menu-label">Signed in as</p>
          <p className="nav-username">{displayName}</p>
          <button
            type="button"
            className="button user-menu-signout"
            onClick={handleSignOut}
            disabled={isSigningOut}
          >
            {isSigningOut ? "Signing out..." : "Sign out"}
          </button>
          {signOutError && (
            <p className="nav-user-error" role="alert">
              Sign out failed. Try again.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
