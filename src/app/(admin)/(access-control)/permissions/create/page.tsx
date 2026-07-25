import ComponentCard from "@/components/common/ComponentCard";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import PermissionForm from "@/components/permissions/PermissionForm";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Create Permission | Shortlink Admin",
  description: "Add a new permission that roles can be granted.",
};

export default function CreatePermissionPage() {
  return (
    <div>
      <PageBreadcrumb pageTitle="Create Permission" />
      <div className="max-w-3xl">
        <ComponentCard
          title="Permission details"
          desc="Names are grouped by their first segment, for example every users.* permission shows up under the users group."
        >
          <PermissionForm />
        </ComponentCard>
      </div>
    </div>
  );
}
