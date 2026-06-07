"use client";

import { useEffect } from "react";
import { Button, ButtonLink, Panel } from "@/components/ui";

type RouteRecoveryAction = {
  href: string;
  label: string;
  variant?: "soft" | "ghost";
};

export function RouteRecovery({
  error,
  reset,
  logLabel,
  eyebrow,
  title,
  description,
  actions
}: {
  error: Error & { digest?: string };
  reset: () => void;
  logLabel: string;
  eyebrow: string;
  title: string;
  description: string;
  actions: RouteRecoveryAction[];
}) {
  useEffect(() => {
    console.error(logLabel, error);
  }, [error, logLabel]);

  return (
    <main className="grid min-h-screen place-items-center bg-ink px-4 py-10 text-cream">
      <Panel tone="paper" className="w-full max-w-xl p-6 text-center sm:p-8">
        <p className="type-eyebrow text-gold">{eyebrow}</p>
        <h1 className="mt-3 font-serif text-3xl font-semibold leading-tight text-ink sm:text-4xl">{title}</h1>
        <p className="mx-auto mt-4 max-w-md text-sm leading-6 text-slate-600">{description}</p>
        {error.digest ? (
          <p className="mt-4 rounded-lg border border-gold/20 bg-[#eae4d8] px-3 py-2 text-xs font-extrabold text-ink">
            Support code: {error.digest}
          </p>
        ) : null}
        <div className="mt-6 grid gap-3 sm:grid-cols-3">
          <Button type="button" onClick={reset} className="w-full">
            Try Again
          </Button>
          {actions.map((action) => (
            <ButtonLink key={`${action.href}-${action.label}`} href={action.href} variant={action.variant ?? "soft"} className="w-full">
              {action.label}
            </ButtonLink>
          ))}
        </div>
      </Panel>
    </main>
  );
}
