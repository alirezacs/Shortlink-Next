import { backendClient } from "@/lib/api/backend-client";
import { backendEndpoints } from "@/lib/api/endpoints";
import { withAccessToken } from "@/lib/api/route-helpers";
import { NextResponse } from "next/server";

export async function GET() {
  return withAccessToken(async (accessToken) =>
    NextResponse.json(
      await backendClient.request<unknown>(backendEndpoints.permissions.groups, {
        accessToken,
      }),
    ),
  );
}
