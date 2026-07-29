import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import SettingCategoriesTable from "@/components/settings/SettingCategoriesTable";
import type { Metadata } from "next";
import { Suspense } from "react";

export const metadata: Metadata = { title: "Setting Categories | Shortlink Admin", description: "Browse, search and manage setting categories." };
export default function SettingCategoriesPage() { return <div><PageBreadcrumb pageTitle="Categories" /><Suspense fallback={<div className="h-64 animate-pulse rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]" />}><SettingCategoriesTable /></Suspense></div>; }
