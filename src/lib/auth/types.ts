export type AuthUser = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  roles?: string[];
  /** Flattened role permissions, for example `permissions.create`. */
  permissions?: string[];
};

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
