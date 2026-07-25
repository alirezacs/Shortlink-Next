import type { PaginatedResult, PaginationMeta, SortOrder } from "@/lib/api/types";

// Re-exported so the permission modules keep importing their pagination types
// from one place, even though the shapes are shared with every other list.
export type { PaginatedResult, PaginationMeta, SortOrder };

export type PermissionRole = {
  id: string;
  name: string;
};

export type Permission = {
  id: string;
  name: string;
  description: string | null;
  /** First segment of the name, for example `users` in `users.read`. */
  group: string;
  rolesCount: number;
  /** Only returned when fetching a single permission. */
  roles?: PermissionRole[];
  createdAt: string;
  updatedAt: string;
};

export const PERMISSION_SORT_FIELDS = ["name", "createdAt", "updatedAt"] as const;

export type PermissionSortField = (typeof PERMISSION_SORT_FIELDS)[number];

export type PermissionListQuery = {
  page: number;
  limit: number;
  search: string;
  group: string;
  /** "" = any, "true" = assigned to a role, "false" = not assigned. */
  assigned: string;
  sortBy: PermissionSortField;
  sortOrder: SortOrder;
};

export type PermissionInput = {
  name: string;
  description?: string | null;
};

/** Mirrors the pattern enforced by the API. */
export const PERMISSION_NAME_PATTERN = /^[a-z][a-z0-9_]*(\.[a-z0-9_]+)*$/;

export const PERMISSION_NAME_HINT =
  "Lower case, dot separated, for example: users.read";
