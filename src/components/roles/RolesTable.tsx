"use client";

import ConfirmDeleteModal from "@/components/common/ConfirmDeleteModal";
import SelectField from "@/components/form/SelectField";
import Input from "@/components/form/input/InputField";
import SortableTableHeader from "@/components/tables/SortableTableHeader";
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
import { useListParams } from "@/hooks/useListParams";
import { PencilIcon, PlusIcon, TrashBinIcon } from "@/icons";
import { isApiError } from "@/lib/api/types";
import { hasPermission } from "@/lib/auth/permissions";
import { roleService } from "@/lib/roles/service";
import {
  ROLE_SORT_FIELDS,
  type PaginatedResult,
  type Role,
  type RoleListQuery,
  type RoleSortField,
  type SortOrder,
} from "@/lib/roles/types";
import { formatDateTime } from "@/lib/utils/date";
import {
  DEFAULT_PAGE_SIZE,
  PAGE_SIZE_OPTIONS,
  SEARCH_DEBOUNCE_MS,
  parsePositiveInt,
  parseSortField,
  withCurrentValue,
} from "@/lib/utils/table";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

const STATUS_OPTIONS = [
  { value: "", label: "Any status" },
  { value: "true", label: "Active" },
  { value: "false", label: "Deactivated" },
];

const ASSIGNED_OPTIONS = [
  { value: "", label: "Any assignment" },
  { value: "true", label: "Assigned to a user" },
  { value: "false", label: "Not assigned" },
];

const NOTICES: Record<string, string> = {
  created: "Role created successfully.",
  updated: "Role updated successfully.",
};

export default function RolesTable() {
  const { searchParams, updateParams, resetParams } = useListParams();
  const { user } = useAuth();

  const canCreate = hasPermission(user, "roles.create");
  const canUpdate = hasPermission(user, "roles.update");
  const canDelete = hasPermission(user, "roles.delete");

  // The URL is the single source of truth for the list state, so every view is
  // shareable and survives a refresh or a back navigation.
  const page = parsePositiveInt(searchParams.get("page"), 1);
  const limit = parsePositiveInt(searchParams.get("limit"), DEFAULT_PAGE_SIZE);
  const search = searchParams.get("search") ?? "";
  const isActive = searchParams.get("isActive") ?? "";
  const assigned = searchParams.get("assigned") ?? "";
  const sortBy = parseSortField(ROLE_SORT_FIELDS, searchParams.get("sortBy"), "name");
  const sortOrder: SortOrder = searchParams.get("sortOrder") === "DESC" ? "DESC" : "ASC";
  const notice = searchParams.get("notice") ?? "";

  const query = useMemo<RoleListQuery>(
    () => ({ page, limit, search, isActive, assigned, sortBy, sortOrder }),
    [assigned, isActive, limit, page, search, sortBy, sortOrder],
  );

  const [result, setResult] = useState<PaginatedResult<Role> | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [refreshToken, setRefreshToken] = useState(0);
  const [flash, setFlash] = useState("");
  const [searchDraft, setSearchDraft] = useState(search);
  const [pendingDelete, setPendingDelete] = useState<Role | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  useEffect(() => {
    let ignore = false;
    setIsLoading(true);

    roleService
      .list(query)
      .then((response) => {
        if (ignore) return;
        setResult(response);
        setLoadError("");
      })
      .catch((error: unknown) => {
        if (ignore) return;
        setResult(null);
        setLoadError(isApiError(error) ? error.message : "Unable to load roles.");
      })
      .finally(() => {
        if (!ignore) setIsLoading(false);
      });

    return () => {
      ignore = true;
    };
  }, [query, refreshToken]);

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

  const handleSort = (field: RoleSortField) => {
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
      await roleService.remove(pendingDelete.id);
      setFlash(`Role "${pendingDelete.name}" was deleted.`);
      setPendingDelete(null);
      setRefreshToken((token) => token + 1);
    } catch (error) {
      setDeleteError(
        isApiError(error) ? error.message : "Unable to delete this role.",
      );
    } finally {
      setIsDeleting(false);
    }
  };

  const resetFilters = () => {
    setSearchDraft("");
    resetParams();
  };

  const hasActiveFilters =
    Boolean(search || isActive || assigned) ||
    sortBy !== "name" ||
    sortOrder !== "ASC" ||
    limit !== DEFAULT_PAGE_SIZE;

  const roles = result?.data ?? [];

  return (
    <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
      <div className="flex flex-col gap-4 px-5 py-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-base font-medium text-gray-800 dark:text-white/90">
            All roles
          </h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            {isLoading && !result
              ? "Loading roles..."
              : `${result?.meta.total ?? 0} ${
                  result?.meta.total === 1 ? "role" : "roles"
                } found`}
          </p>
        </div>

        {canCreate && (
          <ButtonLink href="/roles/create" size="sm" startIcon={<PlusIcon />}>
            Add role
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
            aria-label="Search roles"
          />
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 lg:ml-auto lg:w-auto lg:grid-cols-3">
          <SelectField
            options={withCurrentValue(STATUS_OPTIONS, isActive)}
            value={isActive}
            onChange={(value) => updateParams({ isActive: value }, { resetPage: true })}
            aria-label="Filter by status"
            className="lg:w-40"
          />
          <SelectField
            options={withCurrentValue(ASSIGNED_OPTIONS, assigned)}
            value={assigned}
            onChange={(value) => updateParams({ assigned: value }, { resetPage: true })}
            aria-label="Filter by user assignment"
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
          isLoading && roles.length > 0 ? "opacity-60" : ""
        }`}
      >
        <Table>
          <TableHeader className="border-b border-gray-100 dark:border-gray-800">
            <TableRow>
              <SortableTableHeader
                label="Role"
                field="name"
                sortBy={sortBy}
                sortOrder={sortOrder}
                onSort={handleSort}
              />
              <TableCell
                isHeader
                className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400"
              >
                Status
              </TableCell>
              <TableCell
                isHeader
                className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400"
              >
                Permissions
              </TableCell>
              <TableCell
                isHeader
                className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400"
              >
                Users
              </TableCell>
              <SortableTableHeader
                label="Created"
                field="createdAt"
                sortBy={sortBy}
                sortOrder={sortOrder}
                onSort={handleSort}
              />
              <SortableTableHeader
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
            {isLoading && roles.length === 0 && (
              <>
                {Array.from({ length: 5 }).map((_, index) => (
                  <TableRow
                    key={`skeleton-${index}`}
                    className="border-b border-gray-100 dark:border-gray-800"
                  >
                    {Array.from({ length: 7 }).map((__, cell) => (
                      <TableCell key={`skeleton-cell-${cell}`} className="px-5 py-4">
                        <div className="h-4 w-full animate-pulse rounded bg-gray-100 dark:bg-gray-800" />
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </>
            )}

            {!isLoading && roles.length === 0 && !loadError && (
              <TableRow>
                <TableCell className="px-5 py-12 text-center" colSpan={7}>
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    No roles found
                  </p>
                  <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                    {hasActiveFilters
                      ? "Try a different search term or clear the filters."
                      : "Create your first role to get started."}
                  </p>
                </TableCell>
              </TableRow>
            )}

            {roles.map((role) => (
              <TableRow
                key={role.id}
                className="border-b border-gray-100 last:border-b-0 dark:border-gray-800"
              >
                <TableCell className="px-5 py-4">
                  <span className="block font-medium text-gray-800 dark:text-white/90">
                    {role.name}
                  </span>
                  <span className="mt-0.5 block text-xs text-gray-500 dark:text-gray-400">
                    {role.description || "No description"}
                  </span>
                </TableCell>
                <TableCell className="px-5 py-4">
                  <Badge
                    variant="light"
                    color={role.isActive ? "success" : "light"}
                    size="sm"
                  >
                    {role.isActive ? "Active" : "Deactivated"}
                  </Badge>
                </TableCell>
                <TableCell className="px-5 py-4">
                  <Badge
                    variant="light"
                    color={role.permissionsCount > 0 ? "primary" : "warning"}
                    size="sm"
                  >
                    {role.permissionsCount === 0
                      ? "No permissions"
                      : `${role.permissionsCount} ${
                          role.permissionsCount === 1 ? "permission" : "permissions"
                        }`}
                  </Badge>
                </TableCell>
                <TableCell className="px-5 py-4">
                  <Badge
                    variant="light"
                    color={role.usersCount > 0 ? "success" : "warning"}
                    size="sm"
                  >
                    {role.usersCount === 0
                      ? "Unassigned"
                      : `${role.usersCount} ${
                          role.usersCount === 1 ? "user" : "users"
                        }`}
                  </Badge>
                </TableCell>
                <TableCell className="px-5 py-4 text-sm whitespace-nowrap text-gray-500 dark:text-gray-400">
                  {formatDateTime(role.createdAt)}
                </TableCell>
                <TableCell className="px-5 py-4 text-sm whitespace-nowrap text-gray-500 dark:text-gray-400">
                  {formatDateTime(role.updatedAt)}
                </TableCell>
                <TableCell className="px-5 py-4">
                  <div className="flex items-center justify-end gap-2">
                    {canUpdate && (
                      <Link
                        href={`/roles/${role.id}/edit`}
                        aria-label={`Edit ${role.name}`}
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
                          setPendingDelete(role);
                        }}
                        aria-label={`Delete ${role.name}`}
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

      <ConfirmDeleteModal
        isOpen={pendingDelete !== null}
        title="Delete role"
        description={
          <>
            This removes{" "}
            <span className="font-medium text-gray-700 dark:text-gray-300">
              {pendingDelete?.name}
            </span>
            . Users holding it will lose every permission it grants.
          </>
        }
        confirmLabel="Delete role"
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
