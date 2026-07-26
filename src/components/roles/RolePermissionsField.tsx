"use client";

import Checkbox from "@/components/form/input/Checkbox";
import { toErrorMessage } from "@/lib/api/types";
import { permissionService } from "@/lib/permissions/service";
import type { Permission } from "@/lib/permissions/types";
import { useEffect, useMemo, useState } from "react";

type RolePermissionsFieldProps = {
  selectedIds: string[];
  onChange: (permissionIds: string[]) => void;
  disabled?: boolean;
};

type PermissionGroup = {
  name: string;
  permissions: Permission[];
};

/** Groups the catalogue by the first segment of each name, keeping API order. */
function toGroups(permissions: Permission[]): PermissionGroup[] {
  const groups = new Map<string, Permission[]>();

  for (const permission of permissions) {
    const existing = groups.get(permission.group);

    if (existing) {
      existing.push(permission);
    } else {
      groups.set(permission.group, [permission]);
    }
  }

  return [...groups].map(([name, groupPermissions]) => ({
    name,
    permissions: groupPermissions,
  }));
}

/** Checkbox catalogue used by the role form to grant and revoke permissions. */
export default function RolePermissionsField({
  selectedIds,
  onChange,
  disabled = false,
}: RolePermissionsFieldProps) {
  const [state, setState] = useState<
    | { status: "loading" }
    | { status: "ready"; permissions: Permission[] }
    | { status: "error"; error: string }
  >({ status: "loading" });

  useEffect(() => {
    let ignore = false;

    permissionService
      .listAll()
      .then((permissions) => {
        if (!ignore) setState({ status: "ready", permissions });
      })
      .catch((error: unknown) => {
        if (ignore) return;

        setState({
          status: "error",
          // A 403 here is expected for an account that may manage roles but not
          // read the permission catalogue: the rest of the form stays usable.
          error: toErrorMessage(error, "Unable to load the permission catalogue."),
        });
      });

    return () => {
      ignore = true;
    };
  }, []);

  const groups = useMemo(
    () => (state.status === "ready" ? toGroups(state.permissions) : []),
    [state],
  );
  const selected = useMemo(() => new Set(selectedIds), [selectedIds]);

  const permissions = state.status === "ready" ? state.permissions : [];

  const togglePermission = (permissionId: string, checked: boolean) => {
    onChange(
      checked
        ? [...selectedIds, permissionId]
        : selectedIds.filter((id) => id !== permissionId),
    );
  };

  const toggleGroup = (group: PermissionGroup, checked: boolean) => {
    const groupIds = group.permissions.map((permission) => permission.id);
    const withoutGroup = selectedIds.filter((id) => !groupIds.includes(id));

    onChange(checked ? [...withoutGroup, ...groupIds] : withoutGroup);
  };

  if (state.status === "loading") {
    return (
      <div className="space-y-3 rounded-xl border border-gray-200 p-4 dark:border-gray-800" aria-busy="true">
        {Array.from({ length: 3 }).map((_, index) => (
          <div
            key={`permission-skeleton-${index}`}
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

  if (permissions.length === 0) {
    return (
      <p className="rounded-xl border border-dashed border-gray-300 p-4 text-sm text-gray-500 dark:border-gray-700 dark:text-gray-400">
        No permissions exist yet. Create one first, then come back to grant it.
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
          of {permissions.length} selected
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

      <div className="max-h-96 space-y-5 overflow-y-auto p-4">
        {groups.map((group) => {
          const groupIds = group.permissions.map((permission) => permission.id);
          const selectedInGroup = groupIds.filter((id) => selected.has(id)).length;

          return (
            <div key={group.name}>
              <div className="mb-2 flex items-center justify-between gap-3">
                <Checkbox
                  id={`permission-group-${group.name}`}
                  label={group.name}
                  checked={selectedInGroup === groupIds.length}
                  onChange={(checked) => toggleGroup(group, checked)}
                  disabled={disabled}
                />
                <span className="text-xs text-gray-400 dark:text-gray-500">
                  {selectedInGroup}/{groupIds.length}
                </span>
              </div>

              <div className="grid grid-cols-1 gap-2 border-l border-gray-100 pl-4 sm:grid-cols-2 dark:border-gray-800">
                {group.permissions.map((permission) => (
                  <Checkbox
                    key={permission.id}
                    id={`permission-${permission.id}`}
                    label={permission.name}
                    checked={selected.has(permission.id)}
                    onChange={(checked) => togglePermission(permission.id, checked)}
                    disabled={disabled}
                  />
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
