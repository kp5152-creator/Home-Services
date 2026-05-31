import { notFound } from "next/navigation";
import ReportPageActions from "@/components/ReportPageActions";
import { Panel } from "@/components/ui";
import { getInspectionType, groupChecklistItems, visibleChecklistItems } from "@/utils/checklists";
import { readDatabase } from "@/services/database";
import { demoDatabase } from "@/reports/demoData";
import type { Inspection, Property } from "@/utils/types";
import type { ReactNode } from "react";

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
    demoDatabase.properties.find((item) => item.id === inspection?.propertyId) ??
    fallbackPropertyForInspection(inspection);

  if (!inspection || !property) {
    notFound();
  }

  const status = reportConditionStatus(inspection);
  const checklistSections = groupChecklistItems(inspection.checklist).filter((section) => section.items.length);
  const completedChecks = visibleChecklistItems(inspection.checklist);
  const photoGroups = groupReportPhotos(inspection.photos);

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(212,175,55,0.14),transparent_28rem),linear-gradient(180deg,#252525,#1f1f1f)] px-4 py-5 text-cream sm:px-8 print:bg-white print:p-0 print:text-ink">
      <Panel tone="ink" className="no-print mx-auto mb-6 max-w-4xl p-4">
        <ReportPageActions pdfUrl={`/api/reports/${inspection.id}`} />
      </Panel>

      <article className="mx-auto max-w-5xl overflow-hidden rounded-lg border border-gold/25 bg-cream text-ink shadow-estate print:border-0 print:bg-white print:shadow-none">
        <header className="relative overflow-hidden bg-[#252525] text-cream">
          {property.photoUrl ? (
            <figure className="h-[24rem] bg-[#1f1f1f] sm:h-[28rem]">
              <img src={property.photoUrl} alt={property.name} className="h-full w-full object-cover" />
            </figure>
          ) : (
            <div className="h-[24rem] bg-[#1f1f1f] sm:h-[28rem]" />
          )}
          <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(31,31,31,0.92)_0%,rgba(31,31,31,0.72)_38%,rgba(31,31,31,0.22)_78%),linear-gradient(0deg,rgba(31,31,31,0.82)_0%,rgba(31,31,31,0)_46%)]" />
          <div className="absolute inset-0 flex flex-col justify-between p-6 sm:p-8">
            <div>
              <p className="type-eyebrow">EstateIQ</p>
              <h1 className="mt-4 max-w-2xl font-serif text-4xl font-semibold leading-tight text-white sm:text-5xl">
                Homeowner Visit Summary
              </h1>
              <p className="mt-4 max-w-xl text-sm leading-6 text-[#d8d0c2]">
                A concise record of property condition, completed checks, notes, and visit documentation.
              </p>
            </div>
            <div className="mt-8 border-t border-gold/25 pt-5">
              <h2 className="font-serif text-2xl font-semibold leading-tight text-white">{property.name}</h2>
              <p className="mt-2 text-sm leading-6 text-[#d8d0c2]">
                {property.owner} / {property.address}
              </p>
            </div>
          </div>
        </header>

        <div className="grid border-b border-gold/20 bg-[#2c2c2c] text-cream md:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)]">
          <section className="border-b border-gold/20 p-5 md:border-b-0 md:border-r">
            <span className="type-eyebrow">Property Status</span>
            <strong className="mt-2 block font-serif text-2xl font-semibold leading-tight text-white">
              {status.label}
            </strong>
            <p className="mt-2 text-sm leading-6 text-[#d8d0c2]">{status.description}</p>
          </section>
          <dl className="grid grid-cols-2 gap-px bg-gold/15 sm:grid-cols-3">
            <ReportMeta label="Date" value={formatDateTime(inspection.timestamp)} />
            <ReportMeta label="Type" value={getInspectionType(inspection.checklist)} />
            <ReportMeta label="Inspector" value={inspection.inspectorName || "Inspector"} />
            <ReportMeta label="Temp" value={`${inspection.interiorTemperature} F`} />
            <ReportMeta label="Urgent" value={inspection.urgent} urgent={inspection.urgent === "Yes"} />
            <ReportMeta label="Photos" value={String(inspection.photos.length)} />
          </dl>
        </div>

        <div className="grid gap-6 p-5 sm:p-7">
          {inspection.executiveSummary ? (
            <ReportSection eyebrow="Summary" title="Concierge Notes">
              <p className="max-w-3xl text-[0.98rem] leading-7 text-muted">{inspection.executiveSummary}</p>
            </ReportSection>
          ) : null}

          <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(280px,0.55fr)]">
            <ReportSection eyebrow="Completed" title="Inspection Checks">
              {completedChecks.length ? (
                <div className="grid gap-4">
                  {checklistSections.map((section) => (
                    <section key={section.title} className="rounded-lg border border-gold/15 bg-white/60 p-4">
                      <h3 className="text-xs font-black uppercase tracking-[0.08em] text-gold">{section.title}</h3>
                      <ul className="mt-3 grid gap-x-5 gap-y-2 text-sm leading-5 text-muted sm:grid-cols-2">
                        {section.items.map((item) => (
                          <li key={item} className="flex gap-2">
                            <span className="mt-[0.45rem] h-1.5 w-1.5 shrink-0 rounded-full bg-gold" />
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </section>
                  ))}
                </div>
              ) : (
                <p className="text-sm leading-6 text-muted">No checklist items were marked complete.</p>
              )}
            </ReportSection>

            <ReportSection eyebrow="Notes" title="Issues Found">
              <p className="text-sm leading-6 text-muted">
                {inspection.notes || "No issues were noted during this visit."}
              </p>
            </ReportSection>
          </div>

          {inspection.photos.length ? (
            <ReportSection eyebrow="Photos" title="Visit Documentation">
              <div className="grid gap-5">
                {photoGroups.map((group) => (
                  <section key={group.title}>
                    <div className="mb-3 flex items-center justify-between gap-3 border-b border-gold/20 pb-2">
                      <h3 className="font-serif text-xl font-semibold leading-tight text-ink">{group.title}</h3>
                      <span className="text-xs font-bold uppercase tracking-[0.08em] text-muted">
                        {group.photos.length} {group.photos.length === 1 ? "photo" : "photos"}
                      </span>
                    </div>
                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                      {group.photos.map((photo) => (
                        <a
                          key={photo.id}
                          href={photo.url}
                          target="_blank"
                          rel="noreferrer"
                          className="group overflow-hidden rounded-lg border border-gold/20 bg-[#252525] shadow-soft"
                        >
                          <img
                            src={photo.url}
                            alt={cleanReportPhotoName(photo.name)}
                            className="aspect-[4/3] w-full object-cover transition duration-300 group-hover:scale-[1.02]"
                          />
                        </a>
                      ))}
                    </div>
                  </section>
                ))}
              </div>
            </ReportSection>
          ) : null}

          <footer className="border-t border-gold/20 pt-5 text-xs leading-5 text-muted">
            EstateIQ records are intended to provide a clear operating snapshot for the homeowner and property team.
          </footer>
        </div>
      </article>
    </main>
  );
}

function ReportSection({
  eyebrow,
  title,
  children
}: {
  eyebrow: string;
  title: string;
  children: ReactNode;
}) {
  return (
    <section>
      <div className="mb-3">
        <p className="type-eyebrow">{eyebrow}</p>
        <h2 className="mt-1 font-serif text-2xl font-semibold leading-tight text-ink">{title}</h2>
      </div>
      {children}
    </section>
  );
}

function groupReportPhotos(photos: Inspection["photos"]) {
  const groups = [
    { title: "Exterior", photos: [] as Inspection["photos"] },
    { title: "Interior", photos: [] as Inspection["photos"] },
    { title: "Issues", photos: [] as Inspection["photos"] }
  ];

  photos.forEach((photo, index) => {
    if (photo.name.startsWith("Exterior__")) {
      groups[0].photos.push(photo);
      return;
    }
    if (photo.name.startsWith("Interior__")) {
      groups[1].photos.push(photo);
      return;
    }
    if (photo.name.startsWith("Issues__")) {
      groups[2].photos.push(photo);
      return;
    }

    groups[index % groups.length].photos.push(photo);
  });

  return groups.filter((group) => group.photos.length);
}

function cleanReportPhotoName(name: string) {
  return name.replace(/^(Exterior|Interior|Issues)__/, "");
}

function fallbackPropertyForInspection(inspection: Inspection | undefined): Property | undefined {
  if (!inspection) return undefined;

  const inferredName = (inspection.executiveSummary ?? "").match(/^(.+?) received /)?.[1]?.trim();

  return {
    id: inspection.propertyId,
    name: inferredName || "Saved Property",
    owner: "Homeowner",
    address: "Property details unavailable",
    phone: "",
    email: "",
    accessNotes: "",
    photoUrl: "",
    status: "Active"
  };
}

function ReportMeta({ label, value, urgent = false }: { label: string; value: string; urgent?: boolean }) {
  return (
    <div className="bg-[#252525] p-3">
      <dt className="text-[0.68rem] font-extrabold uppercase tracking-[0.08em] text-gold">{label}</dt>
      <dd className={`mt-1 text-sm font-semibold leading-5 ${urgent ? "text-[#f0b7ae]" : "text-cream"}`}>
        {value}
      </dd>
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
