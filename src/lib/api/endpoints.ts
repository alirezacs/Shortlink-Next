/**
 * Every NestJS endpoint the BFF route handlers call, in one place.
 *
 * `BACKEND_API_URL` holds the origin only (for example `http://localhost:3002`).
 * The `/api/v1` prefix lives here rather than in the environment so moving to a
 * new API version is a reviewable code change instead of a silent config change,
 * and so one grep shows every backend path the dashboard depends on.
 */
const API_V1 = "/api/v1";

export const backendEndpoints = {
  auth: {
    login: `${API_V1}/auth/login`,
    register: `${API_V1}/auth/register`,
    me: `${API_V1}/auth/me`,
    refresh: `${API_V1}/auth/refresh`,
  },
  permissions: {
    /** List (GET) and create (POST). */
    collection: `${API_V1}/permissions`,
    groups: `${API_V1}/permissions/groups`,
    byId: (id: string) => `${API_V1}/permissions/${encodeURIComponent(id)}`,
  },
} as const;
