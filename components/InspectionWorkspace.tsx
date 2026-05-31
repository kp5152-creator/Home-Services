"use client";

import { Dispatch, FormEvent, SetStateAction, useEffect, useMemo, useState } from "react";
import {
  defaultInspectionType,
  getInspectionTemplate,
  getInspectionType,
  groupChecklistItems,
  inspectionTemplates,
  visibleChecklistItems,
  withInspectionType
} from "@/utils/checklists";
import type { InspectionType } from "@/utils/checklists";
import { trackAnalyticsEvent, useWorkflowAnalytics } from "@/hooks/useAnalytics";
import { demoDatabase } from "@/reports/demoData";
import type {
  Database,
  Inspection,
  MaintenanceIssue,
  MaintenancePriority,
  MaintenanceStatus,
  OwnerUpdate,
  OwnerUpdateCategory,
  OwnerUpdateStatus,
  PilotDatabase,
  PilotUsageSummary,
  Property,
  ScheduleTask,
  ScheduleTaskStatus,
  ScheduleTaskType,
  FeedbackRecord,
  FeedbackSentiment,
  FeedbackType,
  UrgentStatus,
  VendorContact,
  VendorType
} from "@/utils/types";

type NewPropertyForm = {
  name: string;
  owner: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  phone: string;
  email: string;
  accessNotes: string;
  photoUrl: string;
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

type InspectionPhotoCategory = "Exterior" | "Interior" | "Issues";

type CategorizedPhotoFile = {
  file: File;
  category: InspectionPhotoCategory;
};

type MaintenanceRecommendation = {
  priority: MaintenancePriority;
  vendorType: VendorType;
  nextStep: string;
  ownerExplanation: string;
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

type OwnerUpdateForm = {
  category: OwnerUpdateCategory;
  title: string;
  message: string;
  status: OwnerUpdateStatus;
};

type FeedbackForm = {
  type: FeedbackType;
  sentiment: FeedbackSentiment;
  message: string;
  email: string;
  rating: string;
};

type InspectionForm = {
  inspectionType: InspectionType;
  inspectorName: string;
  interiorTemperature: string;
  checklist: string[];
  executiveSummary: string;
  notes: string;
  urgent: UrgentStatus;
  photoFiles: CategorizedPhotoFile[];
};

type ExperienceScreen =
  | "Login"
  | "Dashboard"
  | "Pilot Admin"
  | "Property"
  | "Inspection"
  | "Schedule"
  | "Reports"
  | "Maintenance"
  | "Owner Portal";

export type AppRole = "Admin" | "Inspector" | "Homeowner";

const roleLabels: Record<AppRole, { title: string; description: string; firstScreen: ExperienceScreen }> = {
  Admin: {
    title: "Command Center",
    description: "Portfolio operations, reports, vendors, scheduling, and owner communication in one calm workspace.",
    firstScreen: "Dashboard"
  },
  Inspector: {
    title: "Inspector",
    description: "Focused field workflow for inspections, photos, maintenance issues, and property confirmation.",
    firstScreen: "Dashboard"
  },
  Homeowner: {
    title: "Owner Portal",
    description: "Private homeowner view for property condition, shared updates, and report access.",
    firstScreen: "Owner Portal"
  }
};

const emptyInspectionForm: InspectionForm = {
  inspectionType: defaultInspectionType,
  inspectorName: "",
  interiorTemperature: "",
  checklist: [],
  executiveSummary: "",
  notes: "",
  urgent: "No",
  photoFiles: []
};

const emptyFeedbackForm: FeedbackForm = {
  type: "Feature Request",
  sentiment: "Neutral",
  message: "",
  email: "",
  rating: ""
};

const emptyPropertyForm: NewPropertyForm = {
  name: "",
  owner: "",
  address: "",
  city: "",
  state: "CA",
  zip: "",
  phone: "",
  email: "",
  accessNotes: "",
  photoUrl: ""
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

const emptyOwnerUpdateForm: OwnerUpdateForm = {
  category: "General",
  title: "",
  message: "",
  status: "Draft"
};

const vendorTypes: VendorType[] = ["Pool", "Landscape", "HVAC", "Cleaning", "Handyman", "Plumbing", "Electrical", "Other"];
const ownerUpdateCategories: OwnerUpdateCategory[] = ["Inspection", "Maintenance", "Vendor", "Arrival", "General"];
const ownerUpdateStatuses: OwnerUpdateStatus[] = ["Draft", "Shared", "Archived"];
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
  "Dashboard",
  "Property",
  "Inspection",
  "Maintenance",
  "Schedule",
  "Reports",
  "Owner Portal",
  "Pilot Admin"
];

function roleExperienceScreens(role: AppRole): ExperienceScreen[] {
  if (role === "Homeowner") return ["Dashboard", "Owner Portal", "Reports"];
  if (role === "Inspector") return ["Dashboard", "Property", "Inspection", "Maintenance", "Schedule", "Reports"];

  return experienceScreens;
}

function mobileRoleExperienceScreens(role: AppRole, activeExperience: ExperienceScreen): ExperienceScreen[] {
  const primaryScreens =
    role === "Homeowner"
      ? (["Dashboard", "Owner Portal", "Reports"] as ExperienceScreen[])
      : role === "Inspector"
        ? (["Dashboard", "Property", "Inspection", "Maintenance", "Reports"] as ExperienceScreen[])
        : (["Dashboard", "Property", "Inspection", "Maintenance", "Reports"] as ExperienceScreen[]);

  if (
    activeExperience !== "Login" &&
    activeExperience !== "Dashboard" &&
    !primaryScreens.includes(activeExperience)
  ) {
    return [...primaryScreens.slice(0, -1), activeExperience];
  }

  return primaryScreens;
}

function mobileScreenLabel(screen: ExperienceScreen) {
  const labels: Partial<Record<ExperienceScreen, string>> = {
    Dashboard: "Home",
    Inspection: "Inspect",
    "Owner Portal": "Owner",
    Maintenance: "Issues",
    "Pilot Admin": "Pilot"
  };

  return labels[screen] ?? screen;
}

function screenLabel(screen: ExperienceScreen) {
  return mobileScreenLabel(screen);
}

function formatPhoneNumber(value: string) {
  const digits = value.replace(/\D/g, "");
  const localDigits = digits.length === 11 && digits.startsWith("1") ? digits.slice(1) : digits;
  const phoneDigits = localDigits.slice(0, 10);
  const area = phoneDigits.slice(0, 3);
  const prefix = phoneDigits.slice(3, 6);
  const line = phoneDigits.slice(6, 10);

  if (phoneDigits.length > 6) return `(${area}) ${prefix}-${line}`;
  if (phoneDigits.length > 3) return `(${area}) ${prefix}`;
  if (phoneDigits.length > 0) return `(${area}`;

  return "";
}

function propertyToForm(property: Property): NewPropertyForm {
  return {
    name: property.name,
    owner: property.owner,
    address: property.address,
    city: "",
    state: "CA",
    zip: "",
    phone: property.phone,
    email: property.email,
    accessNotes: property.accessNotes,
    photoUrl: property.photoUrl ?? ""
  };
}

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

function photoUploadToDemoPhoto(
  photo: Awaited<ReturnType<typeof fileToPhotoUpload>>,
  prefix: "inspection" | "maintenance",
  index: number
) {
  return {
    id: `demo-${prefix}-photo-${Date.now()}-${index}`,
    name: photo.name,
    url: photo.data,
    mimeType: photo.type,
    size: photo.data.length
  };
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
  initialDatabase,
  initialDemoRole,
  initialRole
}: {
  initialDatabase: Database;
  initialDemoRole?: AppRole;
  initialRole?: AppRole;
}) {
  const [properties, setProperties] = useState<Property[]>(initialDatabase.properties);
  const [inspections, setInspections] = useState<Inspection[]>(initialDatabase.inspections);
  const [maintenanceIssues, setMaintenanceIssues] = useState<MaintenanceIssue[]>(
    initialDatabase.maintenanceIssues ?? []
  );
  const [vendors, setVendors] = useState<VendorContact[]>(initialDatabase.vendors ?? []);
  const [scheduleTasks, setScheduleTasks] = useState<ScheduleTask[]>(initialDatabase.scheduleTasks ?? []);
  const [ownerUpdates, setOwnerUpdates] = useState<OwnerUpdate[]>(initialDatabase.ownerUpdates ?? []);
  const [selectedPropertyId, setSelectedPropertyId] = useState(initialDatabase.properties[0]?.id ?? "");
  const [activeReportId, setActiveReportId] = useState(initialDatabase.inspections[0]?.id ?? "");
  const [selectedReportActionId, setSelectedReportActionId] = useState("");
  const [inspectionForm, setInspectionForm] = useState<InspectionForm>(emptyInspectionForm);
  const [propertyForm, setPropertyForm] = useState<NewPropertyForm>(emptyPropertyForm);
  const [maintenanceIssueForm, setMaintenanceIssueForm] =
    useState<MaintenanceIssueForm>(emptyMaintenanceIssueForm);
  const [vendorForm, setVendorForm] = useState<VendorForm>(emptyVendorForm);
  const [scheduleTaskForm, setScheduleTaskForm] = useState<ScheduleTaskForm>(emptyScheduleTaskForm);
  const [ownerUpdateForm, setOwnerUpdateForm] = useState<OwnerUpdateForm>(emptyOwnerUpdateForm);
  const [vendorSaveMessage, setVendorSaveMessage] = useState("");
  const [isSavingVendor, setIsSavingVendor] = useState(false);
  const [scheduleSaveMessage, setScheduleSaveMessage] = useState("");
  const [isSavingScheduleTask, setIsSavingScheduleTask] = useState(false);
  const [ownerUpdateSaveMessage, setOwnerUpdateSaveMessage] = useState("");
  const [isSavingOwnerUpdate, setIsSavingOwnerUpdate] = useState(false);
  const [suggestedSummary, setSuggestedSummary] = useState("");
  const [suggestedSummaryMessage, setSuggestedSummaryMessage] = useState("");
  const [inspectionSaveMessage, setInspectionSaveMessage] = useState("");
  const [isSavingInspection, setIsSavingInspection] = useState(false);
  const [propertySaveMessage, setPropertySaveMessage] = useState("");
  const [isSavingProperty, setIsSavingProperty] = useState(false);
  const [maintenanceRecommendation, setMaintenanceRecommendation] = useState<MaintenanceRecommendation | null>(null);
  const [maintenanceRecommendationMessage, setMaintenanceRecommendationMessage] = useState("");
  const [maintenanceSaveMessage, setMaintenanceSaveMessage] = useState("");
  const [isSavingMaintenanceIssue, setIsSavingMaintenanceIssue] = useState(false);
  const [pilotDatabase, setPilotDatabase] = useState<PilotDatabase | null>(null);
  const [pilotUsageSummary, setPilotUsageSummary] = useState<PilotUsageSummary | null>(null);
  const [feedbackItems, setFeedbackItems] = useState<FeedbackRecord[]>([]);
  const [feedbackForm, setFeedbackForm] = useState<FeedbackForm>(emptyFeedbackForm);
  const [feedbackMessage, setFeedbackMessage] = useState("");
  const [isSavingFeedback, setIsSavingFeedback] = useState(false);
  const [showPropertyForm, setShowPropertyForm] = useState(false);
  const [editingPropertyId, setEditingPropertyId] = useState("");
  const [showVendorForm, setShowVendorForm] = useState(false);
  const [selectedVendorId, setSelectedVendorId] = useState("");
  const [showMaintenanceForm, setShowMaintenanceForm] = useState(false);
  const [selectedMaintenanceIssueId, setSelectedMaintenanceIssueId] = useState("");
  const [activeExperience, setActiveExperience] = useState<ExperienceScreen>("Login");
  const [activeRole, setActiveRole] = useState<AppRole>("Admin");
  const [demoMode, setDemoMode] = useState(false);
  const [hasAppliedInitialDemoRole, setHasAppliedInitialDemoRole] = useState(false);
  const [hasAppliedInitialRole, setHasAppliedInitialRole] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [now] = useState(() => new Date());
  const visibleExperienceScreens = roleExperienceScreens(activeRole);
  const desktopNavigationScreens = visibleExperienceScreens.includes("Dashboard")
    ? (["Dashboard", ...visibleExperienceScreens.filter((screen) => screen !== "Dashboard")] as ExperienceScreen[])
    : visibleExperienceScreens;
  const mobileExperienceScreens = mobileRoleExperienceScreens(activeRole, activeExperience).filter((screen) =>
    visibleExperienceScreens.includes(screen)
  );

  const selectedProperty = useMemo(
    () => properties.find((property) => property.id === selectedPropertyId) ?? properties[0],
    [properties, selectedPropertyId]
  );
  useWorkflowAnalytics({
    screen: activeExperience,
    role: activeRole,
    demoMode,
    propertyId: selectedProperty?.id
  });

  useEffect(() => {
    if (activeExperience !== "Login" && !visibleExperienceScreens.includes(activeExperience)) {
      setActiveExperience(roleLabels[activeRole].firstScreen);
    }
  }, [activeExperience, activeRole, visibleExperienceScreens]);

  useEffect(() => {
    if (activeRole !== "Admin") return;

    void refreshPilotConsole();
  }, [activeRole]);

  useEffect(() => {
    if (!initialDemoRole || hasAppliedInitialDemoRole) return;

    setHasAppliedInitialDemoRole(true);
    loadDemoMode(initialDemoRole);
  }, [hasAppliedInitialDemoRole, initialDemoRole]);

  useEffect(() => {
    if (!initialRole || initialDemoRole || hasAppliedInitialRole) return;

    setHasAppliedInitialRole(true);
    enterRole(initialRole);
  }, [hasAppliedInitialRole, initialDemoRole, initialRole]);

  const selectedInspections = useMemo(
    () => inspections.filter((inspection) => inspection.propertyId === selectedProperty?.id),
    [inspections, selectedProperty?.id]
  );

  const selectedMaintenanceIssues = useMemo(
    () => maintenanceIssues.filter((issue) => issue.propertyId === selectedProperty?.id),
    [maintenanceIssues, selectedProperty?.id]
  );
  const selectedMaintenanceIssue = useMemo(
    () => selectedMaintenanceIssues.find((issue) => issue.id === selectedMaintenanceIssueId) ?? null,
    [selectedMaintenanceIssueId, selectedMaintenanceIssues]
  );

  const selectedVendors = useMemo(
    () => vendors.filter((vendor) => vendor.propertyId === selectedProperty?.id),
    [vendors, selectedProperty?.id]
  );
  const selectedVendor = useMemo(
    () => selectedVendors.find((vendor) => vendor.id === selectedVendorId) ?? null,
    [selectedVendorId, selectedVendors]
  );

  const selectedScheduleTasks = useMemo(
    () =>
      scheduleTasks
        .filter((task) => task.propertyId === selectedProperty?.id)
        .slice()
        .sort((a, b) => new Date(a.scheduledFor).getTime() - new Date(b.scheduledFor).getTime()),
    [scheduleTasks, selectedProperty?.id]
  );

  const selectedOwnerUpdates = useMemo(
    () =>
      ownerUpdates
        .filter((update) => update.propertyId === selectedProperty?.id)
        .slice()
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
    [ownerUpdates, selectedProperty?.id]
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
  const selectedReportAction =
    selectedInspections.find((inspection) => inspection.id === selectedReportActionId) ?? null;
  const reportRouteId = (inspection: Inspection) =>
    demoMode && inspection.id.startsWith("demo-inspection-") && !demoDatabase.inspections.some((item) => item.id === inspection.id)
      ? demoDatabase.inspections[0]?.id ?? inspection.id
      : inspection.id;
  const selectedNextScheduleTask = selectedScheduleTasks.find((task) => !["Complete", "Skipped"].includes(task.status));
  const activeInspectionTemplate = useMemo(
    () => getInspectionTemplate(inspectionForm.inspectionType),
    [inspectionForm.inspectionType]
  );
  const inspectionTotalChecks = activeInspectionTemplate.sections.flatMap((section) => section.items).length;
  const inspectionTemperature = Number(inspectionForm.interiorTemperature);
  const inspectionReadyMessage = !inspectionForm.inspectorName.trim()
    ? "Add inspector name to generate the homeowner report."
    : !inspectionForm.interiorTemperature.trim()
      ? "Add interior temperature to generate the homeowner report."
      : !Number.isFinite(inspectionTemperature) || inspectionTemperature < 40 || inspectionTemperature > 120
        ? "Enter a realistic interior temperature to generate the homeowner report."
        : !inspectionForm.checklist.length
          ? "Select at least one checklist item to generate the homeowner report."
          : "";
  const inspectionReady = !inspectionReadyMessage;
  const allInspectionChecklistItems = activeInspectionTemplate.sections.flatMap((section) => section.items);

  function draftOwnerUpdateFromReport(inspection: Inspection) {
    const status = reportConditionStatus(inspection);
    const summary =
      inspection.executiveSummary ||
      status.description ||
      "The latest inspection report is ready for homeowner review.";

    setOwnerUpdateForm((current) => ({
      ...current,
      category: "Inspection",
      status: "Draft",
      title: `${selectedProperty?.name || "Property"} inspection report ready`,
      message: `${summary} The homeowner packet is available for review and includes ${visibleChecklistItems(
        inspection.checklist
      ).length} completed checklist items and ${inspection.photos.length} photo${
        inspection.photos.length === 1 ? "" : "s"
      }.`
    }));
    setActiveExperience("Owner Portal");
  }

  async function refreshPilotConsole() {
    try {
      const [pilotResponse, feedbackResponse] = await Promise.all([fetch("/api/pilot"), fetch("/api/feedback")]);

      if (pilotResponse.ok) {
        const pilotData = (await pilotResponse.json()) as {
          pilot: PilotDatabase;
          usageSummary: PilotUsageSummary;
        };
        setPilotDatabase(pilotData.pilot);
        setPilotUsageSummary(pilotData.usageSummary);
      }

      if (feedbackResponse.ok) {
        const feedbackData = (await feedbackResponse.json()) as { feedback: FeedbackRecord[] };
        setFeedbackItems(feedbackData.feedback);
      }
    } catch {
      setFeedbackMessage("Pilot console data could not be refreshed. Check the local API and try again.");
    }
  }

  async function saveFeedback(event?: FormEvent<HTMLFormElement>, quickType?: FeedbackType, quickSentiment?: FeedbackSentiment) {
    event?.preventDefault();
    const type = quickType ?? feedbackForm.type;
    const sentiment = quickSentiment ?? feedbackForm.sentiment;
    const message =
      quickType === "Thumbs Up"
        ? "Quick positive signal from the current workflow."
        : quickType === "Thumbs Down"
          ? "Quick negative signal from the current workflow."
          : feedbackForm.message.trim();

    if (!message) {
      setFeedbackMessage("Add a short note so the feedback is useful.");
      return;
    }

    setIsSavingFeedback(true);
    setFeedbackMessage("Saving feedback...");

    try {
      const response = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type,
          sentiment,
          message,
          role: activeRole,
          screen: activeExperience,
          propertyId: selectedProperty?.id,
          email: feedbackForm.email,
          rating: feedbackForm.rating
        })
      });

      if (!response.ok) {
        setFeedbackMessage("Feedback could not be saved. Please try again.");
        return;
      }

      const data = (await response.json()) as { feedback: FeedbackRecord };
      setFeedbackItems((current) => [data.feedback, ...current]);
      setFeedbackForm(emptyFeedbackForm);
      setFeedbackMessage("Feedback saved. This will help shape the pilot.");
      trackAnalyticsEvent({
        name: "workflow_step",
        role: activeRole,
        screen: activeExperience,
        workflow: "feedback",
        target: type,
        demoMode,
        metadata: { sentiment }
      });
    } catch {
      setFeedbackMessage("Feedback could not be saved. Check your connection and try again.");
    } finally {
      setIsSavingFeedback(false);
    }
  }

  async function toggleFeatureFlag(featureId: string) {
    await fetch("/api/pilot", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "toggle-feature", featureId })
    });
    await refreshPilotConsole();
  }

  async function resetPilotAccount(organizationId: string) {
    await fetch("/api/pilot", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "reset-account", organizationId })
    });
    await refreshPilotConsole();
  }

  async function saveInspection(event?: FormEvent<HTMLFormElement>) {
    event?.preventDefault();
    if (!selectedProperty) {
      setInspectionSaveMessage("Select or create a property before generating a report.");
      return;
    }

    const inspectorName = inspectionForm.inspectorName.trim();
    const temperature = Number(inspectionForm.interiorTemperature);
    const demoChecklist = inspectionForm.checklist.length
      ? inspectionForm.checklist
      : activeInspectionTemplate.sections.flatMap((section) => section.items).slice(0, 6);
    const reportInspectorName = demoMode && !inspectorName ? "Demo Inspector" : inspectorName;
    const reportTemperature =
      demoMode && (!Number.isFinite(temperature) || temperature < 40 || temperature > 120) ? 76 : temperature;
    const reportChecklist = demoMode ? demoChecklist : inspectionForm.checklist;

    if (!demoMode && !inspectorName) {
      setInspectionSaveMessage("Add the inspector name before generating the homeowner report.");
      return;
    }

    if (!demoMode && (!Number.isFinite(temperature) || temperature < 40 || temperature > 120)) {
      setInspectionSaveMessage("Enter a realistic interior temperature before generating the report.");
      return;
    }

    if (!demoMode && !inspectionForm.checklist.length) {
      setInspectionSaveMessage("Complete at least one checklist item before generating the report.");
      return;
    }

    setIsSavingInspection(true);
    setInspectionSaveMessage("Preparing homeowner report...");
    trackAnalyticsEvent({
      name: "workflow_step",
      role: activeRole,
      screen: activeExperience,
      workflow: "inspection",
      target: "report_submit_attempt",
      demoMode,
      metadata: {
        checklistItems: inspectionForm.checklist.length,
        photoCount: inspectionForm.photoFiles.length,
        urgent: inspectionForm.urgent === "Yes"
      }
    });

    let photos: Awaited<ReturnType<typeof fileToPhotoUpload>>[];

    try {
      photos = await Promise.all(
        inspectionForm.photoFiles.map(async ({ category, file }) => {
          const photo = await fileToPhotoUpload(file);
          return {
            ...photo,
            name: `${category}__${photo.name}`
          };
        })
      );
    } catch {
      setInspectionSaveMessage("One or more photos could not be processed. Please try JPEG or PNG photos.");
      setIsSavingInspection(false);
      return;
    }

    if (demoMode) {
      const now = new Date().toISOString();
      const inspection: Inspection = {
        id: `demo-inspection-${Date.now()}`,
        propertyId: selectedProperty.id,
        timestamp: now,
        inspectorName: reportInspectorName,
        interiorTemperature: String(Math.round(reportTemperature)),
        checklist: withInspectionType(reportChecklist, inspectionForm.inspectionType),
        executiveSummary: inspectionForm.executiveSummary,
        notes: inspectionForm.notes,
        urgent: inspectionForm.urgent,
        photos: photos.map((photo, index) => photoUploadToDemoPhoto(photo, "inspection", index))
      };

      setInspections((current) => [inspection, ...current]);
      setActiveReportId(inspection.id);
      setSelectedReportActionId(inspection.id);
      setInspectionForm(emptyInspectionForm);
      setActiveExperience("Reports");
      setInspectionSaveMessage("Demo report created locally and opened.");
      setIsSavingInspection(false);
      trackAnalyticsEvent({
        name: "workflow_step",
        role: activeRole,
        screen: activeExperience,
        workflow: "inspection",
        target: "report_created",
        demoMode: true,
        metadata: { photoCount: inspection.photos.length, urgent: inspection.urgent === "Yes" }
      });
      return;
    }

    const saveController = new AbortController();
    const saveTimeout = window.setTimeout(() => saveController.abort(), 30000);

    try {
      const response = await fetch("/api/inspections", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: saveController.signal,
        body: JSON.stringify({
          ...inspectionForm,
          inspectorName: reportInspectorName,
          interiorTemperature: String(Math.round(reportTemperature)),
          photoFiles: undefined,
          photos,
          propertyId: selectedProperty.id
        })
      });

      if (!response.ok) {
        const error = (await response.json().catch(() => null)) as { message?: string } | null;
        setInspectionSaveMessage(error?.message || "Inspection report could not be saved. Please try again.");
        return;
      }

      const inspection = (await response.json()) as Inspection;
      setInspections((current) => [inspection, ...current]);
      setActiveReportId(inspection.id);
      setSelectedReportActionId(inspection.id);
      setInspectionForm(emptyInspectionForm);
      setActiveExperience("Reports");
      setInspectionSaveMessage("Homeowner report generated and opened.");
      trackAnalyticsEvent({
        name: "workflow_step",
        role: activeRole,
        screen: activeExperience,
        workflow: "inspection",
        target: "report_created",
        demoMode,
        metadata: { photoCount: inspection.photos.length, urgent: inspection.urgent === "Yes" }
      });
    } catch (error) {
      const timedOut = error instanceof DOMException && error.name === "AbortError";
      setInspectionSaveMessage(
        timedOut
          ? "Report generation took too long. Please try again."
          : "Inspection report could not be saved. Check your connection and try again."
      );
    } finally {
      window.clearTimeout(saveTimeout);
      setIsSavingInspection(false);
    }
  }

  function openAddPropertyForm() {
    setEditingPropertyId("");
    setPropertyForm(emptyPropertyForm);
    setPropertySaveMessage("");
    setShowPropertyForm(true);
  }

  function openEditPropertyForm(property: Property) {
    setEditingPropertyId(property.id);
    setPropertyForm(propertyToForm(property));
    setPropertySaveMessage("");
    setShowPropertyForm(true);
  }

  async function saveProperty(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSavingProperty(true);
    setPropertySaveMessage(editingPropertyId ? "Updating property..." : "Saving property...");
    const locality = [propertyForm.city.trim(), propertyForm.state.trim(), propertyForm.zip.trim()]
      .filter(Boolean)
      .join(" ");
    const fullAddress = [
      propertyForm.address.trim(),
      locality
    ]
      .filter(Boolean)
      .join(", ");
    const savedAddress =
      fullAddress ||
      (editingPropertyId
        ? properties.find((property) => property.id === editingPropertyId)?.address ?? ""
        : "");

    if (demoMode) {
      if (editingPropertyId) {
        const updatedProperty = properties.find((property) => property.id === editingPropertyId);

        if (!updatedProperty) {
          setPropertySaveMessage("Property could not be found.");
          setIsSavingProperty(false);
          return;
        }

        const property: Property = {
          ...updatedProperty,
          name: propertyForm.name || updatedProperty.name,
          owner: propertyForm.owner || updatedProperty.owner,
          address: savedAddress || updatedProperty.address,
          phone: propertyForm.phone,
          email: propertyForm.email,
          accessNotes: propertyForm.accessNotes,
          photoUrl: propertyForm.photoUrl
        };

        setProperties((current) => current.map((item) => (item.id === property.id ? property : item)));
        setSelectedPropertyId(property.id);
        setPropertyForm(emptyPropertyForm);
        setEditingPropertyId("");
        setPropertySaveMessage(`Demo property updated: ${property.name}`);
        setTimeout(() => {
          setShowPropertyForm(false);
          setPropertySaveMessage("");
        }, 650);
        setIsSavingProperty(false);
        return;
      }

      const property: Property = {
        id: `demo-property-${Date.now()}`,
        name: propertyForm.name || "Demo Property",
        owner: propertyForm.owner || "Sample Homeowner",
        address: savedAddress || "Coachella Valley, CA",
        phone: propertyForm.phone,
        email: propertyForm.email,
        accessNotes: propertyForm.accessNotes,
        photoUrl: propertyForm.photoUrl,
        status: "Active"
      };

      setProperties((current) => [property, ...current]);
      setSelectedPropertyId(property.id);
      setActiveReportId("");
      setPropertyForm(emptyPropertyForm);
      setEditingPropertyId("");
      setPropertySaveMessage(`Demo property added locally: ${property.name}`);
      setTimeout(() => {
        setShowPropertyForm(false);
        setPropertySaveMessage("");
      }, 650);
      setIsSavingProperty(false);
      return;
    }

    try {
      const response = await fetch("/api/properties", {
        method: editingPropertyId ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...propertyForm,
          id: editingPropertyId,
          address: savedAddress
        })
      });

      if (!response.ok) {
        const error = (await response.json().catch(() => null)) as { message?: string } | null;
        setPropertySaveMessage(error?.message || "Property could not be saved. Please try again.");
        setIsSavingProperty(false);
        return;
      }

      const property = (await response.json()) as Property;
      setProperties((current) =>
        editingPropertyId ? current.map((item) => (item.id === property.id ? property : item)) : [property, ...current]
      );
      setSelectedPropertyId(property.id);
      setActiveReportId("");
      setPropertyForm(emptyPropertyForm);
      setEditingPropertyId("");
      setPropertySaveMessage(editingPropertyId ? `Property updated: ${property.name}` : `Property saved: ${property.name}`);
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

    if (demoMode) {
      setProperties((current) => current.filter((item) => item.id !== property.id));
      setInspections((current) => current.filter((inspection) => inspection.propertyId !== property.id));
      setMaintenanceIssues((current) => current.filter((issue) => issue.propertyId !== property.id));
      setVendors((current) => current.filter((vendor) => vendor.propertyId !== property.id));
      setScheduleTasks((current) => current.filter((task) => task.propertyId !== property.id));
      setOwnerUpdates((current) => current.filter((update) => update.propertyId !== property.id));
      setSelectedPropertyId((current) => (current === property.id ? properties.find((item) => item.id !== property.id)?.id ?? "" : current));
      setActiveReportId("");
      return;
    }

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
    setOwnerUpdates(database.ownerUpdates ?? []);
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

    if (demoMode) {
      const vendor: VendorContact = {
        id: `demo-vendor-${Date.now()}`,
        propertyId: selectedProperty.id,
        createdAt: new Date().toISOString(),
        ...vendorForm
      };

      setVendors((current) => [vendor, ...current]);
      setVendorForm(emptyVendorForm);
      setShowVendorForm(false);
      setVendorSaveMessage(`Demo vendor added locally: ${vendor.name}`);
      setIsSavingVendor(false);
      return;
    }

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
      setShowVendorForm(false);
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

    if (demoMode) {
      const task: ScheduleTask = {
        id: `demo-schedule-${Date.now()}`,
        propertyId: selectedProperty.id,
        createdAt: new Date().toISOString(),
        ...scheduleTaskForm
      };

      setScheduleTasks((current) => [task, ...current]);
      setScheduleTaskForm(emptyScheduleTaskForm);
      setScheduleSaveMessage(`Demo schedule item added locally: ${task.title}`);
      setIsSavingScheduleTask(false);
      return;
    }

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

  async function saveOwnerUpdate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedProperty) {
      setOwnerUpdateSaveMessage("Select a property before saving an owner update.");
      return;
    }

    setIsSavingOwnerUpdate(true);
    setOwnerUpdateSaveMessage("Saving owner update...");

    if (demoMode) {
      const update: OwnerUpdate = {
        id: `demo-owner-update-${Date.now()}`,
        propertyId: selectedProperty.id,
        createdAt: new Date().toISOString(),
        ...ownerUpdateForm
      };

      setOwnerUpdates((current) => [update, ...current]);
      setOwnerUpdateForm(emptyOwnerUpdateForm);
      setOwnerUpdateSaveMessage(`Demo owner update added locally: ${update.title}`);
      setIsSavingOwnerUpdate(false);
      return;
    }

    try {
      const response = await fetch("/api/owner-updates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...ownerUpdateForm,
          propertyId: selectedProperty.id
        })
      });

      if (!response.ok) {
        const error = (await response.json().catch(() => null)) as { message?: string } | null;
        setOwnerUpdateSaveMessage(error?.message || "Owner update could not be saved.");
        return;
      }

      const update = (await response.json()) as OwnerUpdate;
      setOwnerUpdates((current) => [update, ...current]);
      setOwnerUpdateForm(emptyOwnerUpdateForm);
      setOwnerUpdateSaveMessage(`Owner update saved: ${update.title}`);
    } catch {
      setOwnerUpdateSaveMessage("Owner update could not be saved. Check your connection and try again.");
    } finally {
      setIsSavingOwnerUpdate(false);
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
    trackAnalyticsEvent({
      name: "workflow_step",
      role: activeRole,
      screen: activeExperience,
      workflow: "maintenance",
      target: "issue_submit_attempt",
      demoMode,
      metadata: {
        priority: maintenanceIssueForm.priority,
        hasVendor: Boolean(maintenanceIssueForm.vendor),
        photoCount: maintenanceIssueForm.photoFiles.length
      }
    });

    let photos: Awaited<ReturnType<typeof fileToPhotoUpload>>[];

    try {
      photos = await Promise.all(maintenanceIssueForm.photoFiles.map(fileToPhotoUpload));
    } catch {
      setMaintenanceSaveMessage("One or more maintenance photos could not be processed. Please try JPEG or PNG photos.");
      setIsSavingMaintenanceIssue(false);
      return;
    }

    if (demoMode) {
      const issue: MaintenanceIssue = {
        id: `demo-maintenance-${Date.now()}`,
        propertyId: selectedProperty.id,
        createdAt: new Date().toISOString(),
        title: maintenanceIssueForm.title,
        description: maintenanceIssueForm.description,
        priority: maintenanceIssueForm.priority,
        status: maintenanceIssueForm.status,
        vendor: maintenanceIssueForm.vendor,
        nextStep: maintenanceIssueForm.nextStep,
        photos: photos.map((photo, index) => photoUploadToDemoPhoto(photo, "maintenance", index))
      };

      setMaintenanceIssues((current) => [issue, ...current]);
      setMaintenanceIssueForm(emptyMaintenanceIssueForm);
      setActiveExperience("Maintenance");
      setShowMaintenanceForm(false);
      setMaintenanceSaveMessage(
        `Demo issue added locally with ${issue.photos.length} photo${issue.photos.length === 1 ? "" : "s"}.`
      );
      setIsSavingMaintenanceIssue(false);
      trackAnalyticsEvent({
        name: "workflow_step",
        role: activeRole,
        screen: activeExperience,
        workflow: "maintenance",
        target: "issue_created",
        demoMode: true,
        metadata: { priority: issue.priority, photoCount: issue.photos.length }
      });
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
      setShowMaintenanceForm(false);
      setMaintenanceSaveMessage(
        maintenanceIssueForm.photoFiles.length && savedPhotoCount === 0
          ? "Issue saved, but no photos attached. Confirm the Supabase maintenance photo table exists."
          : `Issue saved with ${savedPhotoCount} photo${savedPhotoCount === 1 ? "" : "s"}.`
      );
      trackAnalyticsEvent({
        name: "workflow_step",
        role: activeRole,
        screen: activeExperience,
        workflow: "maintenance",
        target: "issue_created",
        demoMode,
        metadata: { priority: issue.priority, photoCount: savedPhotoCount }
      });
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

  function setChecklistSection(items: readonly string[], selected: boolean) {
    setInspectionForm((current) => {
      const sectionItems = new Set(items);
      const withoutSection = current.checklist.filter((item) => !sectionItems.has(item));

      return {
        ...current,
        checklist: selected ? [...withoutSection, ...items] : withoutSection
      };
    });
  }

  function generateSuggestedSummary() {
    if (!selectedProperty) {
      setSuggestedSummaryMessage("Select a property before creating a suggested summary.");
      return;
    }

    const completedCount = inspectionForm.checklist.length;
    const totalCount = activeInspectionTemplate.sections.flatMap((section) => section.items).length;
    const completionPhrase =
      completedCount === totalCount
        ? "All planned inspection items were completed"
        : `${completedCount} of ${totalCount} planned inspection items were completed`;
    const temperaturePhrase = inspectionForm.interiorTemperature
      ? `Interior temperature was recorded at ${inspectionForm.interiorTemperature} F`
      : "Interior temperature was not recorded";
    const photoPhrase = inspectionForm.photoFiles.length
      ? `${inspectionForm.photoFiles.length} supporting photo${inspectionForm.photoFiles.length === 1 ? " was" : "s were"} documented`
      : "No photos were attached at the time of this draft";
    const issuePhrase =
      inspectionForm.urgent === "Yes"
        ? "Immediate homeowner attention is recommended based on the urgent issue flag"
        : "No urgent homeowner action is indicated from this inspection";
    const notesPhrase = inspectionForm.notes.trim()
      ? `Inspector notes: ${inspectionForm.notes.trim()}`
      : "No additional issues were noted by the inspector";

    const summary = [
      `${selectedProperty.name} received a ${inspectionForm.inspectionType.toLowerCase()} by ${
        inspectionForm.inspectorName || "the inspection team"
      }.`,
      `${completionPhrase}. ${temperaturePhrase}, and ${photoPhrase}.`,
      issuePhrase,
      notesPhrase
    ].join(" ");

    setSuggestedSummary(summary);
    setSuggestedSummaryMessage("Concierge summary drafted. Review and approve before sharing with the homeowner.");
    trackAnalyticsEvent({
      name: "workflow_step",
      role: activeRole,
      screen: activeExperience,
      workflow: "ai_assist",
      target: "concierge_summary_drafted",
      demoMode,
      metadata: {
        checklistItems: completedCount,
        urgent: inspectionForm.urgent === "Yes",
        photoCount: inspectionForm.photoFiles.length
      }
    });
  }

  function useSuggestedSummary() {
    if (!suggestedSummary) return;

    setInspectionForm((current) => ({
      ...current,
      executiveSummary: suggestedSummary
    }));
    setSuggestedSummaryMessage("Concierge summary approved. You can edit it before generating the report.");
  }

  function suggestMaintenanceRecommendation() {
    const issueText = `${maintenanceIssueForm.title} ${maintenanceIssueForm.description}`.toLowerCase();

    if (!issueText.trim()) {
      setMaintenanceRecommendationMessage("Add an issue title or description before requesting a recommendation.");
      return;
    }

    const vendorType: VendorType =
      /pool|spa|heater|water feature/.test(issueText)
        ? "Pool"
        : /irrigation|landscape|sprinkler|plant|tree|lawn|drip/.test(issueText)
          ? "Landscape"
          : /hvac|air|thermostat|temperature|ac|a\/c|cooling|heating/.test(issueText)
            ? "HVAC"
            : /clean|trash|linen|laundry|stain/.test(issueText)
              ? "Cleaning"
              : /plumb|leak|toilet|sink|shower|faucet|water/.test(issueText)
                ? "Plumbing"
                : /electric|breaker|outlet|light|lighting|power/.test(issueText)
                  ? "Electrical"
                  : "Handyman";

    const priority: MaintenancePriority =
      /active leak|flood|no air|no ac|no a\/c|electrical smell|sparking|security|forced entry|urgent/.test(issueText)
        ? "Urgent"
        : /leak|not working|broken|damage|alarm|hvac|pool equipment/.test(issueText)
          ? "High"
          : /wear|loose|slow|minor|monitor/.test(issueText)
            ? "Medium"
            : "Medium";

    const matchingVendor = selectedVendors.find((vendor) => vendor.type === vendorType);
    const vendorLabel = matchingVendor ? matchingVendor.name : `${vendorType} vendor`;
    const nextStep =
      priority === "Urgent"
        ? `Contact ${vendorLabel} immediately and notify the homeowner with photo documentation.`
        : priority === "High"
          ? `Request availability from ${vendorLabel} and monitor until the repair is scheduled.`
          : `Add to the next service visit for ${vendorLabel} and continue monitoring.`;
    const ownerExplanation = `A ${vendorType.toLowerCase()} item was identified and is recommended for ${priority.toLowerCase()} follow-up. EstateIQ recommends documenting the condition, coordinating with ${vendorLabel}, and keeping the homeowner updated once timing is confirmed.`;

    setMaintenanceRecommendation({
      priority,
      vendorType,
      nextStep,
      ownerExplanation
    });
    setMaintenanceRecommendationMessage("Recommendation drafted. Review before applying.");
  }

  function applyMaintenanceRecommendation() {
    if (!maintenanceRecommendation) return;

    const matchingVendor = selectedVendors.find((vendor) => vendor.type === maintenanceRecommendation.vendorType);

    setMaintenanceIssueForm((current) => ({
      ...current,
      priority: maintenanceRecommendation.priority,
      vendor: matchingVendor?.name ?? current.vendor,
      nextStep: maintenanceRecommendation.nextStep,
      description: current.description.trim()
        ? `${current.description.trim()}\n\nOwner-facing note: ${maintenanceRecommendation.ownerExplanation}`
        : maintenanceRecommendation.ownerExplanation
    }));
    setMaintenanceRecommendationMessage("Recommendation applied. You can edit before saving.");
  }

  function addPhotoFiles(files: FileList | null, category: InspectionPhotoCategory = "Exterior") {
    setInspectionForm((current) => ({
      ...current,
      photoFiles: files
        ? [
            ...current.photoFiles,
            ...Array.from(files).map((file) => ({
              file,
              category
            }))
          ]
        : current.photoFiles
    }));
  }

  function addMaintenanceIssuePhotoFiles(files: FileList | null) {
    setMaintenanceIssueForm((current) => ({
      ...current,
      photoFiles: files ? [...current.photoFiles, ...Array.from(files)] : current.photoFiles
    }));
  }

  async function uploadPropertyPhoto(files: FileList | null) {
    const file = files?.[0];

    if (!file) return;

    try {
      const photo = await fileToPhotoUpload(file);
      setPropertyForm((current) => ({ ...current, photoUrl: photo.data }));
      setPropertySaveMessage("Home photo ready. Save the property to keep it.");
    } catch {
      setPropertySaveMessage("Home photo could not be processed. Please try a JPEG or PNG.");
    }
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

  const hasMobileActionBar = [
    "Inspection",
    "Maintenance",
    "Schedule",
    "Owner Portal",
    "Reports",
    "Property"
  ].includes(activeExperience) && visibleExperienceScreens.includes(activeExperience);
  const workflowExperienceScreens: ExperienceScreen[] = visibleExperienceScreens;
  const currentFlowIndex = workflowExperienceScreens.indexOf(activeExperience);
  const nextFlowScreen =
    currentFlowIndex >= 0 && currentFlowIndex < workflowExperienceScreens.length - 1
        ? workflowExperienceScreens[currentFlowIndex + 1]
      : undefined;

  function enterRole(role: AppRole) {
    trackAnalyticsEvent({
      name: "workflow_step",
      role,
      screen: "Login",
      workflow: "onboarding",
      target: "role_selected",
      demoMode
    });
    setActiveRole(role);
    setActiveExperience(roleLabels[role].firstScreen);
  }

  function loadDemoMode(role: AppRole = "Admin") {
    trackAnalyticsEvent({
      name: "workflow_step",
      role,
      screen: "Login",
      workflow: "demo_mode",
      target: "demo_role_started",
      demoMode: true,
      metadata: { sampleProperty: demoDatabase.properties[0]?.name ?? "Demo property" }
    });
    setDemoMode(true);
    setProperties(demoDatabase.properties);
    setInspections(demoDatabase.inspections);
    setMaintenanceIssues(demoDatabase.maintenanceIssues);
    setVendors(demoDatabase.vendors);
    setScheduleTasks(demoDatabase.scheduleTasks);
    setOwnerUpdates(demoDatabase.ownerUpdates);
    setSelectedPropertyId(demoDatabase.properties[0]?.id ?? "");
    setActiveReportId(demoDatabase.inspections[0]?.id ?? "");
    setActiveRole(role);
    setActiveExperience(roleLabels[role].firstScreen);
  }

  function exitDemoMode() {
    setDemoMode(false);
    setProperties(initialDatabase.properties);
    setInspections(initialDatabase.inspections);
    setMaintenanceIssues(initialDatabase.maintenanceIssues ?? []);
    setVendors(initialDatabase.vendors ?? []);
    setScheduleTasks(initialDatabase.scheduleTasks ?? []);
    setOwnerUpdates(initialDatabase.ownerUpdates ?? []);
    setSelectedPropertyId(initialDatabase.properties[0]?.id ?? "");
    setActiveReportId(initialDatabase.inspections[0]?.id ?? "");
    setActiveExperience("Login");
  }

  if (activeExperience === "Login") {
    return (
      <main className={`grid min-h-screen place-items-center px-4 py-8 ${darkMode ? "luxury-dark" : ""}`}>
        <section className="estate-panel w-full max-w-[440px] rounded-lg p-6 shadow-estate sm:p-8">
          <div className="mb-8 text-center">
            <img
              src="/estateiq-logo-clean.png"
              alt="EstateIQ"
              className="mx-auto mb-5 w-full max-w-[300px] drop-shadow-[0_14px_34px_rgba(0,0,0,0.28)]"
            />
            <p className="mb-2 text-xs font-extrabold uppercase tracking-[0.16em] text-clay">
              Property Intelligence. Peace of Mind.
            </p>
            <h1 className="font-serif text-4xl font-extrabold leading-tight text-ink">EstateIQ</h1>
          </div>

          <form className="grid gap-4">
            <label className="grid gap-2 text-sm font-extrabold text-ink">
              Email
              <input className="field-shell min-h-12 rounded-lg p-3" placeholder="name@example.com" type="email" />
            </label>
            <label className="grid gap-2 text-sm font-extrabold text-ink">
              Password
              <input className="field-shell min-h-12 rounded-lg p-3" placeholder="Password" type="password" />
            </label>
            <button
              type="button"
              onClick={() => enterRole(activeRole)}
              className="button-primary mt-2 min-h-12 rounded-lg px-5 font-extrabold"
            >
              Sign In
            </button>
          </form>

          <div className="mt-5 grid gap-2">
            {(Object.keys(roleLabels) as AppRole[]).map((role) => (
              <button
                key={role}
                type="button"
                onClick={() => enterRole(role)}
                className={`rounded-lg border p-3 text-left transition ${
                  activeRole === role
                    ? "border-gold bg-warning-soft shadow-[inset_4px_0_0_#d4af37]"
                    : "border-line bg-cream hover:border-gold/50 hover:bg-warning-soft/60"
                }`}
              >
                <strong className="block text-sm text-ink">{roleLabels[role].title}</strong>
                <span className="mt-1 block text-xs leading-5 text-slate-600">{roleLabels[role].description}</span>
              </button>
            ))}
          </div>

          <div className="mt-5 rounded-lg border border-[#ead2a8] bg-[#fff8ed] p-4">
            <span className="block text-xs font-extrabold uppercase tracking-[0.1em] text-[#7b5426]">
              Customer demo mode
            </span>
            <p className="mt-2 text-sm leading-6 text-slate-700">
              Launch a polished sample estate with demo inspections, photos, maintenance, schedules, reports, and owner
              updates. No real client data is shown.
            </p>
            <div className="mt-3 grid gap-2 sm:grid-cols-3">
              {(Object.keys(roleLabels) as AppRole[]).map((role) => (
                <button
                  key={`demo-${role}`}
                  type="button"
                  onClick={() => loadDemoMode(role)}
                  className="button-primary min-h-10 rounded-lg px-3 text-xs font-extrabold"
                >
                  Demo {role}
                </button>
              ))}
            </div>
          </div>

          <p className="mt-5 text-center text-sm leading-6 text-slate-600">
            Shared platform access for admins, inspectors, and homeowners.
          </p>
        </section>
      </main>
    );
  }

  if (!properties.length) {
    return (
      <main className={`mx-auto min-h-screen w-full max-w-[980px] p-3 sm:p-6 ${darkMode ? "luxury-dark" : ""}`}>
        <section className="mb-5 overflow-hidden rounded-lg bg-ink text-white shadow-estate">
          <div className="bg-[radial-gradient(circle_at_top_left,rgba(242,217,138,0.28),transparent_34rem),linear-gradient(135deg,rgba(31,31,31,0.96),rgba(44,44,44,0.92))] p-6">
            <img
              src="/estateiq-logo-clean.png"
              alt="EstateIQ"
              className="mb-5 h-24 w-auto drop-shadow-[0_14px_34px_rgba(0,0,0,0.38)]"
            />
            <p className="mb-2 text-xs font-extrabold uppercase tracking-[0.16em] text-gold">
              Property Intelligence. Peace of Mind.
            </p>
            <h1 className="text-4xl font-extrabold leading-none tracking-normal">EstateIQ</h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-white/72">
              Start by creating the first homeowner profile. Once a property is saved, inspections, maintenance,
              schedules, reports, and the owner portal will unlock around that property.
            </p>
          </div>
        </section>

        <section className="estate-panel rounded-lg p-5">
          <div className="mb-5">
            <p className="mb-2 text-xs font-extrabold uppercase tracking-[0.1em] text-clay">
              First property
            </p>
            <h2 className="text-2xl font-extrabold text-ink">Create the homeowner profile</h2>
            {propertySaveMessage ? (
              <p className="mt-3 rounded-lg border border-line bg-[#fbfcfb] p-3 text-sm font-semibold text-slate-600">
                {propertySaveMessage}
              </p>
            ) : null}
          </div>
          <form className="grid gap-4" onSubmit={saveProperty}>
            <div className="grid gap-4 sm:grid-cols-2">
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
            </div>
            <PropertyInput
              label="Street address"
              value={propertyForm.address}
              onChange={(value) => setPropertyForm((current) => ({ ...current, address: value }))}
              required
            />
            <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_110px_130px]">
              <PropertyInput
                label="City"
                value={propertyForm.city}
                onChange={(value) => setPropertyForm((current) => ({ ...current, city: value }))}
                required={!editingPropertyId}
              />
              <PropertyInput
                label="State"
                value={propertyForm.state}
                onChange={(value) => setPropertyForm((current) => ({ ...current, state: value.toUpperCase() }))}
                required={!editingPropertyId}
              />
              <PropertyInput
                label="ZIP"
                value={propertyForm.zip}
                onChange={(value) => setPropertyForm((current) => ({ ...current, zip: value }))}
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <PropertyInput
                label="Phone"
                value={propertyForm.phone}
                onChange={(value) => setPropertyForm((current) => ({ ...current, phone: formatPhoneNumber(value) }))}
                type="tel"
              />
              <PropertyInput
                label="Email"
                type="email"
                value={propertyForm.email}
                onChange={(value) => setPropertyForm((current) => ({ ...current, email: value }))}
              />
            </div>
            <label className="grid gap-2 text-sm font-extrabold">
              Access notes
              <textarea
                rows={4}
                value={propertyForm.accessNotes}
                onChange={(event) =>
                  setPropertyForm((current) => ({ ...current, accessNotes: event.target.value }))
                }
                className="field-shell rounded-lg p-3"
                placeholder="Gate code, alarm notes, preferred entry, parking, vendor access..."
              />
            </label>
            <PropertyPhotoPicker
              photoUrl={propertyForm.photoUrl}
              onUpload={uploadPropertyPhoto}
              onClear={() => setPropertyForm((current) => ({ ...current, photoUrl: "" }))}
            />
            <button
              type="submit"
              disabled={isSavingProperty}
              className="button-soft min-h-12 rounded-lg px-5 font-extrabold disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSavingProperty ? "Saving..." : "Create Property"}
            </button>
          </form>
        </section>
      </main>
    );
  }

  return (
    <main
      className={`mx-auto min-h-screen w-full max-w-[1480px] p-3 ${
        hasMobileActionBar ? "pb-44" : "pb-28"
      } sm:p-6 lg:pb-6 ${darkMode ? "luxury-dark" : ""}`}
    >
      <section className="mb-5 overflow-hidden rounded-lg border border-gold/20 bg-ink text-white shadow-estate motion-reveal">
        <div className="flex min-h-24 flex-col justify-between gap-5 bg-[radial-gradient(circle_at_top_left,rgba(242,217,138,0.24),transparent_30rem),linear-gradient(135deg,rgba(31,31,31,0.98),rgba(44,44,44,0.94))] p-4 md:flex-row md:items-center md:p-5 xl:min-h-28">
          <div className="flex min-w-0 items-center gap-4">
            <img
              src="/estateiq-logo-clean.png"
              alt="EstateIQ"
              className="h-16 w-auto shrink-0 drop-shadow-[0_14px_34px_rgba(0,0,0,0.38)] xl:h-20"
            />
            <div className="min-w-0">
              <p className="mb-1 text-xs font-extrabold uppercase tracking-[0.16em] text-gold">
                Property Intelligence. Peace of Mind.
              </p>
              <h1 className="truncate font-serif text-3xl font-semibold leading-none tracking-normal sm:text-4xl xl:text-5xl">
                {selectedProperty ? selectedProperty.name : "EstateIQ"}
              </h1>
              <p className="mt-2 truncate text-xs font-extrabold uppercase tracking-[0.16em] text-white/68">
                {selectedProperty ? selectedProperty.address : "Inspect | Report | Protect"}
              </p>
            </div>
          </div>
          <div className="hidden rounded-lg border border-gold/20 bg-white/10 px-4 py-3 text-left text-white/78 md:min-w-48 md:text-right lg:block">
            <span className="block text-xs font-extrabold uppercase tracking-[0.12em] text-gold">{formatShortDate(now)}</span>
            <strong className="block font-serif text-2xl font-semibold text-white">
              {new Intl.DateTimeFormat("en-US", { hour: "numeric", minute: "2-digit" }).format(now)}
            </strong>
          </div>
        </div>
      </section>

      {demoMode ? (
        <section className="no-print mb-5 rounded-lg border border-gold/25 bg-[#252525] p-3 text-cream shadow-soft">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs font-extrabold uppercase tracking-[0.12em] text-gold">
                Demo Mode Active
              </p>
              <p className="mt-1 text-sm font-semibold text-[#d8d0c2]">
                Showing sample EstateIQ data only. Safe for live customer demos.
              </p>
            </div>
            <button
              type="button"
              onClick={exitDemoMode}
              className="button-soft min-h-10 rounded-lg px-4 text-sm font-extrabold"
            >
              Exit Demo
            </button>
          </div>
        </section>
      ) : null}

      <section className="estate-panel no-print mb-5 hidden rounded-lg p-2.5 sm:p-3 lg:block">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex gap-1.5 overflow-x-auto pb-1">
            {desktopNavigationScreens.map((screen) => (
              <button
                key={screen}
                type="button"
                onClick={() => setActiveExperience(screen)}
                className={`min-h-10 shrink-0 rounded-lg border px-4 text-sm font-extrabold transition ${
                  activeExperience === screen
                    ? "border-gold bg-[linear-gradient(135deg,#f2d98a,#d4af37)] text-ink shadow-button"
                    : "border-gold/20 bg-cream/80 text-slate-700 hover:border-gold hover:bg-warning-soft"
                }`}
              >
                {screenLabel(screen)}
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

      <section className="estate-panel no-print mb-5 hidden rounded-lg p-4 lg:block">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="mb-1 text-xs font-extrabold uppercase tracking-[0.12em] text-gold">
              Workflow
            </p>
            <h2 className="font-serif text-2xl font-semibold text-ink">
              {screenLabel(activeExperience)}
            </h2>
            <p className="mt-1 text-sm font-semibold text-slate-600">
              {roleLabels[activeRole].title} / Step {currentFlowIndex + 1} of {workflowExperienceScreens.length}
            </p>
          </div>
          {nextFlowScreen ? (
            <button
              type="button"
              onClick={() => setActiveExperience(nextFlowScreen)}
              className="button-soft min-h-11 rounded-lg px-5 text-sm font-extrabold"
            >
              Continue to {screenLabel(nextFlowScreen)}
            </button>
          ) : activeExperience !== "Reports" ? (
            <button
              type="button"
              onClick={() => setActiveExperience("Property")}
              className="button-soft min-h-11 rounded-lg px-5 text-sm font-extrabold"
            >
            Start New Property Flow
          </button>
        ) : null}
        </div>
        {selectedProperty && activeExperience !== "Pilot Admin" ? (
          <PropertyReferenceStrip
            property={selectedProperty}
            activeExperience={activeExperience}
            onViewProperty={() => setActiveExperience("Property")}
          />
        ) : null}
      </section>

      <LuxuryExperiencePanel
        activeExperience={activeExperience}
        activeRole={activeRole}
        activeReport={activeReport}
        now={now}
        properties={properties}
        maintenanceIssueForm={maintenanceIssueForm}
        maintenanceRecommendation={maintenanceRecommendation}
        maintenanceRecommendationMessage={maintenanceRecommendationMessage}
        maintenanceIssues={selectedMaintenanceIssues}
        allMaintenanceIssues={maintenanceIssues}
        ownerUpdateForm={ownerUpdateForm}
        ownerUpdateSaveMessage={ownerUpdateSaveMessage}
        ownerUpdates={selectedOwnerUpdates}
        scheduleTaskForm={scheduleTaskForm}
        scheduleSaveMessage={scheduleSaveMessage}
        scheduleTasks={selectedScheduleTasks}
        selectedPropertyId={selectedProperty?.id ?? ""}
        selectedVendors={selectedVendors}
        vendorForm={vendorForm}
        vendorSaveMessage={vendorSaveMessage}
        selectedInspections={selectedInspections}
        selectedProperty={selectedProperty}
        openAddPropertyForm={openAddPropertyForm}
        openEditPropertyForm={openEditPropertyForm}
        onSelectProperty={(propertyId) => {
          setSelectedPropertyId(propertyId);
          setActiveReportId("");
          setSelectedReportActionId("");
          setShowVendorForm(false);
          setSelectedVendorId("");
          setSelectedMaintenanceIssueId("");
        }}
        setActiveExperience={setActiveExperience}
        setInspectionForm={setInspectionForm}
        setMaintenanceIssueForm={setMaintenanceIssueForm}
        setOwnerUpdateForm={setOwnerUpdateForm}
        setScheduleTaskForm={setScheduleTaskForm}
        addMaintenanceIssuePhotoFiles={addMaintenanceIssuePhotoFiles}
        saveMaintenanceIssue={saveMaintenanceIssue}
        saveOwnerUpdate={saveOwnerUpdate}
        saveScheduleTask={saveScheduleTask}
        isSavingMaintenanceIssue={isSavingMaintenanceIssue}
        isSavingOwnerUpdate={isSavingOwnerUpdate}
        isSavingScheduleTask={isSavingScheduleTask}
        maintenanceSaveMessage={maintenanceSaveMessage}
        setMaintenanceSaveMessage={setMaintenanceSaveMessage}
        setMaintenanceRecommendation={setMaintenanceRecommendation}
        setMaintenanceRecommendationMessage={setMaintenanceRecommendationMessage}
        showMaintenanceForm={showMaintenanceForm}
        setShowMaintenanceForm={setShowMaintenanceForm}
        setSelectedMaintenanceIssueId={setSelectedMaintenanceIssueId}
        upcomingScheduleTasks={upcomingScheduleTasks}
        updateMaintenanceStatus={updateMaintenanceStatus}
        updateMaintenanceIssue={updateMaintenanceIssue}
        suggestMaintenanceRecommendation={suggestMaintenanceRecommendation}
        applyMaintenanceRecommendation={applyMaintenanceRecommendation}
        updateScheduleTaskStatus={updateScheduleTaskStatus}
        setVendorForm={setVendorForm}
        saveVendor={saveVendor}
        isSavingVendor={isSavingVendor}
        pilotDatabase={pilotDatabase}
        pilotUsageSummary={pilotUsageSummary}
        feedbackItems={feedbackItems}
        refreshPilotConsole={refreshPilotConsole}
        toggleFeatureFlag={toggleFeatureFlag}
        resetPilotAccount={resetPilotAccount}
      />

      <section className="grid gap-5">
        <section className="grid gap-5">
          <section className={`estate-panel rounded-lg p-5 ${activeExperience === "Property" ? "" : "hidden"}`}>
            <div className="mb-5 flex items-start justify-between gap-3">
              <div>
                <p className="mb-2 text-xs font-extrabold uppercase tracking-[0.1em] text-gold">
                  Property
                </p>
                <h2 className="font-serif text-3xl font-semibold leading-tight text-ink">{selectedProperty?.name}</h2>
              </div>
              <div className="flex items-center gap-2">
                <span className="rounded-full border border-gold/35 bg-cream px-3 py-2 text-xs font-extrabold text-ink">
                  {selectedProperty?.status}
                </span>
                {selectedProperty ? (
                  <button
                    type="button"
                    onClick={() => openEditPropertyForm(selectedProperty)}
                    className="button-soft min-h-10 rounded-lg px-4 text-sm font-extrabold"
                  >
                    Edit Property
                  </button>
                ) : null}
              </div>
            </div>

            {selectedProperty ? (
              <div className="grid gap-4">
                <div className="grid gap-4 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:items-start">
                  {selectedProperty.photoUrl ? (
                    <figure className="mx-auto w-full max-w-2xl overflow-hidden rounded-lg border border-gold/20 bg-[#252525] shadow-soft lg:mx-0">
                      <img
                        src={selectedProperty.photoUrl}
                        alt={selectedProperty.name}
                        className="aspect-[16/9] w-full object-cover"
                      />
                      <figcaption className="border-t border-white/10 px-3 py-2 text-xs font-semibold text-[#d8d0c2]">
                      Property reference photo for inspector confirmation
                      </figcaption>
                    </figure>
                  ) : null}
                  <div className="grid gap-4">
                    <QuickContactButtons property={selectedProperty} />
                    <div className="grid gap-2 rounded-lg border border-gold/15 bg-cream/80 p-3 shadow-soft">
                      <ProfileItem label="Address" value={selectedProperty.address} />
                      <ProfileItem label="Homeowner" value={selectedProperty.owner} />
                      <ProfileItem label="Access Notes" value={selectedProperty.accessNotes || "No special access notes."} />
                    </div>
                  </div>
                </div>
                <div className="grid gap-3 md:grid-cols-2">
                  <ProfileItem label="Phone" value={selectedProperty.phone || "Not provided"} />
                  <ProfileItem label="Email" value={selectedProperty.email || "Not provided"} />
                  <ProfileItem label="Saved Visits" value={`${selectedInspections.length}`} />
                  <ProfileItem label="Open Items" value={`${selectedMaintenanceIssues.filter((issue) => issue.status !== "Resolved").length}`} />
                </div>
              </div>
            ) : null}
          </section>

          <section className={`estate-panel rounded-lg p-5 ${activeExperience === "Property" ? "" : "hidden"}`}>
            <div className="mb-4 flex items-start justify-between gap-3">
              <div>
                <p className="mb-2 text-xs font-extrabold uppercase tracking-[0.1em] text-gold">
                  Vendors
                </p>
                <h2 className="font-serif text-2xl font-semibold leading-tight text-ink">Property Contacts</h2>
                <p className="mt-1 text-sm leading-6 text-slate-600">
                  Keep key service providers tied to this home.
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setVendorSaveMessage("");
                  setShowVendorForm((current) => !current);
                }}
                className="button-soft min-h-10 shrink-0 rounded-lg px-3 text-sm font-extrabold"
              >
                {showVendorForm ? "Close Form" : "Add Vendor"}
              </button>
            </div>

            <form
              id="vendor-form"
              className={`mb-4 gap-3 rounded-lg border border-gold/15 bg-cream/80 p-4 shadow-soft ${showVendorForm ? "grid" : "hidden"}`}
              onSubmit={saveVendor}
            >
              <div className="grid gap-2 sm:grid-cols-4">
                {(["Pool", "Landscape", "HVAC", "Cleaning"] as VendorType[]).map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setVendorForm((current) => ({ ...current, type }))}
                    className={`min-h-10 rounded-lg border px-3 text-left text-sm font-extrabold transition hover:border-gold/50 hover:shadow-lift ${
                      vendorForm.type === type ? "border-gold bg-warning-soft text-ink" : "border-line bg-cream text-ink"
                    }`}
                  >
                    {type}
                  </button>
                ))}
              </div>
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
                    type="tel"
                    inputMode="tel"
                    maxLength={14}
                    value={vendorForm.phone}
                    onChange={(event) =>
                      setVendorForm((current) => ({ ...current, phone: formatPhoneNumber(event.target.value) }))
                    }
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
                <div className="rounded-lg border border-gold/20 bg-warning-soft/50 p-3 text-sm font-semibold text-slate-600">
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
                <div className="overflow-hidden rounded-lg border border-gold/15 bg-cream shadow-soft">
                  {selectedVendors.map((vendor) => (
                    <VendorListItem
                      key={vendor.id}
                      vendor={vendor}
                      onSelect={() => setSelectedVendorId(vendor.id)}
                    />
                  ))}
                </div>
              ) : (
                <div className="rounded-lg border border-gold/15 bg-cream/80 p-4 text-sm text-slate-600 shadow-soft">
                  No vendor contacts have been saved for this property yet.
                </div>
              )}
            </div>
          </section>

          <section className={`estate-panel no-print rounded-lg p-5 pb-28 lg:pb-5 ${activeExperience === "Inspection" ? "" : "hidden"}`}>
            <div className="mb-5 flex items-start justify-between gap-3">
              <div>
                <p className="mb-2 text-xs font-extrabold uppercase tracking-[0.1em] text-clay">
                  Inspection
                </p>
                <h2 className="font-serif text-3xl font-semibold leading-tight text-ink">Inspection</h2>
              </div>
              <span className="rounded-full border border-gold/25 bg-warning-soft px-3 py-2 text-xs font-extrabold text-ink">
                {formatDateTime(now)}
              </span>
            </div>

            <form id="inspection-form" className="grid gap-4" onSubmit={saveInspection}>
              <fieldset className="grid gap-3 rounded-lg border border-gold/30 bg-warning-soft/70 p-4 shadow-soft">
                <div className="border-b border-gold/20 pb-3">
                  <div>
                    <p className="text-xs font-extrabold uppercase tracking-[0.1em] text-gold">Step 1</p>
                    <h3 className="font-serif text-xl font-semibold leading-tight text-ink">Inspection type</h3>
                  </div>
                </div>
                <select
                  value={inspectionForm.inspectionType}
                  onChange={(event) =>
                    setInspectionForm((current) => ({
                      ...current,
                      inspectionType: event.target.value as InspectionType,
                      checklist: []
                    }))
                  }
                  className="field-shell rounded-lg p-3 font-extrabold lg:hidden"
                >
                  {inspectionTemplates.map((template) => (
                    <option key={template.title} value={template.title}>
                      {template.title}
                    </option>
                  ))}
                </select>
                <p className="text-sm leading-6 text-slate-600 lg:hidden">
                  {activeInspectionTemplate.description}
                </p>
                <div className="hidden gap-3 sm:grid-cols-2 lg:grid lg:grid-cols-3">
                  {inspectionTemplates.map((template) => {
                    const active = inspectionForm.inspectionType === template.title;

                    return (
                      <label
                        key={template.title}
                        className={`grid cursor-pointer gap-2 rounded-lg border p-3 transition ${
                          active
                            ? "border-gold bg-cream shadow-[inset_0_0_0_1px_rgba(212,175,55,0.32)]"
                            : "border-line bg-cream/75 hover:border-gold/50 hover:shadow-lift"
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
                            className="mt-1 accent-gold"
                          />
                          <span className="font-extrabold text-ink">{template.title}</span>
                        </span>
                        <span className="pl-7 text-sm font-medium leading-5 text-slate-600">{template.description}</span>
                      </label>
                    );
                  })}
                </div>
              </fieldset>

              <fieldset className="grid gap-4 rounded-lg border border-gold/20 bg-cream p-4 text-ink shadow-soft md:grid-cols-2">
                <div className="border-b border-gold/20 pb-3 md:col-span-2">
                  <div>
                    <p className="text-xs font-extrabold uppercase tracking-[0.1em] text-gold">Step 2</p>
                    <h3 className="font-serif text-xl font-semibold leading-tight text-ink">Visit details</h3>
                  </div>
                </div>
                <label className="grid gap-2 text-sm font-extrabold text-ink">
                  Inspector name
                  <input
                    required
                    value={inspectionForm.inspectorName}
                    onChange={(event) =>
                      setInspectionForm((current) => ({ ...current, inspectorName: event.target.value }))
                    }
                    className="field-shell rounded-lg border border-gold/35 bg-white p-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.8)]"
                  />
                </label>
                <label className="grid gap-2 text-sm font-extrabold text-ink">
                  Interior temperature
                  <div className="field-shell grid max-w-[220px] grid-cols-[minmax(0,1fr)_34px] overflow-hidden rounded-lg border border-gold/35 bg-white shadow-[inset_0_1px_0_rgba(255,255,255,0.8)]">
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
                      className="border-0 bg-transparent p-3 text-ink outline-none"
                    />
                    <span className="grid place-items-center border-l border-line font-extrabold text-muted">F</span>
                  </div>
                </label>
              </fieldset>

              <fieldset className="grid gap-4 rounded-lg border border-gold/20 bg-cream p-4 text-ink shadow-soft">
                <div className="border-b border-gold/20 pb-3">
                  <div>
                    <p className="text-xs font-extrabold uppercase tracking-[0.1em] text-gold">Step 3</p>
                    <h3 className="font-serif text-xl font-semibold leading-tight text-ink">Inspection checklist</h3>
                  </div>
                </div>
                <div className="flex flex-col gap-3 rounded-lg border border-gold/15 bg-cream/90 p-3 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-sm font-semibold text-muted">
                    <span className="font-extrabold text-ink">
                      {inspectionForm.checklist.length}/{inspectionTotalChecks}
                    </span>{" "}
                    checks complete
                  </p>
                  <div className="grid grid-cols-2 gap-2 sm:flex">
                    <button
                      type="button"
                      onClick={() => setInspectionForm((current) => ({ ...current, checklist: allInspectionChecklistItems }))}
                      className="button-soft min-h-10 rounded-lg px-4 text-sm font-extrabold"
                    >
                      Select All
                    </button>
                    <button
                      type="button"
                      onClick={() => setInspectionForm((current) => ({ ...current, checklist: [] }))}
                      className="min-h-10 rounded-lg border border-line bg-cream px-4 text-sm font-extrabold text-ink transition hover:border-gold/50"
                    >
                      Clear
                    </button>
                  </div>
                </div>
                {activeInspectionTemplate.sections.map((section) => {
                  const completedInSection = section.items.filter((item) => inspectionForm.checklist.includes(item)).length;
                  const sectionComplete = completedInSection === section.items.length;

                  return (
                  <div
                    key={section.title}
                    className={`grid gap-3 rounded-lg border p-3 ${
                      sectionComplete ? "border-gold/35 bg-cream shadow-[inset_4px_0_0_#d4af37]" : "border-line bg-cream/80"
                    }`}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <h3 className="text-sm font-black uppercase tracking-[0.08em] text-gold">{section.title}</h3>
                      <div className="flex shrink-0 items-center gap-2">
                        <span className="rounded-full border border-line bg-cream px-3 py-1 text-xs font-extrabold text-slate-600">
                          {completedInSection}/{section.items.length}
                        </span>
                        <button
                          type="button"
                          onClick={() => setChecklistSection(section.items, !sectionComplete)}
                          className="rounded-full border border-line bg-cream px-3 py-1 text-xs font-extrabold text-ink transition hover:border-gold/50"
                        >
                          {sectionComplete ? "Clear" : "Select all"}
                        </button>
                      </div>
                    </div>
                    <div className="grid gap-2 md:grid-cols-2">
                      {section.items.map((item) => (
                        <label
                          key={item}
                          className="grid min-h-11 min-w-0 grid-cols-[22px_minmax(0,1fr)] items-center gap-2 rounded-md px-2 font-semibold text-ink transition hover:bg-cream/70"
                        >
                          <input
                            type="checkbox"
                            checked={inspectionForm.checklist.includes(item)}
                            onChange={() => toggleChecklistItem(item)}
                            className="accent-gold"
                          />
                          <span className="min-w-0 leading-5">{item}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                  );
                })}
              </fieldset>

              <label className="grid min-h-24 content-center gap-2 rounded-lg border border-dashed border-gold/40 bg-cream p-4 text-sm font-extrabold text-ink shadow-soft transition hover:border-gold lg:hidden">
                Add inspection photos
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={(event) => addPhotoFiles(event.target.files)}
                  className="w-full min-w-0 text-xs font-semibold text-muted file:mr-3 file:rounded-lg file:border-0 file:bg-[#252525] file:px-3 file:py-2 file:text-xs file:font-extrabold file:text-cream"
                />
              </label>

              <div className="hidden gap-4 md:grid-cols-3 lg:grid">
                {[
                  ["Exterior", "Exterior photos"],
                  ["Interior", "Interior photos"],
                  ["Issues", "Issue photos"]
                ].map(([category, label]) => (
                  <label
                    key={label}
                    className="grid min-h-28 content-center gap-2 rounded-lg border border-dashed border-gold/40 bg-cream p-4 text-sm font-extrabold text-ink shadow-soft transition hover:border-gold"
                  >
                    {label}
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={(event) => addPhotoFiles(event.target.files, category as InspectionPhotoCategory)}
                      className="w-full min-w-0 text-xs font-semibold text-muted file:mr-3 file:rounded-lg file:border-0 file:bg-[#252525] file:px-3 file:py-2 file:text-xs file:font-extrabold file:text-cream"
                    />
                  </label>
                ))}
              </div>
              {inspectionForm.photoFiles.length ? (
                <div className="rounded-lg border border-line bg-[#fbfcfb] p-3 text-sm text-slate-600">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <strong className="text-ink">
                      {inspectionForm.photoFiles.length} photo selected
                      {inspectionForm.photoFiles.length === 1 ? "" : "s"}
                    </strong>
                    <button
                      type="button"
                      onClick={() => setInspectionForm((current) => ({ ...current, photoFiles: [] }))}
                      className="font-extrabold text-[#9f352e]"
                    >
                      Clear photos
                    </button>
                  </div>
                  <SelectedPhotoPreviewGrid
                    files={inspectionForm.photoFiles.map((photoFile) => photoFile.file)}
                    onRemove={(removeIndex) =>
                      setInspectionForm((current) => ({
                        ...current,
                        photoFiles: current.photoFiles.filter((_, index) => index !== removeIndex)
                      }))
                    }
                  />
                </div>
              ) : null}

              <label className="grid gap-2 rounded-lg border border-gold/15 bg-cream/80 p-4 text-sm font-extrabold text-ink shadow-soft">
                Notes / issues found
                <textarea
                  rows={5}
                  value={inspectionForm.notes}
                  onChange={(event) => setInspectionForm((current) => ({ ...current, notes: event.target.value }))}
                  placeholder="Record observations, maintenance needs, vendor recommendations, or owner follow-up."
                  className="field-shell rounded-lg p-3"
                />
              </label>

              <label className="hidden gap-2 rounded-lg border border-gold/20 bg-cream p-4 text-sm font-extrabold text-ink shadow-soft lg:grid">
                <span className="text-xs font-extrabold uppercase tracking-[0.1em] text-gold">
                  Executive Summary
                </span>
                <textarea
                  rows={4}
                  value={inspectionForm.executiveSummary}
                  onChange={(event) =>
                    setInspectionForm((current) => ({ ...current, executiveSummary: event.target.value }))
                  }
                  placeholder="Approved owner-ready summary for the final report."
                  className="field-shell rounded-lg bg-white p-3 text-ink placeholder:text-muted"
                />
              </label>

              <div className="hidden rounded-lg border border-gold/20 bg-cream p-4 text-ink shadow-soft lg:block">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="mb-1 text-xs font-extrabold uppercase tracking-[0.1em] text-gold">
                      Concierge Summary
                    </p>
                    <h3 className="font-serif text-2xl font-semibold leading-tight text-ink">
                      Human-reviewed owner draft
                    </h3>
                    <p className="mt-2 text-sm font-semibold leading-6 text-ink">
                      Creates a private concierge-style draft from verified inspection details. Review before sharing.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={generateSuggestedSummary}
                    className="button-soft min-h-11 rounded-lg px-4 text-sm font-extrabold"
                  >
                    Draft Concierge Summary
                  </button>
                </div>
                {suggestedSummary ? (
                  <div className="mt-4 rounded-lg border border-gold/20 bg-cream/90 p-4">
                    <p className="text-sm font-semibold leading-6 text-ink">{suggestedSummary}</p>
                    <button
                      type="button"
                      onClick={useSuggestedSummary}
                      className="button-primary mt-4 min-h-10 rounded-lg px-4 text-sm font-extrabold"
                    >
                      Approve As Executive Summary
                    </button>
                  </div>
                ) : null}
                {suggestedSummaryMessage ? (
                  <p className="mt-3 text-sm font-semibold text-ink">{suggestedSummaryMessage}</p>
                ) : null}
              </div>

              <div className="grid gap-4 rounded-lg border border-gold/25 bg-cream p-4 text-ink shadow-soft md:grid-cols-[minmax(0,1fr)_160px] md:items-center">
                <div>
                  <p className="mb-1 text-xs font-extrabold uppercase tracking-[0.1em] text-gold">
                    Report Flag
                  </p>
                  <strong className="block font-serif text-2xl font-semibold leading-tight text-ink">
                    Urgent issue?
                  </strong>
                  <span className="mt-2 block text-sm font-semibold leading-6 text-ink">
                    Flag reports that need immediate homeowner attention.
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2" role="radiogroup" aria-label="Urgent issue">
                  {(["No", "Yes"] as UrgentStatus[]).map((value) => (
                    <label
                      key={value}
                      className={`flex min-h-11 items-center justify-center gap-2 rounded-lg border font-extrabold transition ${
                        inspectionForm.urgent === value
                          ? value === "Yes"
                            ? "border-[#e7cbc4] bg-[#fff8f6] text-[#9f352e]"
                            : "border-gold bg-cream text-ink shadow-[inset_0_0_0_1px_rgba(212,175,55,0.32)]"
                          : "border-line bg-white text-ink"
                      }`}
                    >
                      <input
                        type="radio"
                        name="urgent"
                        checked={inspectionForm.urgent === value}
                        onChange={() => setInspectionForm((current) => ({ ...current, urgent: value }))}
                        className="accent-gold"
                      />
                      {value}
                    </label>
                  ))}
                </div>
              </div>

              {inspectionSaveMessage ? (
                <p className="rounded-lg border border-gold/20 bg-cream p-3 text-sm font-semibold text-ink shadow-soft">
                  {inspectionSaveMessage}
                </p>
              ) : null}

              <div className="grid grid-cols-2 gap-3 lg:flex lg:flex-wrap lg:justify-end">
                <button
                  type="button"
                  onClick={() => setInspectionForm(emptyInspectionForm)}
                  className="button-soft min-h-11 flex-1 rounded-lg px-5 font-extrabold sm:flex-none"
                >
                  Clear
                </button>
                <button
                  type="button"
                  onClick={() => void saveInspection()}
                  disabled={isSavingInspection}
                  className="button-soft min-h-11 flex-1 rounded-lg px-5 font-extrabold disabled:cursor-not-allowed disabled:opacity-60 sm:flex-none"
                >
                  {isSavingInspection ? "Generating..." : "Generate Report"}
                </button>
              </div>
            </form>
          </section>
        </section>

        <aside className={`estate-panel rounded-lg p-4 sm:p-5 ${activeExperience === "Reports" ? "" : "hidden"}`}>
          <div className="mb-4 flex flex-col gap-3 rounded-lg border border-gold/15 bg-[#eae4d8] p-4 shadow-soft lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="mb-2 text-xs font-extrabold uppercase tracking-[0.1em] text-clay">
                Reports
              </p>
              <h2 className="font-serif text-2xl font-semibold leading-tight text-ink">
                Reports
              </h2>
            </div>
            <div className="flex flex-wrap gap-2 lg:justify-end">
              {activeReport ? (
                <button
                  type="button"
                  onClick={() => setSelectedReportActionId(activeReport.id)}
                  className="button-soft min-h-11 rounded-lg px-4 text-sm font-extrabold"
                >
                  Share / Export
                </button>
              ) : null}
              <button
                type="button"
                onClick={() => window.print()}
                className="button-soft min-h-11 rounded-lg px-4 text-sm font-extrabold"
              >
                Print
              </button>
            </div>
          </div>

          <ReportCard property={selectedProperty} inspection={activeReport} />

          {activeReport ? (
            <div className="no-print mt-4 grid gap-2 rounded-lg border border-gold/15 bg-[#eae4d8] p-4 shadow-soft sm:grid-cols-2">
              <a
                href={`/reports/${reportRouteId(activeReport)}`}
                target="_blank"
                rel="noreferrer"
                className="button-soft grid min-h-11 place-items-center rounded-lg px-4 text-sm font-extrabold"
              >
                Open Web Report
              </a>
              <a
                href={`/api/reports/${reportRouteId(activeReport)}`}
                target="_blank"
                rel="noreferrer"
                className="button-soft grid min-h-11 place-items-center rounded-lg px-4 text-sm font-extrabold"
              >
                Download PDF
              </a>
            </div>
          ) : null}

          <div className="no-print mt-4 rounded-lg border border-gold/15 bg-[#eae4d8] p-4 shadow-soft">
            <div className="mb-3 flex items-center justify-between gap-3">
              <div>
                <p className="mb-1 text-xs font-extrabold uppercase tracking-[0.1em] text-clay">
                  Visit history
                </p>
                <h2 className="font-serif text-xl font-semibold leading-tight text-ink">
                  Saved reports
                </h2>
              </div>
              <span className="rounded-full border border-gold/20 bg-cream px-3 py-1 text-xs font-extrabold text-ink">
                {selectedInspections.length}
              </span>
            </div>
            <div className="grid gap-2">
              {selectedInspections.length ? (
                selectedInspections.map((inspection) => (
                  <button
                    key={inspection.id}
                    type="button"
                    onClick={() => {
                      setActiveReportId(inspection.id);
                      setSelectedReportActionId(inspection.id);
                    }}
                    className={`rounded-lg border px-3 py-3 transition ${
                      activeReport?.id === inspection.id
                        ? "border-gold bg-warning-soft shadow-[inset_4px_0_0_#d4af37]"
                        : "border-line bg-cream hover:border-gold/50 hover:shadow-lift"
                    }`}
                  >
                    <div className="grid w-full grid-cols-[minmax(0,1fr)_auto] items-center gap-3 text-left">
                      <span className="min-w-0">
                        <strong className="block truncate text-sm text-ink">{formatDateTime(inspection.timestamp)}</strong>
                        <span className="mt-1 block truncate text-sm font-semibold text-slate-600">
                          {getInspectionType(inspection.checklist)} / {inspection.inspectorName || "Inspector"}
                        </span>
                      </span>
                      <span
                        className={`rounded-full border px-3 py-1 text-xs font-extrabold ${
                          inspection.urgent === "Yes"
                            ? "border-[#e7cbc4] bg-[#fff8f6] text-[#9f352e]"
                            : "border-gold/25 bg-warning-soft text-ink"
                        }`}
                      >
                        {reportConditionStatus(inspection).label}
                      </span>
                    </div>
                  </button>
                ))
              ) : (
                <p className="text-sm text-slate-600">No saved inspections yet.</p>
              )}
            </div>
          </div>
        </aside>

        {selectedReportAction ? (
          <div className="estate-modal-backdrop">
            <div className="estate-modal-panel max-h-[calc(100svh-2rem)] w-full max-w-xl overflow-y-auto p-5">
              <div className="mb-4 flex items-start justify-between gap-3 border-b border-line pb-4">
                <div>
                  <span className="text-xs font-extrabold uppercase tracking-[0.1em] text-clay">
                    Report details
                  </span>
                  <h3 className="mt-1 text-2xl font-extrabold text-ink">
                    {formatDateTime(selectedReportAction.timestamp)}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedReportActionId("")}
                  className="button-soft min-h-10 rounded-lg px-4 text-sm font-extrabold"
                >
                  Close
                </button>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <DetailStrip label="Type" value={getInspectionType(selectedReportAction.checklist)} />
                <DetailStrip label="Inspector" value={selectedReportAction.inspectorName || "Inspector"} />
                <DetailStrip
                  label="Completed Checks"
                  value={`${visibleChecklistItems(selectedReportAction.checklist).length}`}
                />
                <DetailStrip label="Photos" value={`${selectedReportAction.photos.length}`} />
              </div>
              <p className="mt-4 rounded-lg border border-line bg-[#fbfcfb] p-4 text-sm leading-6 text-slate-700">
                {selectedReportAction.executiveSummary || reportConditionStatus(selectedReportAction).description}
              </p>
              <div className="mt-4 grid gap-2 sm:grid-cols-2">
                <a
                  href={`/reports/${reportRouteId(selectedReportAction)}`}
                  target="_blank"
                  rel="noreferrer"
                  className="button-soft grid min-h-11 place-items-center rounded-lg px-4 text-sm font-extrabold"
                >
                  Open Web Report
                </a>
                <a
                  href={`/api/reports/${reportRouteId(selectedReportAction)}`}
                  target="_blank"
                  rel="noreferrer"
                  className="button-soft grid min-h-11 place-items-center rounded-lg px-4 text-sm font-extrabold"
                >
                  Download PDF
                </a>
              </div>
            </div>
          </div>
        ) : null}
      </section>

      <div className="pb-6 lg:pb-0">
        <FeedbackPanel
          form={feedbackForm}
          message={feedbackMessage}
          isSaving={isSavingFeedback}
          setForm={setFeedbackForm}
          saveFeedback={saveFeedback}
        />
      </div>

      <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-gold/30 bg-[#1f1f1f] pb-[env(safe-area-inset-bottom)] lg:hidden">
        <div
          className="grid w-full"
          style={{ gridTemplateColumns: `repeat(${mobileExperienceScreens.length}, minmax(0, 1fr))` }}
        >
          {mobileExperienceScreens.map((screen) => (
            <button
              key={screen}
              type="button"
              onClick={() => setActiveExperience(screen)}
              className={`min-h-16 min-w-0 border-t-2 px-1 text-[0.68rem] font-extrabold leading-tight transition ${
                activeExperience === screen
                  ? "border-gold bg-[#252525] text-gold"
                  : "border-transparent bg-[#1f1f1f] text-[#d8d0c2] hover:border-gold/40 hover:bg-[#252525]"
              }`}
            >
              <span className="block truncate">{mobileScreenLabel(screen)}</span>
            </button>
          ))}
        </div>
      </nav>

      {selectedVendor ? (
        <div className="estate-modal-backdrop">
          <div className="estate-modal-panel w-full max-w-lg p-5">
            <div className="mb-4 flex items-start justify-between gap-4 border-b border-line pb-4">
              <div className="min-w-0">
                <p className="mb-2 text-xs font-extrabold uppercase tracking-[0.1em] text-clay">
                  {selectedVendor.type}
                </p>
                <h3 className="truncate text-2xl font-extrabold text-ink">{selectedVendor.name}</h3>
                <p className="mt-1 text-sm font-semibold text-slate-600">
                  {selectedVendor.contactName || "No contact name saved"}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedVendorId("")}
                className="button-soft min-h-10 shrink-0 rounded-lg px-3 text-sm font-extrabold"
              >
                Close
              </button>
            </div>
            <div className="grid gap-3">
              <DetailStrip label="Phone" value={selectedVendor.phone || "Not provided"} />
              <DetailStrip label="Email" value={selectedVendor.email || "Not provided"} />
              <DetailStrip label="Notes" value={selectedVendor.notes || "No vendor notes."} />
            </div>
            <div className="mt-5 grid gap-2 sm:grid-cols-2">
              {selectedVendor.phone ? (
                <a href={`tel:${selectedVendor.phone}`} className="button-primary grid min-h-11 place-items-center rounded-lg px-4 text-sm font-extrabold">
                  Call Vendor
                </a>
              ) : null}
              {selectedVendor.email ? (
                <a href={`mailto:${selectedVendor.email}`} className="button-soft grid min-h-11 place-items-center rounded-lg px-4 text-sm font-extrabold">
                  Email Vendor
                </a>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}

      {selectedMaintenanceIssue ? (
        <div className="estate-modal-backdrop">
          <div className="estate-modal-panel max-h-[calc(100svh-2rem)] w-full max-w-2xl overflow-y-auto p-5">
            <div className="mb-4 flex items-start justify-between gap-4 border-b border-line pb-4">
              <div className="min-w-0">
                <p className="mb-2 text-xs font-extrabold uppercase tracking-[0.1em] text-clay">
                  Issue details
                </p>
                <h3 className="truncate text-2xl font-extrabold text-ink">{selectedMaintenanceIssue.title}</h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedMaintenanceIssueId("")}
                className="button-soft min-h-10 shrink-0 rounded-lg px-3 text-sm font-extrabold"
              >
                Close
              </button>
            </div>
            <div className="grid gap-3">
              <div className="grid gap-3 sm:grid-cols-2">
                <DetailStrip label="Priority" value={selectedMaintenanceIssue.priority} />
                <DetailStrip label="Status" value={selectedMaintenanceIssue.status} />
              </div>
              <DetailStrip label="Description" value={selectedMaintenanceIssue.description || "No description saved."} />
              <DetailStrip label="Vendor" value={selectedMaintenanceIssue.vendor || "Not assigned"} />
              <DetailStrip label="Next Step" value={selectedMaintenanceIssue.nextStep || "Review needed"} />
              <label className="grid gap-2 text-sm font-extrabold text-ink">
                Update status
                <select
                  value={selectedMaintenanceIssue.status}
                  onChange={(event) =>
                    updateMaintenanceStatus(selectedMaintenanceIssue.id, event.target.value as MaintenanceStatus)
                  }
                  className="field-shell rounded-lg p-3"
                >
                  {(["Open", "Scheduled", "In Progress", "Resolved"] as MaintenanceStatus[]).map((status) => (
                    <option key={status}>{status}</option>
                  ))}
                </select>
              </label>
              {selectedVendors.find((vendor) => vendor.name === selectedMaintenanceIssue.vendor)?.phone ? (
                <a
                  href={`tel:${selectedVendors.find((vendor) => vendor.name === selectedMaintenanceIssue.vendor)?.phone}`}
                  className="button-primary grid min-h-11 place-items-center rounded-lg px-4 text-sm font-extrabold"
                >
                  Call Vendor
                </a>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}

      {showPropertyForm ? (
        <div className="estate-modal-backdrop">
          <form
            className="estate-modal-panel grid max-h-[calc(100svh-2rem)] w-full max-w-xl gap-4 overflow-y-auto p-5"
            onSubmit={saveProperty}
          >
            <div>
              <p className="mb-2 text-xs font-extrabold uppercase tracking-[0.1em] text-clay">
                {editingPropertyId ? "Edit Property" : "New Property"}
              </p>
              <h2 className="text-xl font-extrabold">
                {editingPropertyId ? "Update Property Profile" : "Add Homeowner Profile"}
              </h2>
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
              label="Street address"
              value={propertyForm.address}
              onChange={(value) => setPropertyForm((current) => ({ ...current, address: value }))}
              required
            />
            <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_110px_130px]">
              <PropertyInput
                label="City"
                value={propertyForm.city}
                onChange={(value) => setPropertyForm((current) => ({ ...current, city: value }))}
                required={!editingPropertyId}
              />
              <PropertyInput
                label="State"
                value={propertyForm.state}
                onChange={(value) => setPropertyForm((current) => ({ ...current, state: value.toUpperCase() }))}
                required={!editingPropertyId}
              />
              <PropertyInput
                label="ZIP"
                value={propertyForm.zip}
                onChange={(value) => setPropertyForm((current) => ({ ...current, zip: value }))}
              />
            </div>
            <PropertyInput
              label="Phone"
              value={propertyForm.phone}
              onChange={(value) => setPropertyForm((current) => ({ ...current, phone: formatPhoneNumber(value) }))}
              type="tel"
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
            <PropertyPhotoPicker
              photoUrl={propertyForm.photoUrl}
              onUpload={uploadPropertyPhoto}
              onClear={() => setPropertyForm((current) => ({ ...current, photoUrl: "" }))}
            />
            <div className="sticky bottom-0 -mx-5 -mb-5 flex flex-wrap justify-end gap-3 border-t border-gold/20 bg-cream/95 p-5 backdrop-blur">
              <button
                type="button"
                onClick={() => {
                  setShowPropertyForm(false);
                  setEditingPropertyId("");
                  setPropertyForm(emptyPropertyForm);
                  setPropertySaveMessage("");
                }}
                className="button-soft min-h-11 flex-1 rounded-lg px-5 font-extrabold sm:flex-none"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSavingProperty}
                className="button-soft min-h-11 flex-1 rounded-lg px-5 font-extrabold disabled:cursor-not-allowed disabled:opacity-60 sm:flex-none"
              >
                {isSavingProperty ? "Saving..." : editingPropertyId ? "Update Property" : "Save Property"}
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
    <div className="min-h-[74px] rounded-lg border border-gold/20 bg-cream/80 p-4 shadow-soft">
      <span className="mb-2 block text-xs font-extrabold uppercase tracking-[0.08em] text-muted">{label}</span>
      <strong className="text-ink">{value}</strong>
    </div>
  );
}

function PropertyPhotoPicker({
  photoUrl,
  onUpload,
  onClear
}: {
  photoUrl: string;
  onUpload: (files: FileList | null) => void;
  onClear: () => void;
}) {
  return (
    <div className="grid gap-2 text-sm font-extrabold">
      Home photo
      <div className="rounded-lg border border-gold/20 bg-cream/80 p-3 shadow-soft">
        {photoUrl ? (
          <img src={photoUrl} alt="Selected home" className="mb-3 h-40 w-full rounded-lg border border-line bg-white object-cover" />
        ) : (
          <div className="mb-3 grid h-32 place-items-center rounded-lg border border-dashed border-gold/30 bg-white/70 text-sm font-semibold text-slate-500">
            No home photo selected
          </div>
        )}
        <div className="flex flex-wrap gap-2">
          <label className="button-soft grid min-h-10 cursor-pointer place-items-center rounded-lg px-4 text-sm font-extrabold">
            Browse Photo
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="sr-only"
              onChange={(event) => {
                onUpload(event.target.files);
                event.target.value = "";
              }}
            />
          </label>
          {photoUrl ? (
            <button
              type="button"
              onClick={onClear}
              className="button-soft min-h-10 rounded-lg px-4 text-sm font-extrabold"
            >
              Remove
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function PropertyReferenceStrip({
  activeExperience,
  onViewProperty,
  property
}: {
  activeExperience: ExperienceScreen;
  onViewProperty: () => void;
  property: Property;
}) {
  return (
    <section className="mt-4 rounded-lg border border-gold/25 bg-[#eae4d8] p-3 shadow-soft">
      <div className="grid gap-3 sm:grid-cols-[112px_minmax(0,1fr)_auto] sm:items-center">
        <span className="overflow-hidden rounded-lg border border-gold/20 bg-[#252525] shadow-soft">
          {property.photoUrl ? (
            <img src={property.photoUrl} alt={property.name} className="aspect-[4/3] w-full object-cover" />
          ) : (
            <span className="grid aspect-[4/3] place-items-center text-xs font-extrabold text-[#d8d0c2]">
              Home
            </span>
          )}
        </span>
        <div className="min-w-0">
          <p className="mb-1 text-xs font-extrabold uppercase tracking-[0.1em] text-gold">
            Active Property / {screenLabel(activeExperience)}
          </p>
          <h3 className="truncate font-serif text-2xl font-semibold leading-tight text-ink">
            {property.name}
          </h3>
          <p className="mt-1 truncate text-sm font-semibold text-muted">{property.address}</p>
        </div>
        <button
          type="button"
          onClick={onViewProperty}
          className={`button-soft min-h-10 rounded-lg px-4 text-sm font-extrabold ${
            activeExperience === "Property" ? "pointer-events-none opacity-70" : ""
          }`}
        >
          {activeExperience === "Property" ? "Viewing Property" : "View Property"}
        </button>
      </div>
    </section>
  );
}

function QuickContactButtons({ property }: { property: Property }) {
  async function copyAccessNotes() {
    const notes = property.accessNotes || "No access notes saved.";

    try {
      await navigator.clipboard.writeText(notes);
      window.alert("Access notes copied.");
    } catch {
      window.alert(notes);
    }
  }

  return (
    <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
      {property.phone ? (
        <a
          href={`tel:${property.phone}`}
          className="button-soft grid min-h-12 place-items-center rounded-lg px-4 text-sm font-extrabold"
        >
          Call Homeowner
        </a>
      ) : (
      <span className="grid min-h-12 place-items-center rounded-lg border border-line bg-[#fbfcfb] px-4 text-sm font-extrabold text-slate-500">
          No Phone Saved
        </span>
      )}
      {property.email ? (
        <a
          href={`mailto:${property.email}`}
          className="button-soft grid min-h-12 place-items-center rounded-lg px-4 text-sm font-extrabold"
        >
          Email Homeowner
        </a>
      ) : (
        <span className="grid min-h-12 place-items-center rounded-lg border border-line bg-[#fbfcfb] px-4 text-sm font-extrabold text-slate-500">
          No Email Saved
        </span>
      )}
      <a
        href={`https://maps.apple.com/?q=${encodeURIComponent(property.address)}`}
        target="_blank"
        className="button-soft grid min-h-12 place-items-center rounded-lg px-4 text-sm font-extrabold"
      >
        Directions
      </a>
      <button
        type="button"
        onClick={copyAccessNotes}
        className="button-soft grid min-h-12 place-items-center rounded-lg px-4 text-sm font-extrabold"
      >
        Copy Access Notes
      </button>
    </div>
  );
}

function SelectedPhotoPreviewGrid({
  files,
  onRemove
}: {
  files: File[];
  onRemove: (index: number) => void;
}) {
  const [previews, setPreviews] = useState<{ index: number; name: string; url: string }[]>([]);

  useEffect(() => {
    const nextPreviews = files.slice(0, 6).map((file, index) => ({
      index,
      name: file.name,
      url: URL.createObjectURL(file)
    }));

    setPreviews(nextPreviews);
    return () => {
      nextPreviews.forEach((preview) => URL.revokeObjectURL(preview.url));
    };
  }, [files]);

  if (!previews.length) {
    return null;
  }

  return (
    <div className="mt-3 grid gap-3 sm:grid-cols-2">
      {previews.map((preview) => (
        <figure key={preview.url} className="overflow-hidden rounded-lg border border-line bg-cream shadow-soft">
          <img src={preview.url} alt={preview.name} className="h-56 w-full bg-[#252525] object-contain sm:h-64" />
          <figcaption className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2 px-3 py-2">
            <span className="truncate text-xs font-semibold text-slate-600">{preview.name}</span>
            <button
              type="button"
              onClick={() => onRemove(preview.index)}
              className="rounded-lg border border-[#e7cbc4] bg-[#fff8f6] px-3 py-1 text-xs font-extrabold text-[#9f352e]"
              aria-label={`Remove ${preview.name}`}
            >
              Remove
            </button>
          </figcaption>
        </figure>
      ))}
      {files.length > previews.length ? (
        <div className="grid min-h-56 place-items-center rounded-lg border border-line bg-cream p-4 text-center text-sm font-extrabold text-slate-600 sm:min-h-64">
          +{files.length - previews.length} more
        </div>
      ) : null}
    </div>
  );
}

function LuxuryExperiencePanel({
  activeExperience,
  activeRole,
  activeReport,
  addMaintenanceIssuePhotoFiles,
  applyMaintenanceRecommendation,
  maintenanceIssueForm,
  maintenanceRecommendation,
  maintenanceRecommendationMessage,
  maintenanceIssues,
  allMaintenanceIssues,
  maintenanceSaveMessage,
  setMaintenanceSaveMessage,
  now,
  ownerUpdateForm,
  ownerUpdateSaveMessage,
  ownerUpdates,
  properties,
  selectedPropertyId,
  scheduleTaskForm,
  scheduleSaveMessage,
  scheduleTasks,
  saveMaintenanceIssue,
  saveOwnerUpdate,
  saveScheduleTask,
  saveVendor,
  openAddPropertyForm,
  openEditPropertyForm,
  onSelectProperty,
  selectedInspections,
  selectedProperty,
  selectedVendors,
  setActiveExperience,
  setInspectionForm,
  setMaintenanceRecommendation,
  setMaintenanceRecommendationMessage,
  setMaintenanceIssueForm,
  showMaintenanceForm,
  setShowMaintenanceForm,
  setSelectedMaintenanceIssueId,
  setOwnerUpdateForm,
  setScheduleTaskForm,
  setVendorForm,
  suggestMaintenanceRecommendation,
  isSavingOwnerUpdate,
  isSavingScheduleTask,
  isSavingMaintenanceIssue,
  upcomingScheduleTasks,
  updateMaintenanceStatus,
  updateMaintenanceIssue,
  updateScheduleTaskStatus,
  vendorForm,
  vendorSaveMessage,
  isSavingVendor,
  pilotDatabase,
  pilotUsageSummary,
  feedbackItems,
  refreshPilotConsole,
  toggleFeatureFlag,
  resetPilotAccount
}: {
  activeExperience: ExperienceScreen;
  activeRole: AppRole;
  activeReport: Inspection | undefined;
  addMaintenanceIssuePhotoFiles: (files: FileList | null) => void;
  applyMaintenanceRecommendation: () => void;
  isSavingMaintenanceIssue: boolean;
  maintenanceIssueForm: MaintenanceIssueForm;
  maintenanceRecommendation: MaintenanceRecommendation | null;
  maintenanceRecommendationMessage: string;
  maintenanceIssues: MaintenanceIssue[];
  allMaintenanceIssues: MaintenanceIssue[];
  maintenanceSaveMessage: string;
  setMaintenanceSaveMessage: Dispatch<SetStateAction<string>>;
  now: Date;
  ownerUpdateForm: OwnerUpdateForm;
  ownerUpdateSaveMessage: string;
  ownerUpdates: OwnerUpdate[];
  properties: Property[];
  selectedPropertyId: string;
  scheduleTaskForm: ScheduleTaskForm;
  scheduleSaveMessage: string;
  scheduleTasks: ScheduleTask[];
  saveMaintenanceIssue: (event: FormEvent<HTMLFormElement>) => void;
  saveOwnerUpdate: (event: FormEvent<HTMLFormElement>) => void;
  saveScheduleTask: (event: FormEvent<HTMLFormElement>) => void;
  saveVendor: (event: FormEvent<HTMLFormElement>) => void;
  openAddPropertyForm: () => void;
  openEditPropertyForm: (property: Property) => void;
  onSelectProperty: (propertyId: string) => void;
  selectedInspections: Inspection[];
  selectedProperty: Property | undefined;
  selectedVendors: VendorContact[];
  setActiveExperience: (screen: ExperienceScreen) => void;
  setInspectionForm: Dispatch<SetStateAction<InspectionForm>>;
  setMaintenanceRecommendation: Dispatch<SetStateAction<MaintenanceRecommendation | null>>;
  setMaintenanceRecommendationMessage: Dispatch<SetStateAction<string>>;
  setMaintenanceIssueForm: Dispatch<SetStateAction<MaintenanceIssueForm>>;
  showMaintenanceForm: boolean;
  setShowMaintenanceForm: Dispatch<SetStateAction<boolean>>;
  setSelectedMaintenanceIssueId: Dispatch<SetStateAction<string>>;
  setOwnerUpdateForm: Dispatch<SetStateAction<OwnerUpdateForm>>;
  setScheduleTaskForm: Dispatch<SetStateAction<ScheduleTaskForm>>;
  setVendorForm: Dispatch<SetStateAction<VendorForm>>;
  suggestMaintenanceRecommendation: () => void;
  isSavingOwnerUpdate: boolean;
  isSavingScheduleTask: boolean;
  updateMaintenanceStatus: (issueId: string, status: MaintenanceStatus) => void;
  updateMaintenanceIssue: (issueId: string, updates: Partial<MaintenanceIssueForm>) => Promise<MaintenanceIssue>;
  upcomingScheduleTasks: ScheduleTask[];
  updateScheduleTaskStatus: (taskId: string, status: ScheduleTaskStatus) => void;
  vendorForm: VendorForm;
  vendorSaveMessage: string;
  isSavingVendor: boolean;
  pilotDatabase: PilotDatabase | null;
  pilotUsageSummary: PilotUsageSummary | null;
  feedbackItems: FeedbackRecord[];
  refreshPilotConsole: () => void;
  toggleFeatureFlag: (featureId: string) => void;
  resetPilotAccount: (organizationId: string) => void;
}) {
  const urgentCount = selectedInspections.filter((inspection) => inspection.urgent === "Yes").length;
  const urgentMaintenanceCount = maintenanceIssues.filter(
    (issue) => issue.priority === "Urgent" && issue.status !== "Resolved"
  ).length;
  const openMaintenanceCount = maintenanceIssues.filter((issue) => issue.status !== "Resolved").length;
  const resolvedMaintenanceCount = maintenanceIssues.filter((issue) => issue.status === "Resolved").length;
  const assignedMaintenanceCount = maintenanceIssues.filter((issue) => issue.vendor && issue.status !== "Resolved").length;
  const recentReport = selectedInspections[0];
  const sharedOwnerUpdates = ownerUpdates.filter((update) => update.status === "Shared");
  const internalOwnerUpdates = ownerUpdates.filter((update) => update.status !== "Shared");
  const latestSharedOwnerUpdate = sharedOwnerUpdates[0];
  const [showOwnerUpdateForm, setShowOwnerUpdateForm] = useState(false);
  const [selectedOwnerUpdateId, setSelectedOwnerUpdateId] = useState("");
  const selectedOwnerUpdate = ownerUpdates.find((update) => update.id === selectedOwnerUpdateId) ?? null;
  const ownerAttentionCount = urgentCount + urgentMaintenanceCount;
  const ownerPortalStatus = ownerAttentionCount > 0 ? "Attention Recommended" : "Property Stable";
  const ownerPortalDetail =
    ownerAttentionCount > 0
      ? "A recent inspection or repair item should be reviewed."
      : "No urgent homeowner action is flagged at this time.";
  const latestExecutiveSummary =
    recentReport?.executiveSummary ||
    (recentReport
      ? "The latest inspection has been completed and is ready for homeowner review."
      : "Complete an inspection to create the first homeowner summary.");
  const activeMaintenanceIssues = maintenanceIssues.filter((issue) => issue.status !== "Resolved").slice(0, 3);
  const ownerReportRouteId = (inspection: Inspection) =>
    inspection.id.startsWith("demo-inspection-") && !demoDatabase.inspections.some((item) => item.id === inspection.id)
      ? demoDatabase.inspections[0]?.id ?? inspection.id
      : inspection.id;
  const activeScheduleTasks = scheduleTasks
    .filter((task) => !["Complete", "Skipped"].includes(task.status))
    .sort((first, second) => new Date(first.scheduledFor).getTime() - new Date(second.scheduledFor).getTime());
  const completedScheduleTasks = scheduleTasks.filter((task) => task.status === "Complete");
  const [showScheduleForm, setShowScheduleForm] = useState(false);
  const [selectedScheduleTaskId, setSelectedScheduleTaskId] = useState("");
  const selectedScheduleTask = scheduleTasks.find((task) => task.id === selectedScheduleTaskId) ?? null;

  useEffect(() => {
    setSelectedScheduleTaskId("");
    setShowScheduleForm(false);
    setSelectedOwnerUpdateId("");
    setShowOwnerUpdateForm(false);
  }, [selectedPropertyId]);

  function localDateTimeValue(daysFromNow: number, hour: number, minute = 0) {
    const date = new Date();
    date.setDate(date.getDate() + daysFromNow);
    date.setHours(hour, minute, 0, 0);
    const offset = date.getTimezoneOffset();
    const localDate = new Date(date.getTime() - offset * 60 * 1000);

    return localDate.toISOString().slice(0, 16);
  }

  function prepareScheduleTemplate(type: ScheduleTaskType) {
    const template =
      type === "Pre-Guest Arrival"
        ? {
            title: "Pre-guest arrival inspection",
            scheduledFor: localDateTimeValue(1, 10),
            notes: "Confirm access, climate, lighting, pool/spa readiness, supplies, and visible arrival details."
          }
        : type === "Post-Checkout"
          ? {
              title: "Post-checkout inspection",
              scheduledFor: localDateTimeValue(1, 12),
              notes: "Document property condition, visible damage, left items, trash, thermostat, and vendor needs."
            }
          : type === "Cleaner"
            ? {
                title: "Cleaner completion report",
                scheduledFor: localDateTimeValue(1, 15),
                notes: "Verify cleaner completion, photo-ready condition, linens, supplies, trash, and final presentation."
              }
            : type === "Vendor"
              ? {
                  title: "Vendor site visit",
                  scheduledFor: localDateTimeValue(2, 9),
                  notes: "Confirm vendor access, scope, arrival window, contact details, and owner-facing follow-up."
                }
              : {
                  title: "Weekly home watch inspection",
                  scheduledFor: localDateTimeValue(7, 9),
                  notes: "Complete exterior, interior, photo documentation, issue review, and homeowner report."
                };

    setScheduleTaskForm((current) => ({
      ...current,
      type,
      status: "Scheduled",
      assignedTo: current.assignedTo,
      ...template
    }));
    setShowScheduleForm(true);
  }

  function draftLatestInspectionOwnerUpdate() {
    setOwnerUpdateForm((current) => ({
      ...current,
      category: "Inspection",
      status: "Draft",
      title: recentReport ? "Latest inspection completed" : "Inspection update",
      message: latestExecutiveSummary
    }));
    setShowOwnerUpdateForm(true);
  }

  function draftMaintenanceOwnerUpdate() {
    const featuredIssue = activeMaintenanceIssues[0];

    setOwnerUpdateForm((current) => ({
      ...current,
      category: "Maintenance",
      status: "Draft",
      title: featuredIssue ? `Maintenance update: ${featuredIssue.title}` : "Maintenance update",
      message: featuredIssue
        ? `${featuredIssue.title} is currently marked ${featuredIssue.status.toLowerCase()}. ${
            featuredIssue.nextStep || featuredIssue.description || "The item is being monitored and will be updated as work progresses."
          }`
        : "No open maintenance items are currently visible for this property."
    }));
    setShowOwnerUpdateForm(true);
  }

  function draftOwnerUpdateFromMaintenance(issue: MaintenanceIssue) {
    setOwnerUpdateForm((current) => ({
      ...current,
      category: "Maintenance",
      status: "Draft",
      title: `Maintenance update: ${issue.title}`,
      message: `${issue.title} is currently marked ${issue.status.toLowerCase()} with ${issue.priority.toLowerCase()} priority. ${
        issue.vendor ? `${issue.vendor} is assigned for follow-up. ` : ""
      }${issue.nextStep || issue.description || "The item is being monitored and will be updated as work progresses."}`
    }));
    setActiveExperience("Owner Portal");
    setShowOwnerUpdateForm(true);
  }

  function planVendorVisitFromMaintenance(issue: MaintenanceIssue) {
    setScheduleTaskForm((current) => ({
      ...current,
      type: "Vendor",
      title: `Vendor follow-up: ${issue.title}`,
      scheduledFor: current.scheduledFor || localDateTimeValue(1, 9),
      status: "Scheduled",
      assignedTo: issue.vendor || current.assignedTo,
      notes: `${issue.priority} priority maintenance item. ${issue.description || "Review issue details on site."} ${
        issue.nextStep ? `Next step: ${issue.nextStep}` : ""
      }`
    }));
    setActiveExperience("Schedule");
    setShowScheduleForm(true);
  }

  function inspectionTypeForScheduleTask(type: ScheduleTaskType): InspectionType {
    if (type === "Pre-Guest Arrival") return "Pre-Guest Arrival Inspection";
    if (type === "Post-Checkout") return "Post-Checkout Inspection";
    if (type === "Cleaner") return "Cleaner Completion Report";
    if (type === "Maintenance" || type === "Vendor") return "Damage / Maintenance Report";

    return "Home Watch Inspection";
  }

  function startInspectionFromSchedule(task: ScheduleTask) {
    setInspectionForm((current) => ({
      ...current,
      inspectionType: inspectionTypeForScheduleTask(task.type),
      inspectorName: task.assignedTo || current.inspectorName,
      notes: task.notes ? `Scheduled work: ${task.title}\n${task.notes}` : `Scheduled work: ${task.title}`,
      checklist: []
    }));
    setActiveExperience("Inspection");
  }

  function prepareMaintenanceTemplate(
    title: string,
    priority: MaintenancePriority,
    vendorType: VendorType,
    description: string,
    nextStep: string
  ) {
    const matchingVendor = selectedVendors.find((vendor) => vendor.type === vendorType);

    setMaintenanceIssueForm((current) => ({
      ...current,
      title,
      priority,
      status: "Open",
      vendor: matchingVendor?.name ?? "",
      description,
      nextStep
    }));
    setMaintenanceSaveMessage("");
    setShowMaintenanceForm(true);
  }

  function propertyIssueSummary(propertyId: string) {
    const openIssues = allMaintenanceIssues.filter(
      (issue) => issue.propertyId === propertyId && issue.status !== "Resolved"
    );
    const urgentIssues = openIssues.filter((issue) => issue.priority === "Urgent");

    return {
      openCount: openIssues.length,
      urgentCount: urgentIssues.length
    };
  }

  return (
    <section className="no-print mb-5">
      {activeExperience !== "Dashboard" && activeExperience !== "Login" ? (
        <div className="estate-panel mb-4 rounded-lg p-4 lg:hidden">
          <div className="flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => setActiveExperience("Dashboard")}
              className="button-primary min-h-10 rounded-lg px-4 text-sm font-extrabold shadow-lift"
            >
              Home
            </button>
            <div className="min-w-0 text-right">
              <span className="block truncate text-xs font-extrabold uppercase tracking-[0.1em] text-clay">
                {activeExperience}
              </span>
              <strong className="block truncate text-sm text-ink">
                {selectedProperty?.name || "No property selected"}
              </strong>
            </div>
          </div>
        </div>
      ) : null}

      {activeExperience === "Login" ? (
        <div className="estate-panel grid min-h-[620px] place-items-center rounded-lg p-5 sm:p-8">
          <div className="w-full max-w-[420px]">
            <div className="mb-8 text-center">
              <img
                src="/estateiq-logo.png"
                alt="EstateIQ"
                className="mx-auto mb-5 w-full max-w-[300px] rounded-lg shadow-lift"
              />
              <p className="mb-2 text-xs font-extrabold uppercase tracking-[0.16em] text-clay">
                Property Intelligence. Peace of Mind.
              </p>
              <h2 className="font-serif text-4xl font-semibold leading-tight text-ink">EstateIQ</h2>
            </div>

            <form className="grid gap-4">
              <label className="grid gap-2 text-sm font-extrabold text-ink">
                Email
                <input className="field-shell min-h-12 rounded-lg p-3" placeholder="name@example.com" type="email" />
              </label>
              <label className="grid gap-2 text-sm font-extrabold text-ink">
                Password
                <input className="field-shell min-h-12 rounded-lg p-3" placeholder="Password" type="password" />
              </label>
              <button type="button" className="button-primary mt-2 min-h-12 rounded-lg px-5 font-extrabold">
                Sign In
              </button>
            </form>

            <p className="mt-5 text-center text-sm leading-6 text-slate-600">
              Secure access for homeowners and property operations teams.
            </p>
          </div>
        </div>
      ) : null}

      {activeExperience === "Pilot Admin" && activeRole === "Admin" ? (
        <PilotAdminConsole
          pilotDatabase={pilotDatabase}
          pilotUsageSummary={pilotUsageSummary}
          feedbackItems={feedbackItems}
          refreshPilotConsole={refreshPilotConsole}
          toggleFeatureFlag={toggleFeatureFlag}
          resetPilotAccount={resetPilotAccount}
        />
      ) : null}

      {activeExperience === "Dashboard" ? (
        <div className="grid gap-5">
          {activeRole === "Homeowner" ? (
            <div className="estate-panel rounded-lg p-5">
              <p className="mb-2 text-xs font-extrabold uppercase tracking-[0.12em] text-clay">
                Home
              </p>
              <h2 className="text-2xl font-extrabold text-ink">
                {selectedProperty ? selectedProperty.name : "Your property"}
              </h2>
              <div
                className={`mt-4 rounded-lg border p-4 ${
                  ownerAttentionCount > 0
                    ? "border-[#e7cbc4] bg-[#fff8f6]"
                    : "border-gold/25 bg-warning-soft/60"
                }`}
              >
                <span className="text-xs font-extrabold uppercase tracking-[0.1em] text-slate-500">
                  Current status
                </span>
                <strong
                  className={`mt-2 block text-2xl font-black ${
                    ownerAttentionCount > 0 ? "text-[#9f352e]" : "text-gold"
                  }`}
                >
                  {ownerPortalStatus}
                </strong>
                <p className="mt-2 text-sm leading-6 text-slate-700">{ownerPortalDetail}</p>
              </div>
              <button
                type="button"
                onClick={() => setActiveExperience("Owner Portal")}
                className="button-primary mt-4 min-h-11 w-full rounded-lg px-4 text-sm font-extrabold"
              >
                View Owner Portal
              </button>
            </div>
          ) : (
            <>
          <div className="estate-panel rounded-lg p-5">
              <div className="mb-4 grid gap-3 sm:flex sm:items-center sm:justify-between">
                <div>
                  <p className="mb-2 text-xs font-extrabold uppercase tracking-[0.12em] text-clay">
                    Home
                  </p>
                  <h2 className="font-serif text-4xl font-semibold leading-tight text-ink">Today’s properties</h2>
                </div>
                <div className="grid gap-2 sm:flex sm:w-auto sm:shrink-0">
                  {selectedProperty ? (
                    <button
                      type="button"
                      onClick={() => openEditPropertyForm(selectedProperty)}
                      className="button-soft min-h-11 w-full rounded-lg px-4 text-sm font-extrabold sm:w-auto"
                    >
                      Edit Selected Property
                    </button>
                  ) : null}
                  <button
                    type="button"
                    onClick={openAddPropertyForm}
                    className="button-soft min-h-11 w-full rounded-lg px-4 text-sm font-extrabold sm:w-auto"
                  >
                    Add New Property
                  </button>
                </div>
              </div>
              <div className="grid gap-3 lg:grid-cols-2 xl:grid-cols-3">
                {properties.map((property) => {
                  const issueSummary = propertyIssueSummary(property.id);

                  return (
                    <article
                      key={property.id}
                      className={`motion-hover-lift overflow-hidden rounded-lg border bg-cream/90 shadow-soft transition ${
                        selectedProperty?.id === property.id
                          ? "border-gold shadow-[inset_4px_0_0_#d4af37]"
                          : "border-gold/20 hover:border-gold/50 hover:shadow-lift"
                      }`}
                    >
                      <button
                        type="button"
                        onClick={() => {
                          onSelectProperty(property.id);
                          setActiveExperience("Property");
                        }}
                        className="block w-full text-left"
                      >
                        <span className="block overflow-hidden border-b border-gold/15 bg-[#252525]">
                        {property.photoUrl ? (
                          <img src={property.photoUrl} alt={property.name} className="aspect-[5/3] w-full object-cover" />
                        ) : (
                          <span className="grid aspect-[5/3] place-items-center text-xs font-extrabold text-[#d8d0c2]">
                            Home
                          </span>
                        )}
                        </span>
                        <span className="block p-3">
                          <span className="flex items-start justify-between gap-3">
                            <span className="min-w-0">
                              <strong className="block truncate font-serif text-xl font-semibold leading-tight text-ink">
                                {property.name}
                              </strong>
                              <span className="mt-1 block truncate text-sm font-semibold text-slate-600">
                                {property.address}
                              </span>
                              <span className="mt-1 block truncate text-sm font-semibold text-slate-600">
                                {property.owner} / {property.status}
                              </span>
                            </span>
                            {issueSummary.openCount ? (
                              <span
                                className={`shrink-0 rounded-full border px-2.5 py-1 text-[0.68rem] font-extrabold ${
                                  issueSummary.urgentCount
                                    ? "border-[#e7cbc4] bg-[#fff8f6] text-[#9f352e]"
                                    : "border-gold/25 bg-warning-soft text-ink"
                                }`}
                              >
                                {issueSummary.urgentCount
                                  ? "Urgent"
                                  : `${issueSummary.openCount} issue${issueSummary.openCount === 1 ? "" : "s"}`}
                              </span>
                            ) : null}
                          </span>
                        </span>
                      </button>
                      <div className="grid gap-2 border-t border-gold/15 p-3 sm:grid-cols-2">
                        <button
                          type="button"
                          onClick={() => {
                            onSelectProperty(property.id);
                            setActiveExperience("Property");
                          }}
                          className="button-soft min-h-10 rounded-lg px-4 text-sm font-extrabold"
                        >
                          View Property
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            onSelectProperty(property.id);
                            setActiveExperience("Inspection");
                          }}
                          className="button-soft min-h-10 rounded-lg px-4 text-sm font-extrabold"
                        >
                          Inspect
                        </button>
                      </div>
                    </article>
                  );
                })}
              </div>
          </div>
            </>
          )}
        </div>
      ) : null}

      {activeExperience === "Schedule" ? (
        <>
          <div className="grid gap-5">
            <div className="grid gap-5 lg:grid-cols-[minmax(0,1.25fr)_minmax(280px,0.75fr)]">
              <section className="rounded-lg border border-gold/25 bg-[#eae4d8] p-4 shadow-soft">
                <div className="mb-4 flex flex-wrap items-start justify-between gap-3 border-b border-gold/20 pb-4">
                  <div>
                    <p className="mb-2 text-xs font-extrabold uppercase tracking-[0.1em] text-gold">
                      Schedule
                    </p>
                    <h2 className="font-serif text-3xl font-semibold leading-tight text-ink">
                      Schedule the next visit
                    </h2>
                    <p className="mt-2 max-w-2xl text-sm font-semibold leading-6 text-muted">
                      Confirm the next home watch, vendor, cleaner, or arrival-prep appointment for {selectedProperty?.name || "this property"}.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setScheduleTaskForm(emptyScheduleTaskForm);
                      setShowScheduleForm(true);
                    }}
                    className="button-soft min-h-11 rounded-lg px-4 text-sm font-extrabold"
                  >
                    Add Visit
                  </button>
                </div>
                {activeScheduleTasks[0] ? (
                  <div className="mb-4 rounded-lg border border-gold/20 bg-cream p-4 shadow-soft">
                    <span className="text-xs font-extrabold uppercase tracking-[0.1em] text-gold">
                      Next scheduled
                    </span>
                    <h3 className="mt-2 font-serif text-2xl font-semibold leading-tight text-ink">
                      {activeScheduleTasks[0].title}
                    </h3>
                    <p className="mt-1 text-sm font-semibold leading-6 text-muted">
                      {formatDateTime(activeScheduleTasks[0].scheduledFor)} / {activeScheduleTasks[0].assignedTo || "Unassigned"}
                    </p>
                  </div>
                ) : null}
                <div className="grid gap-3">
                  {scheduleTasks.length ? (
                    scheduleTasks.map((task) => (
                      <ScheduleTaskListItem
                        key={task.id}
                        task={task}
                        onSelect={() => setSelectedScheduleTaskId(task.id)}
                      />
                    ))
                  ) : (
                    <div className="rounded-lg border border-gold/15 bg-cream/80 p-4 shadow-soft">
                      <p className="text-sm font-semibold leading-6 text-muted">
                        No work has been scheduled for this property yet. Add the next visit to place it on the property calendar.
                      </p>
                      <button
                        type="button"
                        onClick={() => prepareScheduleTemplate("Home Watch")}
                        className="button-soft mt-4 min-h-10 rounded-lg px-4 text-sm font-extrabold"
                      >
                        Plan Home Watch
                      </button>
                    </div>
                  )}
                </div>
              </section>

              <section className="rounded-lg border border-gold/15 bg-[#eae4d8] p-4 shadow-soft">
                <div className="mb-3">
                  <p className="text-xs font-extrabold uppercase tracking-[0.1em] text-gold">
                    Optional templates
                  </p>
                  <h3 className="mt-1 font-serif text-2xl font-semibold leading-tight text-ink">Start from a visit type</h3>
                  <p className="mt-1 text-sm font-semibold leading-6 text-muted">
                    Use one when you need to create a new visit quickly.
                  </p>
                </div>
                <div className="grid gap-2">
                  {(["Home Watch", "Pre-Guest Arrival", "Post-Checkout", "Cleaner", "Vendor"] as ScheduleTaskType[]).map(
                    (type) => (
                      <button
                        key={type}
                        type="button"
                        onClick={() => prepareScheduleTemplate(type)}
                        className={`min-h-11 rounded-lg border px-4 text-left text-sm font-extrabold transition hover:border-gold/50 hover:shadow-lift ${
                          scheduleTaskForm.type === type ? "border-gold bg-cream text-ink shadow-[inset_4px_0_0_#d4af37]" : "border-gold/20 bg-cream text-ink"
                        }`}
                      >
                        {type}
                      </button>
                    )
                  )}
                </div>
                {scheduleSaveMessage ? (
                  <div className="mt-4 rounded-lg border border-gold/20 bg-cream p-3 text-sm font-semibold text-ink">
                    {scheduleSaveMessage}
                  </div>
                ) : null}
              </section>
            </div>
          </div>

          {showScheduleForm ? (
            <div className="estate-modal-backdrop">
              <form
                id="schedule-form"
                className="estate-modal-panel grid max-h-[calc(100svh-2rem)] w-full max-w-2xl gap-3 overflow-y-auto p-5"
                onSubmit={(event) => {
                  saveScheduleTask(event);
                  setShowScheduleForm(false);
                }}
              >
                <div className="mb-1 flex items-start justify-between gap-3 border-b border-gold/20 pb-4">
                  <div>
                    <span className="text-xs font-extrabold uppercase tracking-[0.1em] text-clay">
                      Schedule work
                    </span>
                    <h3 className="mt-1 font-serif text-3xl font-semibold leading-tight text-ink">Add scheduled work</h3>
                    <p className="mt-1 text-sm font-semibold leading-6 text-slate-600">
                      Confirm who is going, when they are expected, and any property-specific instructions.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowScheduleForm(false)}
                    className="button-soft min-h-10 rounded-lg px-4 text-sm font-extrabold"
                  >
                    Close
                  </button>
                </div>
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
                <button
                  type="submit"
                  disabled={isSavingScheduleTask}
                  className="button-primary min-h-12 rounded-lg px-5 font-extrabold disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isSavingScheduleTask ? "Saving..." : "Save Task"}
                </button>
              </form>
            </div>
          ) : null}

          {selectedScheduleTask ? (
            <div className="estate-modal-backdrop">
              <div className="estate-modal-panel max-h-[calc(100svh-2rem)] w-full max-w-xl overflow-y-auto p-5">
                <div className="mb-4 flex items-start justify-between gap-3 border-b border-gold/20 pb-4">
                  <div>
                    <span className="text-xs font-extrabold uppercase tracking-[0.1em] text-clay">
                      Schedule detail
                    </span>
                    <h3 className="mt-1 font-serif text-3xl font-semibold leading-tight text-ink">{selectedScheduleTask.title}</h3>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSelectedScheduleTaskId("")}
                    className="button-soft min-h-10 rounded-lg px-4 text-sm font-extrabold"
                  >
                    Close
                  </button>
                </div>
                <ScheduleTaskCard
                  task={selectedScheduleTask}
                  updateScheduleTaskStatus={updateScheduleTaskStatus}
                  onStartInspection={(task) => {
                    setSelectedScheduleTaskId("");
                    startInspectionFromSchedule(task);
                  }}
                />
              </div>
            </div>
          ) : null}
        </>
      ) : null}

      {activeExperience === "Maintenance" ? (
        <div className="grid gap-4">
          <div className="grid gap-4 lg:grid-cols-[minmax(0,1.25fr)_minmax(280px,0.75fr)]">
            <section className="rounded-lg border border-gold/25 bg-[#eae4d8] p-4 shadow-soft">
              <div className="mb-4 flex flex-wrap items-start justify-between gap-3 border-b border-gold/20 pb-4">
                <div>
                  <p className="mb-2 text-xs font-extrabold uppercase tracking-[0.1em] text-gold">
                    Issues
                  </p>
                  <h3 className="font-serif text-3xl font-semibold leading-tight text-ink">
                    Issues
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setMaintenanceIssueForm(emptyMaintenanceIssueForm);
                    setMaintenanceRecommendation(null);
                    setMaintenanceRecommendationMessage("");
                    setMaintenanceSaveMessage("");
                    setShowMaintenanceForm(true);
                  }}
                  className="button-soft min-h-11 rounded-lg px-4 text-sm font-extrabold"
                >
                  Add Issue
                </button>
              </div>
              <div className="mb-4 flex flex-wrap gap-2">
                <span className="rounded-full border border-gold/25 bg-cream px-3 py-1 text-xs font-extrabold text-ink">
                  {openMaintenanceCount} open
                </span>
                <span
                  className={`rounded-full border px-3 py-1 text-xs font-extrabold ${
                    urgentMaintenanceCount > 0
                      ? "border-[#e7cbc4] bg-[#fff8f6] text-[#9f352e]"
                      : "border-gold/25 bg-cream text-ink"
                  }`}
                >
                  {urgentMaintenanceCount} urgent
                </span>
                <span className="rounded-full border border-gold/25 bg-cream px-3 py-1 text-xs font-extrabold text-ink">
                  {assignedMaintenanceCount} assigned
                </span>
              </div>
              <div className="overflow-hidden rounded-lg border border-gold/15 bg-cream shadow-soft">
                {maintenanceIssues.length ? (
                  maintenanceIssues.map((issue) => (
                    <MaintenanceIssueListItem
                      key={issue.id}
                      issue={issue}
                      onSelect={() => setSelectedMaintenanceIssueId(issue.id)}
                    />
                  ))
                ) : (
                  <div className="p-4">
                    <p className="text-sm leading-6 text-slate-600">
                      No maintenance issues have been saved for this property yet. Start with a common repair workflow,
                      then add photos and save the item.
                    </p>
                    <button
                      type="button"
                      onClick={() =>
                        prepareMaintenanceTemplate(
                          "Landscape or irrigation issue",
                          "Medium",
                          "Landscape",
                          "Landscape or irrigation condition requires attention. Document affected area, visible leaks, flooding, dry spots, or plant stress.",
                          "Coordinate with landscape vendor and verify condition at the next property visit."
                        )
                      }
                      className="button-soft mt-4 min-h-10 rounded-lg px-4 text-sm font-extrabold"
                    >
                      Start First Issue
                    </button>
                  </div>
                )}
              </div>
            </section>

            <section className="rounded-lg border border-gold/15 bg-[#eae4d8] p-4 shadow-soft">
              <div className="mb-3">
                <p className="text-xs font-extrabold uppercase tracking-[0.1em] text-gold">
                  Add from template
                </p>
                <h3 className="mt-1 font-serif text-2xl font-semibold leading-tight text-ink">New issue starters</h3>
                <p className="mt-1 text-sm font-semibold leading-6 text-muted">
                  Use only when the issue is not already in the work queue.
                </p>
              </div>
              <div className="grid gap-2">
                <button
                  type="button"
                  onClick={() =>
                    prepareMaintenanceTemplate(
                      "HVAC performance concern",
                      "High",
                      "HVAC",
                      "HVAC performance requires review. Document thermostat reading, airflow, and any abnormal noise or lack of cooling.",
                      "Contact HVAC vendor for availability and update homeowner once service timing is confirmed."
                    )
                  }
                  className="min-h-11 rounded-lg border border-gold/20 bg-cream px-4 text-left text-sm font-extrabold text-ink transition hover:border-gold/50 hover:shadow-lift"
                >
                  HVAC Concern
                </button>
                <button
                  type="button"
                  onClick={() =>
                    prepareMaintenanceTemplate(
                      "Pool or spa service item",
                      "Medium",
                      "Pool",
                      "Pool/spa condition requires service review. Document water clarity, equipment status, visible leaks, and exterior condition.",
                      "Request pool vendor review and continue monitoring until service is complete."
                    )
                  }
                  className="min-h-11 rounded-lg border border-gold/20 bg-cream px-4 text-left text-sm font-extrabold text-ink transition hover:border-gold/50 hover:shadow-lift"
                >
                  Pool / Spa
                </button>
                <button
                  type="button"
                  onClick={() =>
                    prepareMaintenanceTemplate(
                      "Landscape or irrigation issue",
                      "Medium",
                      "Landscape",
                      "Landscape or irrigation condition requires attention. Document affected area, visible leaks, flooding, dry spots, or plant stress.",
                      "Coordinate with landscape vendor and verify condition at the next property visit."
                    )
                  }
                  className="min-h-11 rounded-lg border border-gold/20 bg-cream px-4 text-left text-sm font-extrabold text-ink transition hover:border-gold/50 hover:shadow-lift"
                >
                  Landscape / Irrigation
                </button>
                <button
                  type="button"
                  onClick={() =>
                    prepareMaintenanceTemplate(
                      "Security or access concern",
                      "Urgent",
                      "Handyman",
                      "Security or access condition requires prompt review. Document doors, gates, locks, panels, and visible signs of concern.",
                      "Review immediately, document with photos, and notify homeowner with recommended next steps."
                    )
                  }
                  className="min-h-11 rounded-lg border border-[#e7cbc4] bg-[#fff8f6] px-4 text-left text-sm font-extrabold text-[#9f352e] transition hover:bg-[#ffecea]"
                >
                  Security Concern
                </button>
              </div>
            </section>
          </div>

            {showMaintenanceForm ? (
              <div className="estate-modal-backdrop">
                <form
                  id="maintenance-form"
                  className="estate-modal-panel grid max-h-[calc(100svh-2rem)] w-full max-w-2xl gap-3 overflow-y-auto p-5"
                  onSubmit={saveMaintenanceIssue}
                >
              <div className="mb-1 flex items-start justify-between gap-4 border-b border-gold/20 pb-4">
                <div>
                  <p className="mb-2 text-xs font-extrabold uppercase tracking-[0.1em] text-clay">
                    New issue
                  </p>
                  <h3 className="font-serif text-3xl font-semibold leading-tight text-ink">Create repair task</h3>
                  <p className="mt-1 text-sm font-semibold leading-6 text-slate-600">
                    Capture the condition, assign the right vendor, and prepare the next homeowner-facing step.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowMaintenanceForm(false)}
                  className="button-soft min-h-10 shrink-0 rounded-lg px-3 text-sm font-extrabold"
                >
                  Close
                </button>
              </div>
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
                  disabled={!selectedVendors.length}
                  onChange={(event) =>
                    setMaintenanceIssueForm((current) => ({ ...current, vendor: event.target.value }))
                  }
                  className="field-shell rounded-lg p-3 disabled:cursor-not-allowed disabled:bg-cream/70 disabled:text-muted"
                >
                  <option value="">
                    {selectedVendors.length ? "Select vendor or leave unassigned" : "No vendors saved for this property"}
                  </option>
                  {selectedVendors.map((vendor) => (
                    <option key={vendor.id} value={vendor.name}>
                      {vendor.type}: {vendor.name}
                    </option>
                  ))}
                </select>
              </label>
              {!selectedVendors.length ? (
                <div className="rounded-lg border border-gold/15 bg-warning-soft/50 p-3 text-sm font-semibold text-slate-600">
                  Vendors are saved per property. Add a vendor to {selectedProperty?.name || "this property"} first, then
                  it will appear here.
                  <button
                    type="button"
                    onClick={() => setActiveExperience("Property")}
                    className="mt-3 block min-h-10 rounded-lg border border-line bg-cream px-4 text-sm font-extrabold text-ink transition hover:border-gold/50 hover:shadow-lift"
                  >
                    Add Vendor Contact
                  </button>
                </div>
              ) : null}
              <div className="rounded-lg border border-gold/15 bg-cream/80 p-4 shadow-soft">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="mb-1 text-xs font-extrabold uppercase tracking-[0.1em] text-gold">
                      Recommended Next Step
                    </p>
                    <h3 className="font-serif text-2xl font-semibold leading-tight text-ink">Issue guidance</h3>
                    <p className="mt-1 text-sm leading-6 text-slate-600">
                      Suggests priority, vendor type, and owner-facing wording for review.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={suggestMaintenanceRecommendation}
                    className="button-soft min-h-11 rounded-lg px-4 text-sm font-extrabold"
                  >
                    Suggest Next Step
                  </button>
                </div>
                {maintenanceRecommendation ? (
                  <div className="mt-4 grid gap-3 rounded-lg border border-gold/15 bg-white/60 p-4">
                    <div className="grid gap-3 sm:grid-cols-2">
                      <DetailStrip label="Priority" value={maintenanceRecommendation.priority} />
                      <DetailStrip label="Vendor Type" value={maintenanceRecommendation.vendorType} />
                    </div>
                    <DetailStrip label="Next Step" value={maintenanceRecommendation.nextStep} />
                    <div className="rounded-lg border border-gold/15 bg-cream/80 p-3">
                      <span className="block text-xs font-extrabold uppercase tracking-[0.08em] text-gold">
                        Owner-facing note
                      </span>
                      <p className="mt-2 text-sm leading-6 text-slate-700">
                        {maintenanceRecommendation.ownerExplanation}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={applyMaintenanceRecommendation}
                      className="button-primary min-h-10 rounded-lg px-4 text-sm font-extrabold"
                    >
                      Apply Recommendation
                    </button>
                  </div>
                ) : null}
                {maintenanceRecommendationMessage ? (
                  <p className="mt-3 text-sm font-semibold text-slate-600">{maintenanceRecommendationMessage}</p>
                ) : null}
              </div>
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
              <label className="grid min-h-28 content-center gap-2 rounded-lg border border-dashed border-gold/40 bg-warning-soft/60 p-4 text-sm font-extrabold shadow-soft transition hover:bg-warning-soft">
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
                  <SelectedPhotoPreviewGrid
                    files={maintenanceIssueForm.photoFiles}
                    onRemove={(removeIndex) =>
                      setMaintenanceIssueForm((current) => ({
                        ...current,
                        photoFiles: current.photoFiles.filter((_, index) => index !== removeIndex)
                      }))
                    }
                  />
                </div>
              ) : null}
              {maintenanceSaveMessage ? (
                <div className="rounded-lg border border-gold/20 bg-warning-soft/50 p-3 text-sm font-semibold text-slate-600">
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
              </div>
            ) : null}
        </div>
      ) : null}

      {activeExperience === "Owner Portal" ? (
        <div className="grid gap-5">
          <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(320px,0.85fr)]">
            <ConceptCard eyebrow="Owner portal" title={selectedProperty ? selectedProperty.name : "Property overview"}>
              <div className="grid gap-4 lg:grid-cols-[180px_minmax(0,1fr)] lg:items-center">
                {selectedProperty?.photoUrl ? (
                  <img
                    src={selectedProperty.photoUrl}
                    alt={selectedProperty.name}
                    className="aspect-[4/3] w-full rounded-lg border border-gold/20 bg-[#252525] object-cover shadow-soft"
                  />
                ) : null}
                <div
                  className={`rounded-lg border p-4 shadow-soft ${
                    ownerAttentionCount > 0
                      ? "border-[#e7cbc4] bg-[#fff8f6]"
                      : "border-gold/25 bg-cream/85"
                  }`}
                >
                <span className="text-xs font-extrabold uppercase tracking-[0.1em] text-gold">
                  Current property status
                </span>
                <strong
                  className={`mt-2 block font-serif text-3xl font-semibold leading-tight ${
                    ownerAttentionCount > 0 ? "text-[#9f352e]" : "text-ink"
                  }`}
                >
                  {ownerPortalStatus}
                </strong>
                <p className="mt-2 text-sm leading-6 text-slate-700">{ownerPortalDetail}</p>
              </div>
              </div>
            </ConceptCard>

            <ConceptCard eyebrow="Latest report" title="Homeowner report">
              {recentReport ? (
                <div className="grid gap-3">
                  <div className="rounded-lg border border-gold/15 bg-cream/85 p-4 shadow-soft">
                    <span className="text-xs font-extrabold uppercase tracking-[0.08em] text-gold">
                      {getInspectionType(recentReport.checklist)}
                    </span>
                    <p className="mt-2 text-sm font-semibold text-slate-600">
                      {formatDateTime(recentReport.timestamp)} / {recentReport.inspectorName || "Inspector"}
                    </p>
                    <p className="mt-3 text-sm leading-6 text-slate-700">{latestExecutiveSummary}</p>
                  </div>
                  <div className="grid gap-2 sm:grid-cols-2">
                    <a
                      href={`/reports/${ownerReportRouteId(recentReport)}`}
                      target="_blank"
                      rel="noreferrer"
                      className="button-soft grid min-h-11 place-items-center rounded-lg px-4 text-sm font-extrabold"
                    >
                      Open Report
                    </a>
                    <a
                      href={`/api/reports/${ownerReportRouteId(recentReport)}`}
                      target="_blank"
                      rel="noreferrer"
                      className="button-soft grid min-h-11 place-items-center rounded-lg px-4 text-sm font-extrabold"
                    >
                      Download PDF
                    </a>
                  </div>
                </div>
              ) : (
                <div className="rounded-lg border border-gold/15 bg-cream/80 p-4 text-sm leading-6 text-slate-600 shadow-soft">
                  No homeowner report is ready yet.
                </div>
              )}
            </ConceptCard>
          </div>

          <ConceptCard eyebrow="Owner updates" title="Recent notes">
            <div className="grid gap-3">
              {latestSharedOwnerUpdate ? (
                <div className="rounded-lg border border-gold/15 bg-cream/85 p-4 shadow-soft">
                  <span className="text-xs font-extrabold uppercase tracking-[0.08em] text-gold">
                    Latest shared update
                  </span>
                  <p className="mt-2 text-sm leading-6 text-slate-700">{latestSharedOwnerUpdate.message}</p>
                </div>
              ) : (
                <div className="rounded-lg border border-gold/15 bg-cream/85 p-4 text-sm leading-6 text-slate-600 shadow-soft">
                  No updates have been shared with the homeowner yet.
                </div>
              )}

              {sharedOwnerUpdates.length > 1 ? (
                <div className="grid gap-2">
                  {sharedOwnerUpdates.slice(1, 4).map((update) => (
                    <OwnerUpdateListItem
                      key={update.id}
                      update={update}
                      onSelect={() => setSelectedOwnerUpdateId(update.id)}
                    />
                  ))}
                </div>
              ) : null}

              {activeRole !== "Homeowner" ? (
                <div className="grid gap-2 border-t border-gold/15 pt-3 sm:grid-cols-3">
                  <button
                    type="button"
                    onClick={() => {
                      setOwnerUpdateForm(emptyOwnerUpdateForm);
                      setShowOwnerUpdateForm(true);
                    }}
                    className="button-soft min-h-10 rounded-lg px-4 text-sm font-extrabold"
                  >
                    Draft Update
                  </button>
                  <button
                    type="button"
                    onClick={draftLatestInspectionOwnerUpdate}
                    className="button-soft min-h-10 rounded-lg px-4 text-sm font-extrabold"
                  >
                    Draft Report Note
                  </button>
                  <button
                    type="button"
                    onClick={draftMaintenanceOwnerUpdate}
                    className="button-soft min-h-10 rounded-lg px-4 text-sm font-extrabold"
                  >
                    Maintenance Note
                  </button>
                </div>
              ) : null}

                {ownerUpdateSaveMessage ? (
                  <div className="rounded-lg border border-gold/20 bg-warning-soft/50 p-3 text-sm font-semibold text-slate-600">
                    {ownerUpdateSaveMessage}
                  </div>
                ) : null}
              </div>
          </ConceptCard>

          {showOwnerUpdateForm && activeRole !== "Homeowner" ? (
            <div className="estate-modal-backdrop">
              <form
                id="owner-update-form"
                className="estate-modal-panel grid max-h-[calc(100svh-2rem)] w-full max-w-2xl gap-3 overflow-y-auto p-5"
                onSubmit={(event) => {
                  saveOwnerUpdate(event);
                  setShowOwnerUpdateForm(false);
                }}
              >
                <div className="mb-1 flex items-start justify-between gap-3 border-b border-line pb-4">
                  <div>
                    <span className="text-xs font-extrabold uppercase tracking-[0.1em] text-clay">
                      Owner update
                    </span>
                    <h3 className="mt-1 text-2xl font-extrabold text-ink">Draft homeowner note</h3>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowOwnerUpdateForm(false)}
                    className="button-soft min-h-10 rounded-lg px-4 text-sm font-extrabold"
                  >
                    Close
                  </button>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <label className="grid gap-2 text-sm font-extrabold">
                    Category
                    <select
                      value={ownerUpdateForm.category}
                      onChange={(event) =>
                        setOwnerUpdateForm((current) => ({
                          ...current,
                          category: event.target.value as OwnerUpdateCategory
                        }))
                      }
                      className="field-shell rounded-lg p-3"
                    >
                      {ownerUpdateCategories.map((category) => (
                        <option key={category}>{category}</option>
                      ))}
                    </select>
                  </label>
                  <label className="grid gap-2 text-sm font-extrabold">
                    Visibility
                    <select
                      value={ownerUpdateForm.status}
                      onChange={(event) =>
                        setOwnerUpdateForm((current) => ({
                          ...current,
                          status: event.target.value as OwnerUpdateStatus
                        }))
                      }
                      className="field-shell rounded-lg p-3"
                    >
                      {ownerUpdateStatuses.map((status) => (
                        <option key={status}>{status}</option>
                      ))}
                    </select>
                  </label>
                </div>
                <label className="grid gap-2 text-sm font-extrabold">
                  Update title
                  <input
                    required
                    value={ownerUpdateForm.title}
                    onChange={(event) => setOwnerUpdateForm((current) => ({ ...current, title: event.target.value }))}
                    className="field-shell rounded-lg p-3"
                    placeholder="Weekly inspection completed"
                  />
                </label>
                <label className="grid gap-2 text-sm font-extrabold">
                  Homeowner message
                  <textarea
                    rows={5}
                    value={ownerUpdateForm.message}
                    onChange={(event) => setOwnerUpdateForm((current) => ({ ...current, message: event.target.value }))}
                    className="field-shell rounded-lg p-3"
                    placeholder="Write the concise, professional update the homeowner should see."
                  />
                </label>
                <button
                  type="submit"
                  disabled={isSavingOwnerUpdate}
                  className="button-soft min-h-12 rounded-lg px-5 font-extrabold disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isSavingOwnerUpdate ? "Saving..." : "Save Update"}
                </button>
              </form>
            </div>
          ) : null}

          {selectedOwnerUpdate ? (
            <div className="estate-modal-backdrop">
              <div className="estate-modal-panel max-h-[calc(100svh-2rem)] w-full max-w-xl overflow-y-auto p-5">
                <div className="mb-4 flex items-start justify-between gap-3 border-b border-line pb-4">
                  <div>
                    <span className="text-xs font-extrabold uppercase tracking-[0.1em] text-clay">
                      Homeowner update
                    </span>
                    <h3 className="mt-1 text-2xl font-extrabold text-ink">{selectedOwnerUpdate.title}</h3>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSelectedOwnerUpdateId("")}
                    className="button-soft min-h-10 rounded-lg px-4 text-sm font-extrabold"
                  >
                    Close
                  </button>
                </div>
                <OwnerUpdateCard update={selectedOwnerUpdate} />
              </div>
            </div>
          ) : null}
        </div>
      ) : null}

    </section>
  );
}

function PilotAdminConsole({
  pilotDatabase,
  pilotUsageSummary,
  feedbackItems,
  refreshPilotConsole,
  toggleFeatureFlag,
  resetPilotAccount
}: {
  pilotDatabase: PilotDatabase | null;
  pilotUsageSummary: PilotUsageSummary | null;
  feedbackItems: FeedbackRecord[];
  refreshPilotConsole: () => void;
  toggleFeatureFlag: (featureId: string) => void;
  resetPilotAccount: (organizationId: string) => void;
}) {
  const organizations = pilotDatabase?.organizations ?? [];
  const users = pilotDatabase?.users ?? [];
  const flags = pilotDatabase?.featureFlags ?? [];

  return (
    <div className="grid gap-5">
      <div className="estate-panel rounded-lg p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="mb-2 text-xs font-extrabold uppercase tracking-[0.12em] text-clay">
              Internal admin
            </p>
            <h2 className="font-serif text-4xl font-semibold leading-tight text-ink">Pilot customer console</h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
              Monitor pilot accounts, usage, feedback, feature flags, and system readiness without exposing real
              homeowner data during demos.
            </p>
          </div>
          <button type="button" onClick={refreshPilotConsole} className="button-soft min-h-11 rounded-lg px-4 text-sm font-extrabold">
            Refresh
          </button>
        </div>
        <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <MetricCard label="Pilot orgs" value={`${organizations.length}`} detail="Accounts configured" />
          <MetricCard label="Users" value={`${users.length}`} detail="Pilot seats" />
          <MetricCard label="Sessions" value={`${pilotUsageSummary?.uniqueSessions ?? 0}`} detail="Tracked browsers" />
          <MetricCard label="Feedback" value={`${feedbackItems.length}`} detail="Validation notes" urgent={feedbackItems.length > 0} />
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-[1fr_1fr]">
        <ConceptCard eyebrow="Product analytics" title="Usage signals">
          <div className="grid gap-3 sm:grid-cols-2">
            <MetricCard label="Logins" value={`${pilotUsageSummary?.loginFrequency ?? 0}`} detail="Role sign-ins" />
            <MetricCard label="Inspections" value={`${pilotUsageSummary?.inspectionsCompleted ?? 0}`} detail="Reports created" />
            <MetricCard label="Reports viewed" value={`${pilotUsageSummary?.reportsViewed ?? 0}`} detail="Web/PDF actions" />
            <MetricCard label="Photos" value={`${pilotUsageSummary?.photosUploaded ?? 0}`} detail="Uploaded in workflows" />
            <MetricCard label="Mobile" value={`${pilotUsageSummary?.mobileEvents ?? 0}`} detail="Mobile events" />
            <MetricCard label="Desktop" value={`${pilotUsageSummary?.desktopEvents ?? 0}`} detail="Desktop events" />
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            <RankedList title="Most-used features" items={pilotUsageSummary?.mostUsedFeatures ?? []} empty="No usage yet." />
            <RankedList title="Drop-off points" items={pilotUsageSummary?.dropOffPoints ?? []} empty="No stuck signals yet." />
          </div>
        </ConceptCard>

        <ConceptCard eyebrow="Pilot customers" title="Organizations and users">
          <div className="grid gap-3">
            {organizations.map((organization) => (
              <div key={organization.id} className="rounded-lg border border-gold/15 bg-cream/80 p-4 shadow-soft">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <strong className="block text-ink">{organization.name}</strong>
                    <span className="mt-1 block text-sm text-slate-600">
                      {organization.contactName} / expires {formatDateTime(organization.expiresAt)}
                    </span>
                  </div>
                  <span className="rounded-full border border-gold/20 bg-warning-soft px-3 py-1 text-xs font-extrabold text-ink">
                    {organization.status}
                  </span>
                </div>
                <div className="mt-3 grid gap-2 sm:grid-cols-2">
                  <button
                    type="button"
                    onClick={() => resetPilotAccount(organization.id)}
                    className="button-soft min-h-10 rounded-lg px-4 text-sm font-extrabold"
                  >
                    Reset Account
                  </button>
                  <button
                    type="button"
                    onClick={() => window.alert("Pilot impersonation is audit-only in this MVP. Use demo role buttons for safe walkthroughs.")}
                    className="min-h-10 rounded-lg border border-gold/20 bg-cream px-4 text-sm font-extrabold text-ink transition hover:border-gold/50"
                  >
                    Safe Impersonation
                  </button>
                </div>
              </div>
            ))}
            <div className="rounded-lg border border-gold/15 bg-cream/80 p-4 shadow-soft">
              <span className="block text-xs font-extrabold uppercase tracking-[0.08em] text-clay">Pilot users</span>
              <div className="mt-3 grid gap-2">
                {users.map((user) => (
                  <div key={user.id} className="flex items-center justify-between gap-3 rounded-lg border border-gold/15 bg-white/60 p-3">
                    <div>
                      <strong className="block text-sm text-ink">{user.name}</strong>
                      <span className="text-xs font-semibold text-slate-500">{user.email}</span>
                    </div>
                    <span className="rounded-full border border-gold/25 bg-warning-soft px-3 py-1 text-xs font-extrabold text-ink">
                      {user.role}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </ConceptCard>
      </div>

      <div className="grid gap-5 lg:grid-cols-[0.9fr_1.1fr]">
        <ConceptCard eyebrow="Feature flags" title="Controlled pilot features">
          <div className="grid gap-3">
            {flags.map((flag) => (
              <button
                key={flag.id}
                type="button"
                onClick={() => toggleFeatureFlag(flag.id)}
                className="grid gap-2 rounded-lg border border-line bg-cream p-4 text-left transition hover:border-gold/50"
              >
                <span className="flex items-start justify-between gap-3">
                  <strong className="text-ink">{flag.label}</strong>
                  <span className={`rounded-full px-3 py-1 text-xs font-extrabold ${flag.enabled ? "border border-gold/25 bg-warning-soft text-ink" : "border border-line bg-cream/80 text-muted"}`}>
                    {flag.enabled ? "On" : "Off"}
                  </span>
                </span>
                <span className="text-sm leading-6 text-slate-600">{flag.description}</span>
              </button>
            ))}
          </div>
        </ConceptCard>

        <ConceptCard eyebrow="Customer validation" title="Latest feedback">
          <div className="grid gap-3">
            {feedbackItems.length ? (
              feedbackItems.slice(0, 6).map((item) => (
                <div key={item.id} className="rounded-lg border border-gold/15 bg-cream/80 p-4 shadow-soft">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <strong className="text-ink">{item.type}</strong>
                      <span className="ml-2 text-sm font-semibold text-slate-500">{item.role} / {item.screen}</span>
                    </div>
                    <span className="rounded-full border border-gold/20 bg-warning-soft px-3 py-1 text-xs font-extrabold text-ink">
                      {item.sentiment}
                    </span>
                  </div>
                  <p className="mt-2 text-sm leading-6 text-slate-700">{item.message}</p>
                </div>
              ))
            ) : (
              <div className="rounded-lg border border-gold/15 bg-cream/80 p-4 text-sm text-slate-600 shadow-soft">
                No pilot feedback has been captured yet.
              </div>
            )}
          </div>
        </ConceptCard>
      </div>
    </div>
  );
}

function FeedbackPanel({
  form,
  message,
  isSaving,
  setForm,
  saveFeedback
}: {
  form: FeedbackForm;
  message: string;
  isSaving: boolean;
  setForm: Dispatch<SetStateAction<FeedbackForm>>;
  saveFeedback: (event?: FormEvent<HTMLFormElement>, quickType?: FeedbackType, quickSentiment?: FeedbackSentiment) => void;
}) {
  const [showFeedbackForm, setShowFeedbackForm] = useState(false);

  return (
    <ConceptCard eyebrow="Pilot feedback" title="Help improve EstateIQ">
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => saveFeedback(undefined, "Thumbs Up", "Positive")}
          className="button-soft min-h-10 rounded-lg px-4 text-sm font-extrabold"
        >
          Thumbs Up
        </button>
        <button
          type="button"
          onClick={() => saveFeedback(undefined, "Thumbs Down", "Negative")}
          className="button-soft min-h-10 rounded-lg px-4 text-sm font-extrabold"
        >
          Thumbs Down
        </button>
        <button
          type="button"
          onClick={() => setShowFeedbackForm(true)}
          className="button-soft min-h-10 rounded-lg px-4 text-sm font-extrabold"
        >
          Share Feedback
        </button>
      </div>
      {message ? <p className="mt-3 rounded-lg border border-gold/20 bg-warning-soft/50 p-3 text-sm font-semibold text-slate-600">{message}</p> : null}

      {showFeedbackForm ? (
        <div className="estate-modal-backdrop">
          <form
            className="estate-modal-panel grid max-h-[calc(100svh-2rem)] w-full max-w-2xl gap-3 overflow-y-auto p-5"
            onSubmit={(event) => {
              saveFeedback(event);
              setShowFeedbackForm(false);
            }}
          >
            <div className="mb-1 flex items-start justify-between gap-3 border-b border-line pb-4">
              <div>
                <span className="text-xs font-extrabold uppercase tracking-[0.1em] text-clay">
                  Pilot feedback
                </span>
                <h3 className="mt-1 text-2xl font-extrabold text-ink">Share feedback</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowFeedbackForm(false)}
                className="button-soft min-h-10 rounded-lg px-4 text-sm font-extrabold"
              >
                Close
              </button>
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              <label className="grid gap-2 text-sm font-extrabold">
                Type
                <select
                  value={form.type}
                  onChange={(event) => setForm((current) => ({ ...current, type: event.target.value as FeedbackType }))}
                  className="field-shell rounded-lg p-3"
                >
                  {(["Feature Request", "Bug Report", "Post Inspection", "Homeowner Satisfaction"] as FeedbackType[]).map((type) => (
                    <option key={type}>{type}</option>
                  ))}
                </select>
              </label>
              <label className="grid gap-2 text-sm font-extrabold">
                Sentiment
                <select
                  value={form.sentiment}
                  onChange={(event) => setForm((current) => ({ ...current, sentiment: event.target.value as FeedbackSentiment }))}
                  className="field-shell rounded-lg p-3"
                >
                  {(["Positive", "Neutral", "Negative"] as FeedbackSentiment[]).map((sentiment) => (
                    <option key={sentiment}>{sentiment}</option>
                  ))}
                </select>
              </label>
              <label className="grid gap-2 text-sm font-extrabold">
                Rating
                <select
                  value={form.rating}
                  onChange={(event) => setForm((current) => ({ ...current, rating: event.target.value }))}
                  className="field-shell rounded-lg p-3"
                >
                  <option value="">Optional</option>
                  {[5, 4, 3, 2, 1].map((rating) => (
                    <option key={rating} value={rating}>{rating}</option>
                  ))}
                </select>
              </label>
            </div>
            <label className="grid gap-2 text-sm font-extrabold">
              Note
              <textarea
                rows={3}
                value={form.message}
                onChange={(event) => setForm((current) => ({ ...current, message: event.target.value }))}
                className="field-shell rounded-lg p-3"
                placeholder="What felt useful, confusing, missing, or important during this workflow?"
              />
            </label>
            <label className="grid gap-2 text-sm font-extrabold">
              Email for follow-up
              <input
                type="email"
                value={form.email}
                onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
                className="field-shell rounded-lg p-3"
                placeholder="Optional"
              />
            </label>
            <button
              type="submit"
              disabled={isSaving}
              className="button-primary min-h-11 rounded-lg px-4 text-sm font-extrabold disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSaving ? "Saving..." : "Send Feedback"}
            </button>
          </form>
        </div>
      ) : null}
    </ConceptCard>
  );
}

function RankedList({
  title,
  items,
  empty
}: {
  title: string;
  items: Array<{ label: string; count: number }>;
  empty: string;
}) {
  return (
    <div className="rounded-lg border border-gold/15 bg-cream/80 p-4 shadow-soft">
      <strong className="block text-sm text-ink">{title}</strong>
      <div className="mt-3 grid gap-2">
        {items.length ? (
          items.map((item) => (
            <div key={item.label} className="flex items-center justify-between gap-3 rounded-lg border border-line bg-white/70 px-3 py-2 text-sm">
              <span className="font-semibold text-slate-700">{item.label}</span>
              <span className="font-black text-ink">{item.count}</span>
            </div>
          ))
        ) : (
          <span className="text-sm text-slate-600">{empty}</span>
        )}
      </div>
    </div>
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
    <article className="estate-panel motion-reveal rounded-lg p-5">
      <p className="mb-2 text-xs font-extrabold uppercase tracking-[0.12em] text-clay">{eyebrow}</p>
      <h3 className="mb-4 font-serif text-3xl font-semibold leading-tight text-ink">{title}</h3>
      {children}
    </article>
  );
}

function MobileActionButton({
  detail,
  label,
  onClick,
  urgent = false
}: {
  detail: string;
  label: string;
  onClick: () => void;
  urgent?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`motion-hover-lift grid min-h-20 grid-cols-[minmax(0,1fr)_36px] items-center gap-3 rounded-lg border p-4 text-left transition active:scale-[0.99] ${
        urgent ? "border-[#e7cbc4] bg-[#fff8f6]" : "border-gold/20 bg-cream/90"
      }`}
    >
      <span>
        <strong className={`block text-lg font-extrabold ${urgent ? "text-[#9f352e]" : "text-ink"}`}>
          {label}
        </strong>
        <span className="mt-1 block text-sm font-semibold text-slate-600">{detail}</span>
      </span>
      <span className="grid h-9 w-9 place-items-center rounded-full bg-[linear-gradient(135deg,#f2d98a,#d4af37)] text-lg font-extrabold text-ink shadow-button">
        {">"}
      </span>
    </button>
  );
}

function MobileStatusTile({
  label,
  urgent = false,
  value
}: {
  label: string;
  urgent?: boolean;
  value: string;
}) {
  return (
    <div className={`min-h-20 rounded-lg border p-3 shadow-soft ${urgent ? "border-[#e7cbc4] bg-[#fff8f6]" : "border-gold/20 bg-cream/80"}`}>
      <span className="block text-[0.68rem] font-extrabold uppercase tracking-[0.08em] text-slate-500">
        {label}
      </span>
      <strong className={`mt-2 block truncate text-sm font-extrabold ${urgent ? "text-[#9f352e]" : "text-ink"}`}>
        {value}
      </strong>
    </div>
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
    <div className={`rounded-lg border p-4 shadow-soft ${urgent ? "border-[#e7cbc4] bg-[#fff8f6]" : "border-gold/20 bg-cream/80"}`}>
      <span className="text-xs font-extrabold uppercase tracking-[0.08em] text-muted">{label}</span>
      <strong className={`mt-2 block font-serif text-3xl font-semibold ${urgent ? "text-[#9f352e]" : "text-ink"}`}>{value}</strong>
      <span className="mt-1 block text-sm text-slate-600">{detail}</span>
    </div>
  );
}

function OwnerUpdateListItem({ update, onSelect }: { update: OwnerUpdate; onSelect: () => void }) {
  const statusClass =
    update.status === "Shared"
      ? "border-gold/25 bg-warning-soft text-ink"
      : update.status === "Archived"
        ? "border-line bg-[#fbfcfb] text-slate-600"
        : "border-[#ead2a8] bg-[#fff8ed] text-[#7b5426]";

  return (
    <button
      type="button"
      onClick={onSelect}
      className={`grid min-h-16 w-full grid-cols-[minmax(0,1fr)_auto] items-center gap-3 rounded-lg border p-4 text-left transition hover:border-gold/50 hover:shadow-lift ${statusClass}`}
    >
      <span className="min-w-0">
        <strong className="block truncate text-ink">{update.title}</strong>
        <span className="mt-1 block truncate text-sm font-semibold text-slate-600">
          {update.category} / {formatDateTime(update.createdAt)}
        </span>
      </span>
      <span className="rounded-full border border-current/20 px-3 py-1 text-xs font-extrabold">
        {update.status}
      </span>
    </button>
  );
}

function OwnerPortalDetail({ label, value, urgent = false }: { label: string; value: string; urgent?: boolean }) {
  return (
    <div className={`grid gap-1 rounded-lg border p-3 shadow-soft ${urgent ? "border-[#e7cbc4] bg-[#fff8f6]" : "border-gold/15 bg-cream/80"}`}>
      <span className="text-xs font-extrabold uppercase tracking-[0.08em] text-gold">{label}</span>
      <strong className={`font-serif text-xl font-semibold leading-tight ${urgent ? "text-[#9f352e]" : "text-ink"}`}>{value}</strong>
    </div>
  );
}

function OwnerUpdateCard({ update }: { update: OwnerUpdate }) {
  const statusClass =
    update.status === "Shared"
      ? "border-gold/25 bg-warning-soft text-ink"
      : update.status === "Archived"
        ? "border-line bg-[#fbfcfb] text-slate-600"
        : "border-[#ead2a8] bg-[#fff8ed] text-[#7b5426]";

  return (
    <article className={`rounded-lg border p-4 ${statusClass}`}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <span className="text-xs font-extrabold uppercase tracking-[0.08em] opacity-75">
            {update.category}
          </span>
          <h4 className="mt-1 text-lg font-extrabold">{update.title}</h4>
        </div>
        <span className="rounded-full border border-current/20 px-3 py-1 text-xs font-extrabold">
          {update.status}
        </span>
      </div>
      <p className="mt-3 text-sm leading-6 opacity-80">
        {update.message || "No message added."}
      </p>
      <span className="mt-3 block text-xs font-semibold opacity-65">{formatDateTime(update.createdAt)}</span>
    </article>
  );
}

function ScheduleTaskListItem({ task, onSelect }: { task: ScheduleTask; onSelect: () => void }) {
  const statusClass =
    task.status === "Complete"
      ? "border-gold/25 bg-warning-soft text-ink"
      : task.status === "Skipped"
        ? "border-[#e7cbc4] bg-[#fff8f6] text-[#9f352e]"
        : "border-line bg-cream text-ink";

  return (
    <button
      type="button"
      onClick={onSelect}
      className={`grid min-h-16 w-full grid-cols-[minmax(0,1fr)_auto] items-center gap-3 rounded-lg border p-4 text-left transition hover:border-gold/50 hover:shadow-lift ${statusClass}`}
    >
      <span className="min-w-0">
        <strong className="block truncate font-serif text-lg font-semibold leading-tight text-ink">{task.title}</strong>
        <span className="mt-1 block truncate text-sm font-semibold text-slate-600">
          {task.type} / {formatDateTime(task.scheduledFor)}
        </span>
      </span>
      <span className="rounded-full border border-current/20 px-3 py-1 text-xs font-extrabold">
        {task.status}
      </span>
    </button>
  );
}

function ScheduleTaskCard({
  onStartInspection,
  propertyName,
  task,
  updateScheduleTaskStatus
}: {
  onStartInspection: (task: ScheduleTask) => void;
  propertyName?: string;
  task: ScheduleTask;
  updateScheduleTaskStatus: (taskId: string, status: ScheduleTaskStatus) => void;
}) {
  const statusClass =
    task.status === "Complete"
      ? "border-gold/25 bg-warning-soft text-ink"
      : task.status === "Skipped"
        ? "border-[#e7cbc4] bg-[#fff8f6] text-[#9f352e]"
        : "border-line bg-cream text-ink";

  return (
    <article className={`rounded-lg border p-4 shadow-soft ${statusClass}`}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <span className="text-xs font-extrabold uppercase tracking-[0.08em] opacity-75">
            {task.type}
          </span>
          <h4 className="mt-1 font-serif text-2xl font-semibold leading-tight">{task.title}</h4>
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
      <button
        type="button"
        onClick={() => onStartInspection(task)}
        className="button-primary mt-4 min-h-11 w-full rounded-lg px-4 text-sm font-extrabold"
      >
        Start Related Inspection
      </button>
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

function VendorListItem({ vendor, onSelect }: { vendor: VendorContact; onSelect: () => void }) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className="grid min-h-16 w-full grid-cols-[minmax(0,1fr)_auto] items-center gap-3 border-b border-gold/15 bg-cream px-4 py-3 text-left transition last:border-b-0 hover:bg-warning-soft/45"
    >
      <span className="min-w-0">
        <strong className="block truncate font-serif text-lg font-semibold leading-tight text-ink">{vendor.name}</strong>
        <span className="mt-1 block truncate text-sm font-semibold text-slate-600">
          {vendor.type}{vendor.contactName ? ` / ${vendor.contactName}` : ""}
        </span>
      </span>
      <span className="rounded-full border border-gold/20 bg-white/65 px-3 py-1 text-xs font-extrabold text-slate-600">
        View
      </span>
    </button>
  );
}

function MaintenanceIssueListItem({ issue, onSelect }: { issue: MaintenanceIssue; onSelect: () => void }) {
  const urgent = issue.priority === "Urgent" || issue.priority === "High";

  return (
    <button
      type="button"
      onClick={onSelect}
      className="grid min-h-16 w-full grid-cols-[minmax(0,1fr)_auto] items-center gap-3 border-b border-gold/15 bg-cream px-4 py-3 text-left transition last:border-b-0 hover:bg-warning-soft/45"
    >
      <span className="min-w-0">
        <span className="mb-1 flex flex-wrap items-center gap-2">
          <strong className="truncate font-serif text-lg font-semibold leading-tight text-ink">{issue.title}</strong>
          <span
            className={`rounded-full border px-2 py-0.5 text-[0.68rem] font-extrabold ${
              urgent ? "border-[#e7cbc4] bg-[#fff8f6] text-[#9f352e]" : "border-gold/20 bg-warning-soft text-ink"
            }`}
          >
            {issue.priority}
          </span>
        </span>
        <span className="block truncate text-sm font-semibold text-slate-600">
          {issue.status}{issue.vendor ? ` / ${issue.vendor}` : " / Unassigned"}
        </span>
      </span>
      <span className="rounded-full border border-gold/20 bg-white/65 px-3 py-1 text-xs font-extrabold text-slate-600">
        View
      </span>
    </button>
  );
}

function MaintenanceIssueCard({
  issue,
  onDraftOwnerUpdate,
  onPlanVendorVisit,
  selectedVendors,
  updateMaintenanceStatus,
  updateMaintenanceIssue
}: {
  issue: MaintenanceIssue;
  onDraftOwnerUpdate: (issue: MaintenanceIssue) => void;
  onPlanVendorVisit: (issue: MaintenanceIssue) => void;
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
      {assignedVendor?.phone ? (
        <a
          href={`tel:${assignedVendor.phone}`}
          className="button-primary mt-4 grid min-h-11 place-items-center rounded-lg px-4 text-sm font-extrabold lg:hidden"
        >
          Call {assignedVendor.name}
        </a>
      ) : null}
      {issuePhotos.length ? (
        <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3">
          {issuePhotos.map((photo) => (
            <a
              key={photo.id}
              href={photo.url}
              target="_blank"
              className="overflow-hidden rounded-lg border border-line bg-[#252525]"
            >
              <img src={photo.url} alt={photo.name} className="h-28 w-full bg-[#252525] object-cover" />
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
      <div className="mt-3 grid gap-2 sm:grid-cols-2">
        <button
          type="button"
          onClick={() => onPlanVendorVisit(issue)}
          className="button-soft min-h-11 rounded-lg px-4 text-sm font-extrabold"
        >
          Plan Vendor Visit
        </button>
        <button
          type="button"
          onClick={() => onDraftOwnerUpdate(issue)}
          className="button-primary min-h-11 rounded-lg px-4 text-sm font-extrabold"
        >
          Draft Owner Update
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
    <div className="rounded-lg border border-gold/15 bg-cream/80 p-3 shadow-soft">
      <span className="block text-xs font-extrabold uppercase tracking-[0.08em] text-gold">{label}</span>
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
      <article className="grid min-h-52 place-items-center rounded-lg border border-gold/15 bg-cream/80 p-5 text-center text-slate-600 shadow-soft">
        <p>Generate an inspection report to create a clean homeowner summary.</p>
      </article>
    );
  }

  const status = reportConditionStatus(inspection);

  return (
    <article className="rounded-lg border border-gold/15 bg-cream p-4 shadow-soft">
      <div className="mb-4 grid gap-3 border-b border-line pb-4 lg:grid-cols-[minmax(0,1fr)_220px] lg:items-start">
        <div className="min-w-0">
          <p className="mb-2 text-xs font-extrabold uppercase tracking-[0.1em] text-clay">
            Current report
          </p>
          <h3 className="font-serif text-3xl font-semibold leading-tight text-ink">{property.name}</h3>
          <p className="mt-2 text-sm text-slate-600">
            {property.owner} / {property.address}
          </p>
          <div
            className={`mt-3 inline-flex rounded-lg border px-4 py-2 text-sm font-extrabold ${
              status.tone === "urgent"
                ? "border-[#e7cbc4] bg-[#fff8f6] text-[#9f352e]"
                : "border-gold/25 bg-warning-soft text-ink"
            }`}
          >
            {status.label}
          </div>
        </div>
        {property.photoUrl ? (
          <img
            src={property.photoUrl}
            alt={property.name}
            className="aspect-[4/3] w-full rounded-lg border border-line bg-[#252525] object-cover"
          />
        ) : null}
      </div>
      <div className="mb-4 overflow-hidden rounded-lg border border-gold/20 bg-[#eae4d8] text-ink shadow-soft">
        <div className="grid gap-0 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)]">
          <section className="border-b border-gold/20 p-4 lg:border-b-0 lg:border-r">
            <span className="type-eyebrow text-gold">Property Status</span>
            <strong className="mt-2 block font-serif text-2xl font-semibold leading-tight text-ink">
              {status.label}
            </strong>
            <p className="mt-2 text-sm leading-6 text-slate-700">{status.description}</p>
          </section>
          <div className="grid grid-cols-2 gap-px bg-gold/15">
            <ReportRow label="Date" value={formatDateTime(inspection.timestamp)} />
            <ReportRow label="Type" value={getInspectionType(inspection.checklist)} />
            <ReportRow label="Inspector" value={inspection.inspectorName} />
            <ReportRow label="Temp" value={`${inspection.interiorTemperature} F`} />
            <ReportRow
              label="Urgent"
              value={inspection.urgent}
              valueClassName={inspection.urgent === "Yes" ? "text-[#f0b7ae] font-black" : ""}
            />
            <ReportRow label="Photos" value={`${inspection.photos.length}`} />
          </div>
        </div>
      </div>

      {inspection.executiveSummary ? (
        <>
          <h4 className="mb-2 mt-5 text-sm font-extrabold uppercase">Executive Summary</h4>
          <p className="leading-7">{inspection.executiveSummary}</p>
        </>
      ) : null}

      <h4 className="mb-2 mt-5 text-sm font-extrabold uppercase">Completed Checks</h4>
      {visibleChecklistItems(inspection.checklist).length ? (
        <div className="grid gap-3 lg:grid-cols-2">
          {groupChecklistItems(inspection.checklist).map((section) =>
            section.items.length ? (
              <section key={section.title} className="rounded-lg border border-gold/15 bg-white/55 p-3">
                <div className="mb-2 flex items-center justify-between gap-3">
                  <h5 className="text-xs font-black uppercase tracking-[0.08em] text-clay">{section.title}</h5>
                  <span className="rounded-full border border-line bg-cream px-2 py-1 text-xs font-extrabold text-slate-600">
                    {section.items.length}
                  </span>
                </div>
                <ul className="grid gap-1.5">
                  {section.items.map((item) => (
                    <li key={item} className="rounded-md bg-cream/80 px-2.5 py-2 text-sm leading-5 text-slate-700">
                      {item}
                    </li>
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
          <div className="mb-2 mt-5 flex items-center justify-between gap-3">
            <h4 className="text-sm font-extrabold uppercase">Photos</h4>
            <span className="rounded-full border border-line bg-[#fbfcfb] px-3 py-1 text-xs font-extrabold text-slate-600">
              {inspection.photos.length}
            </span>
          </div>
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 lg:grid-cols-6">
            {inspection.photos.map((photo) => (
              <a
                key={photo.id}
                href={photo.url}
                target="_blank"
                rel="noreferrer"
                title={photo.name}
                className="group overflow-hidden rounded-lg border border-line bg-cream transition hover:border-gold/50 hover:shadow-lift"
              >
                <img src={photo.url} alt={photo.name} className="aspect-square w-full bg-[#252525] object-cover" />
                <span className="block truncate px-2 py-1 text-[0.68rem] font-semibold text-slate-600">
                  {photo.name}
                </span>
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
    <div className="bg-cream p-3">
      <span className="block text-xs font-extrabold uppercase tracking-[0.08em] text-gold">{label}</span>
      <strong className={`mt-1 block break-words text-sm text-ink ${valueClassName}`}>{value}</strong>
    </div>
  );
}

function reportConditionStatus(inspection: Inspection) {
  if (inspection.urgent === "Yes") {
    return {
      label: "Attention Recommended",
      tone: "urgent" as const,
      description:
        "This report includes an urgent item that should be reviewed promptly by the homeowner or property manager."
    };
  }

  if (visibleChecklistItems(inspection.checklist).length === 0) {
    return {
      label: "Report Pending",
      tone: "normal" as const,
      description:
        "This report has been created, but no completed checklist items were recorded."
    };
  }

  return {
    label: "Property Stable",
    tone: "normal" as const,
    description:
      "This inspection indicates the property is stable with no urgent homeowner action flagged at this time."
  };
}

function PropertyInput({
  label,
  value,
  onChange,
  type = "text",
  required = false,
  placeholder = ""
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  required?: boolean;
  placeholder?: string;
}) {
  return (
    <label className="grid gap-2 text-sm font-extrabold text-ink">
      {label}
      <input
        type={type}
        inputMode={type === "tel" ? "tel" : undefined}
        maxLength={type === "tel" ? 14 : undefined}
        required={required}
        placeholder={placeholder}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="field-shell rounded-lg p-3 shadow-soft"
      />
    </label>
  );
}
