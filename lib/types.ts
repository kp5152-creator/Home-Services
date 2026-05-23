export type UrgentStatus = "Yes" | "No";

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

export type Database = {
  properties: Property[];
  inspections: Inspection[];
};
