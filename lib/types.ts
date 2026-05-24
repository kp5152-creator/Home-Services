export type UrgentStatus = "Yes" | "No";
export type MaintenancePriority = "Low" | "Medium" | "High" | "Urgent";
export type MaintenanceStatus = "Open" | "Scheduled" | "In Progress" | "Resolved";

export type InspectionPhoto = {
  id: string;
  name: string;
  url: string;
  storagePath?: string;
  mimeType: string;
  size: number;
};

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
};

export type Database = {
  properties: Property[];
  inspections: Inspection[];
  maintenanceIssues: MaintenanceIssue[];
};
