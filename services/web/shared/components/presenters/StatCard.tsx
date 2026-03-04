import type { ReactNode } from "react";

type Props = {
  label: string;
  value: string | number;
  icon?: ReactNode;
  description?: string;
};

export const StatCard = ({ label, value, icon, description }: Props) => {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="flex items-center gap-3">
        {icon && (
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
            {icon}
          </div>
        )}
        <div className="flex-1">
          <p className="text-muted-foreground text-sm">{label}</p>
          <p className="font-bold text-2xl">{value}</p>
          {description && (
            <p className="mt-1 text-muted-foreground text-xs">{description}</p>
          )}
        </div>
      </div>
    </div>
  );
};
