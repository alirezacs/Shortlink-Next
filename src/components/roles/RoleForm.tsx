"use client";

import Label from "@/components/form/Label";
import Input from "@/components/form/input/InputField";
import TextArea from "@/components/form/input/TextArea";
import Switch from "@/components/form/switch/Switch";
import RolePermissionsField from "@/components/roles/RolePermissionsField";
import Button from "@/components/ui/button/Button";
import ButtonLink from "@/components/ui/button/ButtonLink";
import { isApiError } from "@/lib/api/types";
import { roleService } from "@/lib/roles/service";
import {
  ROLE_NAME_HINT,
  ROLE_NAME_PATTERN,
  type Role,
} from "@/lib/roles/types";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

type RoleFormProps = {
  /** Omitted when creating a new role. */
  role?: Role;
};

const NAME_MAX_LENGTH = 100;
const DESCRIPTION_MAX_LENGTH = 255;

type FieldErrors = {
  name?: string;
  description?: string;
};

function validate(name: string, description: string): FieldErrors {
  const errors: FieldErrors = {};
  const trimmedName = name.trim().toLowerCase();

  if (!trimmedName) {
    errors.name = "Name is required.";
  } else if (trimmedName.length < 3) {
    errors.name = "Name must be at least 3 characters long.";
  } else if (trimmedName.length > NAME_MAX_LENGTH) {
    errors.name = `Name must be at most ${NAME_MAX_LENGTH} characters long.`;
  } else if (!ROLE_NAME_PATTERN.test(trimmedName)) {
    errors.name = ROLE_NAME_HINT;
  }

  if (description.trim().length > DESCRIPTION_MAX_LENGTH) {
    errors.description = `Description must be at most ${DESCRIPTION_MAX_LENGTH} characters long.`;
  }

  return errors;
}

export default function RoleForm({ role }: RoleFormProps) {
  const router = useRouter();
  const isEditing = role !== undefined;

  const [name, setName] = useState(role?.name ?? "");
  const [description, setDescription] = useState(role?.description ?? "");
  const [isActive, setIsActive] = useState(role?.isActive ?? true);
  const [permissionIds, setPermissionIds] = useState<string[]>(
    role?.permissions?.map((permission) => permission.id) ?? [],
  );
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isSubmitting) return;

    const errors = validate(name, description);
    setFieldErrors(errors);
    setFormError("");

    if (Object.keys(errors).length > 0) return;

    setIsSubmitting(true);

    const input = {
      name: name.trim().toLowerCase(),
      // An empty field clears the stored description.
      description: description.trim() || null,
      isActive,
      // Always sent, so unchecking a permission revokes it.
      permissionIds,
    };

    try {
      if (isEditing) {
        await roleService.update(role.id, input);
      } else {
        await roleService.create(input);
      }

      router.push(`/roles?notice=${isEditing ? "updated" : "created"}`);
    } catch (error) {
      setFormError(
        isApiError(error)
          ? error.message
          : "Unable to save this role. Please try again.",
      );
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-6">
      <div>
        <Label htmlFor="role-name">
          Name <span className="text-error-500">*</span>
        </Label>
        <Input
          id="role-name"
          name="name"
          placeholder="content_editor"
          value={name}
          onChange={(event) => setName(event.target.value)}
          error={Boolean(fieldErrors.name)}
          hint={fieldErrors.name ?? ROLE_NAME_HINT}
          maxLength={NAME_MAX_LENGTH}
          autoComplete="off"
          required
        />
      </div>

      <div>
        <Label htmlFor="role-description">Description</Label>
        <TextArea
          id="role-description"
          value={description}
          onChange={setDescription}
          rows={4}
          placeholder="What is this role for?"
          error={Boolean(fieldErrors.description)}
          hint={
            fieldErrors.description ??
            `Optional. ${description.trim().length}/${DESCRIPTION_MAX_LENGTH} characters.`
          }
        />
      </div>

      <div>
        <Label>Status</Label>
        <Switch
          label={isActive ? "Active" : "Deactivated"}
          defaultChecked={isActive}
          onChange={setIsActive}
        />
        <p className="mt-1.5 text-xs text-gray-500">
          Deactivated roles keep their assignments but are meant to be filtered out
          when granting access.
        </p>
      </div>

      <div>
        <Label>Permissions</Label>
        <RolePermissionsField
          selectedIds={permissionIds}
          onChange={setPermissionIds}
          disabled={isSubmitting}
        />
      </div>

      {formError && (
        <p
          className="rounded-lg bg-error-50 p-3 text-sm text-error-600 dark:bg-error-500/15 dark:text-error-400"
          role="alert"
        >
          {formError}
        </p>
      )}

      <div className="flex flex-col-reverse gap-3 sm:flex-row">
        <ButtonLink href="/roles" size="sm" variant="outline">
          Cancel
        </ButtonLink>
        <Button size="sm" type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Saving..." : isEditing ? "Save changes" : "Create role"}
        </Button>
      </div>
    </form>
  );
}
