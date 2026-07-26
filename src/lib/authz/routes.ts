import { PERMISSIONS, type PermissionName } from "@/lib/authz/permissions";
import type { PermissionRule } from "@/lib/authz/policy";

/**
 * A path pattern and the rule that guards everything under it.
 *
 * `:param` matches exactly one dynamic segment, mirroring the `[id]` folders of
 * the App Router.
 */
export type RoutePermission = {
  pattern: string;
  rule: PermissionRule;
};

type CrudPermissions = {
  read: PermissionName;
  create: PermissionName;
  update: PermissionName;
};

/**
 * The list / create / edit rules a CRUD module needs, so registering a new one
 * stays a three-line change.
 *
 * The edit route requires read *and* update because the page loads the record
 * (`GET /:id`, guarded by `*.read`) before it can save it (`PATCH /:id`,
 * guarded by `*.update`); without both, the form can only ever show an error.
 */
export function crudRoutePermissions(
  basePath: string,
  permissions: CrudPermissions,
): RoutePermission[] {
  return [
    { pattern: basePath, rule: { permission: permissions.read } },
    { pattern: `${basePath}/create`, rule: { permission: permissions.create } },
    {
      pattern: `${basePath}/:id/edit`,
      rule: { allOf: [permissions.read, permissions.update] },
    },
  ];
}

/**
 * Every guarded route of the dashboard.
 *
 * Routes that are absent are treated as public to any signed-in account, which
 * is why the demo pages and `/` keep working untouched.
 */
export const ROUTE_PERMISSIONS: readonly RoutePermission[] = [
  ...crudRoutePermissions("/permissions", {
    read: PERMISSIONS.PERMISSIONS.READ,
    create: PERMISSIONS.PERMISSIONS.CREATE,
    update: PERMISSIONS.PERMISSIONS.UPDATE,
  }),
  ...crudRoutePermissions("/roles", {
    read: PERMISSIONS.ROLES.READ,
    create: PERMISSIONS.ROLES.CREATE,
    update: PERMISSIONS.ROLES.UPDATE,
  }),
];

function toSegments(path: string): string[] {
  return path.split("/").filter(Boolean);
}

/**
 * Returns how many static segments matched, or `null` when the pattern does not
 * apply. Patterns match by prefix so an unregistered child route such as
 * `/permissions/123` inherits the rule of `/permissions`.
 */
function matchSegments(pattern: readonly string[], path: readonly string[]): number | null {
  if (pattern.length > path.length) return null;

  let staticSegments = 0;

  for (let index = 0; index < pattern.length; index += 1) {
    const segment = pattern[index];
    if (segment.startsWith(":")) continue;
    if (segment !== path[index]) return null;
    staticSegments += 1;
  }

  return staticSegments;
}

/**
 * Resolves the rule guarding `pathname`, or `undefined` when the route is
 * public.
 *
 * The most specific pattern wins: `/permissions/:id/edit` beats `/permissions`
 * on depth, and a static segment beats a dynamic one at equal depth, so adding
 * `/permissions/create` never changes how `/permissions/:id` resolves.
 */
export function resolveRouteRule(pathname: string): PermissionRule | undefined {
  const pathSegments = toSegments(pathname);
  let best: { rule: PermissionRule; depth: number; staticSegments: number } | undefined;

  for (const { pattern, rule } of ROUTE_PERMISSIONS) {
    const patternSegments = toSegments(pattern);
    const staticSegments = matchSegments(patternSegments, pathSegments);
    if (staticSegments === null) continue;

    const depth = patternSegments.length;
    const isBetter =
      best === undefined ||
      depth > best.depth ||
      (depth === best.depth && staticSegments > best.staticSegments);

    if (isBetter) {
      best = { rule, depth, staticSegments };
    }
  }

  return best?.rule;
}
