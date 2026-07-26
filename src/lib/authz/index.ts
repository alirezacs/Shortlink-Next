/**
 * Public surface of the frontend authorization layer.
 *
 * This is a UX layer only. The NestJS guards remain the security boundary:
 * everything here decides what to *show*, never what is *allowed*.
 *
 * - `permissions` — the permission catalogue as typed constants
 * - `policy`      — the pure, framework-free rule engine
 * - `routes`      — which rule guards which URL
 * - `navigation`  — filtering the sidebar tree
 *
 * React bindings live in `@/hooks/useAuthorization` and
 * `@/components/authorization/*`.
 */
export {
  ALL_PERMISSIONS,
  PERMISSIONS,
  type PermissionName,
  type PermissionResource,
} from "@/lib/authz/permissions";

export {
  NO_PERMISSIONS,
  hasAllPermissions,
  hasAnyPermission,
  hasPermission,
  isRuleSatisfied,
  toGrantedPermissions,
  type GrantedPermissions,
  type PermissionRule,
} from "@/lib/authz/policy";

export {
  ROUTE_PERMISSIONS,
  crudRoutePermissions,
  resolveRouteRule,
  type RoutePermission,
} from "@/lib/authz/routes";

export {
  filterNavItems,
  type NavItem,
  type NavSubItem,
} from "@/lib/authz/navigation";
