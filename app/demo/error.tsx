"use client";

import { RouteRecovery } from "@/components/RouteRecovery";

export default function DemoError({
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
      logLabel="EstateIQ demo route failed."
      eyebrow="EstateIQ app recovery"
      title="The app needs a quick refresh."
      description="EstateIQ could not finish loading this app view. Your data is protected; try reloading the app or check system health before continuing."
      actions={[
        { href: "/", label: "Home" },
        { href: "/api/health", label: "Health", variant: "ghost" }
      ]}
    />
  );
}
