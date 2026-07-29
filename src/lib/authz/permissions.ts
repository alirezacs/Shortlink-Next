/**
 * Every permission name the NestJS API enforces, in one place.
 *
 * The strings must stay identical to the ones the backend guards check
 * (`@Permissions('permissions.read')` and friends). Keeping them here means a
 * rename is a single edit plus a compiler sweep instead of a grep through JSX,
 * and `PermissionName` turns a typo into a build error rather than a silently
 * hidden button.
 */
export const PERMISSIONS = {
  USERS: {
    READ: "users.read",
    CREATE: "users.create",
    UPDATE: "users.update",
    DELETE: "users.delete",
  },
  ROLES: {
    READ: "roles.read",
    CREATE: "roles.create",
    UPDATE: "roles.update",
    DELETE: "roles.delete",
  },
  PERMISSIONS: {
    READ: "permissions.read",
    CREATE: "permissions.create",
    UPDATE: "permissions.update",
    DELETE: "permissions.delete",
  },
  SETTINGS: {
    READ: "settings.read",
    CREATE: "settings.create",
    UPDATE: "settings.update",
    DELETE: "settings.delete",
  },
  SETTING_CATEGORIES: {
    READ: "settings.categories.read",
    CREATE: "settings.categories.create",
    UPDATE: "settings.categories.update",
    DELETE: "settings.categories.delete",
  },
} as const;

type PermissionRegistry = typeof PERMISSIONS;

/** Resource keys of `PERMISSIONS`, for example `"ROLES"`. */
export type PermissionResource = keyof PermissionRegistry;

/**
 * Union of every permission string in `PERMISSIONS`.
 *
 * Written as a mapped type rather than a plain indexed access so a future
 * resource with a different set of actions (`links.publish`, ...) still widens
 * the union correctly.
 */
export type PermissionName = {
  [Resource in PermissionResource]: PermissionRegistry[Resource][keyof PermissionRegistry[Resource]];
}[PermissionResource];

/**
 * Flat list of every known permission. Only used for tooling and tests: the
 * dashboard authorizes against what the API reports, never against this list.
 */
export const ALL_PERMISSIONS = Object.values(PERMISSIONS).flatMap((resource) =>
  Object.values(resource),
) as readonly PermissionName[];
