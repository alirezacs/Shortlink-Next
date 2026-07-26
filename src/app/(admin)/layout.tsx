"use client";

import Forbidden from "@/components/authorization/Forbidden";
import RouteGuard from "@/components/authorization/RouteGuard";
import { useAuth } from "@/context/AuthContext";
import { useSidebar } from "@/context/SidebarContext";
import AppHeader from "@/layout/AppHeader";
import AppSidebar from "@/layout/AppSidebar";
import Backdrop from "@/layout/Backdrop";
import { useRouter } from "next/navigation";
import React from "react";

/** Shown while the session is being restored, so nothing privileged paints first. */
function SessionLoading() {
  return (
    <div className="flex min-h-screen items-center justify-center" aria-busy="true">
      <span className="sr-only">Loading your session</span>
      <span className="h-8 w-8 animate-spin rounded-full border-2 border-gray-200 border-t-brand-500 dark:border-gray-700 dark:border-t-brand-500" />
    </div>
  );
}

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isExpanded, isHovered, isMobileOpen } = useSidebar();
  const { status } = useAuth();
  const router = useRouter();

  // Authentication only. Lacking a permission is never a reason to sign out.
  React.useEffect(() => {    
    if (status === "unauthenticated") {
      router.replace("/signin");
    }
  }, [status, router]);

  if (status === "loading") {
    return <SessionLoading />;
  }

  if (status === "unauthenticated") {
    return null;
  }

  // Dynamic class for main content margin based on sidebar state
  const mainContentMargin = isMobileOpen
    ? "ml-0"
    : isExpanded || isHovered
    ? "lg:ml-[290px]"
    : "lg:ml-[90px]";

  return (
    <div className="min-h-screen xl:flex">
      {/* Sidebar and Backdrop */}
      <AppSidebar />
      <Backdrop />
      {/* Main Content Area */}
      <div
        className={`flex-1 transition-all  duration-300 ease-in-out ${mainContentMargin}`}
      >
        {/* Header */}
        <AppHeader />
        {/* Page Content */}
        <div className="p-4 mx-auto max-w-(--breakpoint-2xl) md:p-6">
          {status === "profile-unavailable" ? (
            // Signed in, but `GET /auth/me` was refused, so no permission is
            // known. The shell still renders so the account can sign out.
            <Forbidden
              title="We could not load your account"
              description="Your session is valid, but your account is not allowed to read its own profile, so the dashboard cannot tell what you may access. Ask an administrator to grant you the users.read permission."
              showHomeLink={false}
            />
          ) : (
            <RouteGuard>{children}</RouteGuard>
          )}
        </div>
      </div>
    </div>
  );
}
