"use client";

import { useAuth } from "@/context/AuthContext";
import {
  hasAllPermissions,
  hasAnyPermission,
  hasPermission,
  isRuleSatisfied,
  type GrantedPermissions,
  type PermissionName,
  type PermissionRule,
} from "@/lib/authz";
import { useMemo } from "react";

export type Authorization = {
  /**
   * False until the session has been resolved. Callers must render nothing
   * privileged while this is false, otherwise an unauthorized button flashes
   * on screen before the permissions arrive.
   */
  isReady: boolean;
  permissions: GrantedPermissions;
  can: (permission: PermissionName) => boolean;
  canAny: (permissions: readonly PermissionName[]) => boolean;
  canAll: (permissions: readonly PermissionName[]) => boolean;
  /** Evaluates a declarative rule, as used by routes and navigation items. */
  check: (rule: PermissionRule | undefined) => boolean;
};

/**
 * The one way a component asks what the current account may do.
 *
 * It reads the permission set the `AuthProvider` already built, so this adds no
 * request and no state of its own. Nothing else in the app should touch
 * `user.permissions` directly.
 */
export function useAuthorization(): Authorization {
  const { permissions, isLoading } = useAuth();

  return useMemo(
    () => ({
      isReady: !isLoading,
      permissions,
      can: (permission) => hasPermission(permissions, permission),
      canAny: (list) => hasAnyPermission(permissions, list),
      canAll: (list) => hasAllPermissions(permissions, list),
      check: (rule) => isRuleSatisfied(permissions, rule),
    }),
    [isLoading, permissions],
  );
}
