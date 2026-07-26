"use client";

import Forbidden from "@/components/authorization/Forbidden";
import { useAuthorization } from "@/hooks/useAuthorization";
import { resolveRouteRule } from "@/lib/authz";
import { usePathname } from "next/navigation";
import { useMemo, type ReactNode } from "react";

/**
 * Applies the central route registry to whatever the App Router is rendering.
 *
 * Mounted once in the admin layout, so a page never repeats an authorization
 * check and a new page is protected the moment its pattern is registered in
 * `ROUTE_PERMISSIONS` — hiding a sidebar entry is not enough, this is what
 * stops a typed-in URL.
 *
 * Blocked children are never mounted, so their effects never run and the
 * requests they would have made are never sent.
 */
export default function RouteGuard({ children }: Readonly<{ children: ReactNode }>) {
  const pathname = usePathname();
  const { check, isReady } = useAuthorization();

  const rule = useMemo(() => resolveRouteRule(pathname), [pathname]);

  // The layout resolves the session before rendering this, so this branch only
  // guards against the guard being reused somewhere that does not.
  if (!isReady) return null;

  if (!check(rule)) return <Forbidden />;

  return <>{children}</>;
}
