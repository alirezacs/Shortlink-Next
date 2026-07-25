import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import PermissionsTable from "@/components/permissions/PermissionsTable";
import type { Metadata } from "next";
import { Suspense } from "react";

export const metadata: Metadata = {
  title: "Permissions | Shortlink Admin",
  description: "Browse, search and manage the permissions used by roles.",
};

export default function PermissionsPage() {
  return (
    <div>
      <PageBreadcrumb pageTitle="Permissions" />
      {/* The table reads its state from the URL, so it needs a Suspense boundary. */}
      <Suspense
        fallback={
          <div className="h-64 animate-pulse rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]" />
        }
      >
        <PermissionsTable />
      </Suspense>
    </div>
  );
}
