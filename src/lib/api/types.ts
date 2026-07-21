export type ApiErrorBody = {
  message?: string | string[];
};

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
