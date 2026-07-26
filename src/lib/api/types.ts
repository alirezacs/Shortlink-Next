export type ApiErrorBody = {
  message?: string | string[];
};

/** Envelope every paginated list endpoint of the API returns. */
export type PaginationMeta = {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasPreviousPage: boolean;
  hasNextPage: boolean;
};

export type PaginatedResult<T> = {
  data: T[];
  meta: PaginationMeta;
};

export type SortOrder = "ASC" | "DESC";

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly body: ApiErrorBody = {},
  ) {
    super(
      Array.isArray(body.message)
        ? body.message.join(" ")
        : body.message ?? "An unexpected error occurred.",
    );
    this.name = "ApiError";
  }
}

export function isApiError(error: unknown): error is ApiError {
  return error instanceof ApiError;
}

/** 401: the session is gone. Handled centrally by the API client, which tries a
 * refresh and then signs the user out. */
export function isUnauthorizedError(error: unknown): boolean {
  return isApiError(error) && error.status === 401;
}

/** 403: the session is fine, the account simply may not do this. Never a reason
 * to sign anyone out. */
export function isForbiddenError(error: unknown): boolean {
  return isApiError(error) && error.status === 403;
}

const FORBIDDEN_MESSAGE =
  "You do not have permission to perform this action. Ask an administrator if you need access.";

/**
 * Turns a rejected request into something worth showing a user.
 *
 * A 403 gets an authorization message rather than the backend's terse "Forbidden
 * resource", which is what keeps a permission failure visibly different from a
 * sign-in problem. The dashboard hides actions it knows are not permitted, so a
 * 403 here usually means the permissions changed mid-session.
 */
export function toErrorMessage(error: unknown, fallback: string): string {
  if (isForbiddenError(error)) return FORBIDDEN_MESSAGE;
  return isApiError(error) ? error.message : fallback;
}
