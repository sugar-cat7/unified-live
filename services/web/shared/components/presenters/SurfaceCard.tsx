import { cva, type VariantProps } from "class-variance-authority";
import * as React from "react";

import { cn } from "../../lib/cn";
import { Card } from "../ui/card";

const surfaceCardVariants = cva("p-5", {
  variants: {
    tone: {
      glass: "bg-card/75 border-border/70 backdrop-blur shadow-card",
      soft: "bg-info-soft border-border/50",
      ink: "bg-primary text-primary-foreground border-primary/60",
    },
  },
  defaultVariants: {
    tone: "glass",
  },
});

type SurfaceCardProps = React.HTMLAttributes<HTMLDivElement> &
  VariantProps<typeof surfaceCardVariants>;

export const SurfaceCard = React.forwardRef<HTMLDivElement, SurfaceCardProps>(
  ({ tone, className, children, ...props }, ref) => {
    return (
      <Card
        ref={ref}
        className={cn(surfaceCardVariants({ tone }), className)}
        {...props}
      >
        {children}
      </Card>
    );
  },
);

SurfaceCard.displayName = "SurfaceCard";
