import { apiClient } from "@/lib/api/client";
import type {
  PaginatedResult,
  Permission,
  PermissionInput,
  PermissionListQuery,
} from "@/lib/permissions/types";

function toSearchParams(query: Partial<PermissionListQuery>) {
  const params = new URLSearchParams();

  for (const [key, value] of Object.entries(query)) {
    if (value !== undefined && value !== null && value !== "") {
      params.set(key, String(value));
    }
  }

  const search = params.toString();
  return search ? `?${search}` : "";
}

class PermissionService {
  list(query: Partial<PermissionListQuery> = {}) {
    return apiClient.request<PaginatedResult<Permission>>(
      `/api/permissions${toSearchParams(query)}`,
    );
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
