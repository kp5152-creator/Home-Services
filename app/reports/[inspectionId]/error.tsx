"use client";

import { RouteRecovery } from "@/components/RouteRecovery";

export default function ReportError({
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
      logLabel="EstateIQ report route failed."
      eyebrow="EstateIQ report recovery"
      title="The report needs a quick refresh."
      description="EstateIQ could not finish loading this report view. Try again, return to the app, or check system health."
      actions={[
        { href: "/demo", label: "App" },
        { href: "/api/health", label: "Health", variant: "ghost" }
      ]}
    />
  );
}
