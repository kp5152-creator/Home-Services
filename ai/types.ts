import type { InspectionType } from "@/utils/checklists";
import type { MaintenancePriority, UrgentStatus, VendorType } from "@/utils/types";

export type InspectionEvidenceReadinessInput = {
  narration: string;
  notes: string;
  checklistCount: number;
  photoCount: number;
};

export type InspectionEvidenceTextInput = {
  narration: string;
  notes: string;
  separator?: string;
};

export type VisitSummaryEvidenceSignatureInput = {
  evidenceText: string;
  checklist: string[];
  photoCount: number;
  urgent: UrgentStatus;
  interiorTemperature: string;
  inspectionType: InspectionType;
};

export type VisitSummaryDraftInput = {
  propertyName: string;
  inspectionType: InspectionType;
  inspectorName: string;
  completedCount: number;
  totalCount: number;
  interiorTemperature: string;
  photoCount: number;
  urgent: UrgentStatus;
  narration: string;
  notes: string;
};

export type InspectionEvidenceReadiness = {
  chips: Array<{
    readyLabel: string;
    waitingLabel: string;
    ready: boolean;
  }>;
  reviewReady: boolean;
  issueReady: boolean;
};

export type OwnerUpdateDraft = {
  category: "Inspection";
  status: "Draft";
  title: string;
  message: string;
};

export type InspectionIssueSuggestion = {
  title: string;
  priority: MaintenancePriority;
  vendorType: VendorType;
  description: string;
  nextStep: string;
};

export type MaintenanceRecommendationVendor = {
  name: string;
  type: VendorType;
};

export type MaintenanceRecommendation = {
  priority: MaintenancePriority;
  vendorType: VendorType;
  nextStep: string;
  ownerExplanation: string;
};
