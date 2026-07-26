"use client";

import { AUTH_EXPIRED_EVENT } from "@/lib/api/client";
import { isApiError } from "@/lib/api/types";
import { authService } from "@/lib/auth/service";
import type { AuthUser, LoginCredentials } from "@/lib/auth/types";
import {
  NO_PERMISSIONS,
  toGrantedPermissions,
  type GrantedPermissions,
} from "@/lib/authz";
import { useRouter } from "next/navigation";
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

/**
 * The four states the session can be in.
 *
 * `profile-unavailable` exists because `GET /auth/me` is itself guarded by
 * `users.read`. An account without that permission holds a perfectly valid
 * session but cannot read its own profile, and treating that 403 as a failed
 * *authentication* would bounce it to `/signin`, where the auth proxy sees the
 * still-valid cookie and bounces it straight back — an endless loop.
 * Authentication succeeded; only the profile lookup was refused.
 */
export type AuthStatus =
  | "loading"
  | "authenticated"
  | "unauthenticated"
  | "profile-unavailable";

type AuthContextValue = {
  user: AuthUser | null;
  status: AuthStatus;
  /** True whenever a valid session exists, even if the profile could not be read. */
  isAuthenticated: boolean;
  isLoading: boolean;
  /**
   * Effective permissions of the session, built once here so every `can()` call
   * downstream is a set lookup rather than a scan of an array.
   */
  permissions: GrantedPermissions;
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => Promise<void>;
  getCurrentUser: () => Promise<AuthUser | null>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: Readonly<{ children: React.ReactNode }>) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [status, setStatus] = useState<AuthStatus>("loading");
  const router = useRouter();

  const getCurrentUser = useCallback(async () => {
    try {
      const currentUser = await authService.getCurrentUser();
      setUser(currentUser);
      setStatus("authenticated");
      return currentUser;
    } catch (error) {
      setUser(null);

      // Authorization failure, not an authentication failure: keep the session.
      if (isApiError(error) && error.status === 403) {
        setStatus("profile-unavailable");
        return null;
      }

      if (!isApiError(error) || error.status !== 401) {
        console.error("Unable to restore the authenticated session.", error);
      }

      setStatus("unauthenticated");
      return null;
    }
  }, []);

  // One fetch per session restores both the user and its permissions.
  useEffect(() => {
    void getCurrentUser();
  }, [getCurrentUser]);

  const logout = useCallback(async () => {
    try {
      await authService.logout();
    } finally {
      setUser(null);
      setStatus("unauthenticated");
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

  // Rebuilt only when the user object itself changes, so consumers of
  // `useAuthorization()` keep a stable identity across unrelated re-renders.
  const permissions = useMemo(
    () => (user ? toGrantedPermissions(user.permissions) : NO_PERMISSIONS),
    [user],
  );

  const value = useMemo(() => ({
    user,
    status,
    isAuthenticated: status === "authenticated" || status === "profile-unavailable",
    isLoading: status === "loading",
    permissions,
    login,
    logout,
    getCurrentUser,
  }), [getCurrentUser, login, logout, permissions, status, user]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider.");
  }
  return context;
}
