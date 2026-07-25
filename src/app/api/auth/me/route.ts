import { backendClient } from "@/lib/api/backend-client";
import { isApiError } from "@/lib/api/types";
import { ACCESS_TOKEN_COOKIE } from "@/lib/auth/server";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

type BackendRole = {
  name?: unknown;
  permissions?: unknown;
};

function isBackendRole(role: unknown): role is BackendRole {
  return typeof role === "object" && role !== null;
}

/** Flattens role permissions so the dashboard can hide actions the API would reject. */
function toPermissionNames(roles: unknown[]) {
  const names = roles.flatMap((role) =>
    isBackendRole(role) && Array.isArray(role.permissions)
      ? role.permissions.flatMap((permission) =>
          isBackendRole(permission) && typeof permission.name === "string"
            ? [permission.name]
            : [],
        )
      : [],
  );

  return [...new Set(names)];
}

function toCurrentUser(user: unknown) {
  if (typeof user !== "object" || user === null) {
    throw new Error("Authentication service returned an invalid user.");
  }

  const value = user as Record<string, unknown>;
  if (
    typeof value.id !== "string" ||
    typeof value.firstName !== "string" ||
    typeof value.lastName !== "string" ||
    typeof value.email !== "string"
  ) {
    throw new Error("Authentication service returned an invalid user.");
  }

  return {
    id: value.id,
    firstName: value.firstName,
    lastName: value.lastName,
    email: value.email,
    roles: Array.isArray(value.roles)
      ? value.roles.flatMap((role) =>
          isBackendRole(role) && typeof role.name === "string" ? [role.name] : [],
        )
      : undefined,
    permissions: Array.isArray(value.roles)
      ? toPermissionNames(value.roles)
      : undefined,
  };
}

export async function GET() {
  const accessToken = (await cookies()).get(ACCESS_TOKEN_COOKIE)?.value;
  if (!accessToken) {
    return NextResponse.json({ message: "Unauthenticated." }, { status: 401 });
  }

  try {
    const user = await backendClient.request<unknown>("/auth/me", { accessToken });
    return NextResponse.json(toCurrentUser(user));
  } catch (error) {
    if (isApiError(error)) {
      return NextResponse.json(error.body, { status: error.status });
    }
    if (error instanceof Error && error.message.includes("invalid user")) {
      return NextResponse.json({ message: error.message }, { status: 502 });
    }
    return NextResponse.json({ message: "Unable to reach the authentication service." }, { status: 503 });
  }
}
