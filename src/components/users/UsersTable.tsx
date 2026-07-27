"use client";

import Can from "@/components/authorization/Can";
import ConfirmDeleteModal from "@/components/common/ConfirmDeleteModal";
import SelectField from "@/components/form/SelectField";
import Input from "@/components/form/input/InputField";
import SortableTableHeader from "@/components/tables/SortableTableHeader";
import TablePagination from "@/components/tables/TablePagination";
import AvatarText from "@/components/ui/avatar/AvatarText";
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
import { useAuthorization } from "@/hooks/useAuthorization";
import { PencilIcon, PlusIcon, TrashBinIcon } from "@/icons";
import { toErrorMessage } from "@/lib/api/types";
import { PERMISSIONS } from "@/lib/authz";
import { roleService } from "@/lib/roles/service";
import { userService } from "@/lib/users/service";
import {
  USER_SORT_FIELDS,
  type PaginatedResult,
  type SortOrder,
  type User,
  type UserListQuery,
  type UserSortField,
} from "@/lib/users/types";
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

const VERIFIED_OPTIONS = [
  { value: "", label: "Any email" },
  { value: "true", label: "Email verified" },
  { value: "false", label: "Email unverified" },
];

const ANY_ROLE_OPTION = { value: "", label: "Any role" };

const NOTICES: Record<string, string> = {
  created: "User created successfully.",
  updated: "User updated successfully.",
};

export default function UsersTable() {
  const { searchParams, updateParams, resetParams } = useListParams();
  const { can } = useAuthorization();
  const { user: currentUser } = useAuth();

  // Row actions read the hook because they also decide the "View only" state;
  // the toolbar button is a plain `<Can>` since it only has to appear or not.
  const canUpdate = can(PERMISSIONS.USERS.UPDATE);
  const canDelete = can(PERMISSIONS.USERS.DELETE);

  // The URL is the single source of truth for the list state, so every view is
  // shareable and survives a refresh or a back navigation.
  const page = parsePositiveInt(searchParams.get("page"), 1);
  const limit = parsePositiveInt(searchParams.get("limit"), DEFAULT_PAGE_SIZE);
  const search = searchParams.get("search") ?? "";
  const isActive = searchParams.get("isActive") ?? "";
  const isEmailVerified = searchParams.get("isEmailVerified") ?? "";
  const roleId = searchParams.get("roleId") ?? "";
  const sortBy = parseSortField(
    USER_SORT_FIELDS,
    searchParams.get("sortBy"),
    "firstName",
  );
  const sortOrder: SortOrder = searchParams.get("sortOrder") === "DESC" ? "DESC" : "ASC";
  const notice = searchParams.get("notice") ?? "";

  const query = useMemo<UserListQuery>(
    () => ({ page, limit, search, isActive, isEmailVerified, roleId, sortBy, sortOrder }),
    [isActive, isEmailVerified, limit, page, roleId, search, sortBy, sortOrder],
  );

  const [result, setResult] = useState<PaginatedResult<User> | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [roleOptions, setRoleOptions] = useState([ANY_ROLE_OPTION]);
  const [refreshToken, setRefreshToken] = useState(0);
  const [flash, setFlash] = useState("");
  const [searchDraft, setSearchDraft] = useState(search);
  const [pendingDelete, setPendingDelete] = useState<User | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  useEffect(() => {
    let ignore = false;
    setIsLoading(true);

    userService
      .list(query)
      .then((response) => {
        if (ignore) return;
        setResult(response);
        setLoadError("");
      })
      .catch((error: unknown) => {
        if (ignore) return;
        setResult(null);
        setLoadError(toErrorMessage(error, "Unable to load users."));
      })
      .finally(() => {
        if (!ignore) setIsLoading(false);
      });

    return () => {
      ignore = true;
    };
  }, [query, refreshToken]);

  // Role options come from the API so the filter always matches stored data. An
  // account allowed to manage users may not be allowed to read roles, so a
  // failure here simply leaves the filter with its "Any role" entry.
  useEffect(() => {
    let ignore = false;

    roleService
      .listAll()
      .then((roles) => {
        if (ignore) return;

        setRoleOptions([
          ANY_ROLE_OPTION,
          ...roles.map((role) => ({ value: role.id, label: role.name })),
        ]);
      })
      .catch(() => {
        if (!ignore) setRoleOptions([ANY_ROLE_OPTION]);
      });

    return () => {
      ignore = true;
    };
  }, []);

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

  const handleSort = (field: UserSortField) => {
    if (sortBy === field) {
      updateParams({ sortBy: field, sortOrder: sortOrder === "ASC" ? "DESC" : "ASC" });
      return;
    }

    // Names read best A → Z, timestamps newest first.
    updateParams(
      {
        sortBy: field,
        sortOrder: field === "firstName" || field === "email" ? "ASC" : "DESC",
      },
      { resetPage: true },
    );
  };

  const handleDelete = async () => {
    if (!pendingDelete) return;

    setIsDeleting(true);
    setDeleteError("");

    try {
      await userService.remove(pendingDelete.id);
      setFlash(`User "${pendingDelete.email}" was deleted.`);
      setPendingDelete(null);
      setRefreshToken((token) => token + 1);
    } catch (error) {
      setDeleteError(toErrorMessage(error, "Unable to delete this user."));
    } finally {
      setIsDeleting(false);
    }
  };

  const resetFilters = () => {
    setSearchDraft("");
    resetParams();
  };

  const hasActiveFilters =
    Boolean(search || isActive || isEmailVerified || roleId) ||
    sortBy !== "firstName" ||
    sortOrder !== "ASC" ||
    limit !== DEFAULT_PAGE_SIZE;

  const users = result?.data ?? [];

  return (
    <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
      <div className="flex flex-col gap-4 px-5 py-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-base font-medium text-gray-800 dark:text-white/90">
            All users
          </h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            {isLoading && !result
              ? "Loading users..."
              : `${result?.meta.total ?? 0} ${
                  result?.meta.total === 1 ? "user" : "users"
                } found`}
          </p>
        </div>

        <Can permission={PERMISSIONS.USERS.CREATE}>
          <ButtonLink href="/users/create" size="sm" startIcon={<PlusIcon />}>
            Add user
          </ButtonLink>
        </Can>
      </div>

      <div className="flex flex-col gap-3 border-t border-gray-100 px-5 py-4 dark:border-gray-800 lg:flex-row lg:items-center">
        <div className="lg:max-w-xs lg:flex-1">
          <Input
            type="search"
            placeholder="Search by name or email..."
            value={searchDraft}
            onChange={(event) => setSearchDraft(event.target.value)}
            aria-label="Search users"
          />
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:ml-auto lg:w-auto lg:grid-cols-4">
          <SelectField
            options={withCurrentValue(STATUS_OPTIONS, isActive)}
            value={isActive}
            onChange={(value) => updateParams({ isActive: value }, { resetPage: true })}
            aria-label="Filter by status"
            className="lg:w-40"
          />
          <SelectField
            options={withCurrentValue(VERIFIED_OPTIONS, isEmailVerified)}
            value={isEmailVerified}
            onChange={(value) =>
              updateParams({ isEmailVerified: value }, { resetPage: true })
            }
            aria-label="Filter by email verification"
            className="lg:w-44"
          />
          <SelectField
            options={withCurrentValue(roleOptions, roleId)}
            value={roleId}
            onChange={(value) => updateParams({ roleId: value }, { resetPage: true })}
            aria-label="Filter by role"
            className="lg:w-40"
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
          isLoading && users.length > 0 ? "opacity-60" : ""
        }`}
      >
        <Table>
          <TableHeader className="border-b border-gray-100 dark:border-gray-800">
            <TableRow>
              <SortableTableHeader
                label="User"
                field="firstName"
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
                Email
              </TableCell>
              <TableCell
                isHeader
                className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400"
              >
                Roles
              </TableCell>
              <SortableTableHeader
                label="Last login"
                field="lastLoginAt"
                sortBy={sortBy}
                sortOrder={sortOrder}
                onSort={handleSort}
              />
              <SortableTableHeader
                label="Created"
                field="createdAt"
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
            {isLoading && users.length === 0 && (
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

            {!isLoading && users.length === 0 && !loadError && (
              <TableRow>
                <TableCell className="px-5 py-12 text-center" colSpan={7}>
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    No users found
                  </p>
                  <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                    {hasActiveFilters
                      ? "Try a different search term or clear the filters."
                      : "Create your first user to get started."}
                  </p>
                </TableCell>
              </TableRow>
            )}

            {users.map((user) => {
              // The API refuses this anyway; hiding the button keeps a 409 from
              // being the way anyone finds out.
              const isCurrentUser = user.id === currentUser?.id;

              return (
                <TableRow
                  key={user.id}
                  className="border-b border-gray-100 last:border-b-0 dark:border-gray-800"
                >
                  <TableCell className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <AvatarText name={user.fullName} />
                      <div>
                        <span className="block font-medium text-gray-800 dark:text-white/90">
                          {user.fullName}
                          {isCurrentUser && (
                            <span className="ml-2 text-xs font-normal text-gray-400 dark:text-gray-500">
                              (you)
                            </span>
                          )}
                        </span>
                        <span className="mt-0.5 block text-xs text-gray-500 dark:text-gray-400">
                          {user.email}
                        </span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="px-5 py-4">
                    <Badge
                      variant="light"
                      color={user.isActive ? "success" : "light"}
                      size="sm"
                    >
                      {user.isActive ? "Active" : "Deactivated"}
                    </Badge>
                  </TableCell>
                  <TableCell className="px-5 py-4">
                    <Badge
                      variant="light"
                      color={user.isEmailVerified ? "success" : "warning"}
                      size="sm"
                    >
                      {user.isEmailVerified ? "Verified" : "Unverified"}
                    </Badge>
                  </TableCell>
                  <TableCell className="px-5 py-4">
                    {user.roles.length === 0 ? (
                      <Badge variant="light" color="warning" size="sm">
                        No roles
                      </Badge>
                    ) : (
                      <div className="flex flex-wrap gap-1.5">
                        {user.roles.map((role) => (
                          <Badge
                            key={role.id}
                            variant="light"
                            color={role.isActive ? "primary" : "light"}
                            size="sm"
                          >
                            {role.name}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </TableCell>
                  <TableCell className="px-5 py-4 text-sm whitespace-nowrap text-gray-500 dark:text-gray-400">
                    {user.lastLoginAt ? formatDateTime(user.lastLoginAt) : "Never"}
                  </TableCell>
                  <TableCell className="px-5 py-4 text-sm whitespace-nowrap text-gray-500 dark:text-gray-400">
                    {formatDateTime(user.createdAt)}
                  </TableCell>
                  <TableCell className="px-5 py-4">
                    <div className="flex items-center justify-end gap-2">
                      {canUpdate && (
                        <Link
                          href={`/users/${user.id}/edit`}
                          aria-label={`Edit ${user.fullName}`}
                          title="Edit"
                          className="flex h-9 w-9 items-center justify-center rounded-lg border border-gray-300 text-gray-500 transition hover:bg-gray-50 hover:text-gray-700 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-white/[0.03] dark:hover:text-gray-200"
                        >
                          <PencilIcon />
                        </Link>
                      )}
                      {canDelete && !isCurrentUser && (
                        <button
                          type="button"
                          onClick={() => {
                            setDeleteError("");
                            setPendingDelete(user);
                          }}
                          aria-label={`Delete ${user.fullName}`}
                          title="Delete"
                          className="flex h-9 w-9 items-center justify-center rounded-lg border border-gray-300 text-gray-500 transition hover:border-error-500 hover:bg-error-50 hover:text-error-500 dark:border-gray-700 dark:text-gray-400 dark:hover:border-error-500 dark:hover:bg-error-500/10 dark:hover:text-error-500"
                        >
                          <TrashBinIcon />
                        </button>
                      )}
                      {!canUpdate && (!canDelete || isCurrentUser) && (
                        <span className="text-xs text-gray-400 dark:text-gray-500">
                          View only
                        </span>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
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
        title="Delete user"
        description={
          <>
            This removes{" "}
            <span className="font-medium text-gray-700 dark:text-gray-300">
              {pendingDelete?.fullName}
            </span>{" "}
            ({pendingDelete?.email}). The account can no longer sign in, and its
            role assignments are kept in case it is restored.
          </>
        }
        confirmLabel="Delete user"
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
