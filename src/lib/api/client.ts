import { ApiError, type ApiErrorBody } from "@/lib/api/types";

type RequestOptions = Omit<RequestInit, "body"> & {
  body?: unknown;
  retryOnUnauthorized?: boolean;
};

const AUTH_EXPIRED_EVENT = "auth:expired";

/** Serializes a list query, dropping empty values so the API applies its own
 * defaults instead of receiving a blank filter. */
export function toSearchParams(query: Record<string, unknown>): string {
  const params = new URLSearchParams();

  for (const [key, value] of Object.entries(query)) {
    if (value !== undefined && value !== null && value !== "") {
      params.set(key, String(value));
    }
  }

  const search = params.toString();
  return search ? `?${search}` : "";
}

class ApiClient {
  async request<T>(path: string, options: RequestOptions = {}): Promise<T> {
    const { body, retryOnUnauthorized = true, headers, ...requestOptions } = options;
    const response = await fetch(path, {
      ...requestOptions,
      headers: {
        "Content-Type": "application/json",
        ...headers,
      },
      body: body === undefined ? undefined : JSON.stringify(body),
      credentials: "same-origin",
    });

    if (response.status === 401 && retryOnUnauthorized && path !== "/api/auth/refresh") {
      const refreshed = await this.refreshSession();
      if (refreshed) {
        return this.request<T>(path, { ...options, retryOnUnauthorized: false });
      }

      window.dispatchEvent(new Event(AUTH_EXPIRED_EVENT));
    }

    const responseBody: unknown = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new ApiError(response.status, this.toErrorBody(responseBody));
    }

    return responseBody as T;
  }

  private async refreshSession(): Promise<boolean> {
    const response = await fetch("/api/auth/refresh", {
      method: "POST",
      credentials: "same-origin",
    });
    return response.ok;
  }

  private toErrorBody(body: unknown): ApiErrorBody {
    if (typeof body === "object" && body !== null && "message" in body) {
      const message = (body as { message?: unknown }).message;
      if (typeof message === "string" || Array.isArray(message)) {
        return { message: message as string | string[] };
      }
    }
    return {};
  }
}

export const apiClient = new ApiClient();
export { AUTH_EXPIRED_EVENT };
