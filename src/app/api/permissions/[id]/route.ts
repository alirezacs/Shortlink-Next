import { backendClient } from "@/lib/api/backend-client";
import {
  invalidBodyResponse,
  readJsonBody,
  withAccessToken,
} from "@/lib/api/route-helpers";
import { NextRequest, NextResponse } from "next/server";

type RouteContext = { params: Promise<{ id: string }> };

function permissionPath(id: string) {
  return `/permissions/${encodeURIComponent(id)}`;
}

export async function GET(_request: NextRequest, { params }: RouteContext) {
  const { id } = await params;

  return withAccessToken(async (accessToken) =>
    NextResponse.json(
      await backendClient.request<unknown>(permissionPath(id), { accessToken }),
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
      await backendClient.request<unknown>(permissionPath(id), {
        method: "PATCH",
        accessToken,
        headers: { "Content-Type": "application/json" },
        // Only forward fields the client actually sent, so an omitted field
        // keeps its stored value.
        body: JSON.stringify({
          ...("name" in body ? { name: body.name } : {}),
          ...("description" in body ? { description: body.description } : {}),
        }),
      }),
    ),
  );
}

export async function DELETE(_request: NextRequest, { params }: RouteContext) {
  const { id } = await params;

  return withAccessToken(async (accessToken) => {
    // The API answers 204 with an empty body.
    await backendClient.request<unknown>(permissionPath(id), {
      method: "DELETE",
      accessToken,
    });

    return NextResponse.json({ success: true });
  });
}
