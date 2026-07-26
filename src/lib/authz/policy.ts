import type { PermissionName } from "@/lib/authz/permissions";

/**
 * The effective permissions of the signed-in account.
 *
 * A `Set` keeps every check O(1) and is built once per session in
 * `AuthProvider`, so components can call `can()` in a render loop for free.
 * Typed as `ReadonlySet<string>` rather than `ReadonlySet<PermissionName>`
 * because the API may legitimately grant permissions this build has no
 * constant for yet; the lookups below are the part that stays strongly typed.
 */
export type GrantedPermissions = ReadonlySet<string>;

/** Shared empty set, so "no permissions" never allocates or breaks memoization. */
export const NO_PERMISSIONS: GrantedPermissions = new Set<string>();

/**
 * What a navigation item, a route or a `<Can>` block requires.
 *
 * The three shapes are mutually exclusive on purpose: mixing `permission` with
 * `anyOf` would leave the precedence to the reader, so the type forbids it.
 */
export type PermissionRule =
  | { permission: PermissionName; anyOf?: never; allOf?: never }
  | { permission?: never; anyOf: readonly PermissionName[]; allOf?: never }
  | { permission?: never; anyOf?: never; allOf: readonly PermissionName[] };

export function toGrantedPermissions(permissions: readonly string[]): GrantedPermissions {
  return new Set(permissions);
}

export function hasPermission(
  granted: GrantedPermissions,
  permission: PermissionName,
): boolean {
  return granted.has(permission);
}

export function hasAnyPermission(
  granted: GrantedPermissions,
  permissions: readonly PermissionName[],
): boolean {
  return permissions.some((permission) => granted.has(permission));
}

export function hasAllPermissions(
  granted: GrantedPermissions,
  permissions: readonly PermissionName[],
): boolean {
  return permissions.every((permission) => granted.has(permission));
}

/**
 * Single entry point every consumer funnels through, so sidebar, routes and
 * action buttons can never drift apart.
 *
 * An absent rule means "public": the item is visible to any signed-in account.
 * An empty `anyOf` is unsatisfiable and an empty `allOf` is satisfied by
 * everyone, which is the usual set semantics.
 */
export function isRuleSatisfied(
  granted: GrantedPermissions,
  rule: PermissionRule | undefined,
): boolean {
  if (rule === undefined) return true;
  if (rule.permission !== undefined) return hasPermission(granted, rule.permission);
  if (rule.anyOf !== undefined) return hasAnyPermission(granted, rule.anyOf);
  return hasAllPermissions(granted, rule.allOf);
}
