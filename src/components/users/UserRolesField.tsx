"use client";

import Checkbox from "@/components/form/input/Checkbox";
import Badge from "@/components/ui/badge/Badge";
import { toErrorMessage } from "@/lib/api/types";
import { roleService } from "@/lib/roles/service";
import type { Role } from "@/lib/roles/types";
import { useEffect, useMemo, useState } from "react";

type UserRolesFieldProps = {
  selectedIds: string[];
  onChange: (roleIds: string[]) => void;
  disabled?: boolean;
};

/** Checkbox catalogue used by the user form to grant and revoke roles. */
export default function UserRolesField({
  selectedIds,
  onChange,
  disabled = false,
}: UserRolesFieldProps) {
  const [state, setState] = useState<
    | { status: "loading" }
    | { status: "ready"; roles: Role[] }
    | { status: "error"; error: string }
  >({ status: "loading" });

  useEffect(() => {
    let ignore = false;

    roleService
      .listAll()
      .then((roles) => {
        if (!ignore) setState({ status: "ready", roles });
      })
      .catch((error: unknown) => {
        if (ignore) return;

        setState({
          status: "error",
          // A 403 here is expected for an account that may manage users but not
          // read the role catalogue: the rest of the form stays usable.
          error: toErrorMessage(error, "Unable to load the role catalogue."),
        });
      });

    return () => {
      ignore = true;
    };
  }, []);

  const selected = useMemo(() => new Set(selectedIds), [selectedIds]);
  const roles = state.status === "ready" ? state.roles : [];

  const toggleRole = (roleId: string, checked: boolean) => {
    onChange(
      checked
        ? [...selectedIds, roleId]
        : selectedIds.filter((id) => id !== roleId),
    );
  };

  if (state.status === "loading") {
    return (
      <div
        className="space-y-3 rounded-xl border border-gray-200 p-4 dark:border-gray-800"
        aria-busy="true"
      >
        {Array.from({ length: 3 }).map((_, index) => (
          <div
            key={`role-skeleton-${index}`}
            className="h-10 w-full animate-pulse rounded-lg bg-gray-100 dark:bg-gray-800"
          />
        ))}
      </div>
    );
  }

  if (state.status === "error") {
    return (
      <p
        className="rounded-lg bg-error-50 p-3 text-sm text-error-600 dark:bg-error-500/15 dark:text-error-400"
        role="alert"
      >
        {state.error}
      </p>
    );
  }

  if (roles.length === 0) {
    return (
      <p className="rounded-xl border border-dashed border-gray-300 p-4 text-sm text-gray-500 dark:border-gray-700 dark:text-gray-400">
        No roles exist yet. Create one first, then come back to assign it.
      </p>
    );
  }

  return (
    <div className="rounded-xl border border-gray-200 dark:border-gray-800">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 px-4 py-3 dark:border-gray-800">
        <p className="text-sm text-gray-500 dark:text-gray-400">
          <span className="font-medium text-gray-700 dark:text-gray-300">
            {selected.size}
          </span>{" "}
          of {roles.length} selected
        </p>
        {selected.size > 0 && !disabled && (
          <button
            type="button"
            onClick={() => onChange([])}
            className="text-xs font-medium text-brand-500 underline"
          >
            Clear all
          </button>
        )}
      </div>

      <div className="max-h-96 space-y-3 overflow-y-auto p-4">
        {roles.map((role) => (
          <div key={role.id} className="flex items-start justify-between gap-3">
            <div>
              <Checkbox
                id={`role-${role.id}`}
                label={role.name}
                checked={selected.has(role.id)}
                onChange={(checked) => toggleRole(role.id, checked)}
                disabled={disabled}
              />
              <p className="mt-0.5 pl-8 text-xs text-gray-500 dark:text-gray-400">
                {role.description || "No description"} ·{" "}
                {role.permissionsCount === 0
                  ? "no permissions"
                  : `${role.permissionsCount} ${
                      role.permissionsCount === 1 ? "permission" : "permissions"
                    }`}
              </p>
            </div>
            {/* A deactivated role still grants everything it holds, so assigning
                one is allowed but worth pointing out. */}
            {!role.isActive && (
              <Badge variant="light" color="light" size="sm">
                Deactivated
              </Badge>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
