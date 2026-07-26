"use client";

import { useAuthorization } from "@/hooks/useAuthorization";
import type { PermissionRule } from "@/lib/authz";
import type { ReactNode } from "react";

type CanProps = PermissionRule & {
  children: ReactNode;
  /** Rendered in place of `children` when the check fails. Defaults to nothing. */
  fallback?: ReactNode;
};

function toRule(props: CanProps): PermissionRule {
  if (props.permission !== undefined) return { permission: props.permission };
  if (props.anyOf !== undefined) return { anyOf: props.anyOf };
  return { allOf: props.allOf };
}

/**
 * Declarative gate for a privileged piece of UI.
 *
 *   <Can permission={PERMISSIONS.PERMISSIONS.CREATE}><CreateButton /></Can>
 *   <Can anyOf={[PERMISSIONS.USERS.UPDATE, PERMISSIONS.USERS.DELETE]}>...</Can>
 *   <Can allOf={[PERMISSIONS.USERS.READ, PERMISSIONS.USERS.UPDATE]}>...</Can>
 *
 * Use the `useAuthorization()` hook instead when the answer also drives logic,
 * such as a column that collapses or a request that should not be sent.
 */
export default function Can(props: CanProps) {
  const { children, fallback = null } = props;
  const { check, isReady } = useAuthorization();

  if (!isReady || !check(toRule(props))) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}
