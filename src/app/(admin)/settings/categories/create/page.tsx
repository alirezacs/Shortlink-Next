import ComponentCard from "@/components/common/ComponentCard";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import SettingCategoryForm from "@/components/settings/SettingCategoryForm";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Create Setting Category | Shortlink Admin", description: "Add a new setting category." };
export default function CreateSettingCategoryPage() { return <div><PageBreadcrumb pageTitle="Create Category" /><div className="max-w-3xl"><ComponentCard title="Category details" desc="Categories organize related settings and control their display order."><SettingCategoryForm /></ComponentCard></div></div>; }
