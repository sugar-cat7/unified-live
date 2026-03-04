import { cva, type VariantProps } from "class-variance-authority";
import * as React from "react";

import { cn } from "../../lib/cn";

const badgeVariants = cva(
  "inline-flex items-center rounded-full px-3 py-1 text-2xs font-semibold",
  {
    variants: {
      tone: {
        coral: "bg-coral text-foreground-soft",
        beige: "bg-beige text-foreground-soft",
        amber: "bg-amber text-foreground-soft",
        ink: "bg-primary text-primary-foreground",
        mint: "bg-mint text-foreground-soft",
        sky: "bg-sky text-foreground-soft",
        lilac: "bg-lilac text-foreground-soft",
        /** Outlined pill style - replaces `.pill-outline` utility */
        outline: "border border-border bg-card/80 px-4 py-2 text-2xs",
      },
    },
    defaultVariants: {
      tone: "beige",
    },
  },
);

type BadgeProps = React.HTMLAttributes<HTMLSpanElement> &
  VariantProps<typeof badgeVariants>;

const Badge = React.forwardRef<HTMLSpanElement, BadgeProps>(
  ({ className, tone, ...props }, ref) => {
    return (
      <span
        ref={ref}
        className={cn(badgeVariants({ tone }), className)}
        {...props}
      />
    );
  },
);

Badge.displayName = "Badge";

export { Badge };
