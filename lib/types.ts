export type UrgentStatus = "Yes" | "No";
export type MaintenancePriority = "Low" | "Medium" | "High" | "Urgent";
export type MaintenanceStatus = "Open" | "Scheduled" | "In Progress" | "Resolved";
export type VendorType =
  | "Pool"
  | "Landscape"
  | "HVAC"
  | "Cleaning"
  | "Handyman"
  | "Plumbing"
  | "Electrical"
  | "Other";

export type InspectionPhoto = {
  id: string;
  name: string;
  url: string;
  storagePath?: string;
  mimeType: string;
  size: number;
};

export type MaintenanceIssuePhoto = InspectionPhoto;

export type Inspection = {
  id: string;
  propertyId: string;
  timestamp: string;
  inspectorName: string;
  interiorTemperature: string;
  checklist: string[];
  notes: string;
  urgent: UrgentStatus;
  photos: InspectionPhoto[];
};

export type Property = {
  id: string;
  name: string;
  owner: string;
  address: string;
  phone: string;
  email: string;
  accessNotes: string;
  status: "Active" | "Seasonal";
};

export type MaintenanceIssue = {
  id: string;
  propertyId: string;
  createdAt: string;
  title: string;
  description: string;
  priority: MaintenancePriority;
  status: MaintenanceStatus;
  vendor: string;
  nextStep: string;
  photos: MaintenanceIssuePhoto[];
};

export type VendorContact = {
  id: string;
  propertyId: string;
  createdAt: string;
  name: string;
  type: VendorType;
  contactName: string;
  phone: string;
  email: string;
  notes: string;
};

export type Database = {
  properties: Property[];
  inspections: Inspection[];
  maintenanceIssues: MaintenanceIssue[];
  vendors: VendorContact[];
};
