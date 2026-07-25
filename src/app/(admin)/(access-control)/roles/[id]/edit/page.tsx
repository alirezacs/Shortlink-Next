import ComponentCard from "@/components/common/ComponentCard";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import RoleEditForm from "@/components/roles/RoleEditForm";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Edit Role | Shortlink Admin",
  description: "Update a role, its status and the permissions it grants.",
};

export default async function EditRolePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <div>
      <PageBreadcrumb pageTitle="Edit Role" />
      <div className="max-w-3xl">
        <ComponentCard
          title="Role details"
          desc="Changes take effect the next time a user holding this role is authenticated."
        >
          <RoleEditForm roleId={id} />
        </ComponentCard>
      </div>
    </div>
  );
}
