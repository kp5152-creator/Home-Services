"use client";

import { Dispatch, FormEvent, SetStateAction, useMemo, useState } from "react";
import {
  defaultInspectionType,
  getInspectionTemplate,
  getInspectionType,
  groupChecklistItems,
  inspectionTemplates,
  visibleChecklistItems
} from "@/lib/checklists";
import type { InspectionType } from "@/lib/checklists";
import type {
  Database,
  Inspection,
  MaintenanceIssue,
  MaintenancePriority,
  MaintenanceStatus,
  Property,
  ScheduleTask,
  ScheduleTaskStatus,
  ScheduleTaskType,
  UrgentStatus,
  VendorContact,
  VendorType
} from "@/lib/types";

type NewPropertyForm = {
  name: string;
  owner: string;
  address: string;
  phone: string;
  email: string;
  accessNotes: string;
};

type MaintenanceIssueForm = {
  title: string;
  description: string;
  priority: MaintenancePriority;
  status: MaintenanceStatus;
  vendor: string;
  nextStep: string;
  photoFiles: File[];
};

type VendorForm = {
  name: string;
  type: VendorType;
  contactName: string;
  phone: string;
  email: string;
  notes: string;
};

type ScheduleTaskForm = {
  title: string;
  type: ScheduleTaskType;
  scheduledFor: string;
  status: ScheduleTaskStatus;
  assignedTo: string;
  notes: string;
};

type InspectionForm = {
  inspectionType: InspectionType;
  inspectorName: string;
  interiorTemperature: string;
  checklist: string[];
  notes: string;
  urgent: UrgentStatus;
  photoFiles: File[];
};

type ExperienceScreen =
  | "Login"
  | "Dashboard"
  | "Property"
  | "Inspection"
  | "Schedule"
  | "Reports"
  | "Maintenance"
  | "Owner Portal";

const emptyInspectionForm: InspectionForm = {
  inspectionType: defaultInspectionType,
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

const emptyMaintenanceIssueForm: MaintenanceIssueForm = {
  title: "",
  description: "",
  priority: "Medium",
  status: "Open",
  vendor: "",
  nextStep: "",
  photoFiles: []
};

const emptyVendorForm: VendorForm = {
  name: "",
  type: "Other",
  contactName: "",
  phone: "",
  email: "",
  notes: ""
};

const emptyScheduleTaskForm: ScheduleTaskForm = {
  title: "",
  type: "Home Watch",
  scheduledFor: "",
  status: "Scheduled",
  assignedTo: "",
  notes: ""
};

const vendorTypes: VendorType[] = ["Pool", "Landscape", "HVAC", "Cleaning", "Handyman", "Plumbing", "Electrical", "Other"];
const scheduleTaskTypes: ScheduleTaskType[] = [
  "Home Watch",
  "Pre-Guest Arrival",
  "Post-Checkout",
  "Cleaner",
  "Maintenance",
  "Vendor",
  "Other"
];
const scheduleTaskStatuses: ScheduleTaskStatus[] = ["Scheduled", "In Progress", "Complete", "Skipped"];

const experienceScreens: ExperienceScreen[] = [
  "Login",
  "Dashboard",
  "Property",
  "Inspection",
  "Schedule",
  "Reports",
  "Maintenance",
  "Owner Portal"
];

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
  const [maintenanceIssues, setMaintenanceIssues] = useState<MaintenanceIssue[]>(
    initialDatabase.maintenanceIssues ?? []
  );
  const [vendors, setVendors] = useState<VendorContact[]>(initialDatabase.vendors ?? []);
  const [scheduleTasks, setScheduleTasks] = useState<ScheduleTask[]>(initialDatabase.scheduleTasks ?? []);
  const [selectedPropertyId, setSelectedPropertyId] = useState(initialDatabase.properties[0]?.id ?? "");
  const [activeReportId, setActiveReportId] = useState(initialDatabase.inspections[0]?.id ?? "");
  const [inspectionForm, setInspectionForm] = useState<InspectionForm>(emptyInspectionForm);
  const [propertyForm, setPropertyForm] = useState<NewPropertyForm>(emptyPropertyForm);
  const [maintenanceIssueForm, setMaintenanceIssueForm] =
    useState<MaintenanceIssueForm>(emptyMaintenanceIssueForm);
  const [vendorForm, setVendorForm] = useState<VendorForm>(emptyVendorForm);
  const [scheduleTaskForm, setScheduleTaskForm] = useState<ScheduleTaskForm>(emptyScheduleTaskForm);
  const [vendorSaveMessage, setVendorSaveMessage] = useState("");
  const [isSavingVendor, setIsSavingVendor] = useState(false);
  const [scheduleSaveMessage, setScheduleSaveMessage] = useState("");
  const [isSavingScheduleTask, setIsSavingScheduleTask] = useState(false);
  const [propertySaveMessage, setPropertySaveMessage] = useState("");
  const [isSavingProperty, setIsSavingProperty] = useState(false);
  const [maintenanceSaveMessage, setMaintenanceSaveMessage] = useState("");
  const [isSavingMaintenanceIssue, setIsSavingMaintenanceIssue] = useState(false);
  const [showPropertyForm, setShowPropertyForm] = useState(false);
  const [activeExperience, setActiveExperience] = useState<ExperienceScreen>("Dashboard");
  const [darkMode, setDarkMode] = useState(false);
  const [now] = useState(() => new Date());

  const selectedProperty = useMemo(
    () => properties.find((property) => property.id === selectedPropertyId) ?? properties[0],
    [properties, selectedPropertyId]
  );

  const selectedInspections = useMemo(
    () => inspections.filter((inspection) => inspection.propertyId === selectedProperty?.id),
    [inspections, selectedProperty?.id]
  );

  const selectedMaintenanceIssues = useMemo(
    () => maintenanceIssues.filter((issue) => issue.propertyId === selectedProperty?.id),
    [maintenanceIssues, selectedProperty?.id]
  );

  const selectedVendors = useMemo(
    () => vendors.filter((vendor) => vendor.propertyId === selectedProperty?.id),
    [vendors, selectedProperty?.id]
  );

  const selectedScheduleTasks = useMemo(
    () =>
      scheduleTasks
        .filter((task) => task.propertyId === selectedProperty?.id)
        .slice()
        .sort((a, b) => new Date(a.scheduledFor).getTime() - new Date(b.scheduledFor).getTime()),
    [scheduleTasks, selectedProperty?.id]
  );

  const upcomingScheduleTasks = useMemo(
    () =>
      scheduleTasks
        .filter((task) => task.status !== "Complete" && task.status !== "Skipped")
        .slice()
        .sort((a, b) => new Date(a.scheduledFor).getTime() - new Date(b.scheduledFor).getTime())
        .slice(0, 6),
    [scheduleTasks]
  );

  const activeReport =
    selectedInspections.find((inspection) => inspection.id === activeReportId) ?? selectedInspections[0];
  const activeInspectionTemplate = useMemo(
    () => getInspectionTemplate(inspectionForm.inspectionType),
    [inspectionForm.inspectionType]
  );

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
    setIsSavingProperty(true);
    setPropertySaveMessage("Saving property...");

    try {
      const response = await fetch("/api/properties", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(propertyForm)
      });

      if (!response.ok) {
        const error = (await response.json().catch(() => null)) as { message?: string } | null;
        setPropertySaveMessage(error?.message || "Property could not be saved. Please try again.");
        setIsSavingProperty(false);
        return;
      }

      const property = (await response.json()) as Property;
      setProperties((current) => [property, ...current]);
      setSelectedPropertyId(property.id);
      setActiveReportId("");
      setPropertyForm(emptyPropertyForm);
      setPropertySaveMessage(`Property saved: ${property.name}`);
      setTimeout(() => {
        setShowPropertyForm(false);
        setPropertySaveMessage("");
      }, 650);
    } catch {
      setPropertySaveMessage("Property could not be saved. Check your connection and try again.");
    } finally {
      setIsSavingProperty(false);
    }
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
    setMaintenanceIssues(database.maintenanceIssues ?? []);
    setVendors(database.vendors ?? []);
    setScheduleTasks(database.scheduleTasks ?? []);
    setSelectedPropertyId(database.properties[0]?.id ?? "");
    setActiveReportId("");
  }

  async function saveVendor(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedProperty) {
      setVendorSaveMessage("Select a property before saving a vendor.");
      return;
    }

    setIsSavingVendor(true);
    setVendorSaveMessage("Saving vendor...");

    try {
      const response = await fetch("/api/vendors", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...vendorForm,
          propertyId: selectedProperty.id
        })
      });

      if (!response.ok) {
        const error = (await response.json().catch(() => null)) as { message?: string } | null;
        setVendorSaveMessage(error?.message || "Vendor could not be saved.");
        return;
      }

      const vendor = (await response.json()) as VendorContact;
      setVendors((current) => [vendor, ...current]);
      setVendorForm(emptyVendorForm);
      setVendorSaveMessage(`Vendor saved: ${vendor.name}`);
    } catch {
      setVendorSaveMessage("Vendor could not be saved. Check your connection and try again.");
    } finally {
      setIsSavingVendor(false);
    }
  }

  async function saveScheduleTask(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedProperty) {
      setScheduleSaveMessage("Select a property before scheduling work.");
      return;
    }

    setIsSavingScheduleTask(true);
    setScheduleSaveMessage("Saving schedule item...");

    try {
      const response = await fetch("/api/schedule-tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...scheduleTaskForm,
          propertyId: selectedProperty.id
        })
      });

      if (!response.ok) {
        const error = (await response.json().catch(() => null)) as { message?: string } | null;
        setScheduleSaveMessage(error?.message || "Scheduled item could not be saved.");
        return;
      }

      const task = (await response.json()) as ScheduleTask;
      setScheduleTasks((current) => [task, ...current]);
      setScheduleTaskForm(emptyScheduleTaskForm);
      setScheduleSaveMessage(`Scheduled: ${task.title}`);
    } catch {
      setScheduleSaveMessage("Scheduled item could not be saved. Check your connection and try again.");
    } finally {
      setIsSavingScheduleTask(false);
    }
  }

  async function saveMaintenanceIssue(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedProperty) {
      setMaintenanceSaveMessage("Select a property before saving a maintenance issue.");
      return;
    }

    setIsSavingMaintenanceIssue(true);
    setMaintenanceSaveMessage("Saving maintenance issue...");

    let photos: Awaited<ReturnType<typeof fileToPhotoUpload>>[];

    try {
      photos = await Promise.all(maintenanceIssueForm.photoFiles.map(fileToPhotoUpload));
    } catch {
      setMaintenanceSaveMessage("One or more maintenance photos could not be processed. Please try JPEG or PNG photos.");
      setIsSavingMaintenanceIssue(false);
      return;
    }

    try {
      const response = await fetch("/api/maintenance-issues", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...maintenanceIssueForm,
          photoFiles: undefined,
          photos,
          propertyId: selectedProperty.id
        })
      });

      if (!response.ok) {
        const error = (await response.json().catch(() => null)) as { message?: string } | null;
        setMaintenanceSaveMessage(error?.message || "Maintenance issue could not be saved. Please try again.");
        setIsSavingMaintenanceIssue(false);
        return;
      }

      const issue = (await response.json()) as MaintenanceIssue;
      const savedPhotoCount = issue.photos?.length ?? 0;

      setMaintenanceIssues((current) => [issue, ...current]);
      setMaintenanceIssueForm(emptyMaintenanceIssueForm);
      setActiveExperience("Maintenance");
      setMaintenanceSaveMessage(
        maintenanceIssueForm.photoFiles.length && savedPhotoCount === 0
          ? "Issue saved, but no photos attached. Confirm the Supabase maintenance photo table exists."
          : `Issue saved with ${savedPhotoCount} photo${savedPhotoCount === 1 ? "" : "s"}.`
      );
    } catch {
      setMaintenanceSaveMessage("Maintenance issue could not be saved. Check your connection and try again.");
    } finally {
      setIsSavingMaintenanceIssue(false);
    }
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

  function addMaintenanceIssuePhotoFiles(files: FileList | null) {
    setMaintenanceIssueForm((current) => ({
      ...current,
      photoFiles: files ? [...current.photoFiles, ...Array.from(files)] : current.photoFiles
    }));
  }

  async function updateMaintenanceStatus(issueId: string, status: MaintenanceStatus) {
    await updateMaintenanceIssue(issueId, { status });
  }

  async function updateMaintenanceIssue(issueId: string, updates: Partial<MaintenanceIssueForm>) {
    const previousIssues = maintenanceIssues;
    setMaintenanceIssues((current) =>
      current.map((issue) => (issue.id === issueId ? { ...issue, ...updates } : issue))
    );

    const response = await fetch("/api/maintenance-issues", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: issueId, ...updates })
    });

    if (!response.ok) {
      const error = (await response.json().catch(() => null)) as { message?: string } | null;
      setMaintenanceIssues(previousIssues);
      throw new Error(error?.message || "Maintenance issue could not be updated.");
    }

    const updatedIssue = (await response.json()) as MaintenanceIssue;
    setMaintenanceIssues((current) =>
      current.map((issue) => (issue.id === updatedIssue.id ? updatedIssue : issue))
    );
    return updatedIssue;
  }

  async function updateScheduleTaskStatus(taskId: string, status: ScheduleTaskStatus) {
    const previousTasks = scheduleTasks;
    setScheduleTasks((current) =>
      current.map((task) => (task.id === taskId ? { ...task, status } : task))
    );

    const response = await fetch("/api/schedule-tasks", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: taskId, status })
    });

    if (!response.ok) {
      setScheduleTasks(previousTasks);
      const error = (await response.json().catch(() => null)) as { message?: string } | null;
      window.alert(error?.message || "Scheduled item could not be updated.");
      return;
    }

    const updatedTask = (await response.json()) as ScheduleTask;
    setScheduleTasks((current) =>
      current.map((task) => (task.id === updatedTask.id ? updatedTask : task))
    );
  }

  return (
    <main className={`mx-auto min-h-screen w-full max-w-[1480px] p-3 sm:p-6 ${darkMode ? "luxury-dark" : ""}`}>
      <section className="mb-5 overflow-hidden rounded-lg bg-ink text-white shadow-estate">
        <div className="flex min-h-36 flex-col justify-between gap-5 bg-[linear-gradient(135deg,rgba(217,154,92,0.22),transparent_42%),linear-gradient(315deg,rgba(95,120,108,0.45),transparent_48%)] p-5 md:flex-row md:items-center md:p-7">
          <div className="flex items-center gap-4">
            <img
              src="/apple-touch-icon.png"
              alt=""
              className="h-16 w-16 shrink-0 rounded-[18px] border border-white/20 shadow-lift"
            />
            <div>
              <p className="mb-2 text-xs font-extrabold uppercase tracking-[0.16em] text-[#f1c27d]">
                Coachella Valley Home Watch
              </p>
              <h1 className="text-4xl font-extrabold leading-none tracking-normal sm:text-6xl">
                Desert Estate Watch
              </h1>
            </div>
          </div>
          <div className="rounded-lg border border-white/15 bg-white/10 px-5 py-4 text-left text-white/78 md:min-w-48 md:text-right">
            <span className="block">{formatShortDate(now)}</span>
            <strong className="block text-2xl text-white">
              {new Intl.DateTimeFormat("en-US", { hour: "numeric", minute: "2-digit" }).format(now)}
            </strong>
          </div>
        </div>
      </section>

      <section className="estate-panel no-print mb-5 rounded-lg p-3 sm:p-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex gap-2 overflow-x-auto pb-1">
            {experienceScreens.map((screen) => (
              <button
                key={screen}
                type="button"
                onClick={() => setActiveExperience(screen)}
                className={`min-h-10 shrink-0 rounded-lg px-4 text-sm font-extrabold transition ${
                  activeExperience === screen
                    ? "bg-ink text-white shadow-lift"
                    : "bg-white text-slate-700 hover:bg-[#f2f5f2]"
                }`}
              >
                {screen}
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={() => setDarkMode((current) => !current)}
            className="button-soft min-h-10 rounded-lg px-4 text-sm font-extrabold"
          >
            {darkMode ? "Light Mode" : "Dark Mode"}
          </button>
        </div>
      </section>

      <LuxuryExperiencePanel
        activeExperience={activeExperience}
        activeReport={activeReport}
        now={now}
        properties={properties}
        maintenanceIssueForm={maintenanceIssueForm}
        maintenanceIssues={selectedMaintenanceIssues}
        scheduleTaskForm={scheduleTaskForm}
        scheduleSaveMessage={scheduleSaveMessage}
        scheduleTasks={selectedScheduleTasks}
        selectedVendors={selectedVendors}
        vendorForm={vendorForm}
        vendorSaveMessage={vendorSaveMessage}
        selectedInspections={selectedInspections}
        selectedProperty={selectedProperty}
        setActiveExperience={setActiveExperience}
        setMaintenanceIssueForm={setMaintenanceIssueForm}
        setScheduleTaskForm={setScheduleTaskForm}
        addMaintenanceIssuePhotoFiles={addMaintenanceIssuePhotoFiles}
        saveMaintenanceIssue={saveMaintenanceIssue}
        saveScheduleTask={saveScheduleTask}
        isSavingMaintenanceIssue={isSavingMaintenanceIssue}
        isSavingScheduleTask={isSavingScheduleTask}
        maintenanceSaveMessage={maintenanceSaveMessage}
        upcomingScheduleTasks={upcomingScheduleTasks}
        updateMaintenanceStatus={updateMaintenanceStatus}
        updateMaintenanceIssue={updateMaintenanceIssue}
        updateScheduleTaskStatus={updateScheduleTaskStatus}
        setVendorForm={setVendorForm}
        saveVendor={saveVendor}
        isSavingVendor={isSavingVendor}
      />

      <section className="grid gap-5 xl:grid-cols-[300px_minmax(0,1fr)_400px]">
        <aside className="estate-panel no-print rounded-lg p-5">
          <div className="mb-5 flex items-start justify-between gap-3">
            <div>
              <p className="mb-2 text-xs font-extrabold uppercase tracking-[0.1em] text-clay">
                Portfolio
              </p>
              <h2 className="text-xl font-extrabold text-ink">Properties</h2>
            </div>
            <button
              type="button"
              onClick={() => {
                setPropertySaveMessage("");
                setShowPropertyForm(true);
              }}
              className="button-primary grid h-11 w-11 place-items-center rounded-lg text-2xl font-extrabold leading-none"
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
                  className={`rounded-lg border p-4 text-left transition ${
                    active
                      ? "border-sage bg-[#f3f8f4] shadow-[inset_4px_0_0_#5f786c]"
                      : "border-line bg-white hover:border-sage hover:shadow-lift"
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
          <section className="estate-panel rounded-lg p-5">
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

          <section className="estate-panel no-print rounded-lg p-5">
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
              <fieldset className="grid gap-3 rounded-lg border border-line bg-white/70 p-4">
                <legend className="px-2 font-extrabold">Inspection type</legend>
                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                  {inspectionTemplates.map((template) => {
                    const active = inspectionForm.inspectionType === template.title;

                    return (
                      <label
                        key={template.title}
                        className={`grid cursor-pointer gap-2 rounded-lg border p-3 transition ${
                          active
                            ? "border-sage bg-[#eef5ef] shadow-[inset_0_0_0_1px_rgba(95,120,108,0.35)]"
                            : "border-line bg-white hover:border-sage hover:shadow-lift"
                        }`}
                      >
                        <span className="grid grid-cols-[22px_minmax(0,1fr)] gap-2">
                          <input
                            type="radio"
                            name="inspectionType"
                            value={template.title}
                            checked={active}
                            onChange={() =>
                              setInspectionForm((current) => ({
                                ...current,
                                inspectionType: template.title,
                                checklist: []
                              }))
                            }
                            className="mt-1 accent-sage-dark"
                          />
                          <span className="font-extrabold text-ink">{template.title}</span>
                        </span>
                        <span className="pl-7 text-sm font-medium leading-5 text-slate-600">{template.description}</span>
                      </label>
                    );
                  })}
                </div>
              </fieldset>

              <div className="grid gap-4 md:grid-cols-2">
                <label className="grid gap-2 text-sm font-extrabold text-ink">
                  Inspector name
                  <input
                    required
                    value={inspectionForm.inspectorName}
                    onChange={(event) =>
                      setInspectionForm((current) => ({ ...current, inspectorName: event.target.value }))
                    }
                    className="field-shell rounded-lg p-3"
                  />
                </label>
                <label className="grid gap-2 text-sm font-extrabold text-ink">
                  Interior temperature
                  <div className="field-shell grid grid-cols-[minmax(0,1fr)_46px] overflow-hidden rounded-lg">
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

              <fieldset className="grid gap-4 rounded-lg border border-line bg-white/70 p-4">
                <legend className="px-2 font-extrabold">Inspection checklist</legend>
                {activeInspectionTemplate.sections.map((section) => (
                  <div key={section.title} className="grid gap-3 rounded-lg border border-line bg-white p-3">
                    <h3 className="text-sm font-black uppercase tracking-[0.08em] text-clay">{section.title}</h3>
                    <div className="grid gap-2 md:grid-cols-2">
                      {section.items.map((item) => (
                        <label
                          key={item}
                          className="grid min-h-11 grid-cols-[22px_minmax(0,1fr)] items-center gap-2 rounded-md px-2 font-semibold transition hover:bg-[#f6f8f6]"
                        >
                          <input
                            type="checkbox"
                            checked={inspectionForm.checklist.includes(item)}
                            onChange={() => toggleChecklistItem(item)}
                            className="accent-sage-dark"
                          />
                          {item}
                        </label>
                      ))}
                    </div>
                  </div>
                ))}
              </fieldset>

              <div className="grid gap-4 md:grid-cols-3">
                {["Exterior photos", "Interior photos", "Issue photos"].map((label) => (
                  <label
                    key={label}
                    className="grid min-h-28 content-center gap-2 rounded-lg border border-dashed border-sage bg-[#f8faf8] p-4 text-sm font-extrabold transition hover:bg-[#eef5ef]"
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
                  className="field-shell rounded-lg p-3"
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
                  className="button-soft min-h-11 flex-1 rounded-lg px-5 font-extrabold sm:flex-none"
                >
                  Clear
                </button>
                <button
                  type="submit"
                  className="button-primary min-h-11 flex-1 rounded-lg px-5 font-extrabold sm:flex-none"
                >
                  Generate Report
                </button>
              </div>
            </form>
          </section>
        </section>

        <aside className="estate-panel rounded-lg p-5">
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
                  className="button-primary grid min-h-10 place-items-center rounded-lg px-4 font-extrabold"
                >
                  Export Report
                </a>
              ) : null}
              <button
                type="button"
                onClick={() => window.print()}
                className="button-soft min-h-10 rounded-lg px-4 font-extrabold"
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
                    className="rounded-lg border border-line bg-white p-4 text-left transition hover:border-sage hover:shadow-lift"
                  >
                    <strong className="block text-ink">{formatDateTime(inspection.timestamp)}</strong>
                    <span className="mt-1 block text-sm text-slate-600">
                      {getInspectionType(inspection.checklist)} / {inspection.inspectorName} /{" "}
                      {inspection.interiorTemperature} F / Urgent: {inspection.urgent}
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
        <div className="fixed inset-0 z-20 grid place-items-center bg-ink/45 p-4 backdrop-blur-sm">
          <form className="grid w-full max-w-xl gap-4 rounded-lg bg-white p-5 shadow-estate" onSubmit={saveProperty}>
            <div>
              <p className="mb-2 text-xs font-extrabold uppercase tracking-[0.1em] text-clay">
                New Property
              </p>
              <h2 className="text-xl font-extrabold">Add Homeowner Profile</h2>
              {propertySaveMessage ? (
                <p className="mt-2 rounded-lg border border-line bg-[#fbfcfb] p-3 text-sm font-semibold text-slate-600">
                  {propertySaveMessage}
                </p>
              ) : null}
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
                className="field-shell rounded-lg p-3"
              />
            </label>
            <div className="flex flex-wrap justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowPropertyForm(false)}
                className="button-soft min-h-11 flex-1 rounded-lg px-5 font-extrabold sm:flex-none"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSavingProperty}
                className="button-primary min-h-11 flex-1 rounded-lg px-5 font-extrabold disabled:cursor-not-allowed disabled:opacity-60 sm:flex-none"
              >
                {isSavingProperty ? "Saving..." : "Save Property"}
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
    <div className="min-h-[74px] rounded-lg border border-line bg-[#fbfcfb] p-4 shadow-[0_8px_20px_rgba(35,45,41,0.04)]">
      <span className="mb-2 block text-xs font-extrabold uppercase text-slate-600">{label}</span>
      <strong className="text-ink">{value}</strong>
    </div>
  );
}

function LuxuryExperiencePanel({
  activeExperience,
  activeReport,
  addMaintenanceIssuePhotoFiles,
  maintenanceIssueForm,
  maintenanceIssues,
  maintenanceSaveMessage,
  now,
  properties,
  scheduleTaskForm,
  scheduleSaveMessage,
  scheduleTasks,
  saveMaintenanceIssue,
  saveScheduleTask,
  saveVendor,
  selectedInspections,
  selectedProperty,
  selectedVendors,
  setActiveExperience,
  setMaintenanceIssueForm,
  setScheduleTaskForm,
  setVendorForm,
  isSavingScheduleTask,
  isSavingMaintenanceIssue,
  upcomingScheduleTasks,
  updateMaintenanceStatus,
  updateMaintenanceIssue,
  updateScheduleTaskStatus,
  vendorForm,
  vendorSaveMessage,
  isSavingVendor
}: {
  activeExperience: ExperienceScreen;
  activeReport: Inspection | undefined;
  addMaintenanceIssuePhotoFiles: (files: FileList | null) => void;
  isSavingMaintenanceIssue: boolean;
  maintenanceIssueForm: MaintenanceIssueForm;
  maintenanceIssues: MaintenanceIssue[];
  maintenanceSaveMessage: string;
  now: Date;
  properties: Property[];
  scheduleTaskForm: ScheduleTaskForm;
  scheduleSaveMessage: string;
  scheduleTasks: ScheduleTask[];
  saveMaintenanceIssue: (event: FormEvent<HTMLFormElement>) => void;
  saveScheduleTask: (event: FormEvent<HTMLFormElement>) => void;
  saveVendor: (event: FormEvent<HTMLFormElement>) => void;
  selectedInspections: Inspection[];
  selectedProperty: Property | undefined;
  selectedVendors: VendorContact[];
  setActiveExperience: (screen: ExperienceScreen) => void;
  setMaintenanceIssueForm: Dispatch<SetStateAction<MaintenanceIssueForm>>;
  setScheduleTaskForm: Dispatch<SetStateAction<ScheduleTaskForm>>;
  setVendorForm: Dispatch<SetStateAction<VendorForm>>;
  isSavingScheduleTask: boolean;
  updateMaintenanceStatus: (issueId: string, status: MaintenanceStatus) => void;
  updateMaintenanceIssue: (issueId: string, updates: Partial<MaintenanceIssueForm>) => Promise<MaintenanceIssue>;
  upcomingScheduleTasks: ScheduleTask[];
  updateScheduleTaskStatus: (taskId: string, status: ScheduleTaskStatus) => void;
  vendorForm: VendorForm;
  vendorSaveMessage: string;
  isSavingVendor: boolean;
}) {
  const urgentCount = selectedInspections.filter((inspection) => inspection.urgent === "Yes").length;
  const urgentMaintenanceCount = maintenanceIssues.filter(
    (issue) => issue.priority === "Urgent" && issue.status !== "Resolved"
  ).length;
  const openMaintenanceCount = maintenanceIssues.filter((issue) => issue.status !== "Resolved").length;
  const recentReport = selectedInspections[0];
  const completedItems = activeReport ? visibleChecklistItems(activeReport.checklist).length : 0;

  return (
    <section className="no-print mb-5">
      {activeExperience === "Login" ? (
        <div className="overflow-hidden rounded-lg bg-ink text-white shadow-estate">
          <div className="grid gap-0 lg:grid-cols-[1.05fr_0.95fr]">
            <div className="min-h-[420px] bg-[linear-gradient(135deg,rgba(217,154,92,0.2),transparent_45%),linear-gradient(315deg,rgba(95,120,108,0.42),transparent_48%),url('/icon-512.png')] bg-[length:auto,auto,260px] bg-[position:center,center,right_2rem_bottom_2rem] bg-no-repeat p-6 sm:p-8">
              <p className="mb-4 text-xs font-extrabold uppercase tracking-[0.16em] text-[#f1c27d]">
                White-glove property operations
              </p>
              <h2 className="max-w-xl text-4xl font-extrabold leading-[0.95] sm:text-6xl">
                Calm control for extraordinary homes.
              </h2>
              <p className="mt-5 max-w-lg text-lg leading-8 text-white/72">
                A premium operations layer for inspections, reports, maintenance, arrivals, and owner confidence.
              </p>
            </div>
            <div className="grid content-center gap-4 bg-white p-6 text-ink sm:p-8">
              <div>
                <p className="mb-2 text-xs font-extrabold uppercase tracking-[0.12em] text-clay">Secure access</p>
                <h3 className="text-2xl font-extrabold">Welcome back</h3>
              </div>
              <label className="grid gap-2 text-sm font-extrabold">
                Email
                <input className="field-shell rounded-lg p-3" placeholder="concierge@example.com" />
              </label>
              <label className="grid gap-2 text-sm font-extrabold">
                Password
                <input className="field-shell rounded-lg p-3" placeholder="••••••••" type="password" />
              </label>
              <button type="button" className="button-primary min-h-12 rounded-lg px-5 font-extrabold">
                Sign In
              </button>
              <p className="text-sm leading-6 text-slate-600">
                This is the premium login concept. Your live app is still protected by the Vercel password setup.
              </p>
            </div>
          </div>
        </div>
      ) : null}

      {activeExperience === "Dashboard" ? (
        <div className="grid gap-5">
          <div className="estate-panel rounded-lg p-5">
            <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
              <div>
                <p className="mb-2 text-xs font-extrabold uppercase tracking-[0.12em] text-clay">
                  Executive dashboard
                </p>
                <h2 className="text-3xl font-extrabold text-ink">Today’s property command center</h2>
              </div>
              <span className="rounded-full bg-[#fff4d9] px-3 py-2 text-xs font-extrabold text-[#7b5426]">
                {formatDateTime(now)}
              </span>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <MetricCard label="Portfolio" value={`${properties.length}`} detail="Active residences" />
              <MetricCard label="Upcoming" value={`${upcomingScheduleTasks.length}`} detail="Scheduled work" />
              <MetricCard
                label="Urgent"
                value={`${urgentCount + urgentMaintenanceCount}`}
                detail="Needs attention"
                urgent={urgentCount + urgentMaintenanceCount > 0}
              />
              <MetricCard label="Readiness" value="96%" detail="Operational score" />
            </div>
          </div>
          <div className="grid gap-5 lg:grid-cols-[1.2fr_0.8fr]">
            <ConceptCard eyebrow="Occupancy overview" title="Next 7 days">
              <div className="grid grid-cols-7 gap-2">
                {["M", "T", "W", "T", "F", "S", "S"].map((day, index) => (
                  <div
                    key={`${day}-${index}`}
                    className={`min-h-20 rounded-lg border p-2 text-center text-sm font-extrabold ${
                      index === 3 || index === 4
                        ? "border-clay bg-[#fff4e6] text-[#7b5426]"
                        : "border-line bg-white text-slate-600"
                    }`}
                  >
                    {day}
                    <span className="mt-2 block text-xs font-semibold">
                      {index === 3 ? "Arrival" : index === 4 ? "Guest" : "Open"}
                    </span>
                  </div>
                ))}
              </div>
            </ConceptCard>
            <ConceptCard eyebrow="Quick actions" title="Move work forward">
              <div className="grid gap-2">
                {(["Inspection", "Schedule", "Maintenance", "Reports", "Owner Portal"] as ExperienceScreen[]).map((screen) => (
                  <button
                    key={screen}
                    type="button"
                    onClick={() => setActiveExperience(screen)}
                    className="min-h-12 rounded-lg border border-line bg-white px-4 text-left font-extrabold transition hover:border-sage hover:shadow-lift"
                  >
                    {screen}
                  </button>
                ))}
              </div>
            </ConceptCard>
          </div>
          <ConceptCard eyebrow="Upcoming work" title="Operations schedule">
            <div className="grid gap-3">
              {upcomingScheduleTasks.length ? (
                upcomingScheduleTasks.map((task) => {
                  const property = properties.find((item) => item.id === task.propertyId);

                  return (
                    <ScheduleTaskCard
                      key={task.id}
                      task={task}
                      propertyName={property?.name}
                      updateScheduleTaskStatus={updateScheduleTaskStatus}
                    />
                  );
                })
              ) : (
                <div className="rounded-lg border border-line bg-white p-4 text-sm text-slate-600">
                  No upcoming work has been scheduled yet.
                </div>
              )}
            </div>
          </ConceptCard>
        </div>
      ) : null}

      {activeExperience === "Property" ? (
        <div className="grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="overflow-hidden rounded-lg bg-ink text-white shadow-estate">
            <div className="min-h-[360px] bg-[linear-gradient(180deg,rgba(23,33,31,0.08),rgba(23,33,31,0.72)),radial-gradient(circle_at_70%_20%,rgba(217,154,92,0.35),transparent_18rem),linear-gradient(135deg,#8ca090,#344b43)] p-6 sm:p-8">
              <p className="mb-3 text-xs font-extrabold uppercase tracking-[0.14em] text-[#f1c27d]">
                Property profile
              </p>
              <h2 className="max-w-lg text-4xl font-extrabold leading-none">{selectedProperty?.name}</h2>
              <p className="mt-4 max-w-lg text-white/72">{selectedProperty?.address}</p>
            </div>
          </div>
          <ConceptCard eyebrow="Owner and operations" title={selectedProperty?.owner || "Selected homeowner"}>
            <div className="grid gap-3">
              <DetailStrip label="Access" value={selectedProperty?.accessNotes || "Gate, lockbox, alarm notes"} />
              <DetailStrip label="Smart home" value="Thermostat, alarm, WiFi, lighting scenes" />
              <DetailStrip label="Vehicle / cart" value="Golf cart charged, vehicle tender connected" />
              <DetailStrip
                label="Vendors"
                value={
                  selectedVendors.length
                    ? selectedVendors.map((vendor) => `${vendor.type}: ${vendor.name}`).join(", ")
                    : "No vendors saved yet"
                }
              />
            </div>
          </ConceptCard>
          <ConceptCard eyebrow="Vendor directory" title="Property vendor contacts">
            <form className="grid gap-3" onSubmit={saveVendor}>
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="grid gap-2 text-sm font-extrabold">
                  Vendor name
                  <input
                    required
                    value={vendorForm.name}
                    onChange={(event) => setVendorForm((current) => ({ ...current, name: event.target.value }))}
                    className="field-shell rounded-lg p-3"
                    placeholder="Desert Pool Care"
                  />
                </label>
                <label className="grid gap-2 text-sm font-extrabold">
                  Vendor type
                  <select
                    value={vendorForm.type}
                    onChange={(event) =>
                      setVendorForm((current) => ({ ...current, type: event.target.value as VendorType }))
                    }
                    className="field-shell rounded-lg p-3"
                  >
                    {vendorTypes.map((type) => (
                      <option key={type}>{type}</option>
                    ))}
                  </select>
                </label>
              </div>
              <div className="grid gap-3 sm:grid-cols-3">
                <label className="grid gap-2 text-sm font-extrabold">
                  Contact
                  <input
                    value={vendorForm.contactName}
                    onChange={(event) => setVendorForm((current) => ({ ...current, contactName: event.target.value }))}
                    className="field-shell rounded-lg p-3"
                  />
                </label>
                <label className="grid gap-2 text-sm font-extrabold">
                  Phone
                  <input
                    value={vendorForm.phone}
                    onChange={(event) => setVendorForm((current) => ({ ...current, phone: event.target.value }))}
                    className="field-shell rounded-lg p-3"
                  />
                </label>
                <label className="grid gap-2 text-sm font-extrabold">
                  Email
                  <input
                    type="email"
                    value={vendorForm.email}
                    onChange={(event) => setVendorForm((current) => ({ ...current, email: event.target.value }))}
                    className="field-shell rounded-lg p-3"
                  />
                </label>
              </div>
              <label className="grid gap-2 text-sm font-extrabold">
                Notes
                <textarea
                  rows={3}
                  value={vendorForm.notes}
                  onChange={(event) => setVendorForm((current) => ({ ...current, notes: event.target.value }))}
                  className="field-shell rounded-lg p-3"
                  placeholder="Preferred schedule, account number, gate instructions, emergency notes..."
                />
              </label>
              {vendorSaveMessage ? (
                <div className="rounded-lg border border-line bg-white p-3 text-sm font-semibold text-slate-600">
                  {vendorSaveMessage}
                </div>
              ) : null}
              <button
                type="submit"
                disabled={isSavingVendor}
                className="button-primary min-h-11 rounded-lg px-4 font-extrabold disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSavingVendor ? "Saving..." : "Save Vendor"}
              </button>
            </form>
            <div className="mt-4 grid gap-3">
              {selectedVendors.length ? (
                selectedVendors.map((vendor) => <VendorCard key={vendor.id} vendor={vendor} />)
              ) : (
                <div className="rounded-lg border border-line bg-white p-4 text-sm text-slate-600">
                  No vendor contacts have been saved for this property yet.
                </div>
              )}
            </div>
          </ConceptCard>
        </div>
      ) : null}

      {activeExperience === "Inspection" ? (
        <div className="grid gap-5 lg:grid-cols-[0.9fr_1.1fr]">
          <ConceptCard eyebrow="Mobile workflow" title="Fast field completion">
            <div className="grid gap-3">
              {["Choose inspection type", "Complete checklist", "Upload required photos", "Flag issues", "Generate report"].map(
                (step, index) => (
                  <div key={step} className="flex items-center gap-3 rounded-lg border border-line bg-white p-3">
                    <span className="grid h-8 w-8 place-items-center rounded-full bg-ink text-sm font-extrabold text-white">
                      {index + 1}
                    </span>
                    <strong>{step}</strong>
                  </div>
                )
              )}
            </div>
          </ConceptCard>
          <ConceptCard eyebrow="Template system" title="Inspection types">
            <div className="grid gap-2 sm:grid-cols-2">
              {inspectionTemplates.map((template) => (
                <div key={template.title} className="rounded-lg border border-line bg-white p-3">
                  <strong className="block text-ink">{template.title}</strong>
                  <span className="mt-1 block text-sm leading-5 text-slate-600">{template.description}</span>
                </div>
              ))}
            </div>
          </ConceptCard>
        </div>
      ) : null}

      {activeExperience === "Schedule" ? (
        <div className="grid gap-5 lg:grid-cols-[0.95fr_1.05fr]">
          <ConceptCard eyebrow="Schedule work" title="Plan the next visit">
            <form className="grid gap-3" onSubmit={saveScheduleTask}>
              <label className="grid gap-2 text-sm font-extrabold">
                Task title
                <input
                  required
                  value={scheduleTaskForm.title}
                  onChange={(event) =>
                    setScheduleTaskForm((current) => ({ ...current, title: event.target.value }))
                  }
                  className="field-shell rounded-lg p-3"
                  placeholder="Weekly home watch inspection"
                />
              </label>
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="grid gap-2 text-sm font-extrabold">
                  Work type
                  <select
                    value={scheduleTaskForm.type}
                    onChange={(event) =>
                      setScheduleTaskForm((current) => ({
                        ...current,
                        type: event.target.value as ScheduleTaskType
                      }))
                    }
                    className="field-shell rounded-lg p-3"
                  >
                    {scheduleTaskTypes.map((type) => (
                      <option key={type}>{type}</option>
                    ))}
                  </select>
                </label>
                <label className="grid gap-2 text-sm font-extrabold">
                  Date and time
                  <input
                    required
                    type="datetime-local"
                    value={scheduleTaskForm.scheduledFor}
                    onChange={(event) =>
                      setScheduleTaskForm((current) => ({ ...current, scheduledFor: event.target.value }))
                    }
                    className="field-shell rounded-lg p-3"
                  />
                </label>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="grid gap-2 text-sm font-extrabold">
                  Assigned to
                  <input
                    value={scheduleTaskForm.assignedTo}
                    onChange={(event) =>
                      setScheduleTaskForm((current) => ({ ...current, assignedTo: event.target.value }))
                    }
                    className="field-shell rounded-lg p-3"
                    placeholder="Inspector, cleaner, or vendor"
                  />
                </label>
                <label className="grid gap-2 text-sm font-extrabold">
                  Status
                  <select
                    value={scheduleTaskForm.status}
                    onChange={(event) =>
                      setScheduleTaskForm((current) => ({
                        ...current,
                        status: event.target.value as ScheduleTaskStatus
                      }))
                    }
                    className="field-shell rounded-lg p-3"
                  >
                    {scheduleTaskStatuses.map((status) => (
                      <option key={status}>{status}</option>
                    ))}
                  </select>
                </label>
              </div>
              <label className="grid gap-2 text-sm font-extrabold">
                Notes
                <textarea
                  rows={4}
                  value={scheduleTaskForm.notes}
                  onChange={(event) =>
                    setScheduleTaskForm((current) => ({ ...current, notes: event.target.value }))
                  }
                  className="field-shell rounded-lg p-3"
                  placeholder="Arrival prep, vendor instructions, gate notes, owner requests..."
                />
              </label>
              {scheduleSaveMessage ? (
                <div className="rounded-lg border border-line bg-white p-3 text-sm font-semibold text-slate-600">
                  {scheduleSaveMessage}
                </div>
              ) : null}
              <button
                type="submit"
                disabled={isSavingScheduleTask}
                className="button-primary min-h-12 rounded-lg px-5 font-extrabold disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSavingScheduleTask ? "Saving..." : "Save Schedule Item"}
              </button>
            </form>
          </ConceptCard>

          <ConceptCard
            eyebrow={`${scheduleTasks.length} scheduled item${scheduleTasks.length === 1 ? "" : "s"}`}
            title="Property calendar"
          >
            <div className="grid gap-3">
              {scheduleTasks.length ? (
                scheduleTasks.map((task) => (
                  <ScheduleTaskCard
                    key={task.id}
                    task={task}
                    updateScheduleTaskStatus={updateScheduleTaskStatus}
                  />
                ))
              ) : (
                <div className="rounded-lg border border-line bg-white p-4 text-sm text-slate-600">
                  No work has been scheduled for this property yet.
                </div>
              )}
            </div>
          </ConceptCard>
        </div>
      ) : null}

      {activeExperience === "Reports" ? (
        <div className="grid gap-5 lg:grid-cols-[0.8fr_1.2fr]">
          <ConceptCard eyebrow="Report summary" title="Owner-ready presentation">
            <MetricCard label="Inspection Score" value={completedItems ? "A" : "Pending"} detail="Clean report status" />
            <div className="mt-4 grid gap-2">
              <DetailStrip label="Latest type" value={activeReport ? getInspectionType(activeReport.checklist) : "No report yet"} />
              <DetailStrip label="Photos" value={`${activeReport?.photos.length ?? 0} attached`} />
              <DetailStrip label="Timestamp" value={activeReport ? formatDateTime(activeReport.timestamp) : "Awaiting inspection"} />
            </div>
          </ConceptCard>
          <ConceptCard eyebrow="Homeowner report" title="Clean, visual, exportable">
            <div className="grid gap-3 sm:grid-cols-3">
              {[1, 2, 3].map((item) => (
                <div key={item} className="min-h-32 rounded-lg bg-[linear-gradient(135deg,#f6f1e8,#d9e1dc)]" />
              ))}
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              {activeReport ? (
                <a href={`/reports/${activeReport.id}`} className="button-primary rounded-lg px-4 py-3 font-extrabold">
                  Open Report
                </a>
              ) : null}
              <button type="button" className="button-soft rounded-lg px-4 py-3 font-extrabold">
                PDF Export
              </button>
            </div>
          </ConceptCard>
        </div>
      ) : null}

      {activeExperience === "Maintenance" ? (
        <div className="grid gap-5 lg:grid-cols-[0.95fr_1.05fr]">
          <ConceptCard eyebrow="Maintenance issue" title="Create and assign repair work">
            <form className="grid gap-3" onSubmit={saveMaintenanceIssue}>
              <label className="grid gap-2 text-sm font-extrabold">
                Issue title
                <input
                  required
                  value={maintenanceIssueForm.title}
                  onChange={(event) =>
                    setMaintenanceIssueForm((current) => ({ ...current, title: event.target.value }))
                  }
                  className="field-shell rounded-lg p-3"
                  placeholder="Irrigation leak near south gate"
                />
              </label>
              <label className="grid gap-2 text-sm font-extrabold">
                Description
                <textarea
                  rows={4}
                  value={maintenanceIssueForm.description}
                  onChange={(event) =>
                    setMaintenanceIssueForm((current) => ({ ...current, description: event.target.value }))
                  }
                  className="field-shell rounded-lg p-3"
                  placeholder="Document what happened, where it is, and what the owner/vendor should know."
                />
              </label>
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="grid gap-2 text-sm font-extrabold">
                  Priority
                  <select
                    value={maintenanceIssueForm.priority}
                    onChange={(event) =>
                      setMaintenanceIssueForm((current) => ({
                        ...current,
                        priority: event.target.value as MaintenancePriority
                      }))
                    }
                    className="field-shell rounded-lg p-3"
                  >
                    {(["Low", "Medium", "High", "Urgent"] as MaintenancePriority[]).map((priority) => (
                      <option key={priority}>{priority}</option>
                    ))}
                  </select>
                </label>
                <label className="grid gap-2 text-sm font-extrabold">
                  Status
                  <select
                    value={maintenanceIssueForm.status}
                    onChange={(event) =>
                      setMaintenanceIssueForm((current) => ({
                        ...current,
                        status: event.target.value as MaintenanceStatus
                      }))
                    }
                    className="field-shell rounded-lg p-3"
                  >
                    {(["Open", "Scheduled", "In Progress", "Resolved"] as MaintenanceStatus[]).map((status) => (
                      <option key={status}>{status}</option>
                    ))}
                  </select>
                </label>
              </div>
              <label className="grid gap-2 text-sm font-extrabold">
                Vendor assignment
                <select
                  value={maintenanceIssueForm.vendor}
                  onChange={(event) =>
                    setMaintenanceIssueForm((current) => ({ ...current, vendor: event.target.value }))
                  }
                  className="field-shell rounded-lg p-3"
                >
                  <option value="">Select vendor or leave unassigned</option>
                  {selectedVendors.map((vendor) => (
                    <option key={vendor.id} value={vendor.name}>
                      {vendor.type}: {vendor.name}
                    </option>
                  ))}
                </select>
              </label>
              <label className="grid gap-2 text-sm font-extrabold">
                Next step
                <input
                  value={maintenanceIssueForm.nextStep}
                  onChange={(event) =>
                    setMaintenanceIssueForm((current) => ({ ...current, nextStep: event.target.value }))
                  }
                  className="field-shell rounded-lg p-3"
                  placeholder="Call vendor, request estimate, monitor next visit..."
                />
              </label>
              <label className="grid min-h-28 content-center gap-2 rounded-lg border border-dashed border-sage bg-[#f8faf8] p-4 text-sm font-extrabold transition hover:bg-[#eef5ef]">
                Damage photos
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={(event) => addMaintenanceIssuePhotoFiles(event.target.files)}
                  className="text-xs font-medium"
                />
              </label>
              {maintenanceIssueForm.photoFiles.length ? (
                <div className="rounded-lg border border-line bg-[#fbfcfb] p-3 text-sm text-slate-600">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <strong className="text-ink">
                      {maintenanceIssueForm.photoFiles.length} maintenance photo selected
                      {maintenanceIssueForm.photoFiles.length === 1 ? "" : "s"}
                    </strong>
                    <button
                      type="button"
                      onClick={() => setMaintenanceIssueForm((current) => ({ ...current, photoFiles: [] }))}
                      className="font-extrabold text-[#9f352e]"
                    >
                      Clear photos
                    </button>
                  </div>
                  <div className="mt-2 grid gap-1">
                    {maintenanceIssueForm.photoFiles.slice(0, 4).map((file) => (
                      <span key={`${file.name}-${file.lastModified}`} className="truncate text-xs">
                        {file.name}
                      </span>
                    ))}
                  </div>
                </div>
              ) : null}
              {maintenanceSaveMessage ? (
                <div className="rounded-lg border border-line bg-white p-3 text-sm font-semibold text-slate-600">
                  {maintenanceSaveMessage}
                </div>
              ) : null}
              <button
                type="submit"
                disabled={isSavingMaintenanceIssue}
                className="button-primary min-h-12 rounded-lg px-5 font-extrabold disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSavingMaintenanceIssue ? "Saving..." : "Save Maintenance Issue"}
              </button>
            </form>
          </ConceptCard>

          <ConceptCard eyebrow={`${openMaintenanceCount} open item${openMaintenanceCount === 1 ? "" : "s"}`} title="Repair tracking">
            <div className="grid gap-3">
              {maintenanceIssues.length ? (
                maintenanceIssues.map((issue) => (
                  <MaintenanceIssueCard
                    key={issue.id}
                    issue={issue}
                    selectedVendors={selectedVendors}
                    updateMaintenanceStatus={updateMaintenanceStatus}
                    updateMaintenanceIssue={updateMaintenanceIssue}
                  />
                ))
              ) : (
                <div className="rounded-lg border border-line bg-white p-4 text-sm text-slate-600">
                  No maintenance issues have been saved for this property yet.
                </div>
              )}
            </div>
          </ConceptCard>
        </div>
      ) : null}

      {activeExperience === "Owner Portal" ? (
        <div className="grid gap-5 lg:grid-cols-[0.95fr_1.05fr]">
          <ConceptCard eyebrow="Owner portal" title="Peace of mind at a glance">
            <div className="grid gap-3">
              <MetricCard label="Property condition" value="Excellent" detail="No urgent action required" />
              <MetricCard label="Last visit" value={recentReport ? formatDateTime(recentReport.timestamp) : "Pending"} detail="Inspection history" />
            </div>
          </ConceptCard>
          <ConceptCard eyebrow="Activity timeline" title="Transparent service record">
            <div className="grid gap-3">
              {[
                "Inspection report generated",
                "Pool area verified",
                "Cleaner completion confirmed",
                "Owner notification sent"
              ].map((item) => (
                <div key={item} className="rounded-lg border border-line bg-white p-3">
                  <strong className="block">{item}</strong>
                  <span className="text-sm text-slate-600">Timestamped operational update</span>
                </div>
              ))}
            </div>
          </ConceptCard>
        </div>
      ) : null}
    </section>
  );
}

function ConceptCard({
  children,
  eyebrow,
  title
}: {
  children: React.ReactNode;
  eyebrow: string;
  title: string;
}) {
  return (
    <article className="estate-panel rounded-lg p-5">
      <p className="mb-2 text-xs font-extrabold uppercase tracking-[0.12em] text-clay">{eyebrow}</p>
      <h3 className="mb-4 text-2xl font-extrabold text-ink">{title}</h3>
      {children}
    </article>
  );
}

function MetricCard({
  detail,
  label,
  urgent = false,
  value
}: {
  detail: string;
  label: string;
  urgent?: boolean;
  value: string;
}) {
  return (
    <div className={`rounded-lg border p-4 ${urgent ? "border-[#e7cbc4] bg-[#fff8f6]" : "border-line bg-white"}`}>
      <span className="text-xs font-extrabold uppercase tracking-[0.08em] text-slate-500">{label}</span>
      <strong className={`mt-2 block text-3xl font-extrabold ${urgent ? "text-[#9f352e]" : "text-ink"}`}>{value}</strong>
      <span className="mt-1 block text-sm text-slate-600">{detail}</span>
    </div>
  );
}

function ScheduleTaskCard({
  propertyName,
  task,
  updateScheduleTaskStatus
}: {
  propertyName?: string;
  task: ScheduleTask;
  updateScheduleTaskStatus: (taskId: string, status: ScheduleTaskStatus) => void;
}) {
  const statusClass =
    task.status === "Complete"
      ? "border-[#c9ddd1] bg-[#f3f8f4] text-sage-dark"
      : task.status === "Skipped"
        ? "border-[#e7cbc4] bg-[#fff8f6] text-[#9f352e]"
        : "border-line bg-white text-ink";

  return (
    <article className={`rounded-lg border p-4 ${statusClass}`}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <span className="text-xs font-extrabold uppercase tracking-[0.08em] opacity-75">
            {task.type}
          </span>
          <h4 className="mt-1 text-lg font-extrabold">{task.title}</h4>
          {propertyName ? <span className="mt-1 block text-sm opacity-75">{propertyName}</span> : null}
        </div>
        <span className="rounded-full border border-current/20 px-3 py-1 text-xs font-extrabold">
          {task.status}
        </span>
      </div>
      <div className="mt-4 grid gap-2 text-sm sm:grid-cols-2">
        <DetailStrip label="Date" value={formatDateTime(task.scheduledFor)} />
        <DetailStrip label="Assigned To" value={task.assignedTo || "Not assigned"} />
      </div>
      {task.notes ? <p className="mt-3 text-sm leading-6 opacity-80">{task.notes}</p> : null}
      <label className="mt-4 grid gap-2 text-sm font-extrabold">
        Update status
        <select
          value={task.status}
          onChange={(event) => updateScheduleTaskStatus(task.id, event.target.value as ScheduleTaskStatus)}
          className="field-shell rounded-lg p-3"
        >
          {scheduleTaskStatuses.map((status) => (
            <option key={status}>{status}</option>
          ))}
        </select>
      </label>
    </article>
  );
}

function VendorCard({ vendor }: { vendor: VendorContact }) {
  return (
    <article className="rounded-lg border border-line bg-white p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <span className="text-xs font-extrabold uppercase tracking-[0.08em] text-clay">{vendor.type}</span>
          <h4 className="mt-1 text-lg font-extrabold text-ink">{vendor.name}</h4>
        </div>
        {vendor.phone ? (
          <a href={`tel:${vendor.phone}`} className="button-soft rounded-lg px-3 py-2 text-sm font-extrabold">
            Call
          </a>
        ) : null}
      </div>
      <div className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
        <DetailStrip label="Contact" value={vendor.contactName || "Not provided"} />
        <DetailStrip label="Phone" value={vendor.phone || "Not provided"} />
        <DetailStrip label="Email" value={vendor.email || "Not provided"} />
        <DetailStrip label="Notes" value={vendor.notes || "No vendor notes."} />
      </div>
    </article>
  );
}

function MaintenanceIssueCard({
  issue,
  selectedVendors,
  updateMaintenanceStatus,
  updateMaintenanceIssue
}: {
  issue: MaintenanceIssue;
  selectedVendors: VendorContact[];
  updateMaintenanceStatus: (issueId: string, status: MaintenanceStatus) => void;
  updateMaintenanceIssue: (issueId: string, updates: Partial<MaintenanceIssueForm>) => Promise<MaintenanceIssue>;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editForm, setEditForm] = useState<MaintenanceIssueForm>({
    title: issue.title,
    description: issue.description,
    priority: issue.priority,
    status: issue.status,
    vendor: issue.vendor,
    nextStep: issue.nextStep,
    photoFiles: []
  });
  const issuePhotos = issue.photos ?? [];
  const normalizedIssueVendor = issue.vendor.trim().toLowerCase();
  const assignedVendor = selectedVendors.find((vendor) => vendor.name.trim().toLowerCase() === normalizedIssueVendor);
  const priorityClass =
    issue.priority === "Urgent"
      ? "border-[#d9a5a0] bg-[#fff8f6] text-[#9f352e]"
      : issue.priority === "High"
        ? "border-[#ead2a8] bg-[#fff8ed] text-[#7b5426]"
        : "border-line bg-white text-ink";

  async function saveIssueEdits(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSaving(true);

    try {
      const updatedIssue = await updateMaintenanceIssue(issue.id, {
        title: editForm.title,
        description: editForm.description,
        priority: editForm.priority,
        status: editForm.status,
        vendor: editForm.vendor,
        nextStep: editForm.nextStep
      });
      setEditForm({
        title: updatedIssue.title,
        description: updatedIssue.description,
        priority: updatedIssue.priority,
        status: updatedIssue.status,
        vendor: updatedIssue.vendor,
        nextStep: updatedIssue.nextStep,
        photoFiles: []
      });
      setIsEditing(false);
    } catch (error) {
      window.alert(error instanceof Error ? error.message : "Maintenance issue could not be updated.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <article className={`rounded-lg border p-4 ${priorityClass}`}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <span className="text-xs font-extrabold uppercase tracking-[0.08em] opacity-75">{issue.priority}</span>
          <h4 className="mt-1 text-lg font-extrabold">{issue.title}</h4>
        </div>
        <div className="flex flex-wrap justify-end gap-2">
          <span className="rounded-full border border-current/20 px-3 py-1 text-xs font-extrabold">
            {issue.status}
          </span>
          <span className="rounded-full border border-current/20 px-3 py-1 text-xs font-extrabold">
            {issuePhotos.length} photo{issuePhotos.length === 1 ? "" : "s"}
          </span>
        </div>
      </div>
      {issue.description ? <p className="mt-3 text-sm leading-6 opacity-80">{issue.description}</p> : null}
      {issuePhotos.length ? (
        <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3">
          {issuePhotos.map((photo) => (
            <a
              key={photo.id}
              href={photo.url}
              target="_blank"
              className="overflow-hidden rounded-lg border border-line bg-white"
            >
              <img src={photo.url} alt={photo.name} className="h-28 w-full bg-slate-100 object-cover" />
            </a>
          ))}
        </div>
      ) : (
        <div className="mt-4 rounded-lg border border-line bg-white/70 p-3 text-sm opacity-75">
          No damage photos are attached to this issue.
        </div>
      )}
      <div className="mt-4 grid gap-2 text-sm sm:grid-cols-2">
        <DetailStrip label="Vendor" value={issue.vendor || "Not assigned"} />
        <DetailStrip label="Next Step" value={issue.nextStep || "Review needed"} />
      </div>
      {issue.vendor ? (
        <div className="mt-4 rounded-lg border border-line bg-white/80 p-3">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <span className="text-xs font-extrabold uppercase tracking-[0.08em] text-clay">
                Assigned Vendor
              </span>
              <strong className="mt-1 block text-ink">{assignedVendor?.name || issue.vendor}</strong>
              <span className="mt-1 block text-sm opacity-75">
                {assignedVendor
                  ? `${assignedVendor.type}${assignedVendor.contactName ? ` / ${assignedVendor.contactName}` : ""}`
                  : "No saved vendor match found"}
              </span>
            </div>
            {assignedVendor?.phone ? (
              <a href={`tel:${assignedVendor.phone}`} className="button-soft rounded-lg px-3 py-2 text-sm font-extrabold">
                Call Vendor
              </a>
            ) : (
              <span className="rounded-lg border border-line bg-[#fbfcfb] px-3 py-2 text-sm font-extrabold opacity-75">
                No phone saved
              </span>
            )}
          </div>
          <div className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
            <DetailStrip label="Phone" value={assignedVendor?.phone || "Not provided"} />
            <DetailStrip label="Email" value={assignedVendor?.email || "Not provided"} />
          </div>
        </div>
      ) : null}
      <div className="mt-4 grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end">
        <label className="grid gap-2 text-sm font-extrabold">
          Update status
          <select
            value={issue.status}
            onChange={(event) => updateMaintenanceStatus(issue.id, event.target.value as MaintenanceStatus)}
            className="field-shell rounded-lg p-3"
          >
            {(["Open", "Scheduled", "In Progress", "Resolved"] as MaintenanceStatus[]).map((status) => (
              <option key={status}>{status}</option>
            ))}
          </select>
        </label>
        <button
          type="button"
          onClick={() => {
            setEditForm({
              title: issue.title,
              description: issue.description,
              priority: issue.priority,
              status: issue.status,
              vendor: issue.vendor,
              nextStep: issue.nextStep,
              photoFiles: []
            });
            setIsEditing((current) => !current);
          }}
          className="button-soft min-h-11 rounded-lg px-4 font-extrabold"
        >
          {isEditing ? "Close Edit" : "Edit Details"}
        </button>
      </div>
      {isEditing ? (
        <form className="mt-4 grid gap-3 rounded-lg border border-line bg-white/70 p-3" onSubmit={saveIssueEdits}>
          <label className="grid gap-2 text-sm font-extrabold">
            Issue title
            <input
              required
              value={editForm.title}
              onChange={(event) => setEditForm((current) => ({ ...current, title: event.target.value }))}
              className="field-shell rounded-lg p-3"
            />
          </label>
          <label className="grid gap-2 text-sm font-extrabold">
            Description
            <textarea
              rows={3}
              value={editForm.description}
              onChange={(event) => setEditForm((current) => ({ ...current, description: event.target.value }))}
              className="field-shell rounded-lg p-3"
            />
          </label>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="grid gap-2 text-sm font-extrabold">
              Priority
              <select
                value={editForm.priority}
                onChange={(event) =>
                  setEditForm((current) => ({ ...current, priority: event.target.value as MaintenancePriority }))
                }
                className="field-shell rounded-lg p-3"
              >
                {(["Low", "Medium", "High", "Urgent"] as MaintenancePriority[]).map((priority) => (
                  <option key={priority}>{priority}</option>
                ))}
              </select>
            </label>
            <label className="grid gap-2 text-sm font-extrabold">
              Status
              <select
                value={editForm.status}
                onChange={(event) =>
                  setEditForm((current) => ({ ...current, status: event.target.value as MaintenanceStatus }))
                }
                className="field-shell rounded-lg p-3"
              >
                {(["Open", "Scheduled", "In Progress", "Resolved"] as MaintenanceStatus[]).map((status) => (
                  <option key={status}>{status}</option>
                ))}
              </select>
            </label>
          </div>
          <label className="grid gap-2 text-sm font-extrabold">
            Vendor
            <input
              value={editForm.vendor}
              onChange={(event) => setEditForm((current) => ({ ...current, vendor: event.target.value }))}
              className="field-shell rounded-lg p-3"
              list={`vendor-options-${issue.id}`}
            />
            <datalist id={`vendor-options-${issue.id}`}>
              {selectedVendors.map((vendor) => (
                <option key={vendor.id} value={vendor.name} />
              ))}
            </datalist>
          </label>
          <label className="grid gap-2 text-sm font-extrabold">
            Next step
            <input
              value={editForm.nextStep}
              onChange={(event) => setEditForm((current) => ({ ...current, nextStep: event.target.value }))}
              className="field-shell rounded-lg p-3"
            />
          </label>
          <div className="flex flex-wrap justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsEditing(false)}
              className="button-soft min-h-11 rounded-lg px-4 font-extrabold"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="button-primary min-h-11 rounded-lg px-4 font-extrabold disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSaving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      ) : null}
      <span className="mt-3 block text-xs font-semibold opacity-65">{formatDateTime(issue.createdAt)}</span>
    </article>
  );
}

function DetailStrip({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-line bg-white p-3">
      <span className="block text-xs font-extrabold uppercase tracking-[0.08em] text-slate-500">{label}</span>
      <strong className="mt-1 block text-ink">{value}</strong>
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
    <article className="min-h-[420px] rounded-lg border border-line bg-gradient-to-b from-white to-[#fbfcfb] p-5 shadow-[0_12px_28px_rgba(35,45,41,0.05)]">
      <h3 className="text-2xl font-extrabold text-ink">{property.name}</h3>
      <p className="mt-2 text-sm text-slate-600">
        {property.owner} / {property.address}
      </p>
      <ReportRow label="Date" value={formatDateTime(inspection.timestamp)} />
      <ReportRow label="Inspection Type" value={getInspectionType(inspection.checklist)} />
      <ReportRow label="Inspector" value={inspection.inspectorName} />
      <ReportRow label="Temperature" value={`${inspection.interiorTemperature} F`} />
      <ReportRow
        label="Urgent"
        value={inspection.urgent}
        valueClassName={inspection.urgent === "Yes" ? "text-[#b93f35] font-black" : ""}
      />
      <ReportRow label="Photos" value={`${inspection.photos.length} uploaded`} />

      <h4 className="mb-2 mt-5 text-sm font-extrabold uppercase">Completed Checks</h4>
      {visibleChecklistItems(inspection.checklist).length ? (
        <div className="grid gap-4">
          {groupChecklistItems(inspection.checklist).map((section) =>
            section.items.length ? (
              <section key={section.title}>
                <h5 className="mb-2 text-xs font-black uppercase tracking-[0.08em] text-clay">{section.title}</h5>
                <ul className="list-disc space-y-2 pl-5">
                  {section.items.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </section>
            ) : null
          )}
        </div>
      ) : (
        <p className="text-sm text-slate-600">No checklist items were marked complete.</p>
      )}

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
                className="overflow-hidden rounded-lg border border-line bg-white transition hover:border-sage"
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
      <strong className={`break-words ${valueClassName}`}>{value}</strong>
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
        className="field-shell rounded-lg p-3"
      />
    </label>
  );
}
