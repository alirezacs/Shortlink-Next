"use client";

import Label from "@/components/form/Label";
import SelectField from "@/components/form/SelectField";
import Input from "@/components/form/input/InputField";
import TextArea from "@/components/form/input/TextArea";
import Switch from "@/components/form/switch/Switch";
import Button from "@/components/ui/button/Button";
import ButtonLink from "@/components/ui/button/ButtonLink";
import { toErrorMessage } from "@/lib/api/types";
import { settingCategoriesService, settingsService } from "@/lib/settings/service";
import { SETTING_TYPES, type Setting, type SettingCategory, type SettingType } from "@/lib/settings/types";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";

type Props = { setting?: Setting };
type Errors = { categoryId?: string; key?: string; value?: string; description?: string };
const KEY_PATTERN = /^[a-zA-Z][a-zA-Z0-9_.-]*$/;

function valueText(value: unknown, type: SettingType): string {
  if (type === "boolean") return value === true ? "true" : "false";
  if (type === "json" || type === "array") return JSON.stringify(value, null, 2);
  return String(value ?? "");
}
function parseValue(type: SettingType, text: string): { value?: unknown; error?: string } {
  if (type === "string") return { value: text };
  if (type === "number") { const value = Number(text); return text.trim() && Number.isFinite(value) ? { value } : { error: "Enter a valid number." }; }
  if (type === "boolean") return { value: text === "true" };
  if (type === "enum") { const trimmed = text.trim(); if (!trimmed) return { error: "Enum value is required." }; const number = Number(trimmed); return { value: Number.isFinite(number) && trimmed !== "" ? number : trimmed }; }
  try { const value: unknown = JSON.parse(text); if (type === "json" && (value === null || typeof value !== "object" || Array.isArray(value))) return { error: "Enter a JSON object." }; if (type === "array" && !Array.isArray(value)) return { error: "Enter a JSON array." }; return { value }; } catch { return { error: type === "json" ? "Enter valid JSON object syntax." : "Enter valid JSON array syntax." }; }
}

export default function SettingForm({ setting }: Props) {
  const router = useRouter(); const isEditing = setting !== undefined;
  const [categories, setCategories] = useState<SettingCategory[]>([]); const [categoriesError, setCategoriesError] = useState("");
  const [categoryId, setCategoryId] = useState(setting ? String(setting.categoryId) : ""); const [key, setKey] = useState(setting?.key ?? ""); const [type, setType] = useState<SettingType>(setting?.type ?? "string");
  const [value, setValue] = useState(valueText(setting?.value, setting?.type ?? "string")); const [description, setDescription] = useState(setting?.description ?? ""); const [isPublic, setIsPublic] = useState(setting?.isPublic ?? false); const [isEditable, setIsEditable] = useState(setting?.isEditable ?? true);
  const [errors, setErrors] = useState<Errors>({}); const [formError, setFormError] = useState(""); const [isSubmitting, setIsSubmitting] = useState(false);
  useEffect(() => { let ignore = false; settingCategoriesService.list().then((items) => { if (!ignore) { setCategories(items); setCategoriesError(""); } }).catch((error: unknown) => { if (!ignore) setCategoriesError(toErrorMessage(error, "Unable to load categories.")); }); return () => { ignore = true; }; }, []);
  const changeType = (nextType: string) => { const typed = nextType as SettingType; setType(typed); setValue(typed === "boolean" ? "false" : typed === "json" ? "{}" : typed === "array" ? "[]" : ""); };
  async function handleSubmit(event: FormEvent<HTMLFormElement>) { event.preventDefault(); if (isSubmitting) return; const nextErrors: Errors = {}; if (!categoryId) nextErrors.categoryId = "Category is required."; if (!isEditing && (!key.trim() || key.length > 150 || !KEY_PATTERN.test(key))) nextErrors.key = "Use up to 150 letters, numbers, dots, underscores or hyphens."; if (description.trim().length > 10000) nextErrors.description = "Description is too long."; const parsed = parseValue(type, value); if (parsed.error) nextErrors.value = parsed.error; setErrors(nextErrors); setFormError(""); if (Object.keys(nextErrors).length || parsed.value === undefined) return; setIsSubmitting(true); const selectedCategoryId = Number(categoryId); try { if (isEditing) await settingsService.update(setting.id, { categoryId: selectedCategoryId, value: parsed.value, description: description.trim() || null, isPublic, isEditable }); else await settingsService.create({ key: key.trim(), type, categoryId: selectedCategoryId, value: parsed.value, description: description.trim() || null, isPublic, isEditable }); router.push(`/settings?notice=${isEditing ? "updated" : "created"}`); } catch (error) { setFormError(toErrorMessage(error, "Unable to save this setting. Please try again.")); setIsSubmitting(false); } }
  const categoryOptions = [{ value: "", label: "Select a category" }, ...categories.map((category) => ({ value: String(category.id), label: category.name }))];
  const typeOptions = SETTING_TYPES.map((item) => ({ value: item, label: item.toUpperCase() }));
  return <form onSubmit={handleSubmit} noValidate className="space-y-6">
    {categoriesError && <p className="rounded-lg bg-error-50 p-3 text-sm text-error-600 dark:bg-error-500/15 dark:text-error-400" role="alert">{categoriesError}</p>}
    <div><Label htmlFor="setting-category">Category <span className="text-error-500">*</span></Label><SelectField id="setting-category" options={categoryOptions} value={categoryId} onChange={setCategoryId} disabled={isSubmitting || categories.length === 0} /><p className="mt-1.5 text-xs text-error-500">{errors.categoryId}</p></div>
    <div><Label htmlFor="setting-key">Key <span className="text-error-500">*</span></Label><Input id="setting-key" value={key} onChange={(event) => setKey(event.target.value)} disabled={isEditing} error={Boolean(errors.key)} hint={errors.key ?? (isEditing ? "Keys cannot be changed after creation." : "For example: site.title")} maxLength={150} required /></div>
    <div><Label htmlFor="setting-type">Type <span className="text-error-500">*</span></Label><SelectField id="setting-type" options={typeOptions} value={type} onChange={changeType} disabled={isEditing || isSubmitting} /><p className="mt-1.5 text-xs text-gray-500">{isEditing ? "Types cannot be changed after creation." : "The value field adapts to the selected type."}</p></div>
    <div><Label htmlFor="setting-value">Value <span className="text-error-500">*</span></Label>{type === "boolean" ? <Switch key={value} label={value === "true" ? "True" : "False"} defaultChecked={value === "true"} onChange={(checked) => setValue(String(checked))} disabled={isSubmitting} /> : type === "json" || type === "array" ? <TextArea id="setting-value" value={value} onChange={setValue} rows={7} error={Boolean(errors.value)} hint={errors.value ?? (type === "json" ? "A valid JSON object." : "A valid JSON array.")} /> : <Input id="setting-value" type={type === "number" ? "number" : "text"} value={value} onChange={(event) => setValue(event.target.value)} error={Boolean(errors.value)} hint={errors.value} step={type === "number" ? "any" : undefined} />}</div>
    <div><Label htmlFor="setting-description">Description</Label><TextArea id="setting-description" value={description} onChange={setDescription} rows={4} error={Boolean(errors.description)} hint={errors.description} /></div>
    <div><Label>Visibility</Label><Switch key={`public-${isPublic}`} label={isPublic ? "Public" : "Private"} defaultChecked={isPublic} onChange={setIsPublic} disabled={isSubmitting} /></div>
    <div><Label>Editing</Label><Switch key={`editable-${isEditable}`} label={isEditable ? "Editable" : "Locked"} defaultChecked={isEditable} onChange={setIsEditable} disabled={isSubmitting} /></div>
    {formError && <p className="rounded-lg bg-error-50 p-3 text-sm text-error-600 dark:bg-error-500/15 dark:text-error-400" role="alert">{formError}</p>}
    <div className="flex flex-col-reverse gap-3 sm:flex-row"><ButtonLink href="/settings" size="sm" variant="outline">Cancel</ButtonLink><Button size="sm" type="submit" disabled={isSubmitting || Boolean(categoriesError)}>{isSubmitting ? "Saving..." : isEditing ? "Save changes" : "Create setting"}</Button></div>
  </form>;
}
