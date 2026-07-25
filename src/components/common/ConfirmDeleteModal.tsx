"use client";

import Button from "@/components/ui/button/Button";
import { Modal } from "@/components/ui/modal";
import type { ReactNode } from "react";

type ConfirmDeleteModalProps = {
  /** Open whenever a row is pending deletion. */
  isOpen: boolean;
  title: string;
  description: ReactNode;
  confirmLabel: string;
  isDeleting: boolean;
  error: string;
  onClose: () => void;
  onConfirm: () => void;
};

/** Confirmation step shared by the delete action of every list table. */
export default function ConfirmDeleteModal({
  isOpen,
  title,
  description,
  confirmLabel,
  isDeleting,
  error,
  onClose,
  onConfirm,
}: ConfirmDeleteModalProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} className="m-4 max-w-[520px] p-6 lg:p-8">
      <h4 className="mb-2 text-lg font-semibold text-gray-800 dark:text-white/90">
        {title}
      </h4>
      <p className="text-sm text-gray-500 dark:text-gray-400">{description}</p>

      {error && (
        <p
          className="mt-4 rounded-lg bg-error-50 p-3 text-sm text-error-600 dark:bg-error-500/15 dark:text-error-400"
          role="alert"
        >
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
          {isDeleting ? "Deleting..." : confirmLabel}
        </Button>
      </div>
    </Modal>
  );
}
