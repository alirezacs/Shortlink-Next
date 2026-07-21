"use client";

import { AUTH_EXPIRED_EVENT } from "@/lib/api/client";
import { isApiError } from "@/lib/api/types";
import { authService } from "@/lib/auth/service";
import type { AuthUser, LoginCredentials } from "@/lib/auth/types";
import { useRouter } from "next/navigation";
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

type AuthContextValue = {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => Promise<void>;
  getCurrentUser: () => Promise<AuthUser | null>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: Readonly<{ children: React.ReactNode }>) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  const getCurrentUser = useCallback(async () => {
    try {
      const currentUser = await authService.getCurrentUser();
      setUser(currentUser);
      return currentUser;
    } catch (error) {
      if (!isApiError(error) || error.status !== 401) {
        console.error("Unable to restore the authenticated session.", error);
      }
      setUser(null);
      return null;
    }
  }, []);

  useEffect(() => {
    void getCurrentUser().finally(() => setIsLoading(false));
  }, [getCurrentUser]);

  const logout = useCallback(async () => {
    try {
      await authService.logout();
    } finally {
      setUser(null);
      router.replace("/signin");
      router.refresh();
    }
  }, [router]);

  useEffect(() => {
    const handleExpiredSession = () => void logout();
    window.addEventListener(AUTH_EXPIRED_EVENT, handleExpiredSession);
    return () => window.removeEventListener(AUTH_EXPIRED_EVENT, handleExpiredSession);
  }, [logout]);

  const login = useCallback(async (credentials: LoginCredentials) => {
    await authService.login(credentials);
    await getCurrentUser();
  }, [getCurrentUser]);

  const value = useMemo(() => ({
    user,
    isAuthenticated: user !== null,
    isLoading,
    login,
    logout,
    getCurrentUser,
  }), [getCurrentUser, isLoading, login, logout, user]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider.");
  }
  return context;
}
