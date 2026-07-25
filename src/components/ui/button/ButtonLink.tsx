import Link from "next/link";
import React, { ReactNode } from "react";

interface ButtonLinkProps {
  href: string;
  children: ReactNode;
  size?: "sm" | "md";
  variant?: "primary" | "outline";
  startIcon?: ReactNode;
  endIcon?: ReactNode;
  className?: string;
}

/** Same look as `Button`, but renders a real link. A `<button>` inside an
 * `<a>` is invalid markup, so navigation actions use this instead. */
const ButtonLink: React.FC<ButtonLinkProps> = ({
  href,
  children,
  size = "md",
  variant = "primary",
  startIcon,
  endIcon,
  className = "",
}) => {
  const sizeClasses = {
    sm: "px-4 py-3 text-sm",
    md: "px-5 py-3.5 text-sm",
  };

  const variantClasses = {
    primary:
      "bg-brand-500 text-white shadow-theme-xs hover:bg-brand-600",
    outline:
      "bg-white text-gray-700 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-400 dark:ring-gray-700 dark:hover:bg-white/[0.03] dark:hover:text-gray-300",
  };

  return (
    <Link
      href={href}
      className={`inline-flex items-center justify-center gap-2 rounded-lg font-medium transition ${className} ${sizeClasses[size]} ${variantClasses[variant]}`}
    >
      {startIcon && <span className="flex items-center">{startIcon}</span>}
      {children}
      {endIcon && <span className="flex items-center">{endIcon}</span>}
    </Link>
  );
};

export default ButtonLink;
