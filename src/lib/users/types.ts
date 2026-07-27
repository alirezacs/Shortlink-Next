import type { PaginatedResult, PaginationMeta, SortOrder } from "@/lib/api/types";

// Re-exported so the user modules keep importing their pagination types from one
// place, even though the shapes are shared with every other list.
export type { PaginatedResult, PaginationMeta, SortOrder };

export type UserRole = {
  id: string;
  name: string;
  isActive: boolean;
};

export type User = {
  id: string;
  firstName: string;
  lastName: string;
  /** First and last name joined by the API, for display only. */
  fullName: string;
  email: string;
  isActive: boolean;
  isEmailVerified: boolean;
  emailVerifiedAt: string | null;
  lastLoginAt: string | null;
  rolesCount: number;
  /** Returned by both the list and the single account endpoint. */
  roles: UserRole[];
  createdAt: string;
  updatedAt: string;
};

export const USER_SORT_FIELDS = [
  "firstName",
  "lastName",
  "email",
  "lastLoginAt",
  "createdAt",
  "updatedAt",
] as const;

export type UserSortField = (typeof USER_SORT_FIELDS)[number];

export type UserListQuery = {
  page: number;
  limit: number;
  search: string;
  /** "" = any, "true" = active, "false" = deactivated. */
  isActive: string;
  /** "" = any, "true" = verified address, "false" = still unverified. */
  isEmailVerified: string;
  /** "" = any role, otherwise the id of the role to filter on. */
  roleId: string;
  sortBy: UserSortField;
  sortOrder: SortOrder;
};

export type UserInput = {
  firstName: string;
  lastName: string;
  email: string;
  /** Omitted on update to keep the stored password. */
  password?: string;
  isActive?: boolean;
  isEmailVerified?: boolean;
  roleIds?: string[];
};

/** Creating an account always sets a password, updating one only may. */
export type CreateUserInput = UserInput & { password: string };

/** Mirrors the minimum the API enforces. */
export const PASSWORD_MIN_LENGTH = 8;

export const PASSWORD_HINT = `At least ${PASSWORD_MIN_LENGTH} characters.`;

/**
 * Deliberately loose: the API owns the real check, and a stricter pattern here
 * only ever rejects addresses that would have worked.
 */
export const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
