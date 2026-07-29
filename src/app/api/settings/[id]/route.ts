import { backendClient } from "@/lib/api/backend-client";
import { backendEndpoints } from "@/lib/api/endpoints";
import { invalidBodyResponse, readJsonBody, withAccessToken } from "@/lib/api/route-helpers";
import { NextRequest, NextResponse } from "next/server";

type RouteContext = { params: Promise<{ id: string }> };
export async function GET(_request: NextRequest, { params }: RouteContext) { const { id } = await params; return withAccessToken(async (accessToken) => NextResponse.json(await backendClient.request<unknown>(backendEndpoints.settings.byId(id), { accessToken }))); }
export async function PATCH(request: NextRequest, { params }: RouteContext) { const { id } = await params; const body = await readJsonBody(request); if (!body) return invalidBodyResponse(); return withAccessToken(async (accessToken) => NextResponse.json(await backendClient.request<unknown>(backendEndpoints.settings.byId(id), { method: "PATCH", accessToken, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }))); }
export async function DELETE(_request: NextRequest, { params }: RouteContext) { const { id } = await params; return withAccessToken(async (accessToken) => { await backendClient.request<unknown>(backendEndpoints.settings.byId(id), { method: "DELETE", accessToken }); return NextResponse.json({ success: true }); }); }
