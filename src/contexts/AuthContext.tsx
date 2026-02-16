import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { api, setTokens, clearTokens } from "@/lib/api";

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const initializeAuth = async () => {
      const token = localStorage.getItem("access_token");
      if (!token) {
        if (isMounted) setIsLoading(false);
        return;
      }
      try {
        const userData = await api<User>("/auth/me");
        if (isMounted) setUser(userData);
      } catch {
        // api() already attempts token refresh on 401 before throwing
        clearTokens();
        if (isMounted) setUser(null);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    initializeAuth();

    return () => { isMounted = false; };
  }, []);

  const login = async (email: string, password: string) => {
    const data = await api<{ accessToken: string; refreshToken: string; user: User }>(
      "/auth/login",
      { method: "POST", body: JSON.stringify({ email, password }) }
    );
    setTokens(data.accessToken, data.refreshToken);
    setUser(data.user);
  };

  const logout = async () => {
    try {
      await api("/auth/logout", { method: "POST" });
    } catch { /* ignore */ }
    clearTokens();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
