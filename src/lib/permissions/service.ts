import { apiClient, toSearchParams } from "@/lib/api/client";
import type {
  PaginatedResult,
  Permission,
  PermissionInput,
  PermissionListQuery,
} from "@/lib/permissions/types";

/** Largest page the API accepts, used when the whole catalogue is needed. */
const MAX_LIMIT = 100;

/** Stops a broken `hasNextPage` from looping forever. */
const MAX_PAGES = 20;

class PermissionService {
  list(query: Partial<PermissionListQuery> = {}) {
    return apiClient.request<PaginatedResult<Permission>>(
      `/api/permissions${toSearchParams(query)}`,
    );
  }

  /** Every permission, for pickers that show the full catalogue at once. */
  async listAll(): Promise<Permission[]> {
    const permissions: Permission[] = [];

    for (let page = 1; page <= MAX_PAGES; page += 1) {
      const result = await this.list({ page, limit: MAX_LIMIT, sortBy: "name" });
      permissions.push(...result.data);

      if (!result.meta.hasNextPage) break;
    }

    return permissions;
  }

  groups() {
    return apiClient.request<string[]>("/api/permissions/groups");
  }

  get(id: string) {
    return apiClient.request<Permission>(`/api/permissions/${id}`);
  }

  create(input: PermissionInput) {
    return apiClient.request<Permission>("/api/permissions", {
      method: "POST",
      body: input,
    });
  }

  update(id: string, input: PermissionInput) {
    return apiClient.request<Permission>(`/api/permissions/${id}`, {
      method: "PATCH",
      body: input,
    });
  }

  remove(id: string) {
    return apiClient.request<{ success: true }>(`/api/permissions/${id}`, {
      method: "DELETE",
    });
  }
}

export const permissionService = new PermissionService();
