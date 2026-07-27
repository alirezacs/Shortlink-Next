import { backendClient } from "@/lib/api/backend-client";
import { backendEndpoints } from "@/lib/api/endpoints";
import {
  invalidBodyResponse,
  readJsonBody,
  withAccessToken,
} from "@/lib/api/route-helpers";
import { NextRequest, NextResponse } from "next/server";

type RouteContext = { params: Promise<{ id: string }> };

const userPath = backendEndpoints.users.byId;

export async function GET(_request: NextRequest, { params }: RouteContext) {
  const { id } = await params;

  return withAccessToken(async (accessToken) =>
    NextResponse.json(
      await backendClient.request<unknown>(userPath(id), { accessToken }),
    ),
  );
}

export async function PATCH(request: NextRequest, { params }: RouteContext) {
  const { id } = await params;
  const body = await readJsonBody(request);
  if (!body) {
    return invalidBodyResponse();
  }

  return withAccessToken(async (accessToken) =>
    NextResponse.json(
      await backendClient.request<unknown>(userPath(id), {
        method: "PATCH",
        accessToken,
        headers: { "Content-Type": "application/json" },
        // Only forward fields the client actually sent, so an omitted field
        // keeps its stored value. That is what lets the edit form leave the
        // password out entirely rather than resend the current one.
        body: JSON.stringify({
          ...("firstName" in body ? { firstName: body.firstName } : {}),
          ...("lastName" in body ? { lastName: body.lastName } : {}),
          ...("email" in body ? { email: body.email } : {}),
          ...("password" in body ? { password: body.password } : {}),
          ...("isActive" in body ? { isActive: body.isActive } : {}),
          ...("isEmailVerified" in body
            ? { isEmailVerified: body.isEmailVerified }
            : {}),
          ...("roleIds" in body ? { roleIds: body.roleIds } : {}),
        }),
      }),
    ),
  );
}

export async function DELETE(_request: NextRequest, { params }: RouteContext) {
  const { id } = await params;

  return withAccessToken(async (accessToken) => {
    // The API answers 204 with an empty body.
    await backendClient.request<unknown>(userPath(id), {
      method: "DELETE",
      accessToken,
    });

    return NextResponse.json({ success: true });
  });
}
