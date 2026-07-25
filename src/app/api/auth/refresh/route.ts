import { backendClient } from "@/lib/api/backend-client";
import { backendEndpoints } from "@/lib/api/endpoints";
import { isApiError } from "@/lib/api/types";
import { clearAuthCookies, REFRESH_TOKEN_COOKIE, setAuthCookies } from "@/lib/auth/server";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function POST() {
  const refreshToken = (await cookies()).get(REFRESH_TOKEN_COOKIE)?.value;
  if (!refreshToken) {
    const response = NextResponse.json({ message: "Session expired." }, { status: 401 });
    clearAuthCookies(response);
    return response;
  }

  try {
    // The current NestJS API does not expose this endpoint yet. Once enabled,
    // this BFF route handles token rotation without exposing either token to JS.
    const tokens = await backendClient.request<{ accessToken?: unknown; refreshToken?: unknown }>(backendEndpoints.auth.refresh, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken }),
    });
    const response = NextResponse.json({ success: true });
    setAuthCookies(response, tokens);
    return response;
  } catch (error) {
    const response = NextResponse.json(
      isApiError(error) ? error.body : { message: "Unable to refresh the session." },
      { status: isApiError(error) ? error.status : 503 },
    );
    clearAuthCookies(response);
    return response;
  }
}
