import { cva, type VariantProps } from "class-variance-authority";
import * as React from "react";

import { cn } from "../../lib/cn";

const inputVariants = cva(
  "flex w-full rounded-2xl border bg-card px-4 py-3 text-sm transition duration-fast ease-standard file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50",
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

type InputProps = React.InputHTMLAttributes<HTMLInputElement> &
  VariantProps<typeof inputVariants>;

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    { className, variant, type, "aria-invalid": ariaInvalid, ...props },
    ref,
  ) => {
    return (
      <input
        type={type}
        ref={ref}
        aria-invalid={ariaInvalid ?? (variant === "error" ? true : undefined)}
        className={cn(inputVariants({ variant }), className)}
        {...props}
      />
    );
  },
);

Input.displayName = "Input";

export { Input };
