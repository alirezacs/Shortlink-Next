import { backendClient } from "@/lib/api/backend-client";
import { backendEndpoints } from "@/lib/api/endpoints";
import { invalidBodyResponse, readJsonBody, withAccessToken } from "@/lib/api/route-helpers";
import { NextRequest, NextResponse } from "next/server";

export async function GET() {
  return withAccessToken(async (accessToken) => NextResponse.json(await backendClient.request<unknown>(backendEndpoints.settings.collection, { accessToken })));
}

export async function POST(request: NextRequest) {
  const body = await readJsonBody(request);
  if (!body) return invalidBodyResponse();
  return withAccessToken(async (accessToken) => NextResponse.json(await backendClient.request<unknown>(backendEndpoints.settings.collection, { method: "POST", accessToken, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }), { status: 201 }));
}
