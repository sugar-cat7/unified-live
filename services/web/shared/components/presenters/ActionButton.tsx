import Link from "next/link";
import type { ButtonHTMLAttributes } from "react";

import { Button } from "../ui/button";

type Variant = "primary" | "secondary" | "ghost" | "destructive";
type Size = "sm" | "md" | "lg";

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  href?: string;
  variant?: Variant;
  size?: Size;
};

export const ActionButton = ({
  href,
  variant = "primary",
  size = "md",
  children,
  ...props
}: Props) => {
  const { type = "button", ...rest } = props;

  if (href) {
    return (
      <Button asChild variant={variant} size={size} {...rest}>
        <Link href={href}>{children}</Link>
      </Button>
    );
  }

  return (
    <Button type={type} variant={variant} size={size} {...rest}>
      {children}
    </Button>
  );
};
