import type { PaginatedResult, PaginationMeta, SortOrder } from "@/lib/api/types";

// Re-exported so the role modules keep importing their pagination types from one
// place, even though the shapes are shared with every other list.
export type { PaginatedResult, PaginationMeta, SortOrder };

export type RolePermission = {
  id: string;
  name: string;
};

export type RoleUser = {
  id: string;
  fullName: string;
  email: string;
};

export type Role = {
  id: string;
  name: string;
  description: string | null;
  isActive: boolean;
  permissionsCount: number;
  usersCount: number;
  /** Only returned when fetching a single role. */
  permissions?: RolePermission[];
  /** Only returned when fetching a single role. */
  users?: RoleUser[];
  createdAt: string;
  updatedAt: string;
};

export const ROLE_SORT_FIELDS = ["name", "createdAt", "updatedAt"] as const;

export type RoleSortField = (typeof ROLE_SORT_FIELDS)[number];

export type RoleListQuery = {
  page: number;
  limit: number;
  search: string;
  /** "" = any, "true" = active, "false" = deactivated. */
  isActive: string;
  /** "" = any, "true" = held by a user, "false" = held by nobody. */
  assigned: string;
  sortBy: RoleSortField;
  sortOrder: SortOrder;
};

export type RoleInput = {
  name: string;
  description?: string | null;
  isActive?: boolean;
  permissionIds?: string[];
};

/** Mirrors the pattern enforced by the API. */
export const ROLE_NAME_PATTERN = /^[a-z][a-z0-9_-]*$/;

export const ROLE_NAME_HINT =
  "Lower case, no spaces or dots, for example: content_editor";
