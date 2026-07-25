import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import RolesTable from "@/components/roles/RolesTable";
import type { Metadata } from "next";
import { Suspense } from "react";

export const metadata: Metadata = {
  title: "Roles | Shortlink Admin",
  description: "Browse, search and manage the roles granted to users.",
};

export default function RolesPage() {
  return (
    <div>
      <PageBreadcrumb pageTitle="Roles" />
      {/* The table reads its state from the URL, so it needs a Suspense boundary. */}
      <Suspense
        fallback={
          <div className="h-64 animate-pulse rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]" />
        }
      >
        <RolesTable />
      </Suspense>
    </div>
  );
}
