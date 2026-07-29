import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import SettingsTable from "@/components/settings/SettingsTable";
import type { Metadata } from "next";
import { Suspense } from "react";

export const metadata: Metadata = { title: "Settings | Shortlink Admin", description: "Browse, search and manage application settings." };
export default function SettingsPage() { return <div><PageBreadcrumb pageTitle="Settings" /><Suspense fallback={<div className="h-64 animate-pulse rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]" />}><SettingsTable /></Suspense></div>; }
