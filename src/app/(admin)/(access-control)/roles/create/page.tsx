import ComponentCard from "@/components/common/ComponentCard";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import RoleForm from "@/components/roles/RoleForm";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Create Role | Shortlink Admin",
  description: "Add a new role and choose the permissions it grants.",
};

export default function CreateRolePage() {
  return (
    <div>
      <PageBreadcrumb pageTitle="Create Role" />
      <div className="max-w-3xl">
        <ComponentCard
          title="Role details"
          desc="A role is a named bundle of permissions. Users receive every permission of every role they hold."
        >
          <RoleForm />
        </ComponentCard>
      </div>
    </div>
  );
}
