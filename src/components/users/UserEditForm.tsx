"use client";

import UserForm from "@/components/users/UserForm";
import Badge from "@/components/ui/badge/Badge";
import ButtonLink from "@/components/ui/button/ButtonLink";
import { isApiError, toErrorMessage } from "@/lib/api/types";
import { userService } from "@/lib/users/service";
import type { User } from "@/lib/users/types";
import { formatDateTime } from "@/lib/utils/date";
import { useEffect, useState } from "react";

type UserEditFormProps = {
  userId: string;
};

export default function UserEditForm({ userId }: UserEditFormProps) {
  // One state object keeps the load status and its result in sync, and avoids
  // flipping a loading flag from inside the effect body.
  const [state, setState] = useState<
    | { status: "loading" }
    | { status: "ready"; user: User }
    | { status: "error"; error: string }
  >({ status: "loading" });

  useEffect(() => {
    let ignore = false;

    userService
      .get(userId)
      .then((user) => {
        if (!ignore) setState({ status: "ready", user });
      })
      .catch((error: unknown) => {
        if (ignore) return;

        setState({
          status: "error",
          error:
            isApiError(error) && error.status === 404
              ? "This user no longer exists."
              : toErrorMessage(error, "Unable to load this user."),
        });
      });

    return () => {
      ignore = true;
    };
  }, [userId]);

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
        <ButtonLink href="/users" size="sm" variant="outline">
          Back to users
        </ButtonLink>
      </div>
    );
  }

  const { user } = state;

  return (
    <div className="space-y-6">
      <dl className="grid grid-cols-1 gap-4 rounded-xl bg-gray-50 p-4 text-sm sm:grid-cols-4 dark:bg-white/[0.03]">
        <div>
          <dt className="text-gray-500 dark:text-gray-400">Assigned roles</dt>
          <dd className="mt-1.5 flex flex-wrap gap-1.5">
            {user.roles.length > 0 ? (
              user.roles.map((role) => (
                <Badge key={role.id} variant="light" color="primary" size="sm">
                  {role.name}
                </Badge>
              ))
            ) : (
              <Badge variant="light" color="warning" size="sm">
                No roles
              </Badge>
            )}
          </dd>
        </div>
        <div>
          <dt className="text-gray-500 dark:text-gray-400">Last login</dt>
          <dd className="mt-1.5 text-gray-800 dark:text-white/90">
            {user.lastLoginAt ? formatDateTime(user.lastLoginAt) : "Never"}
          </dd>
        </div>
        <div>
          <dt className="text-gray-500 dark:text-gray-400">Created</dt>
          <dd className="mt-1.5 text-gray-800 dark:text-white/90">
            {formatDateTime(user.createdAt)}
          </dd>
        </div>
        <div>
          <dt className="text-gray-500 dark:text-gray-400">Last updated</dt>
          <dd className="mt-1.5 text-gray-800 dark:text-white/90">
            {formatDateTime(user.updatedAt)}
          </dd>
        </div>
      </dl>

      <UserForm user={user} />
    </div>
  );
}
