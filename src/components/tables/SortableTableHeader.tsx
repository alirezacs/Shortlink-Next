"use client";

import { TableCell } from "@/components/ui/table";
import { AngleDownIcon, AngleUpIcon } from "@/icons";
import type { SortOrder } from "@/lib/api/types";

type SortableTableHeaderProps<TField extends string> = {
  label: string;
  field: TField;
  sortBy: TField;
  sortOrder: SortOrder;
  onSort: (field: TField) => void;
};

/** Header cell that toggles the sort column and direction of a list table. */
export default function SortableTableHeader<TField extends string>({
  label,
  field,
  sortBy,
  sortOrder,
  onSort,
}: SortableTableHeaderProps<TField>) {
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
