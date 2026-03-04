import { cva, type VariantProps } from "class-variance-authority";
import * as React from "react";

import { cn } from "../../lib/cn";

const selectVariants = cva(
  "flex h-11 w-full appearance-none rounded-2xl border bg-card px-4 py-3 text-sm transition duration-fast ease-standard focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "border-border",
        error: "border-status-danger focus-visible:ring-status-danger",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

type SelectProps = React.SelectHTMLAttributes<HTMLSelectElement> &
  VariantProps<typeof selectVariants>;

const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  (
    { className, variant, children, "aria-invalid": ariaInvalid, ...props },
    ref,
  ) => {
    return (
      <div className="relative">
        <select
          ref={ref}
          aria-invalid={ariaInvalid ?? (variant === "error" ? true : undefined)}
          className={cn(selectVariants({ variant }), "pr-10", className)}
          {...props}
        >
          {children}
        </select>
        <div className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-muted-foreground"
            aria-hidden="true"
          >
            <path d="m6 9 6 6 6-6" />
          </svg>
        </div>
      </div>
    );
  },
);

Select.displayName = "Select";

export { Select };
