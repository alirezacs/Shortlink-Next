import { apiClient, toSearchParams } from "@/lib/api/client";
import type {
  PaginatedResult,
  Role,
  RoleInput,
  RoleListQuery,
} from "@/lib/roles/types";

/** Largest page the API accepts, used when the whole catalogue is needed. */
const MAX_LIMIT = 100;

/** Stops a broken `hasNextPage` from looping forever. */
const MAX_PAGES = 20;

class RoleService {
  list(query: Partial<RoleListQuery> = {}) {
    return apiClient.request<PaginatedResult<Role>>(
      `/api/roles${toSearchParams(query)}`,
    );
  }

  /** Every role, for pickers and filters that show the full catalogue at once. */
  async listAll(): Promise<Role[]> {
    const roles: Role[] = [];

    for (let page = 1; page <= MAX_PAGES; page += 1) {
      const result = await this.list({ page, limit: MAX_LIMIT, sortBy: "name" });
      roles.push(...result.data);

      if (!result.meta.hasNextPage) break;
    }

    return roles;
  }

  get(id: string) {
    return apiClient.request<Role>(`/api/roles/${id}`);
  }

  create(input: RoleInput) {
    return apiClient.request<Role>("/api/roles", {
      method: "POST",
      body: input,
    });
  }

  update(id: string, input: RoleInput) {
    return apiClient.request<Role>(`/api/roles/${id}`, {
      method: "PATCH",
      body: input,
    });
  }

  remove(id: string) {
    return apiClient.request<{ success: true }>(`/api/roles/${id}`, {
      method: "DELETE",
    });
  }
}

export const roleService = new RoleService();
