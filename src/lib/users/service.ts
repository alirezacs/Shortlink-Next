import { apiClient, toSearchParams } from "@/lib/api/client";
import type {
  CreateUserInput,
  PaginatedResult,
  User,
  UserInput,
  UserListQuery,
} from "@/lib/users/types";

class UserService {
  list(query: Partial<UserListQuery> = {}) {
    return apiClient.request<PaginatedResult<User>>(
      `/api/users${toSearchParams(query)}`,
    );
  }

  get(id: string) {
    return apiClient.request<User>(`/api/users/${id}`);
  }

  create(input: CreateUserInput) {
    return apiClient.request<User>("/api/users", {
      method: "POST",
      body: input,
    });
  }

  update(id: string, input: UserInput) {
    return apiClient.request<User>(`/api/users/${id}`, {
      method: "PATCH",
      body: input,
    });
  }

  remove(id: string) {
    return apiClient.request<{ success: true }>(`/api/users/${id}`, {
      method: "DELETE",
    });
  }
}

export const userService = new UserService();
