/** Defaults and helpers shared by the URL driven list tables. */

/** Matches the page size the API falls back to when `limit` is omitted. */
export const DEFAULT_PAGE_SIZE = 10;

/** How long typing pauses before the search term reaches the URL. */
export const SEARCH_DEBOUNCE_MS = 400;

export type SelectOption = {
  value: string;
  label: string;
};

export const PAGE_SIZE_OPTIONS: SelectOption[] = [10, 25, 50].map((size) => ({
  value: String(size),
  label: `${size} per page`,
}));

export function parsePositiveInt(value: string | null, fallback: number): number {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}

/** Keeps a hand written or stale URL value visible in its select. */
export function withCurrentValue(
  options: SelectOption[],
  value: string,
): SelectOption[] {
  return options.some((option) => option.value === value)
    ? options
    : [...options, { value, label: value }];
}

/** Narrows a raw URL value to one of the sort fields a list supports. */
export function parseSortField<TField extends string>(
  fields: readonly TField[],
  value: string | null,
  fallback: TField,
): TField {
  return fields.includes(value as TField) ? (value as TField) : fallback;
}
