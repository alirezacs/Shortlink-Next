"use client";

import SelectField from "@/components/form/SelectField";
import Input from "@/components/form/input/InputField";
import PermissionDeleteModal from "@/components/permissions/PermissionDeleteModal";
import TablePagination from "@/components/tables/TablePagination";
import Badge from "@/components/ui/badge/Badge";
import ButtonLink from "@/components/ui/button/ButtonLink";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useAuth } from "@/context/AuthContext";
import { AngleDownIcon, AngleUpIcon, PencilIcon, PlusIcon, TrashBinIcon } from "@/icons";
import { isApiError } from "@/lib/api/types";
import { hasPermission } from "@/lib/auth/permissions";
import { permissionService } from "@/lib/permissions/service";
import {
  PERMISSION_SORT_FIELDS,
  type PaginatedResult,
  type Permission,
  type PermissionListQuery,
  type PermissionSortField,
  type SortOrder,
} from "@/lib/permissions/types";
import { formatDateTime } from "@/lib/utils/date";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";

const DEFAULT_LIMIT = 10;
const SEARCH_DEBOUNCE_MS = 400;

const PAGE_SIZE_OPTIONS = [10, 25, 50].map((size) => ({
  value: String(size),
  label: `${size} per page`,
}));

const ASSIGNED_OPTIONS = [
  { value: "", label: "Any assignment" },
  { value: "true", label: "Assigned to a role" },
  { value: "false", label: "Not assigned" },
];

const NOTICES: Record<string, string> = {
  created: "Permission created successfully.",
  updated: "Permission updated successfully.",
};

function parseSortBy(value: string | null): PermissionSortField {
  return PERMISSION_SORT_FIELDS.includes(value as PermissionSortField)
    ? (value as PermissionSortField)
    : "name";
}

function parsePositiveInt(value: string | null, fallback: number) {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}

/** Keeps a hand written or stale URL value visible in its select. */
function withCurrentValue(
  options: { value: string; label: string }[],
  value: string,
) {
  return options.some((option) => option.value === value)
    ? options
    : [...options, { value, label: value }];
}

type SortableHeaderProps = {
  label: string;
  field: PermissionSortField;
  sortBy: PermissionSortField;
  sortOrder: SortOrder;
  onSort: (field: PermissionSortField) => void;
};

function SortableHeader({ label, field, sortBy, sortOrder, onSort }: SortableHeaderProps) {
  const isSorted = sortBy === field;

  return (
    <TableCell isHeader className="px-5 py-3 text-left">
      <button
        type="button"
        onClick={() => onSort(field)}
        aria-label={`Sort by ${label}`}
        className="inline-flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-gray-500 transition hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
      >
        {label}
        <span className={isSorted ? "text-brand-500" : "text-gray-300 dark:text-gray-600"}>
          {isSorted && sortOrder === "DESC" ? <AngleDownIcon /> : <AngleUpIcon />}
        </span>
      </button>
    </TableCell>
  );
}

export default function PermissionsTable() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { user } = useAuth();

  const canCreate = hasPermission(user, "permissions.create");
  const canUpdate = hasPermission(user, "permissions.update");
  const canDelete = hasPermission(user, "permissions.delete");

  // The URL is the single source of truth for the list state, so every view is
  // shareable and survives a refresh or a back navigation.
  const page = parsePositiveInt(searchParams.get("page"), 1);
  const limit = parsePositiveInt(searchParams.get("limit"), DEFAULT_LIMIT);
  const search = searchParams.get("search") ?? "";
  const group = searchParams.get("group") ?? "";
  const assigned = searchParams.get("assigned") ?? "";
  const sortBy = parseSortBy(searchParams.get("sortBy"));
  const sortOrder: SortOrder = searchParams.get("sortOrder") === "DESC" ? "DESC" : "ASC";
  const notice = searchParams.get("notice") ?? "";

  const query = useMemo<PermissionListQuery>(
    () => ({ page, limit, search, group, assigned, sortBy, sortOrder }),
    [assigned, group, limit, page, search, sortBy, sortOrder],
  );

  const [result, setResult] = useState<PaginatedResult<Permission> | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [groups, setGroups] = useState<string[]>([]);
  const [refreshToken, setRefreshToken] = useState(0);
  const [flash, setFlash] = useState("");
  const [searchDraft, setSearchDraft] = useState(search);
  const [pendingDelete, setPendingDelete] = useState<Permission | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  const updateParams = useCallback(
    (
      updates: Record<string, string | number | null>,
      options: { resetPage?: boolean } = {},
    ) => {
      const params = new URLSearchParams(searchParams.toString());
      params.delete("notice");

      for (const [key, value] of Object.entries(updates)) {
        if (value === null || value === "") {
          params.delete(key);
        } else {
          params.set(key, String(value));
        }
      }

      if (options.resetPage) {
        params.delete("page");
      }

      const queryString = params.toString();
      router.replace(queryString ? `${pathname}?${queryString}` : pathname, {
        scroll: false,
      });
    },
    [pathname, router, searchParams],
  );

  useEffect(() => {
    let ignore = false;
    setIsLoading(true);

    permissionService
      .list(query)
      .then((response) => {
        if (ignore) return;
        setResult(response);
        setLoadError("");
      })
      .catch((error: unknown) => {
        if (ignore) return;
        setResult(null);
        setLoadError(
          isApiError(error) ? error.message : "Unable to load permissions.",
        );
      })
      .finally(() => {
        if (!ignore) setIsLoading(false);
      });

    return () => {
      ignore = true;
    };
  }, [query, refreshToken]);

  // Group options come from the API so the filter always matches stored data.
  useEffect(() => {
    let ignore = false;

    permissionService
      .groups()
      .then((response) => {
        if (!ignore) setGroups(response);
      })
      .catch(() => {
        if (!ignore) setGroups([]);
      });

    return () => {
      ignore = true;
    };
  }, [refreshToken]);

  // Keep the input in sync when the URL changes from outside (reset, back button).
  useEffect(() => {
    setSearchDraft(search);
  }, [search]);

  useEffect(() => {
    if (searchDraft === search) return;

    const timer = setTimeout(
      () => updateParams({ search: searchDraft }, { resetPage: true }),
      SEARCH_DEBOUNCE_MS,
    );

    return () => clearTimeout(timer);
  }, [search, searchDraft, updateParams]);

  // Deleting the last row of the last page can leave the page out of range.
  useEffect(() => {
    if (result && result.meta.totalPages > 0 && page > result.meta.totalPages) {
      updateParams({ page: result.meta.totalPages });
    }
  }, [page, result, updateParams]);

  // Success messages are handed over through the URL after create / update.
  useEffect(() => {
    if (!notice) return;

    setFlash(NOTICES[notice] ?? "");
    updateParams({});
  }, [notice, updateParams]);

  const handleSort = (field: PermissionSortField) => {
    if (sortBy === field) {
      updateParams({ sortBy: field, sortOrder: sortOrder === "ASC" ? "DESC" : "ASC" });
      return;
    }

    // Names read best A → Z, timestamps newest first.
    updateParams(
      { sortBy: field, sortOrder: field === "name" ? "ASC" : "DESC" },
      { resetPage: true },
    );
  };

  const handleDelete = async () => {
    if (!pendingDelete) return;

    setIsDeleting(true);
    setDeleteError("");

    try {
      await permissionService.remove(pendingDelete.id);
      setFlash(`Permission "${pendingDelete.name}" was deleted.`);
      setPendingDelete(null);
      setRefreshToken((token) => token + 1);
    } catch (error) {
      setDeleteError(
        isApiError(error) ? error.message : "Unable to delete this permission.",
      );
    } finally {
      setIsDeleting(false);
    }
  };

  const resetFilters = () => {
    setSearchDraft("");
    router.replace(pathname, { scroll: false });
  };

  const groupOptions = withCurrentValue(
    [
      { value: "", label: "All groups" },
      ...groups.map((name) => ({ value: name, label: name })),
    ],
    group,
  );

  const hasActiveFilters =
    Boolean(search || group || assigned) ||
    sortBy !== "name" ||
    sortOrder !== "ASC" ||
    limit !== DEFAULT_LIMIT;

  const permissions = result?.data ?? [];

  return (
    <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
      <div className="flex flex-col gap-4 px-5 py-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-base font-medium text-gray-800 dark:text-white/90">
            All permissions
          </h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            {isLoading && !result
              ? "Loading permissions..."
              : `${result?.meta.total ?? 0} ${
                  result?.meta.total === 1 ? "permission" : "permissions"
                } found`}
          </p>
        </div>

        {canCreate && (
          <ButtonLink href="/permissions/create" size="sm" startIcon={<PlusIcon />}>
            Add permission
          </ButtonLink>
        )}
      </div>

      <div className="flex flex-col gap-3 border-t border-gray-100 px-5 py-4 dark:border-gray-800 lg:flex-row lg:items-center">
        <div className="lg:max-w-xs lg:flex-1">
          <Input
            type="search"
            placeholder="Search by name or description..."
            value={searchDraft}
            onChange={(event) => setSearchDraft(event.target.value)}
            aria-label="Search permissions"
          />
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 lg:ml-auto lg:w-auto lg:grid-cols-3">
          <SelectField
            options={groupOptions}
            value={group}
            onChange={(value) => updateParams({ group: value }, { resetPage: true })}
            aria-label="Filter by group"
            className="lg:w-40"
          />
          <SelectField
            options={ASSIGNED_OPTIONS}
            value={assigned}
            onChange={(value) => updateParams({ assigned: value }, { resetPage: true })}
            aria-label="Filter by role assignment"
            className="lg:w-48"
          />
          <SelectField
            options={withCurrentValue(PAGE_SIZE_OPTIONS, String(limit))}
            value={String(limit)}
            onChange={(value) => updateParams({ limit: value }, { resetPage: true })}
            aria-label="Rows per page"
            className="lg:w-36"
          />
        </div>

        {hasActiveFilters && (
          <button
            type="button"
            onClick={resetFilters}
            className="h-11 shrink-0 rounded-lg px-3 text-sm font-medium text-brand-500 transition hover:bg-brand-50 dark:hover:bg-brand-500/10"
          >
            Reset
          </button>
        )}
      </div>

      {flash && (
        <div className="mx-5 mb-4 rounded-lg bg-success-50 p-3 text-sm text-success-600 dark:bg-success-500/15 dark:text-success-500">
          <div className="flex items-start justify-between gap-3">
            <p role="status">{flash}</p>
            <button
              type="button"
              onClick={() => setFlash("")}
              className="text-xs font-medium underline"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      {loadError && (
        <div className="mx-5 mb-4 rounded-lg bg-error-50 p-3 text-sm text-error-600 dark:bg-error-500/15 dark:text-error-400">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p role="alert">{loadError}</p>
            <button
              type="button"
              onClick={() => setRefreshToken((token) => token + 1)}
              className="text-xs font-medium underline"
            >
              Try again
            </button>
          </div>
        </div>
      )}

      <div
        className={`overflow-x-auto border-t border-gray-100 transition-opacity dark:border-gray-800 ${
          isLoading && permissions.length > 0 ? "opacity-60" : ""
        }`}
      >
        <Table>
          <TableHeader className="border-b border-gray-100 dark:border-gray-800">
            <TableRow>
              <SortableHeader
                label="Permission"
                field="name"
                sortBy={sortBy}
                sortOrder={sortOrder}
                onSort={handleSort}
              />
              <TableCell
                isHeader
                className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400"
              >
                Group
              </TableCell>
              <TableCell
                isHeader
                className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400"
              >
                Roles
              </TableCell>
              <SortableHeader
                label="Created"
                field="createdAt"
                sortBy={sortBy}
                sortOrder={sortOrder}
                onSort={handleSort}
              />
              <SortableHeader
                label="Updated"
                field="updatedAt"
                sortBy={sortBy}
                sortOrder={sortOrder}
                onSort={handleSort}
              />
              <TableCell
                isHeader
                className="px-5 py-3 text-right text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400"
              >
                Actions
              </TableCell>
            </TableRow>
          </TableHeader>

          <TableBody>
            {isLoading && permissions.length === 0 && (
              <>
                {Array.from({ length: 5 }).map((_, index) => (
                  <TableRow
                    key={`skeleton-${index}`}
                    className="border-b border-gray-100 dark:border-gray-800"
                  >
                    {Array.from({ length: 6 }).map((__, cell) => (
                      <TableCell key={`skeleton-cell-${cell}`} className="px-5 py-4">
                        <div className="h-4 w-full animate-pulse rounded bg-gray-100 dark:bg-gray-800" />
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </>
            )}

            {!isLoading && permissions.length === 0 && !loadError && (
              <TableRow>
                <TableCell className="px-5 py-12 text-center" colSpan={6}>
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    No permissions found
                  </p>
                  <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                    {hasActiveFilters
                      ? "Try a different search term or clear the filters."
                      : "Create your first permission to get started."}
                  </p>
                </TableCell>
              </TableRow>
            )}

            {permissions.map((permission) => (
              <TableRow
                key={permission.id}
                className="border-b border-gray-100 last:border-b-0 dark:border-gray-800"
              >
                <TableCell className="px-5 py-4">
                  <span className="block font-medium text-gray-800 dark:text-white/90">
                    {permission.name}
                  </span>
                  <span className="mt-0.5 block text-xs text-gray-500 dark:text-gray-400">
                    {permission.description || "No description"}
                  </span>
                </TableCell>
                <TableCell className="px-5 py-4">
                  <Badge variant="light" color="light" size="sm">
                    {permission.group}
                  </Badge>
                </TableCell>
                <TableCell className="px-5 py-4">
                  <Badge
                    variant="light"
                    color={permission.rolesCount > 0 ? "success" : "warning"}
                    size="sm"
                  >
                    {permission.rolesCount === 0
                      ? "Unassigned"
                      : `${permission.rolesCount} ${
                          permission.rolesCount === 1 ? "role" : "roles"
                        }`}
                  </Badge>
                </TableCell>
                <TableCell className="px-5 py-4 text-sm whitespace-nowrap text-gray-500 dark:text-gray-400">
                  {formatDateTime(permission.createdAt)}
                </TableCell>
                <TableCell className="px-5 py-4 text-sm whitespace-nowrap text-gray-500 dark:text-gray-400">
                  {formatDateTime(permission.updatedAt)}
                </TableCell>
                <TableCell className="px-5 py-4">
                  <div className="flex items-center justify-end gap-2">
                    {canUpdate && (
                      <Link
                        href={`/permissions/${permission.id}/edit`}
                        aria-label={`Edit ${permission.name}`}
                        title="Edit"
                        className="flex h-9 w-9 items-center justify-center rounded-lg border border-gray-300 text-gray-500 transition hover:bg-gray-50 hover:text-gray-700 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-white/[0.03] dark:hover:text-gray-200"
                      >
                        <PencilIcon />
                      </Link>
                    )}
                    {canDelete && (
                      <button
                        type="button"
                        onClick={() => {
                          setDeleteError("");
                          setPendingDelete(permission);
                        }}
                        aria-label={`Delete ${permission.name}`}
                        title="Delete"
                        className="flex h-9 w-9 items-center justify-center rounded-lg border border-gray-300 text-gray-500 transition hover:border-error-500 hover:bg-error-50 hover:text-error-500 dark:border-gray-700 dark:text-gray-400 dark:hover:border-error-500 dark:hover:bg-error-500/10 dark:hover:text-error-500"
                      >
                        <TrashBinIcon />
                      </button>
                    )}
                    {!canUpdate && !canDelete && (
                      <span className="text-xs text-gray-400 dark:text-gray-500">
                        View only
                      </span>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {result && result.meta.total > 0 && (
        <TablePagination
          page={result.meta.page}
          limit={result.meta.limit}
          total={result.meta.total}
          totalPages={result.meta.totalPages}
          onPageChange={(nextPage) => updateParams({ page: nextPage })}
        />
      )}

      <PermissionDeleteModal
        permission={pendingDelete}
        isDeleting={isDeleting}
        error={deleteError}
        onClose={() => {
          if (isDeleting) return;
          setPendingDelete(null);
          setDeleteError("");
        }}
        onConfirm={handleDelete}
      />
    </div>
  );
}
