"use client";

import SettingCategoryForm from "@/components/settings/SettingCategoryForm";
import ButtonLink from "@/components/ui/button/ButtonLink";
import { isApiError, toErrorMessage } from "@/lib/api/types";
import { settingCategoriesService } from "@/lib/settings/service";
import type { SettingCategory } from "@/lib/settings/types";
import { useEffect, useState } from "react";

export default function SettingCategoryEditForm({ categoryId }: { categoryId: string }) {
  const [state, setState] = useState<{ status: "loading" } | { status: "ready"; category: SettingCategory } | { status: "error"; error: string }>({ status: "loading" });
  useEffect(() => { let ignore = false; settingCategoriesService.get(categoryId).then((category) => { if (!ignore) setState({ status: "ready", category }); }).catch((error: unknown) => { if (!ignore) setState({ status: "error", error: isApiError(error) && error.status === 404 ? "This category no longer exists." : toErrorMessage(error, "Unable to load this category.") }); }); return () => { ignore = true; }; }, [categoryId]);
  if (state.status === "loading") return <div className="space-y-4" aria-busy="true"><div className="h-4 w-24 animate-pulse rounded bg-gray-100 dark:bg-gray-800" /><div className="h-11 w-full animate-pulse rounded-lg bg-gray-100 dark:bg-gray-800" /></div>;
  if (state.status === "error") return <div className="space-y-4"><p className="rounded-lg bg-error-50 p-3 text-sm text-error-600 dark:bg-error-500/15 dark:text-error-400" role="alert">{state.error}</p><ButtonLink href="/settings/categories" size="sm" variant="outline">Back to categories</ButtonLink></div>;
  return <SettingCategoryForm category={state.category} />;
}
