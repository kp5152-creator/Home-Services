import { Panel } from "@/components/ui";

export function RouteLoading({
  eyebrow,
  title,
  description
}: {
  eyebrow: string;
  title: string;
  description: string;
}) {
  return (
    <main className="grid min-h-screen place-items-center bg-ink px-4 py-10 text-cream">
      <Panel tone="paper" className="w-full max-w-xl p-6 text-center sm:p-8">
        <p className="type-eyebrow text-gold">{eyebrow}</p>
        <h1 className="mt-3 font-serif text-3xl font-semibold leading-tight text-ink sm:text-4xl">{title}</h1>
        <p className="mx-auto mt-4 max-w-md text-sm leading-6 text-slate-600">{description}</p>
        <div className="mx-auto mt-6 h-1.5 w-44 overflow-hidden rounded-full bg-[#eae4d8]">
          <div className="h-full w-1/2 animate-[estate-loading_1.35s_ease-in-out_infinite] rounded-full bg-gold" />
        </div>
      </Panel>
    </main>
  );
}
