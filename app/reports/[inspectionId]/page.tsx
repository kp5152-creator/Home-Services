import { notFound } from "next/navigation";
import ReportPageActions from "@/components/ReportPageActions";
import { Panel } from "@/components/ui";
import { getInspectionType, groupChecklistItems, visibleChecklistItems } from "@/utils/checklists";
import { readDatabase } from "@/services/database";
import { demoDatabase } from "@/reports/demoData";

export const dynamic = "force-dynamic";

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit"
  }).format(new Date(value));
}

export default async function ReportPage({
  params
}: {
  params: Promise<{ inspectionId: string }>;
}) {
  const { inspectionId } = await params;
  const database = await readDatabase();
  const inspection =
    database.inspections.find((item) => item.id === inspectionId) ??
    demoDatabase.inspections.find((item) => item.id === inspectionId);
  const property =
    database.properties.find((item) => item.id === inspection?.propertyId) ??
    demoDatabase.properties.find((item) => item.id === inspection?.propertyId);

  if (!inspection || !property) {
    notFound();
  }

  const status = reportConditionStatus(inspection);

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(212,175,55,0.14),transparent_28rem),linear-gradient(180deg,#252525,#1f1f1f)] px-5 py-6 text-cream sm:px-8 print:bg-white print:p-0 print:text-ink">
      <Panel tone="ink" className="no-print mx-auto mb-6 max-w-4xl p-4">
        <ReportPageActions pdfUrl={`/api/reports/${inspection.id}`} />
      </Panel>

      <article className="mx-auto max-w-4xl rounded-lg border border-gold/25 bg-cream p-5 text-ink shadow-estate sm:p-7 print:border-0 print:bg-white print:p-0 print:shadow-none">
        <header className="border-b border-gold/25 pb-5">
          <p className="type-eyebrow">EstateIQ</p>
          <h1 className="mt-3 font-serif text-4xl font-semibold leading-tight text-ink sm:text-5xl">
            Homeowner Packet
          </h1>
          <p className="mt-3 text-sm leading-6 text-slate-600">
            {property.name} / {property.owner} · {property.address}
          </p>
        </header>

        {property.photoUrl ? (
          <figure className="mx-auto mt-6 w-full max-w-2xl overflow-hidden rounded-lg border border-gold/25 bg-[#252525] shadow-lift">
            <img
              src={property.photoUrl}
              alt={property.name}
              className="aspect-[16/9] w-full object-cover"
            />
          </figure>
        ) : null}

        <div className="mt-6 overflow-hidden rounded-lg border border-gold/25 bg-[#252525] text-cream shadow-soft">
          <div className="grid gap-0 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
            <section className="border-b border-white/10 p-4 lg:border-b-0 lg:border-r">
              <span className="type-eyebrow text-gold">Property Status</span>
              <strong className="mt-2 block font-serif text-2xl font-semibold leading-tight text-white">
                {status.label}
              </strong>
              <p className="mt-2 text-sm leading-6 text-[#d8d0c2]">{status.description}</p>
            </section>
            <dl className="grid grid-cols-2 gap-px bg-white/10 text-sm">
              <ReportMeta label="Date" value={formatDateTime(inspection.timestamp)} />
              <ReportMeta label="Type" value={getInspectionType(inspection.checklist)} />
              <ReportMeta label="Inspector" value={inspection.inspectorName} />
              <ReportMeta label="Temp" value={`${inspection.interiorTemperature} F`} />
              <ReportMeta
                label="Urgent"
                value={inspection.urgent}
                urgent={inspection.urgent === "Yes"}
              />
              <ReportMeta label="Photos" value={String(inspection.photos.length)} />
            </dl>
          </div>
        </div>

        {inspection.executiveSummary ? (
          <Panel tone="paper" className="mt-6 p-4">
            <h2 className="mb-3 font-serif text-2xl font-semibold leading-tight text-ink">Executive Summary</h2>
            <p className="leading-7">{inspection.executiveSummary}</p>
          </Panel>
        ) : null}

        <section className="mt-6">
          <h2 className="mb-3 font-serif text-2xl font-semibold leading-tight text-ink">Completed Checks</h2>
          {visibleChecklistItems(inspection.checklist).length ? (
            <div className="grid gap-5">
              {groupChecklistItems(inspection.checklist).map((section) =>
                section.items.length ? (
                  <section key={section.title}>
                    <h3 className="mb-2 text-xs font-black uppercase tracking-[0.08em] text-clay">{section.title}</h3>
                    <ul className="grid gap-2">
                      {section.items.map((item) => (
                        <li key={item} className="rounded-lg border border-gold/15 bg-white/60 px-3 py-2 text-sm leading-5">
                          {item}
                        </li>
                      ))}
                    </ul>
                  </section>
                ) : null
              )}
            </div>
          ) : (
            <p>No checklist items were marked complete.</p>
          )}
        </section>

        <section className="mt-6">
          <h2 className="mb-3 font-serif text-2xl font-semibold leading-tight text-ink">Notes / Issues</h2>
          <p className="leading-7">{inspection.notes || "No issues were noted during this visit."}</p>
        </section>

        {inspection.photos.length ? (
          <section className="mt-8">
            <h2 className="mb-4 font-serif text-2xl font-semibold leading-tight text-ink">Inspection Photos</h2>
            <div className="grid gap-6">
              {inspection.photos.map((photo) => (
                <figure key={photo.id} className="break-inside-avoid overflow-hidden rounded-lg border border-gold/20 bg-[#252525] shadow-soft">
                  <img src={photo.url} alt={photo.name} className="max-h-[680px] w-full bg-[#252525] object-contain" />
                  <figcaption className="border-t border-line px-3 py-2 text-sm text-slate-600">{photo.name}</figcaption>
                </figure>
              ))}
            </div>
          </section>
        ) : null}
      </article>
    </main>
  );
}

function ReportMeta({ label, value, urgent = false }: { label: string; value: string; urgent?: boolean }) {
  return (
    <div className="bg-[#252525] p-3">
      <dt className="text-[0.68rem] font-extrabold uppercase tracking-[0.08em] text-gold">{label}</dt>
      <dd className={`mt-1 truncate font-semibold ${urgent ? "text-[#f0b7ae]" : "text-cream"}`}>{value}</dd>
    </div>
  );
}

function reportConditionStatus(inspection: { urgent: string; checklist: string[] }) {
  if (inspection.urgent === "Yes") {
    return {
      label: "Attention Recommended",
      tone: "urgent" as const,
      description:
        "This report includes an urgent item that should be reviewed promptly by the homeowner or property manager."
    };
  }

  if (!visibleChecklistItems(inspection.checklist).length) {
    return {
      label: "Report Pending",
      tone: "normal" as const,
      description: "This report has been created, but no completed checklist items were recorded."
    };
  }

  return {
    label: "Property Stable",
    tone: "normal" as const,
    description: "This inspection indicates the property is stable with no urgent homeowner action flagged at this time."
  };
}
