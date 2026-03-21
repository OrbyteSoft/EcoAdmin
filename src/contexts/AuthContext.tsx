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
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const restoreSession = async () => {
      const token = getToken();

      // If no token exists, immediately stop loading.
      // Do not call api() as it might trigger redirect logic.
      if (!token) {
        setIsLoading(false);
        return;
      }

      try {
        const data = await api<User>("/auth/me");

        if (data.role !== "ADMIN") {
          clearTokens();
          setUser(null);
        } else {
          setUser(data);
        }
      } catch (err) {
        console.error("Session restore failed:", err);
        // api() utility already handles clearTokens and redirect for 401s
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    restoreSession();
  }, []);

  const login = async (email: string, password: string) => {
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

  const logout = () => {
    clearTokens();
    setUser(null);
    window.location.href = "/login";
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider");
  }
  return context;
}
