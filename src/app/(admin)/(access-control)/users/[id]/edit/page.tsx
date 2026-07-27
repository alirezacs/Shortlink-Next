import ComponentCard from "@/components/common/ComponentCard";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import UserEditForm from "@/components/users/UserEditForm";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Edit User | Shortlink Admin",
  description: "Update an account, its status and the roles it holds.",
};

export default async function EditUserPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <div>
      <PageBreadcrumb pageTitle="Edit User" />
      <div className="max-w-3xl">
        <ComponentCard
          title="User details"
          desc="Leave the password blank to keep the current one. Role changes take effect the next time the account is authenticated."
        >
          <UserEditForm userId={id} />
        </ComponentCard>
      </div>
    </div>
  );
}
