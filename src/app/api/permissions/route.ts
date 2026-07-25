import { backendClient } from "@/lib/api/backend-client";
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
  "group",
  "assigned",
  "sortBy",
  "sortOrder",
] as const;

export async function GET(request: NextRequest) {
  const query = forwardSearchParams(request.nextUrl.searchParams, LIST_PARAMS);

  return withAccessToken(async (accessToken) =>
    NextResponse.json(
      await backendClient.request<unknown>(`/permissions${query}`, { accessToken }),
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
      await backendClient.request<unknown>("/permissions", {
        method: "POST",
        accessToken,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: body.name, description: body.description }),
      }),
      { status: 201 },
    ),
  );
}
