/** Identity fields every account endpoint returns. */
export type UserIdentity = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
};

/**
 * The signed-in account, as `/api/auth/me` exposes it.
 *
 * `roles` and `permissions` are required: the BFF route always normalizes them
 * to arrays, so an empty list unambiguously means "this account was granted
 * nothing" and the authorization layer can stay fail-closed.
 */
export type AuthUser = UserIdentity & {
  /** Role names, for display only. The UI authorizes on permissions. */
  roles: string[];
  /** Effective permissions, flattened from every role. For example `permissions.create`. */
  permissions: string[];
};

/**
 * `POST /auth/register` returns the bare account: the backend attaches no role
 * on sign-up, so there is nothing to authorize against yet.
 */
export type RegisteredUser = UserIdentity;

export type LoginCredentials = {
  email: string;
  password: string;
  remember: boolean;
};

export type RegisterInput = {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
};
