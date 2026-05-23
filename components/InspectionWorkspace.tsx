"use client";

import { FormEvent, useMemo, useState } from "react";
import type { Database, Inspection, Property, UrgentStatus } from "@/lib/types";

const checklistItems = [
  "Entry and lock security verified",
  "Garage secured",
  "HVAC running and thermostat checked",
  "Refrigerator/freezer operational",
  "Plumbing fixtures and visible leaks checked",
  "Windows, sliders, and shades inspected",
  "Pool, spa, and exterior water features observed",
  "Landscape/irrigation observed",
  "Mail, packages, and exterior entry cleared"
];

type NewPropertyForm = {
  name: string;
  owner: string;
  address: string;
  phone: string;
  email: string;
  accessNotes: string;
};

type InspectionForm = {
  inspectorName: string;
  interiorTemperature: string;
  checklist: string[];
  notes: string;
  urgent: UrgentStatus;
  photoFiles: File[];
};

const emptyInspectionForm: InspectionForm = {
  inspectorName: "",
  interiorTemperature: "",
  checklist: [],
  notes: "",
  urgent: "No",
  photoFiles: []
};

const emptyPropertyForm: NewPropertyForm = {
  name: "",
  owner: "",
  address: "",
  phone: "",
  email: "",
  accessNotes: ""
};

function formatDateTime(value: string | Date) {
  const date = value instanceof Date ? value : new Date(value);
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit"
  }).format(date);
}

function formatShortDate(value: Date) {
  return new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric"
  }).format(value);
}

async function fileToPhotoUpload(file: File) {
  const imageUrl = URL.createObjectURL(file);

  try {
    const image = await loadImage(imageUrl);
    const canvas = document.createElement("canvas");
    const maxDimension = 1800;
    const scale = Math.min(1, maxDimension / Math.max(image.naturalWidth, image.naturalHeight));
    canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
    canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));

    const context = canvas.getContext("2d");
    if (!context) {
      throw new Error("Canvas is not available.");
    }

    context.drawImage(image, 0, 0, canvas.width, canvas.height);

    return {
      name: file.name.replace(/\.[^/.]+$/, ".jpg"),
      type: "image/jpeg",
      data: canvas.toDataURL("image/jpeg", 0.88)
    };
  } finally {
    URL.revokeObjectURL(imageUrl);
  }
}

function loadImage(url: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.addEventListener("load", () => resolve(image));
    image.addEventListener("error", () => reject(new Error("Photo could not be loaded.")));
    image.src = url;
  });
}

export default function InspectionWorkspace({
  initialDatabase
}: {
  initialDatabase: Database;
}) {
  const [properties, setProperties] = useState<Property[]>(initialDatabase.properties);
  const [inspections, setInspections] = useState<Inspection[]>(initialDatabase.inspections);
  const [selectedPropertyId, setSelectedPropertyId] = useState(initialDatabase.properties[0]?.id ?? "");
  const [activeReportId, setActiveReportId] = useState(initialDatabase.inspections[0]?.id ?? "");
  const [inspectionForm, setInspectionForm] = useState<InspectionForm>(emptyInspectionForm);
  const [propertyForm, setPropertyForm] = useState<NewPropertyForm>(emptyPropertyForm);
  const [showPropertyForm, setShowPropertyForm] = useState(false);
  const [now] = useState(() => new Date());

  const selectedProperty = useMemo(
    () => properties.find((property) => property.id === selectedPropertyId) ?? properties[0],
    [properties, selectedPropertyId]
  );

  const selectedInspections = useMemo(
    () => inspections.filter((inspection) => inspection.propertyId === selectedProperty?.id),
    [inspections, selectedProperty?.id]
  );

  const activeReport =
    selectedInspections.find((inspection) => inspection.id === activeReportId) ?? selectedInspections[0];

  async function saveInspection(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedProperty) return;

    let photos: Awaited<ReturnType<typeof fileToPhotoUpload>>[];

    try {
      photos = await Promise.all(inspectionForm.photoFiles.map(fileToPhotoUpload));
    } catch {
      window.alert("One or more photos could not be processed. Please try JPEG or PNG photos.");
      return;
    }

    const response = await fetch("/api/inspections", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...inspectionForm,
        photoFiles: undefined,
        photos,
        propertyId: selectedProperty.id
      })
    });

    const inspection = (await response.json()) as Inspection;
    setInspections((current) => [inspection, ...current]);
    setActiveReportId(inspection.id);
    setInspectionForm(emptyInspectionForm);
  }

  async function saveProperty(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const response = await fetch("/api/properties", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(propertyForm)
    });

    const property = (await response.json()) as Property;
    setProperties((current) => [property, ...current]);
    setSelectedPropertyId(property.id);
    setActiveReportId("");
    setPropertyForm(emptyPropertyForm);
    setShowPropertyForm(false);
  }

  async function deleteSelectedProperty(property: Property) {
    const inspectionCount = inspections.filter((inspection) => inspection.propertyId === property.id).length;
    const confirmed = window.confirm(
      `Delete ${property.name}? This will also remove ${inspectionCount} saved inspection${
        inspectionCount === 1 ? "" : "s"
      }.`
    );

    if (!confirmed) return;

    const response = await fetch(`/api/properties?id=${encodeURIComponent(property.id)}`, {
      method: "DELETE"
    });

    if (!response.ok) return;

    const database = (await response.json()) as Database;
    setProperties(database.properties);
    setInspections(database.inspections);
    setSelectedPropertyId(database.properties[0]?.id ?? "");
    setActiveReportId("");
  }

  function toggleChecklistItem(item: string) {
    setInspectionForm((current) => ({
      ...current,
      checklist: current.checklist.includes(item)
        ? current.checklist.filter((checklistItem) => checklistItem !== item)
        : [...current.checklist, item]
    }));
  }

  function addPhotoFiles(files: FileList | null) {
    setInspectionForm((current) => ({
      ...current,
      photoFiles: files ? [...current.photoFiles, ...Array.from(files)] : current.photoFiles
    }));
  }

  return (
    <main className="mx-auto min-h-screen w-full max-w-[1480px] p-3 sm:p-6">
      <section className="mb-5 flex min-h-32 flex-col justify-between gap-5 rounded-lg border border-line/90 bg-white/90 p-5 shadow-estate md:flex-row md:items-center md:p-7">
        <div>
          <p className="mb-2 text-xs font-extrabold uppercase tracking-[0.1em] text-clay">
            Coachella Valley Home Watch
          </p>
          <h1 className="text-4xl font-extrabold leading-none tracking-normal text-ink sm:text-6xl">
            Desert Estate Watch
          </h1>
        </div>
        <div className="rounded-lg border border-line bg-white px-5 py-4 text-left text-slate-600 md:min-w-48 md:text-right">
          <span className="block">{formatShortDate(now)}</span>
          <strong className="block text-2xl text-ink">
            {new Intl.DateTimeFormat("en-US", { hour: "numeric", minute: "2-digit" }).format(now)}
          </strong>
        </div>
      </section>

      <section className="grid gap-5 xl:grid-cols-[290px_minmax(0,1fr)_390px]">
        <aside className="no-print rounded-lg border border-line/90 bg-white/90 p-5 shadow-estate">
          <div className="mb-5 flex items-start justify-between gap-3">
            <div>
              <p className="mb-2 text-xs font-extrabold uppercase tracking-[0.1em] text-clay">
                Portfolio
              </p>
              <h2 className="text-xl font-extrabold text-ink">Properties</h2>
            </div>
            <button
              type="button"
              onClick={() => setShowPropertyForm(true)}
              className="grid h-11 w-11 place-items-center rounded-lg bg-ink text-2xl font-extrabold leading-none text-white"
              aria-label="Add property"
            >
              +
            </button>
          </div>

          <div className="grid gap-3">
            {properties.map((property) => {
              const count = inspections.filter((inspection) => inspection.propertyId === property.id).length;
              const active = property.id === selectedProperty?.id;

              return (
                <div
                  key={property.id}
                  className={`rounded-lg border bg-white p-4 text-left transition ${
                    active ? "border-sage shadow-[inset_4px_0_0_#6e8478]" : "border-line hover:border-sage"
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedPropertyId(property.id);
                      setActiveReportId("");
                    }}
                    className="block w-full text-left"
                  >
                    <strong className="block text-ink">{property.name}</strong>
                    <span className="mt-1 block text-sm text-slate-600">{property.owner}</span>
                    <span className="mt-1 block text-sm text-slate-600">
                      {count} saved inspection{count === 1 ? "" : "s"}
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => deleteSelectedProperty(property)}
                    className="mt-3 min-h-10 w-full rounded-lg border border-[#e7cbc4] bg-[#fff8f6] px-3 text-sm font-extrabold text-[#9f352e] transition hover:bg-[#ffecea]"
                  >
                    Delete Property
                  </button>
                </div>
              );
            })}
          </div>
        </aside>

        <section className="grid gap-5">
          <section className="rounded-lg border border-line/90 bg-white/90 p-5 shadow-estate">
            <div className="mb-5 flex items-start justify-between gap-3">
              <div>
                <p className="mb-2 text-xs font-extrabold uppercase tracking-[0.1em] text-clay">
                  Homeowner Profile
                </p>
                <h2 className="text-xl font-extrabold text-ink">{selectedProperty?.name}</h2>
              </div>
              <span className="rounded-full bg-[#e7eee9] px-3 py-2 text-xs font-extrabold text-sage-dark">
                {selectedProperty?.status}
              </span>
            </div>

            {selectedProperty ? (
              <div className="grid gap-3 md:grid-cols-2">
                <ProfileItem label="Homeowner" value={selectedProperty.owner} />
                <ProfileItem label="Address" value={selectedProperty.address} />
                <ProfileItem label="Phone" value={selectedProperty.phone || "Not provided"} />
                <ProfileItem label="Email" value={selectedProperty.email || "Not provided"} />
                <ProfileItem label="Access Notes" value={selectedProperty.accessNotes || "No special access notes."} />
              </div>
            ) : null}
          </section>

          <section className="no-print rounded-lg border border-line/90 bg-white/90 p-5 shadow-estate">
            <div className="mb-5 flex items-start justify-between gap-3">
              <div>
                <p className="mb-2 text-xs font-extrabold uppercase tracking-[0.1em] text-clay">
                  Inspection
                </p>
                <h2 className="text-xl font-extrabold text-ink">New Home Watch Visit</h2>
              </div>
              <span className="rounded-full bg-[#fff4d9] px-3 py-2 text-xs font-extrabold text-[#7b5426]">
                {formatDateTime(now)}
              </span>
            </div>

            <form className="grid gap-4" onSubmit={saveInspection}>
              <div className="grid gap-4 md:grid-cols-2">
                <label className="grid gap-2 text-sm font-extrabold text-ink">
                  Inspector name
                  <input
                    required
                    value={inspectionForm.inspectorName}
                    onChange={(event) =>
                      setInspectionForm((current) => ({ ...current, inspectorName: event.target.value }))
                    }
                    className="rounded-lg border border-line bg-white p-3 outline-none focus:border-sage focus:ring-4 focus:ring-sage/15"
                  />
                </label>
                <label className="grid gap-2 text-sm font-extrabold text-ink">
                  Interior temperature
                  <div className="grid grid-cols-[minmax(0,1fr)_46px] overflow-hidden rounded-lg border border-line bg-white focus-within:border-sage focus-within:ring-4 focus-within:ring-sage/15">
                    <input
                      required
                      inputMode="decimal"
                      placeholder="76"
                      value={inspectionForm.interiorTemperature}
                      onChange={(event) =>
                        setInspectionForm((current) => ({
                          ...current,
                          interiorTemperature: event.target.value
                        }))
                      }
                      className="border-0 p-3 outline-none"
                    />
                    <span className="grid place-items-center font-extrabold text-slate-600">F</span>
                  </div>
                </label>
              </div>

              <fieldset className="grid gap-3 rounded-lg border border-line p-4">
                <legend className="px-2 font-extrabold">Inspection checklist</legend>
                {checklistItems.map((item) => (
                  <label key={item} className="grid grid-cols-[22px_minmax(0,1fr)] items-center gap-2 font-semibold">
                    <input
                      type="checkbox"
                      checked={inspectionForm.checklist.includes(item)}
                      onChange={() => toggleChecklistItem(item)}
                      className="accent-sage-dark"
                    />
                    {item}
                  </label>
                ))}
              </fieldset>

              <div className="grid gap-4 md:grid-cols-3">
                {["Exterior photos", "Interior photos", "Issue photos"].map((label) => (
                  <label
                    key={label}
                    className="grid min-h-28 content-center gap-2 rounded-lg border border-dashed border-sage bg-[#f8faf8] p-4 text-sm font-extrabold"
                  >
                    {label}
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={(event) => addPhotoFiles(event.target.files)}
                      className="text-xs font-medium"
                    />
                  </label>
                ))}
              </div>
              {inspectionForm.photoFiles.length ? (
                <div className="rounded-lg border border-line bg-[#fbfcfb] p-3 text-sm text-slate-600">
                  <strong className="text-ink">{inspectionForm.photoFiles.length} photo selected</strong>
                  {inspectionForm.photoFiles.length === 1 ? "" : "s"}
                  <button
                    type="button"
                    onClick={() => setInspectionForm((current) => ({ ...current, photoFiles: [] }))}
                    className="ml-3 font-extrabold text-[#9f352e]"
                  >
                    Clear photos
                  </button>
                </div>
              ) : null}

              <label className="grid gap-2 text-sm font-extrabold text-ink">
                Notes / issues found
                <textarea
                  rows={5}
                  value={inspectionForm.notes}
                  onChange={(event) => setInspectionForm((current) => ({ ...current, notes: event.target.value }))}
                  placeholder="Record observations, maintenance needs, vendor recommendations, or owner follow-up."
                  className="rounded-lg border border-line bg-white p-3 outline-none focus:border-sage focus:ring-4 focus:ring-sage/15"
                />
              </label>

              <div className="grid gap-4 rounded-lg border border-line bg-[#fbfcfb] p-4 md:grid-cols-[minmax(0,1fr)_160px] md:items-center">
                <div>
                  <strong className="block text-lg">Urgent issue?</strong>
                  <span className="text-sm text-slate-600">
                    Flag reports that need immediate homeowner attention.
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2" role="radiogroup" aria-label="Urgent issue">
                  {(["No", "Yes"] as UrgentStatus[]).map((value) => (
                    <label
                      key={value}
                      className="flex min-h-11 items-center justify-center gap-2 rounded-lg border border-line bg-white font-extrabold"
                    >
                      <input
                        type="radio"
                        name="urgent"
                        checked={inspectionForm.urgent === value}
                        onChange={() => setInspectionForm((current) => ({ ...current, urgent: value }))}
                        className="accent-sage-dark"
                      />
                      {value}
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex flex-wrap justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setInspectionForm(emptyInspectionForm)}
                  className="min-h-11 flex-1 rounded-lg bg-[#edf1ee] px-5 font-extrabold text-ink sm:flex-none"
                >
                  Clear
                </button>
                <button
                  type="submit"
                  className="min-h-11 flex-1 rounded-lg bg-sage-dark px-5 font-extrabold text-white sm:flex-none"
                >
                  Generate Report
                </button>
              </div>
            </form>
          </section>
        </section>

        <aside className="rounded-lg border border-line/90 bg-white/90 p-5 shadow-estate">
          <div className="mb-5 flex items-start justify-between gap-3">
            <div>
              <p className="mb-2 text-xs font-extrabold uppercase tracking-[0.1em] text-clay">
                Homeowner Report
              </p>
              <h2 className="text-xl font-extrabold text-ink">Clean Summary</h2>
            </div>
            <div className="no-print flex flex-wrap justify-end gap-2">
              {activeReport ? (
                <a
                  href={`/reports/${activeReport.id}`}
                  className="grid min-h-10 place-items-center rounded-lg bg-sage-dark px-4 font-extrabold text-white"
                >
                  Export Report
                </a>
              ) : null}
              <button
                type="button"
                onClick={() => window.print()}
                className="min-h-10 rounded-lg bg-[#edf1ee] px-4 font-extrabold text-ink"
              >
                Print
              </button>
            </div>
          </div>

          <ReportCard property={selectedProperty} inspection={activeReport} />

          <div className="no-print mt-7">
            <p className="mb-2 text-xs font-extrabold uppercase tracking-[0.1em] text-clay">
              Inspection History
            </p>
            <h2 className="mb-4 text-xl font-extrabold text-ink">Saved Visits</h2>
            <div className="grid gap-3">
              {selectedInspections.length ? (
                selectedInspections.map((inspection) => (
                  <button
                    key={inspection.id}
                    type="button"
                    onClick={() => setActiveReportId(inspection.id)}
                    className="rounded-lg border border-line bg-white p-4 text-left hover:border-sage"
                  >
                    <strong className="block text-ink">{formatDateTime(inspection.timestamp)}</strong>
                    <span className="mt-1 block text-sm text-slate-600">
                      {inspection.inspectorName} / {inspection.interiorTemperature} F / Urgent: {inspection.urgent}
                    </span>
                  </button>
                ))
              ) : (
                <p className="text-sm text-slate-600">No saved inspections yet.</p>
              )}
            </div>
          </div>
        </aside>
      </section>

      {showPropertyForm ? (
        <div className="fixed inset-0 z-20 grid place-items-center bg-ink/45 p-4">
          <form className="grid w-full max-w-xl gap-4 rounded-lg bg-white p-5 shadow-estate" onSubmit={saveProperty}>
            <div>
              <p className="mb-2 text-xs font-extrabold uppercase tracking-[0.1em] text-clay">
                New Property
              </p>
              <h2 className="text-xl font-extrabold">Add Homeowner Profile</h2>
            </div>
            <PropertyInput
              label="Property name"
              value={propertyForm.name}
              onChange={(value) => setPropertyForm((current) => ({ ...current, name: value }))}
              required
            />
            <PropertyInput
              label="Homeowner"
              value={propertyForm.owner}
              onChange={(value) => setPropertyForm((current) => ({ ...current, owner: value }))}
              required
            />
            <PropertyInput
              label="Address"
              value={propertyForm.address}
              onChange={(value) => setPropertyForm((current) => ({ ...current, address: value }))}
              required
            />
            <PropertyInput
              label="Phone"
              value={propertyForm.phone}
              onChange={(value) => setPropertyForm((current) => ({ ...current, phone: value }))}
            />
            <PropertyInput
              label="Email"
              type="email"
              value={propertyForm.email}
              onChange={(value) => setPropertyForm((current) => ({ ...current, email: value }))}
            />
            <label className="grid gap-2 text-sm font-extrabold">
              Access notes
              <textarea
                rows={3}
                value={propertyForm.accessNotes}
                onChange={(event) =>
                  setPropertyForm((current) => ({ ...current, accessNotes: event.target.value }))
                }
                className="rounded-lg border border-line p-3 outline-none focus:border-sage focus:ring-4 focus:ring-sage/15"
              />
            </label>
            <div className="flex flex-wrap justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowPropertyForm(false)}
                className="min-h-11 flex-1 rounded-lg bg-[#edf1ee] px-5 font-extrabold sm:flex-none"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="min-h-11 flex-1 rounded-lg bg-sage-dark px-5 font-extrabold text-white sm:flex-none"
              >
                Save Property
              </button>
            </div>
          </form>
        </div>
      ) : null}
    </main>
  );
}

function ProfileItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-h-[74px] rounded-lg border border-line bg-[#fbfcfb] p-4">
      <span className="mb-2 block text-xs font-extrabold uppercase text-slate-600">{label}</span>
      <strong className="text-ink">{value}</strong>
    </div>
  );
}

function ReportCard({
  property,
  inspection
}: {
  property: Property | undefined;
  inspection: Inspection | undefined;
}) {
  if (!property || !inspection) {
    return (
      <article className="grid min-h-[420px] place-items-center rounded-lg border border-line bg-white p-5 text-center text-slate-600">
        <p>Generate an inspection report to create a clean homeowner summary.</p>
      </article>
    );
  }

  return (
    <article className="min-h-[420px] rounded-lg border border-line bg-gradient-to-b from-white to-[#fbfcfb] p-5">
      <h3 className="text-2xl font-extrabold text-ink">{property.name}</h3>
      <p className="mt-2 text-sm text-slate-600">
        {property.owner} / {property.address}
      </p>
      <ReportRow label="Date" value={formatDateTime(inspection.timestamp)} />
      <ReportRow label="Inspector" value={inspection.inspectorName} />
      <ReportRow label="Temperature" value={`${inspection.interiorTemperature} F`} />
      <ReportRow
        label="Urgent"
        value={inspection.urgent}
        valueClassName={inspection.urgent === "Yes" ? "text-[#b93f35] font-black" : ""}
      />
      <ReportRow label="Photos" value={`${inspection.photos.length} uploaded`} />

      <h4 className="mb-2 mt-5 text-sm font-extrabold uppercase">Completed Checks</h4>
      <ul className="list-disc space-y-2 pl-5">
        {inspection.checklist.length ? (
          inspection.checklist.map((item) => <li key={item}>{item}</li>)
        ) : (
          <li>No checklist items were marked complete.</li>
        )}
      </ul>

      <h4 className="mb-2 mt-5 text-sm font-extrabold uppercase">Notes / Issues</h4>
      <p>{inspection.notes || "No issues were noted during this visit."}</p>

      {inspection.photos.length ? (
        <>
          <h4 className="mb-2 mt-5 text-sm font-extrabold uppercase">Photos</h4>
          <div className="grid grid-cols-2 gap-3">
            {inspection.photos.map((photo) => (
              <a
                key={photo.id}
                href={photo.url}
                target="_blank"
                className="overflow-hidden rounded-lg border border-line bg-white"
              >
                <img src={photo.url} alt={photo.name} className="h-48 w-full bg-slate-100 object-contain" />
                <span className="block truncate px-2 py-1 text-xs text-slate-600">{photo.name}</span>
              </a>
            ))}
          </div>
        </>
      ) : null}
    </article>
  );
}

function ReportRow({
  label,
  value,
  valueClassName = ""
}: {
  label: string;
  value: string;
  valueClassName?: string;
}) {
  return (
    <div className="grid grid-cols-[110px_minmax(0,1fr)] gap-3 border-b border-[#eef2ef] py-3">
      <span className="font-extrabold text-slate-600">{label}</span>
      <strong className={valueClassName}>{value}</strong>
    </div>
  );
}

function PropertyInput({
  label,
  value,
  onChange,
  type = "text",
  required = false
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  required?: boolean;
}) {
  return (
    <label className="grid gap-2 text-sm font-extrabold">
      {label}
      <input
        type={type}
        required={required}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="rounded-lg border border-line p-3 outline-none focus:border-sage focus:ring-4 focus:ring-sage/15"
      />
    </label>
  );
}
