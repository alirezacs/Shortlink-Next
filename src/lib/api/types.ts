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
