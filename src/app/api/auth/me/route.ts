import { backendClient } from "@/lib/api/backend-client";
import { backendEndpoints } from "@/lib/api/endpoints";
import { isApiError } from "@/lib/api/types";
import { ACCESS_TOKEN_COOKIE } from "@/lib/auth/server";
import type { AuthUser } from "@/lib/auth/types";
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

function toCurrentUser(user: unknown): AuthUser {
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

  // Both lists are always arrays, never undefined: the authorization layer is
  // fail-closed, so "we could not read the roles" must look like "no access"
  // rather than degrade into an implicit allow.
  const roles = Array.isArray(value.roles) ? value.roles : [];

  return {
    id: value.id,
    firstName: value.firstName,
    lastName: value.lastName,
    email: value.email,
    roles: roles.flatMap((role) =>
      isBackendRole(role) && typeof role.name === "string" ? [role.name] : [],
    ),
    permissions: toPermissionNames(roles),
  };
}

export async function GET() {
  const accessToken = (await cookies()).get(ACCESS_TOKEN_COOKIE)?.value;
  if (!accessToken) {
    return NextResponse.json({ message: "Unauthenticated." }, { status: 401 });
  }

  try {
    const user = await backendClient.request<unknown>(backendEndpoints.auth.me, { accessToken });
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
