"use client";

import Label from "@/components/form/Label";
import Input from "@/components/form/input/InputField";
import TextArea from "@/components/form/input/TextArea";
import Switch from "@/components/form/switch/Switch";
import Button from "@/components/ui/button/Button";
import ButtonLink from "@/components/ui/button/ButtonLink";
import { toErrorMessage } from "@/lib/api/types";
import { settingCategoriesService } from "@/lib/settings/service";
import type { SettingCategory } from "@/lib/settings/types";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

type Props = { category?: SettingCategory };
type Errors = { name?: string; slug?: string; description?: string; sortOrder?: string };
const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const slugify = (value: string) => value.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");

function validate(name: string, slug: string, description: string, sortOrder: string): Errors {
  const errors: Errors = {};
  if (!name.trim()) errors.name = "Name is required.";
  else if (name.trim().length > 100) errors.name = "Name must be at most 100 characters long.";
  if (!slug.trim()) errors.slug = "Slug is required.";
  else if (slug.length > 100 || !SLUG_PATTERN.test(slug)) errors.slug = "Use lower-case letters, numbers and hyphens only.";
  if (description.trim().length > 10000) errors.description = "Description is too long.";
  if (!/^(0|[1-9]\d*)$/.test(sortOrder)) errors.sortOrder = "Sort order must be a whole number of zero or greater.";
  return errors;
}

export default function SettingCategoryForm({ category }: Props) {
  const router = useRouter();
  const isEditing = category !== undefined;
  const [name, setName] = useState(category?.name ?? "");
  const [slug, setSlug] = useState(category?.slug ?? "");
  const [slugEdited, setSlugEdited] = useState(isEditing);
  const [description, setDescription] = useState(category?.description ?? "");
  const [sortOrder, setSortOrder] = useState(String(category?.sortOrder ?? 0));
  const [isActive, setIsActive] = useState(category?.isActive ?? true);
  const [errors, setErrors] = useState<Errors>({});
  const [formError, setFormError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const onNameChange = (value: string) => { setName(value); if (!slugEdited) setSlug(slugify(value)); };
  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isSubmitting) return;
    const nextErrors = validate(name, slug, description, sortOrder);
    setErrors(nextErrors); setFormError("");
    if (Object.keys(nextErrors).length) return;
    setIsSubmitting(true);
    const input = { name: name.trim(), slug: slug.trim(), description: description.trim() || null, sortOrder: Number(sortOrder), isActive };
    try {
      if (isEditing) await settingCategoriesService.update(category.id, input);
      else await settingCategoriesService.create(input);
      router.push(`/settings/categories?notice=${isEditing ? "updated" : "created"}`);
    } catch (error) { setFormError(toErrorMessage(error, "Unable to save this category. Please try again.")); setIsSubmitting(false); }
  }
  return <form onSubmit={handleSubmit} noValidate className="space-y-6">
    <div><Label htmlFor="category-name">Name <span className="text-error-500">*</span></Label><Input id="category-name" value={name} onChange={(event) => onNameChange(event.target.value)} error={Boolean(errors.name)} hint={errors.name} maxLength={100} required /></div>
    <div><Label htmlFor="category-slug">Slug <span className="text-error-500">*</span></Label><Input id="category-slug" value={slug} onChange={(event) => { setSlugEdited(true); setSlug(slugify(event.target.value)); }} error={Boolean(errors.slug)} hint={errors.slug ?? "Generated from the name until you edit it."} maxLength={100} required /></div>
    <div><Label htmlFor="category-description">Description</Label><TextArea id="category-description" value={description} onChange={setDescription} rows={4} error={Boolean(errors.description)} hint={errors.description} /></div>
    <div><Label htmlFor="category-sort-order">Sort order</Label><Input id="category-sort-order" type="number" min="0" step="1" value={sortOrder} onChange={(event) => setSortOrder(event.target.value)} error={Boolean(errors.sortOrder)} hint={errors.sortOrder} required /></div>
    <div><Label>Status</Label><Switch key={String(isActive)} label={isActive ? "Active" : "Inactive"} defaultChecked={isActive} onChange={setIsActive} disabled={isSubmitting} /></div>
    {formError && <p className="rounded-lg bg-error-50 p-3 text-sm text-error-600 dark:bg-error-500/15 dark:text-error-400" role="alert">{formError}</p>}
    <div className="flex flex-col-reverse gap-3 sm:flex-row"><ButtonLink href="/settings/categories" size="sm" variant="outline">Cancel</ButtonLink><Button size="sm" type="submit" disabled={isSubmitting}>{isSubmitting ? "Saving..." : isEditing ? "Save changes" : "Create category"}</Button></div>
  </form>;
}
