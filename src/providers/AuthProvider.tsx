import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { logInit, warnInit } from "../lib/init-log";
import { useLoadingTimeout } from "../hooks/useLoadingTimeout";

export type User = {
  id: string;
  email: string;
  role: string;
  restaurantId: string | null;
};

type AuthContextType = {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthReady: boolean;
  isAuthenticated: boolean;
  login: (token: string, user: User) => void;
  logout: () => void;
};

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(() => {
    const stored = localStorage.getItem("auth-token");
    logInit("auth", stored ? "token found in storage" : "no token in storage");
    return stored;
  });
  const [user, setUser] = useState<User | null>(() => {
    try {
      const raw = localStorage.getItem("auth-user");
      return raw ? (JSON.parse(raw) as User) : null;
    } catch (err) {
      return null;
    }
  });

  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    try {
      const raw = localStorage.getItem("auth-token");
      return !!raw;
    } catch (err) {
      return false;
    }
  });

  const logout = useCallback(() => {
    logInit("auth", "logout — clearing session");
    localStorage.removeItem("auth-token");
    localStorage.removeItem("auth-user");
    setToken(null);
    setUser(null);
    setIsAuthenticated(false);
  }, []);

  const [isQueryLoading, setIsQueryLoading] = useState(false);
  const [isErrorState, setIsErrorState] = useState<string | null>(null);
  const authPending = !!token && isQueryLoading && !isErrorState;
  const authTimedOut = useLoadingTimeout(authPending, 3000);

  useEffect(() => {
    let mounted = true;
    async function fetchMe() {
      if (!token) return;
      setIsQueryLoading(true);
      setIsErrorState(null);
      try {
        const res = await fetch(`${window.location.origin}/api/auth/me`, {
          method: "GET",
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) {
          const txt = await res.text();
          throw new Error(`Auth fetch failed: ${res.status} ${txt}`);
        }
        const contentType = res.headers.get("content-type") || "";
        if (!contentType.includes("application/json")) {
          const txt = await res.text();
          throw new Error(`Invalid JSON response: ${txt}`);
        }
        const payload = await res.json();
        if (mounted && payload?.user) {
          logInit("auth", "session validated", {
            email: payload.user.email,
            restaurantId: payload.user.restaurantId,
          });
          setUser(payload.user as User);
          setIsAuthenticated(true);
        } else if (mounted) {
          setIsErrorState("Invalid auth response");
          logout();
        }
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err);
        setIsErrorState(message);
        warnInit("auth", "session invalid — redirecting to login", message);
        logout();
      } finally {
        if (mounted) setIsQueryLoading(false);
      }
    }

    if (token) fetchMe();
    return () => {
      mounted = false;
    };
  }, [token, logout]);

  const login = useCallback((newToken: string, newUser: User) => {
    logInit("auth", "login success", { email: newUser.email });
    localStorage.setItem("auth-token", newToken);
    console.log("AuthProvider: saved auth-token to localStorage", { key: "auth-token", tokenPreview: String(newToken).slice(0, 8) });
    try {
      localStorage.setItem("auth-user", JSON.stringify(newUser));
      console.log("AuthProvider: saved auth-user to localStorage", { userEmail: newUser.email });
    } catch (err) {
      logInit("auth", "warning: failed to persist user to localStorage", String(err));
    }
    setToken(newToken);
    setUser(newUser);
    setIsAuthenticated(true);
    console.log("AuthProvider: auth state updated", { token: !!newToken, userEmail: newUser.email });
  }, []);

  const currentUser = userData ?? user;
  const isLoading = authPending && !authTimedOut;
  const isAuthReady = !token || !isLoading;

  useEffect(() => {
    console.log("AuthProvider: state", { tokenPresent: !!token, userPresent: !!currentUser, isAuthenticated });
  }, [token, currentUser, isAuthenticated]);

  return (
    <AuthContext.Provider
      value={{ user: currentUser, token, isLoading, isAuthReady, isAuthenticated, login, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
