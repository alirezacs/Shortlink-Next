import { ApiError, toErrorBody } from "@/lib/api/types";

const DEFAULT_API_URL = "http://localhost:3002";

export type BackendRequestOptions = Omit<RequestInit, "headers"> & {
  accessToken?: string;
  headers?: HeadersInit;
};

function backendApiUrl() {
  return (process.env.BACKEND_API_URL ?? DEFAULT_API_URL).replace(/\/$/, "");
}

/** Server-side HTTP client. The request interceptor forwards the HttpOnly token
 * to NestJS; browsers never receive or read the JWT. */
class BackendClient {
  async request<T>(path: string, options: BackendRequestOptions = {}): Promise<T> {
    const { accessToken, headers, ...requestOptions } = options;
    const response = await fetch(`${backendApiUrl()}${path}`, {
      ...requestOptions,
      headers: {
        ...headers,
        ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      },
      cache: "no-store",
    });

    const body: unknown = await response.json().catch(() => ({}));
    // Response interceptor: normalize every non-success backend response.
    if (!response.ok) {
      throw new ApiError(response.status, toErrorBody(body));
    }

    return body as T;
  }
}

export const backendClient = new BackendClient();
