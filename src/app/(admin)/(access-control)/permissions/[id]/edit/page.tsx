import ComponentCard from "@/components/common/ComponentCard";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import PermissionEditForm from "@/components/permissions/PermissionEditForm";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Edit Permission | Shortlink Admin",
  description: "Update the name or description of an existing permission.",
};

export default async function EditPermissionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <div>
      <PageBreadcrumb pageTitle="Edit Permission" />
      <div className="max-w-3xl">
        <ComponentCard
          title="Permission details"
          desc="Renaming a permission changes what the API checks for, so keep it in sync with the code that requires it."
        >
          <PermissionEditForm permissionId={id} />
        </ComponentCard>
      </div>
    </div>
  );
}
