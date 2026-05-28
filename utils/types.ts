export type UrgentStatus = "Yes" | "No";
export type MaintenancePriority = "Low" | "Medium" | "High" | "Urgent";
export type MaintenanceStatus = "Open" | "Scheduled" | "In Progress" | "Resolved";
export type ScheduleTaskType =
  | "Home Watch"
  | "Pre-Guest Arrival"
  | "Post-Checkout"
  | "Cleaner"
  | "Maintenance"
  | "Vendor"
  | "Other";
export type ScheduleTaskStatus = "Scheduled" | "In Progress" | "Complete" | "Skipped";
export type OwnerUpdateCategory = "Inspection" | "Maintenance" | "Vendor" | "Arrival" | "General";
export type OwnerUpdateStatus = "Draft" | "Shared" | "Archived";
export type PilotUserRole = "Admin" | "Inspector" | "Homeowner" | "Property Manager";
export type PilotStatus = "Active" | "Demo" | "Expired" | "Paused";
export type FeedbackType = "Thumbs Up" | "Thumbs Down" | "Feature Request" | "Bug Report" | "Post Inspection" | "Homeowner Satisfaction";
export type FeedbackSentiment = "Positive" | "Neutral" | "Negative";
export type AnalyticsEventName =
  | "screen_view"
  | "click"
  | "workflow_step"
  | "stuck_signal"
  | "feature_visible"
  | "error";
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
  executiveSummary?: string;
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
  photoUrl?: string;
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

export type ScheduleTask = {
  id: string;
  propertyId: string;
  createdAt: string;
  scheduledFor: string;
  type: ScheduleTaskType;
  title: string;
  status: ScheduleTaskStatus;
  assignedTo: string;
  notes: string;
};

export type OwnerUpdate = {
  id: string;
  propertyId: string;
  createdAt: string;
  category: OwnerUpdateCategory;
  title: string;
  message: string;
  status: OwnerUpdateStatus;
};

export type AnalyticsEvent = {
  id: string;
  timestamp: string;
  sessionId: string;
  name: AnalyticsEventName;
  role?: string;
  screen?: string;
  workflow?: string;
  target?: string;
  feature?: string;
  demoMode?: boolean;
  metadata?: Record<string, string | number | boolean | null>;
};

export type PilotOrganization = {
  id: string;
  name: string;
  contactName: string;
  email: string;
  status: PilotStatus;
  startsAt: string;
  expiresAt: string;
  demoAccount: boolean;
  notes: string;
};

export type PilotUser = {
  id: string;
  organizationId: string;
  name: string;
  email: string;
  role: PilotUserRole;
  lastLoginAt?: string;
  onboardingCompletedAt?: string;
};

export type PilotProperty = {
  id: string;
  organizationId: string;
  propertyId: string;
  label: string;
  isDemo: boolean;
};

export type FeatureFlag = {
  id: string;
  label: string;
  enabled: boolean;
  description: string;
};

export type PilotUsageSnapshot = {
  organizationId: string;
  logins: number;
  inspectionsCompleted: number;
  reportsViewed: number;
  photosUploaded: number;
  feedbackItems: number;
};

export type PilotDatabase = {
  organizations: PilotOrganization[];
  users: PilotUser[];
  properties: PilotProperty[];
  featureFlags: FeatureFlag[];
  usage: PilotUsageSnapshot[];
};

export type FeedbackRecord = {
  id: string;
  createdAt: string;
  type: FeedbackType;
  sentiment: FeedbackSentiment;
  role: string;
  screen: string;
  propertyId?: string;
  message: string;
  email?: string;
  rating?: number;
};

export type PilotUsageSummary = {
  uniqueSessions: number;
  loginFrequency: number;
  inspectionsCompleted: number;
  reportsViewed: number;
  photosUploaded: number;
  onboardingCompletion: number;
  mobileEvents: number;
  desktopEvents: number;
  mostUsedFeatures: Array<{ label: string; count: number }>;
  dropOffPoints: Array<{ label: string; count: number }>;
};

export type Database = {
  properties: Property[];
  inspections: Inspection[];
  maintenanceIssues: MaintenanceIssue[];
  vendors: VendorContact[];
  scheduleTasks: ScheduleTask[];
  ownerUpdates: OwnerUpdate[];
};
