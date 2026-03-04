"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";
import { authClient } from "../../../shared/lib/auth-client";

export default function AuthCallbackPage() {
  const router = useRouter();
  const { data: session, isPending } = authClient.useSession();
  const hasHandled = useRef(false);

  useEffect(() => {
    if (isPending || hasHandled.current) return;

    if (!session) {
      router.replace("/");
      return;
    }

    hasHandled.current = true;

    // Authentication successful -> redirect to home
    router.replace("/");
  }, [session, isPending, router]);

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        <p className="text-muted-foreground text-sm">Signing in...</p>
      </div>
    </div>
  );
}
