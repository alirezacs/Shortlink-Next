import { backendClient } from "@/lib/api/backend-client";
import { isApiError } from "@/lib/api/types";
import { setAuthCookies } from "@/lib/auth/server";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  let payload: { email?: unknown; password?: unknown; remember?: unknown };

  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ message: "Invalid request body." }, { status: 400 });
  }

  try {
    const tokens = await backendClient.request<{ accessToken?: unknown; refreshToken?: unknown }>("/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: payload.email, password: payload.password }),
    });
    const response = NextResponse.json({ success: true });
    setAuthCookies(response, tokens, payload.remember === true);
    return response;
  } catch (error) {
    if (isApiError(error)) {
      return NextResponse.json(error.body, { status: error.status });
    }
    return NextResponse.json({ message: "Unable to reach the authentication service." }, { status: 503 });
  }
}
