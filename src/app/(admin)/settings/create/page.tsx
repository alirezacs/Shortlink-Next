import ComponentCard from "@/components/common/ComponentCard";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import SettingForm from "@/components/settings/SettingForm";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Create Setting | Shortlink Admin", description: "Add a new application setting." };
export default function CreateSettingPage() { return <div><PageBreadcrumb pageTitle="Create Setting" /><div className="max-w-3xl"><ComponentCard title="Setting details" desc="Choose a category and type carefully; keys and types cannot be changed after creation."><SettingForm /></ComponentCard></div></div>; }
