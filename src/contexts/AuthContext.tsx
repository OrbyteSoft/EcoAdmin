import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { api, clearTokens, setTokens, getToken } from "@/lib/api";

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
    const restoreSession = async () => {
      const token = getToken();

      // No token → nothing to restore, show login immediately
      if (!token) {
        setIsLoading(false);
        return;
      }

      try {
        // /auth/me is in SKIP_REFRESH_ENDPOINTS so a 401 here will NOT
        // set isRedirecting or redirect — it just throws and we handle below
        const data = await api<User>("/auth/me");

        if (data.role !== "ADMIN") {
          // Valid token but not an admin — clear and show login
          clearTokens();
          setUser(null);
        } else {
          setUser(data);
        }
      } catch {
        // Token was invalid or expired — clear silently, let ProtectedRoute
        // handle the redirect to /login. Do NOT navigate here so that
        // isRedirecting stays false and the login form works immediately.
        clearTokens();
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    restoreSession();
  }, []);

  const login = async (email: string, password: string): Promise<void> => {
    const data = await api<{
      accessToken: string;
      refreshToken: string;
      user: User;
    }>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });

    if (data.user.role !== "ADMIN") {
      throw new Error("Only Administrators are allowed here.");
    }

    setTokens(data.accessToken, data.refreshToken, data.user.role);
    setUser(data.user);
  };

  const logout = async (): Promise<void> => {
    try {
      // Invalidate the refresh token server-side so it can't be reused
      await api("/auth/logout", { method: "POST" });
    } catch {
      // Non-fatal — clear locally regardless
    } finally {
      clearTokens();
      setUser(null);
      window.location.href = "/login";
    }
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used inside AuthProvider");
  return context;
}
