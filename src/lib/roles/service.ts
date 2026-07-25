import { apiClient, toSearchParams } from "@/lib/api/client";
import type {
  PaginatedResult,
  Role,
  RoleInput,
  RoleListQuery,
} from "@/lib/roles/types";

class RoleService {
  list(query: Partial<RoleListQuery> = {}) {
    return apiClient.request<PaginatedResult<Role>>(
      `/api/roles${toSearchParams(query)}`,
    );
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
