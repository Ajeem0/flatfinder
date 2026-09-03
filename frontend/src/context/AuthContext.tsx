import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { api, clearToken, setToken } from "../lib/api";
import type { User } from "../types";

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  googleLogin: (credential: string, userType?: string) => Promise<void>;
  register: (payload: { name: string; email: string; phone?: string; password: string; userType: string }) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  async function refreshUser() {
    try {
      const { user } = await api.auth.me();
      setUser(user);
    } catch {
      setUser(null);
      clearToken();
    }
  }

  useEffect(() => {
    (async () => {
      setLoading(true);
      await refreshUser();
      setLoading(false);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function login(email: string, password: string) {
    const { token, user } = await api.auth.login({ email, password });
    setToken(token);
    setUser(user);
  }

  async function googleLogin(credential: string, userType = "TENANT") {
    const { token, user } = await api.auth.google(credential, userType);
    setToken(token);
    setUser(user);
  }

  async function register(payload: { name: string; email: string; phone?: string; password: string; userType: string }) {
    const { token, user } = await api.auth.register(payload);
    setToken(token);
    setUser(user);
  }

  function logout() {
    clearToken();
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, googleLogin, register, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
