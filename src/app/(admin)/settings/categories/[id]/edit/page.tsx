import ComponentCard from "@/components/common/ComponentCard";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import SettingCategoryEditForm from "@/components/settings/SettingCategoryEditForm";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Edit Setting Category | Shortlink Admin", description: "Update a setting category." };
export default async function EditSettingCategoryPage({ params }: { params: Promise<{ id: string }> }) { const { id } = await params; return <div><PageBreadcrumb pageTitle="Edit Category" /><div className="max-w-3xl"><ComponentCard title="Category details" desc="Changes are reflected anywhere this category is used."><SettingCategoryEditForm categoryId={id} /></ComponentCard></div></div>; }
