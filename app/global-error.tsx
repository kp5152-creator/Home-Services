"use client";

import { RouteRecovery } from "@/components/RouteRecovery";
import "./globals.css";

export default function GlobalError({
  error,
  reset
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body className="font-sans antialiased">
        <RouteRecovery
          error={error}
          reset={reset}
          logLabel="EstateIQ global route failed."
          eyebrow="EstateIQ recovery"
          title="EstateIQ needs a quick refresh."
          description="EstateIQ could not finish loading the experience. Try again, return home, or check system health before continuing."
          actions={[
            { href: "/", label: "Home" },
            { href: "/api/health", label: "Health", variant: "ghost" }
          ]}
        />
      </body>
    </html>
  );
}
