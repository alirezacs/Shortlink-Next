import ComponentCard from "@/components/common/ComponentCard";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import SettingEditForm from "@/components/settings/SettingEditForm";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Edit Setting | Shortlink Admin", description: "Update an application setting." };
export default async function EditSettingPage({ params }: { params: Promise<{ id: string }> }) { const { id } = await params; return <div><PageBreadcrumb pageTitle="Edit Setting" /><div className="max-w-3xl"><ComponentCard title="Setting details" desc="The key and type are fixed after creation."><SettingEditForm settingId={id} /></ComponentCard></div></div>; }
