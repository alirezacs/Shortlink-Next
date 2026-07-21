import { backendClient } from "@/lib/api/backend-client";
import { isApiError } from "@/lib/api/types";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  let payload: {
    firstName?: unknown;
    lastName?: unknown;
    email?: unknown;
    password?: unknown;
  };

  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ message: "Invalid request body." }, { status: 400 });
  }

  try {
    const user = await backendClient.request<unknown>("/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
      firstName: payload.firstName,
      lastName: payload.lastName,
      email: payload.email,
      password: payload.password,
      }),
    });
    return NextResponse.json(user, { status: 201 });
  } catch (error) {
    if (isApiError(error)) {
      return NextResponse.json(error.body, { status: error.status });
    }
    return NextResponse.json({ message: "Unable to reach the authentication service." }, { status: 503 });
  }
}
