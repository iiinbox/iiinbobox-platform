import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { AuthUser, LoginInput, RegisterInput } from "@iiiiibox/shared-types";
import { api } from "./api";
import { secureTokenStorage } from "./token-storage";

interface AuthContextValue {
  user: AuthUser | null;
  loading: boolean;
  login: (input: LoginInput) => Promise<void>;
  register: (input: RegisterInput) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  async function refreshUser() {
    try {
      setUser(await api.auth.me());
    } catch {
      setUser(null);
    }
  }

  useEffect(() => {
    (async () => {
      const token = await secureTokenStorage.getAccessToken();
      if (token) {
        await refreshUser();
      }
      setLoading(false);
    })();
  }, []);

  async function login(input: LoginInput) {
    const tokens = await api.auth.login(input);
    await secureTokenStorage.setAccessToken(tokens.accessToken);
    await secureTokenStorage.setRefreshToken(tokens.refreshToken);
    await refreshUser();
  }

  async function register(input: RegisterInput) {
    const tokens = await api.auth.register(input);
    await secureTokenStorage.setAccessToken(tokens.accessToken);
    await secureTokenStorage.setRefreshToken(tokens.refreshToken);
    await refreshUser();
  }

  async function logout() {
    await secureTokenStorage.setAccessToken(null);
    await secureTokenStorage.setRefreshToken(null);
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return ctx;
}
