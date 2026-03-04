"use client";

import { useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { useEffect } from "react";
import { authClient } from "../../lib/auth-client";
import { FullPageSpinner } from "../ui/loading";

type AuthGuardProps = {
  children: ReactNode;
  fallback?: ReactNode;
};

export function AuthGuard({ children, fallback }: AuthGuardProps) {
  const router = useRouter();
  const { data: session, isPending } = authClient.useSession();

  useEffect(() => {
    if (!isPending && !session) {
      router.replace("/");
    }
  }, [isPending, session, router]);

  if (isPending) {
    return fallback ?? <FullPageSpinner />;
  }

  if (!session) {
    return null;
  }

  return <>{children}</>;
}
