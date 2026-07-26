"use client";

import Label from "@/components/form/Label";
import Input from "@/components/form/input/InputField";
import TextArea from "@/components/form/input/TextArea";
import Button from "@/components/ui/button/Button";
import ButtonLink from "@/components/ui/button/ButtonLink";
import { toErrorMessage } from "@/lib/api/types";
import { permissionService } from "@/lib/permissions/service";
import {
  PERMISSION_NAME_HINT,
  PERMISSION_NAME_PATTERN,
  type Permission,
} from "@/lib/permissions/types";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

type PermissionFormProps = {
  /** Omitted when creating a new permission. */
  permission?: Permission;
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
  } else if (!PERMISSION_NAME_PATTERN.test(trimmedName)) {
    errors.name = PERMISSION_NAME_HINT;
  }

  if (description.trim().length > DESCRIPTION_MAX_LENGTH) {
    errors.description = `Description must be at most ${DESCRIPTION_MAX_LENGTH} characters long.`;
  }

  return errors;
}

export default function PermissionForm({ permission }: PermissionFormProps) {
  const router = useRouter();
  const isEditing = permission !== undefined;

  const [name, setName] = useState(permission?.name ?? "");
  const [description, setDescription] = useState(permission?.description ?? "");
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
    };

    try {
      if (isEditing) {
        await permissionService.update(permission.id, input);
      } else {
        await permissionService.create(input);
      }

      router.push(`/permissions?notice=${isEditing ? "updated" : "created"}`);
    } catch (error) {
      setFormError(
        toErrorMessage(error, "Unable to save this permission. Please try again."),
      );
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-6">
      <div>
        <Label htmlFor="permission-name">
          Name <span className="text-error-500">*</span>
        </Label>
        <Input
          id="permission-name"
          name="name"
          placeholder="users.read"
          value={name}
          onChange={(event) => setName(event.target.value)}
          error={Boolean(fieldErrors.name)}
          hint={fieldErrors.name ?? PERMISSION_NAME_HINT}
          maxLength={NAME_MAX_LENGTH}
          autoComplete="off"
          required
        />
      </div>

      <div>
        <Label htmlFor="permission-description">Description</Label>
        <TextArea
          id="permission-description"
          value={description}
          onChange={setDescription}
          rows={4}
          placeholder="What does this permission allow?"
          error={Boolean(fieldErrors.description)}
          hint={
            fieldErrors.description ??
            `Optional. ${description.trim().length}/${DESCRIPTION_MAX_LENGTH} characters.`
          }
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
        <ButtonLink href="/permissions" size="sm" variant="outline">
          Cancel
        </ButtonLink>
        <Button size="sm" type="submit" disabled={isSubmitting}>
          {isSubmitting
            ? "Saving..."
            : isEditing
            ? "Save changes"
            : "Create permission"}
        </Button>
      </div>
    </form>
  );
}
