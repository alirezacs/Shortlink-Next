import ButtonLink from "@/components/ui/button/ButtonLink";
import { LockIcon } from "@/icons";
import type { ReactNode } from "react";

type ForbiddenProps = {
  title?: string;
  description?: ReactNode;
  /** Hidden when the account cannot reach the dashboard either. */
  showHomeLink?: boolean;
};

/**
 * The 403 state, shown in place of a page the account may not open.
 *
 * Deliberately rendered inside the dashboard shell rather than as a standalone
 * route: the user is signed in, so keeping the header and sidebar lets them go
 * somewhere they *are* allowed instead of hitting a dead end. It is also the
 * reason this is not a redirect — the URL stays put, so a refresh or a shared
 * link behaves the same way.
 */
export default function Forbidden({
  title = "You do not have access to this page",
  description = "Your account is missing the permission this page requires. Ask an administrator to grant it if you need access.",
  showHomeLink = true,
}: ForbiddenProps) {
  return (
    <div className="flex min-h-[60vh] items-center justify-center px-4">
      <div
        className="w-full max-w-md rounded-2xl border border-gray-200 bg-white p-8 text-center dark:border-gray-800 dark:bg-white/[0.03]"
        role="alert"
      >
        <span className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-error-50 text-error-500 dark:bg-error-500/15">
          <LockIcon className="h-6 w-6" />
        </span>

        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-error-500">
          Error 403
        </p>

        <h2 className="mb-3 text-xl font-semibold text-gray-800 dark:text-white/90">
          {title}
        </h2>

        <p className="text-sm text-gray-500 dark:text-gray-400">{description}</p>

        {showHomeLink && (
          <div className="mt-6 flex justify-center">
            <ButtonLink href="/" size="sm" variant="outline">
              Back to dashboard
            </ButtonLink>
          </div>
        )}
      </div>
    </div>
  );
}
