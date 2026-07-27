"use client";

import Label from "@/components/form/Label";
import Input from "@/components/form/input/InputField";
import Switch from "@/components/form/switch/Switch";
import UserRolesField from "@/components/users/UserRolesField";
import Button from "@/components/ui/button/Button";
import ButtonLink from "@/components/ui/button/ButtonLink";
import { EyeCloseIcon, EyeIcon } from "@/icons";
import { toErrorMessage } from "@/lib/api/types";
import { userService } from "@/lib/users/service";
import {
  EMAIL_PATTERN,
  PASSWORD_HINT,
  PASSWORD_MIN_LENGTH,
  type User,
  type UserInput,
} from "@/lib/users/types";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

type UserFormProps = {
  /** Omitted when creating a new account. */
  user?: User;
};

const NAME_MAX_LENGTH = 100;
const EMAIL_MAX_LENGTH = 255;

type FieldErrors = {
  firstName?: string;
  lastName?: string;
  email?: string;
  password?: string;
};

type FormValues = {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
};

/**
 * `isEditing` decides how the password is read: required when creating an
 * account, optional when editing one, where a blank field means "keep the
 * stored password" rather than "no password".
 */
function validate(values: FormValues, isEditing: boolean): FieldErrors {
  const errors: FieldErrors = {};
  const firstName = values.firstName.trim();
  const lastName = values.lastName.trim();
  const email = values.email.trim();

  if (!firstName) {
    errors.firstName = "First name is required.";
  } else if (firstName.length > NAME_MAX_LENGTH) {
    errors.firstName = `First name must be at most ${NAME_MAX_LENGTH} characters long.`;
  }

  if (!lastName) {
    errors.lastName = "Last name is required.";
  } else if (lastName.length > NAME_MAX_LENGTH) {
    errors.lastName = `Last name must be at most ${NAME_MAX_LENGTH} characters long.`;
  }

  if (!email) {
    errors.email = "Email is required.";
  } else if (email.length > EMAIL_MAX_LENGTH) {
    errors.email = `Email must be at most ${EMAIL_MAX_LENGTH} characters long.`;
  } else if (!EMAIL_PATTERN.test(email)) {
    errors.email = "Enter a valid email address.";
  }

  if (!isEditing && !values.password) {
    errors.password = "Password is required.";
  } else if (values.password && values.password.length < PASSWORD_MIN_LENGTH) {
    errors.password = `Password must be at least ${PASSWORD_MIN_LENGTH} characters long.`;
  }

  return errors;
}

export default function UserForm({ user }: UserFormProps) {
  const router = useRouter();
  const isEditing = user !== undefined;

  const [values, setValues] = useState<FormValues>({
    firstName: user?.firstName ?? "",
    lastName: user?.lastName ?? "",
    email: user?.email ?? "",
    password: "",
  });
  const [isActive, setIsActive] = useState(user?.isActive ?? true);
  const [isEmailVerified, setIsEmailVerified] = useState(
    user?.isEmailVerified ?? false,
  );
  const [roleIds, setRoleIds] = useState<string[]>(
    user?.roles?.map((role) => role.id) ?? [],
  );
  const [showPassword, setShowPassword] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const setValue = (field: keyof FormValues, value: string) =>
    setValues((current) => ({ ...current, [field]: value }));

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isSubmitting) return;

    const errors = validate(values, isEditing);
    setFieldErrors(errors);
    setFormError("");

    if (Object.keys(errors).length > 0) return;

    setIsSubmitting(true);

    const input: UserInput = {
      firstName: values.firstName.trim(),
      lastName: values.lastName.trim(),
      email: values.email.trim().toLowerCase(),
      isActive,
      isEmailVerified,
      // Always sent, so unchecking a role revokes it.
      roleIds,
    };

    try {
      if (isEditing) {
        // The field is left out entirely unless somebody typed a new password,
        // which is what makes the API keep the stored hash.
        await userService.update(user.id, {
          ...input,
          ...(values.password ? { password: values.password } : {}),
        });
      } else {
        await userService.create({ ...input, password: values.password });
      }

      router.push(`/users?notice=${isEditing ? "updated" : "created"}`);
    } catch (error) {
      setFormError(
        toErrorMessage(error, "Unable to save this user. Please try again."),
      );
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-6">
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <div>
          <Label htmlFor="user-first-name">
            First name <span className="text-error-500">*</span>
          </Label>
          <Input
            id="user-first-name"
            name="firstName"
            placeholder="Ada"
            value={values.firstName}
            onChange={(event) => setValue("firstName", event.target.value)}
            error={Boolean(fieldErrors.firstName)}
            hint={fieldErrors.firstName}
            maxLength={NAME_MAX_LENGTH}
            autoComplete="given-name"
            required
          />
        </div>

        <div>
          <Label htmlFor="user-last-name">
            Last name <span className="text-error-500">*</span>
          </Label>
          <Input
            id="user-last-name"
            name="lastName"
            placeholder="Lovelace"
            value={values.lastName}
            onChange={(event) => setValue("lastName", event.target.value)}
            error={Boolean(fieldErrors.lastName)}
            hint={fieldErrors.lastName}
            maxLength={NAME_MAX_LENGTH}
            autoComplete="family-name"
            required
          />
        </div>
      </div>

      <div>
        <Label htmlFor="user-email">
          Email <span className="text-error-500">*</span>
        </Label>
        <Input
          id="user-email"
          name="email"
          type="email"
          placeholder="ada.lovelace@example.com"
          value={values.email}
          onChange={(event) => setValue("email", event.target.value)}
          error={Boolean(fieldErrors.email)}
          hint={fieldErrors.email ?? "Used to sign in. Must be unique."}
          maxLength={EMAIL_MAX_LENGTH}
          autoComplete="off"
          required
        />
      </div>

      <div>
        <Label htmlFor="user-password">
          Password {!isEditing && <span className="text-error-500">*</span>}
        </Label>
        <div className="relative">
          <Input
            id="user-password"
            name="password"
            type={showPassword ? "text" : "password"}
            placeholder={isEditing ? "Leave blank to keep current" : "Enter a password"}
            value={values.password}
            onChange={(event) => setValue("password", event.target.value)}
            error={Boolean(fieldErrors.password)}
            hint={
              fieldErrors.password ??
              (isEditing
                ? `Leave blank to keep the current password. ${PASSWORD_HINT}`
                : PASSWORD_HINT)
            }
            className="pr-11"
            autoComplete="new-password"
            required={!isEditing}
          />
          <button
            type="button"
            onClick={() => setShowPassword((visible) => !visible)}
            aria-label={showPassword ? "Hide password" : "Show password"}
            className="absolute right-4 top-[22px] -translate-y-1/2 cursor-pointer"
          >
            {showPassword ? (
              <EyeIcon className="fill-gray-500 dark:fill-gray-400" />
            ) : (
              <EyeCloseIcon className="fill-gray-500 dark:fill-gray-400" />
            )}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <div>
          <Label>Status</Label>
          <Switch
            label={isActive ? "Active" : "Deactivated"}
            defaultChecked={isActive}
            onChange={setIsActive}
          />
          <p className="mt-1.5 text-xs text-gray-500">
            Deactivated accounts keep their roles and assignments. Use it to mark
            accounts that should no longer be used.
          </p>
        </div>

        <div>
          <Label>Email verification</Label>
          <Switch
            label={isEmailVerified ? "Verified" : "Unverified"}
            defaultChecked={isEmailVerified}
            onChange={setIsEmailVerified}
          />
          <p className="mt-1.5 text-xs text-gray-500">
            Marks the address as confirmed without sending a verification email.
          </p>
        </div>
      </div>

      <div>
        <Label>Roles</Label>
        <UserRolesField
          selectedIds={roleIds}
          onChange={setRoleIds}
          disabled={isSubmitting}
        />
        <p className="mt-1.5 text-xs text-gray-500">
          An account receives every permission of every role it holds. Without a
          role it can sign in but do nothing.
        </p>
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
        <ButtonLink href="/users" size="sm" variant="outline">
          Cancel
        </ButtonLink>
        <Button size="sm" type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Saving..." : isEditing ? "Save changes" : "Create user"}
        </Button>
      </div>
    </form>
  );
}
