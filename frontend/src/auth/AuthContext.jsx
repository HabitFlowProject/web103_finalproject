import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { getCurrentUser, signOut as requestSignOut } from "../api/auth.js";
import { setUnauthorizedHandler } from "../api/client.js";

const AuthContext = createContext(null);

// Loads who is signed in once, and shares it with the whole app.
// status: "loading" | "ready" | "error" (the server could not be reached).
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [status, setStatus] = useState("loading");

  const loadUser = useCallback(async () => {
    setStatus("loading");
    try {
      const response = await getCurrentUser();
      setUser(response.user);
      setStatus("ready");
    } catch (error) {
      console.error(error);
      setStatus("error");
    }
  }, []);

  useEffect(() => {
    loadUser();
  }, [loadUser]);

  // If the session expires, any API call answers 401; treat that as signed out.
  useEffect(() => {
    setUnauthorizedHandler(() => setUser(null));
    return () => setUnauthorizedHandler(null);
  }, []);

  const signOut = useCallback(async () => {
    await requestSignOut();
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({ user, status, retry: loadUser, signOut }),
    [user, status, loadUser, signOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used inside <AuthProvider>.");
  }
  return context;
}
