import { backendClient } from "@/lib/api/backend-client";
import { backendEndpoints } from "@/lib/api/endpoints";
import {
  forwardSearchParams,
  invalidBodyResponse,
  readJsonBody,
  withAccessToken,
} from "@/lib/api/route-helpers";
import { NextRequest, NextResponse } from "next/server";

const LIST_PARAMS = [
  "page",
  "limit",
  "search",
  "isActive",
  "isEmailVerified",
  "roleId",
  "sortBy",
  "sortOrder",
] as const;

export async function GET(request: NextRequest) {
  const query = forwardSearchParams(request.nextUrl.searchParams, LIST_PARAMS);

  return withAccessToken(async (accessToken) =>
    NextResponse.json(
      await backendClient.request<unknown>(
        `${backendEndpoints.users.collection}${query}`,
        { accessToken },
      ),
    ),
  );
}

export async function POST(request: NextRequest) {
  const body = await readJsonBody(request);
  if (!body) {
    return invalidBodyResponse();
  }

  return withAccessToken(async (accessToken) =>
    NextResponse.json(
      await backendClient.request<unknown>(backendEndpoints.users.collection, {
        method: "POST",
        accessToken,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName: body.firstName,
          lastName: body.lastName,
          email: body.email,
          password: body.password,
          isActive: body.isActive,
          isEmailVerified: body.isEmailVerified,
          roleIds: body.roleIds,
        }),
      }),
      { status: 201 },
    ),
  );
}
