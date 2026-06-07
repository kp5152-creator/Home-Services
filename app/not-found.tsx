import { ButtonLink, Panel } from "@/components/ui";

export default function NotFound() {
  return (
    <main className="grid min-h-screen place-items-center bg-ink px-4 py-10 text-cream">
      <Panel tone="paper" className="w-full max-w-xl p-6 text-center sm:p-8">
        <p className="type-eyebrow text-gold">EstateIQ</p>
        <h1 className="mt-3 font-serif text-3xl font-semibold leading-tight text-ink sm:text-4xl">
          This page is not available.
        </h1>
        <p className="mx-auto mt-4 max-w-md text-sm leading-6 text-slate-600">
          The link may have changed, or the report may no longer be available. Return to EstateIQ and choose the
          property or report again.
        </p>
        <div className="mt-6 grid gap-3 sm:grid-cols-3">
          <ButtonLink href="/" className="w-full">
            Home
          </ButtonLink>
          <ButtonLink href="/demo" variant="soft" className="w-full">
            App
          </ButtonLink>
          <ButtonLink href="/api/health" variant="ghost" className="w-full">
            Health
          </ButtonLink>
        </div>
      </Panel>
    </main>
  );
}
