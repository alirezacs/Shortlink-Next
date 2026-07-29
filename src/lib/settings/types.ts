import type { PaginatedResult, PaginationMeta, SortOrder } from "@/lib/api/types";

export type { PaginatedResult, PaginationMeta, SortOrder };

export const SETTING_TYPES = ["string", "number", "boolean", "json", "array", "enum"] as const;
export type SettingType = (typeof SETTING_TYPES)[number];

export type Setting = {
  id: number;
  key: string;
  value: unknown;
  type: SettingType;
  categoryId: number;
  description: string | null;
  isPublic: boolean;
  isEditable: boolean;
  createdAt: string;
  updatedAt: string;
};

export type SettingInput = {
  key: string;
  value: unknown;
  type: SettingType;
  categoryId: number;
  description?: string | null;
  isPublic?: boolean;
  isEditable?: boolean;
};

export type SettingUpdateInput = Omit<Partial<SettingInput>, "key" | "type">;

export type SettingCategory = {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  sortOrder: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export type SettingCategoryInput = {
  name: string;
  slug: string;
  description?: string | null;
  sortOrder?: number;
  isActive?: boolean;
};
