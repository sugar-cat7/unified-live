import * as React from "react";

import { cn } from "../../lib/cn";

const Card = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => {
  return (
    <div
      ref={ref}
      className={cn(
        "rounded-3xl border border-border/70 bg-card text-card-foreground",
        className,
      )}
      {...props}
    />
  );
});

Card.displayName = "Card";

export { Card };
