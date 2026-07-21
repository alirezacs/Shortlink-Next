import { NextResponse } from "next/server";

export const ACCESS_TOKEN_COOKIE = "access_token";
export const REFRESH_TOKEN_COOKIE = "refresh_token";

type TokenResponse = {
  accessToken?: unknown;
  refreshToken?: unknown;
};

function tokenLifetimeInSeconds(token: string) {
  try {
    const payload = JSON.parse(
      Buffer.from(token.split(".")[1], "base64url").toString("utf8"),
    ) as { exp?: unknown };
    return typeof payload.exp === "number"
      ? Math.max(0, payload.exp - Math.floor(Date.now() / 1000))
      : undefined;
  } catch {
    return undefined;
  }
}

const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
};

export function setAuthCookies(response: NextResponse, tokens: TokenResponse, remember = true) {
  if (typeof tokens.accessToken !== "string" || !tokens.accessToken) {
    throw new Error("Authentication service returned an invalid access token.");
  }

  const accessMaxAge = tokenLifetimeInSeconds(tokens.accessToken);
  response.cookies.set(ACCESS_TOKEN_COOKIE, tokens.accessToken, {
    ...cookieOptions,
    ...(remember && accessMaxAge ? { maxAge: accessMaxAge } : {}),
  });

  if (typeof tokens.refreshToken === "string" && tokens.refreshToken) {
    const refreshMaxAge = tokenLifetimeInSeconds(tokens.refreshToken);
    response.cookies.set(REFRESH_TOKEN_COOKIE, tokens.refreshToken, {
      ...cookieOptions,
      ...(refreshMaxAge ? { maxAge: refreshMaxAge } : {}),
    });
  }
}

export function clearAuthCookies(response: NextResponse) {
  response.cookies.set(ACCESS_TOKEN_COOKIE, "", { ...cookieOptions, maxAge: 0 });
  response.cookies.set(REFRESH_TOKEN_COOKIE, "", { ...cookieOptions, maxAge: 0 });
}
