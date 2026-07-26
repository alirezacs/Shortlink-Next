import { apiClient } from "@/lib/api/client";
import type {
  AuthUser,
  LoginCredentials,
  RegisteredUser,
  RegisterInput,
} from "@/lib/auth/types";

class AuthService {
  login(credentials: LoginCredentials) {
    return apiClient.request<{ success: true }>("/api/auth/login", {
      method: "POST",
      body: credentials,
      retryOnUnauthorized: false,
    });
  }

  register(input: RegisterInput) {
    return apiClient.request<RegisteredUser>("/api/auth/register", {
      method: "POST",
      body: input,
      retryOnUnauthorized: false,
    });
  }

  getCurrentUser() {
    return apiClient.request<AuthUser>("/api/auth/me");
  }

  logout() {
    return apiClient.request<{ success: true }>("/api/auth/logout", {
      method: "POST",
      retryOnUnauthorized: false,
    });
  }
}

export const authService = new AuthService();
