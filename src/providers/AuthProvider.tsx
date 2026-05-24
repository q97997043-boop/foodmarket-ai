import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { trpc } from "../lib/trpc";
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

  const {
    data: userData,
    isLoading: isQueryLoading,
    isFetching,
    isError,
    error,
  } = trpc.auth.me.useQuery(undefined, {
    enabled: !!token,
    retry: false,
    refetchOnWindowFocus: false,
  });

  const authPending = !!token && (isQueryLoading || isFetching) && !isError;
  const authTimedOut = useLoadingTimeout(authPending, 3000);

  useEffect(() => {
    if (userData) {
      logInit("auth", "session validated", {
        email: userData.email,
        restaurantId: userData.restaurantId,
      });
      setUser(userData as User);
      setIsAuthenticated(true);
    }
  }, [userData]);

  useEffect(() => {
    if (isError) {
      warnInit("auth", "session invalid — redirecting to login", error);
      logout();
    }
  }, [isError, error, logout]);

  useEffect(() => {
    if (authTimedOut && token) {
      warnInit("auth", "init timeout (3s) — clearing stale token");
      logout();
    }
  }, [authTimedOut, token, logout]);

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
