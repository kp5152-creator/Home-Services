"use client";

import { RouteRecovery } from "@/components/RouteRecovery";

export default function RootError({
  error,
  reset
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <RouteRecovery
      error={error}
      reset={reset}
      logLabel="EstateIQ root route failed."
      eyebrow="EstateIQ recovery"
      title="EstateIQ needs a quick refresh."
      description="EstateIQ could not finish loading this view. Try again, return home, or check system health before continuing."
      actions={[
        { href: "/", label: "Home" },
        { href: "/api/health", label: "Health", variant: "ghost" }
      ]}
    />
  );
}
