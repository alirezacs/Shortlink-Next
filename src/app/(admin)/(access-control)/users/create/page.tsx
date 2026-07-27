import ComponentCard from "@/components/common/ComponentCard";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import UserForm from "@/components/users/UserForm";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Create User | Shortlink Admin",
  description: "Add a new account and choose the roles it holds.",
};

export default function CreateUserPage() {
  return (
    <div>
      <PageBreadcrumb pageTitle="Create User" />
      <div className="max-w-3xl">
        <ComponentCard
          title="User details"
          desc="The account can sign in as soon as it is created. It receives every permission of every role you assign here."
        >
          <UserForm />
        </ComponentCard>
      </div>
    </div>
  );
}
