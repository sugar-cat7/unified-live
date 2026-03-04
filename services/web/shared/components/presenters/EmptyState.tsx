import type { ReactNode } from "react";
import { ActionButton } from "./ActionButton";

type Props = {
  icon?: ReactNode;
  title: string;
  description?: string;
  actionLabel?: string;
  actionHref?: string;
  onAction?: () => void;
};

export const EmptyState = ({
  icon,
  title,
  description,
  actionLabel,
  actionHref,
  onAction,
}: Props) => {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      {icon && (
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted text-muted-foreground">
          {icon}
        </div>
      )}
      <h3 className="font-semibold text-lg">{title}</h3>
      {description && (
        <p className="mt-2 max-w-sm text-muted-foreground text-sm">
          {description}
        </p>
      )}
      {actionLabel && (actionHref || onAction) && (
        <div className="mt-6">
          <ActionButton
            href={actionHref}
            onClick={onAction}
            variant="primary"
            size="md"
          >
            {actionLabel}
          </ActionButton>
        </div>
      )}
    </div>
  );
};
