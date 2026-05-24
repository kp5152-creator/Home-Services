import { notFound } from "next/navigation";
import ReportPageActions from "@/components/ReportPageActions";
import { getInspectionType, groupChecklistItems, visibleChecklistItems } from "@/lib/checklists";
import { readDatabase } from "@/lib/db";

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
  const inspection = database.inspections.find((item) => item.id === inspectionId);
  const property = database.properties.find((item) => item.id === inspection?.propertyId);

  if (!inspection || !property) {
    notFound();
  }

  return (
    <main className="mx-auto min-h-screen max-w-4xl bg-white px-5 py-6 text-ink sm:px-8 print:p-0">
      <section className="no-print mb-6 rounded-lg border border-line bg-paper p-4">
        <ReportPageActions pdfUrl={`/api/reports/${inspection.id}`} />
      </section>

      <article className="rounded-lg border border-line p-6 print:border-0 print:p-0">
        <p className="mb-2 text-xs font-extrabold uppercase tracking-[0.1em] text-clay">
          Coachella Valley Home Watch
        </p>
        <h1 className="text-3xl font-extrabold">Homeowner Inspection Report</h1>
        <p className="mt-2 text-slate-600">
          {property.name} / {property.owner}
        </p>
        <p className="text-slate-600">{property.address}</p>

        <div className="mt-6 grid gap-3 border-y border-line py-4 sm:grid-cols-2">
          <ReportField label="Date" value={formatDateTime(inspection.timestamp)} />
          <ReportField label="Inspection Type" value={getInspectionType(inspection.checklist)} />
          <ReportField label="Inspector" value={inspection.inspectorName} />
          <ReportField label="Interior Temperature" value={`${inspection.interiorTemperature} F`} />
          <ReportField label="Urgent Issue" value={inspection.urgent} urgent={inspection.urgent === "Yes"} />
        </div>

        <section className="mt-6">
          <h2 className="mb-3 text-sm font-extrabold uppercase">Completed Checks</h2>
          {visibleChecklistItems(inspection.checklist).length ? (
            <div className="grid gap-5">
              {groupChecklistItems(inspection.checklist).map((section) =>
                section.items.length ? (
                  <section key={section.title}>
                    <h3 className="mb-2 text-xs font-black uppercase tracking-[0.08em] text-clay">{section.title}</h3>
                    <ul className="grid gap-2">
                      {section.items.map((item) => (
                        <li key={item} className="rounded-lg border border-line bg-[#fbfcfb] px-3 py-2">
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
          <h2 className="mb-3 text-sm font-extrabold uppercase">Notes / Issues</h2>
          <p className="leading-7">{inspection.notes || "No issues were noted during this visit."}</p>
        </section>

        {inspection.photos.length ? (
          <section className="mt-8">
            <h2 className="mb-4 text-sm font-extrabold uppercase">Inspection Photos</h2>
            <div className="grid gap-6">
              {inspection.photos.map((photo) => (
                <figure key={photo.id} className="break-inside-avoid overflow-hidden rounded-lg border border-line">
                  <img src={photo.url} alt={photo.name} className="max-h-[680px] w-full bg-slate-100 object-contain" />
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

function ReportField({
  label,
  value,
  urgent = false
}: {
  label: string;
  value: string;
  urgent?: boolean;
}) {
  return (
    <div>
      <span className="block text-xs font-extrabold uppercase text-slate-500">{label}</span>
      <strong className={urgent ? "text-[#b93f35]" : ""}>{value}</strong>
    </div>
  );
}
