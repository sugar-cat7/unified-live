import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import * as React from "react";

import { cn } from "../../lib/cn";

const buttonVariants = cva(
  "inline-flex min-h-size-touch-target min-w-size-touch-target cursor-pointer items-center justify-center gap-2 rounded-full font-semibold transition duration-fast ease-standard active:scale-scale-pressed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-60",
  {
    variants: {
      variant: {
        primary:
          "bg-primary text-primary-foreground shadow-action hover:-translate-y-0.5 hover:shadow-action-hover active:translate-y-0 active:shadow-action-pressed",
        secondary:
          "bg-card/80 text-foreground-soft border border-border hover:bg-card hover:border-primary/30 active:bg-card/60",
        ghost:
          "bg-transparent text-foreground-soft hover:bg-card/80 hover:text-foreground active:bg-card/40 border border-transparent",
        destructive:
          "bg-status-danger text-white hover:bg-status-danger/90 active:bg-status-danger/80",
      },
      size: {
        sm: "px-4 py-2 text-xs",
        md: "px-5 py-2.5 text-sm",
        lg: "px-6 py-3 text-sm",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
    },
  },
);

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
  };

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";

    return (
      <Comp
        ref={ref}
        className={cn(buttonVariants({ variant, size }), className)}
        {...props}
      />
    );
  },
);

Button.displayName = "Button";

export { Button };
