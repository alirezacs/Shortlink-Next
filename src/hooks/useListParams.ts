"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";

type ParamUpdates = Record<string, string | number | null>;

/**
 * Reads and writes the list state kept in the URL.
 *
 * The URL is the single source of truth for every table, so a view is shareable
 * and survives a refresh or a back navigation. Components using this hook need a
 * Suspense boundary, since `useSearchParams` suspends during prerender.
 */
export function useListParams() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const updateParams = useCallback(
    (updates: ParamUpdates, options: { resetPage?: boolean } = {}) => {
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

  /** Drops every filter, sort and page at once. */
  const resetParams = useCallback(() => {
    router.replace(pathname, { scroll: false });
  }, [pathname, router]);

  return { searchParams, updateParams, resetParams };
}
