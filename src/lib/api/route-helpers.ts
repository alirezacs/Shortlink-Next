import { isApiError } from "@/lib/api/types";
import { ACCESS_TOKEN_COOKIE } from "@/lib/auth/server";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

/** Runs a BFF handler with the HttpOnly access token and normalizes every
 * backend failure into the error shape the browser client already understands. */
export async function withAccessToken(
  handler: (accessToken: string) => Promise<NextResponse>,
): Promise<NextResponse> {
  const accessToken = (await cookies()).get(ACCESS_TOKEN_COOKIE)?.value;
  if (!accessToken) {
    return NextResponse.json({ message: "Unauthenticated." }, { status: 401 });
  }

  try {
    return await handler(accessToken);
  } catch (error) {
    if (isApiError(error)) {
      return NextResponse.json(error.body, { status: error.status });
    }
    return NextResponse.json(
      { message: "Unable to reach the API." },
      { status: 503 },
    );
  }
}

/** Returns the parsed JSON object, or null when the body is missing/malformed. */
export async function readJsonBody(
  request: NextRequest,
): Promise<Record<string, unknown> | null> {
  try {
    const body: unknown = await request.json();
    return typeof body === "object" && body !== null
      ? (body as Record<string, unknown>)
      : null;
  } catch {
    return null;
  }
}

export function invalidBodyResponse() {
  return NextResponse.json({ message: "Invalid request body." }, { status: 400 });
}

/** Forwards only the query parameters the backend accepts. The NestJS validation
 * pipe rejects unknown properties, so unexpected params would become a 400. */
export function forwardSearchParams(
  searchParams: URLSearchParams,
  allowedParams: readonly string[],
): string {
  const forwarded = new URLSearchParams();

  for (const key of allowedParams) {
    const value = searchParams.get(key);
    if (value !== null && value !== "") {
      forwarded.set(key, value);
    }
  }

  const query = forwarded.toString();
  return query ? `?${query}` : "";
}
