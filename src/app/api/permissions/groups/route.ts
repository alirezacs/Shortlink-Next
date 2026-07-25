import { backendClient } from "@/lib/api/backend-client";
import { withAccessToken } from "@/lib/api/route-helpers";
import { NextResponse } from "next/server";

export async function GET() {
  return withAccessToken(async (accessToken) =>
    NextResponse.json(
      await backendClient.request<unknown>("/permissions/groups", { accessToken }),
    ),
  );
}
