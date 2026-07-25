import type { AuthUser } from "@/lib/auth/types";

/** Client side gate for action buttons. The API is still the source of truth:
 * an unknown permission list (older API response) falls back to allowing the
 * action, while an empty list means the user genuinely has none. */
export function hasPermission(user: AuthUser | null, permission: string): boolean {
  if (!user) return false;
  if (!user.permissions) return true;

  return user.permissions.includes(permission);
}
