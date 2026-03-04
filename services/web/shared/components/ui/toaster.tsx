"use client";

import { Toaster as SonnerToaster } from "sonner";

export const Toaster = () => {
  return (
    <SonnerToaster
      position="bottom-right"
      toastOptions={{
        classNames: {
          toast:
            "bg-card border-border shadow-card rounded-lg font-body text-sm",
          title: "text-foreground font-medium",
          description: "text-foreground-soft",
          success: "border-success/30 bg-success/10",
          error: "border-status-danger/30 bg-status-danger/10",
          warning: "border-warning/30 bg-warning/10",
          info: "border-info/30 bg-info/10",
        },
      }}
    />
  );
};
