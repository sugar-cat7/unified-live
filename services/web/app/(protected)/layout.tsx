import type { ReactNode } from "react";
import { AuthGuard } from "../../shared/components/containers/AuthGuard";

export default function ProtectedLayout({ children }: { children: ReactNode }) {
  return <AuthGuard>{children}</AuthGuard>;
}
