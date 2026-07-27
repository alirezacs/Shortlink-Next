import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import UsersTable from "@/components/users/UsersTable";
import type { Metadata } from "next";
import { Suspense } from "react";

export const metadata: Metadata = {
  title: "Users | Shortlink Admin",
  description: "Browse, search and manage the accounts that can sign in.",
};

export default function UsersPage() {
  return (
    <div>
      <PageBreadcrumb pageTitle="Users" />
      {/* The table reads its state from the URL, so it needs a Suspense boundary. */}
      <Suspense
        fallback={
          <div className="h-64 animate-pulse rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]" />
        }
      >
        <UsersTable />
      </Suspense>
    </div>
  );
}
