import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { setAuthToken } from "../api/axios";
import { login as loginApi, register as registerApi } from "../api/auth";
import type { User } from "../types";

interface AuthContextValue {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (username: string, email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    const stored = localStorage.getItem("chat_user");
    return stored ? (JSON.parse(stored) as User) : null;
  });
  const [token, setToken] = useState<string | null>(() => localStorage.getItem("chat_token"));
  const [loading] = useState(false);

  useEffect(() => {
    setAuthToken(token);
  }, [token]);

  function persist(nextToken: string, nextUser: User) {
    localStorage.setItem("chat_token", nextToken);
    localStorage.setItem("chat_user", JSON.stringify(nextUser));
    setToken(nextToken);
    setUser(nextUser);
  }

  async function login(email: string, password: string) {
    const { data } = await loginApi(email, password);
    persist(data.token, data.user);
  }

  async function register(username: string, email: string, password: string) {
    const { data } = await registerApi(username, email, password);
    persist(data.token, data.user);
  }

  function logout() {
    localStorage.removeItem("chat_token");
    localStorage.removeItem("chat_user");
    setToken(null);
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
