"use client";

import Button from "@/components/ui/button/Button";
import { Modal } from "@/components/ui/modal";
import type { Permission } from "@/lib/permissions/types";

type PermissionDeleteModalProps = {
  permission: Permission | null;
  isDeleting: boolean;
  error: string;
  onClose: () => void;
  onConfirm: () => void;
};

export default function PermissionDeleteModal({
  permission,
  isDeleting,
  error,
  onClose,
  onConfirm,
}: PermissionDeleteModalProps) {
  return (
    <Modal
      isOpen={permission !== null}
      onClose={onClose}
      className="m-4 max-w-[520px] p-6 lg:p-8"
    >
      <h4 className="mb-2 text-lg font-semibold text-gray-800 dark:text-white/90">
        Delete permission
      </h4>
      <p className="text-sm text-gray-500 dark:text-gray-400">
        This permanently removes{" "}
        <span className="font-medium text-gray-700 dark:text-gray-300">
          {permission?.name}
        </span>
        . Roles that rely on it will lose the access it grants.
      </p>

      {error && (
        <p className="mt-4 rounded-lg bg-error-50 p-3 text-sm text-error-600 dark:bg-error-500/15 dark:text-error-400" role="alert">
          {error}
        </p>
      )}

      <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <Button size="sm" variant="outline" onClick={onClose} disabled={isDeleting}>
          Cancel
        </Button>
        <Button
          size="sm"
          onClick={onConfirm}
          disabled={isDeleting}
          className="bg-error-500 hover:bg-error-600"
        >
          {isDeleting ? "Deleting..." : "Delete permission"}
        </Button>
      </div>
    </Modal>
  );
}
