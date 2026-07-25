"use client";

import RoleForm from "@/components/roles/RoleForm";
import Badge from "@/components/ui/badge/Badge";
import ButtonLink from "@/components/ui/button/ButtonLink";
import { isApiError } from "@/lib/api/types";
import { roleService } from "@/lib/roles/service";
import type { Role } from "@/lib/roles/types";
import { formatDateTime } from "@/lib/utils/date";
import { useEffect, useState } from "react";

type RoleEditFormProps = {
  roleId: string;
};

export default function RoleEditForm({ roleId }: RoleEditFormProps) {
  // One state object keeps the load status and its result in sync, and avoids
  // flipping a loading flag from inside the effect body.
  const [state, setState] = useState<
    | { status: "loading" }
    | { status: "ready"; role: Role }
    | { status: "error"; error: string }
  >({ status: "loading" });

  useEffect(() => {
    let ignore = false;

    roleService
      .get(roleId)
      .then((role) => {
        if (!ignore) setState({ status: "ready", role });
      })
      .catch((error: unknown) => {
        if (ignore) return;

        setState({
          status: "error",
          error:
            isApiError(error) && error.status === 404
              ? "This role no longer exists."
              : isApiError(error)
              ? error.message
              : "Unable to load this role.",
        });
      });

    return () => {
      ignore = true;
    };
  }, [roleId]);

  if (state.status === "loading") {
    return (
      <div className="space-y-4" aria-busy="true">
        <div className="h-4 w-24 animate-pulse rounded bg-gray-100 dark:bg-gray-800" />
        <div className="h-11 w-full animate-pulse rounded-lg bg-gray-100 dark:bg-gray-800" />
        <div className="h-4 w-24 animate-pulse rounded bg-gray-100 dark:bg-gray-800" />
        <div className="h-24 w-full animate-pulse rounded-lg bg-gray-100 dark:bg-gray-800" />
      </div>
    );
  }

  if (state.status === "error") {
    return (
      <div className="space-y-4">
        <p
          className="rounded-lg bg-error-50 p-3 text-sm text-error-600 dark:bg-error-500/15 dark:text-error-400"
          role="alert"
        >
          {state.error}
        </p>
        <ButtonLink href="/roles" size="sm" variant="outline">
          Back to roles
        </ButtonLink>
      </div>
    );
  }

  const { role } = state;

  return (
    <div className="space-y-6">
      <dl className="grid grid-cols-1 gap-4 rounded-xl bg-gray-50 p-4 text-sm sm:grid-cols-3 dark:bg-white/[0.03]">
        <div>
          <dt className="text-gray-500 dark:text-gray-400">Assigned users</dt>
          <dd className="mt-1.5 flex flex-wrap gap-1.5">
            {role.users && role.users.length > 0 ? (
              role.users.map((user) => (
                <Badge key={user.id} variant="light" color="primary" size="sm">
                  {user.email}
                </Badge>
              ))
            ) : (
              <Badge variant="light" color="warning" size="sm">
                Unassigned
              </Badge>
            )}
          </dd>
        </div>
        <div>
          <dt className="text-gray-500 dark:text-gray-400">Created</dt>
          <dd className="mt-1.5 text-gray-800 dark:text-white/90">
            {formatDateTime(role.createdAt)}
          </dd>
        </div>
        <div>
          <dt className="text-gray-500 dark:text-gray-400">Last updated</dt>
          <dd className="mt-1.5 text-gray-800 dark:text-white/90">
            {formatDateTime(role.updatedAt)}
          </dd>
        </div>
      </dl>

      <RoleForm role={role} />
    </div>
  );
}
