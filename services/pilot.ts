import { promises as fs } from "fs";
import path from "path";
import type { AnalyticsEvent, PilotDatabase } from "@/utils/types";

const pilotPath = path.join(process.cwd(), "data", "pilot.json");

const defaultPilotDatabase: PilotDatabase = {
  organizations: [
    {
      id: "pilot-estateiq-demo",
      name: "EstateIQ Demo Pilot",
      contactName: "Kirby Pert",
      email: "pilot@example.com",
      status: "Demo",
      startsAt: "2026-05-25T00:00:00.000Z",
      expiresAt: "2026-08-25T00:00:00.000Z",
      demoAccount: true,
      notes: "Safe sample account for live customer walkthroughs and early validation."
    }
  ],
  users: [
    {
      id: "pilot-user-admin",
      organizationId: "pilot-estateiq-demo",
      name: "Pilot Admin",
      email: "admin@example.com",
      role: "Admin",
      lastLoginAt: "2026-05-25T16:00:00.000Z"
    },
    {
      id: "pilot-user-inspector",
      organizationId: "pilot-estateiq-demo",
      name: "Avery Stone",
      email: "inspector@example.com",
      role: "Inspector",
      lastLoginAt: "2026-05-25T17:20:00.000Z"
    },
    {
      id: "pilot-user-owner",
      organizationId: "pilot-estateiq-demo",
      name: "Sample Homeowner",
      email: "owner@example.com",
      role: "Homeowner"
    }
  ],
  properties: [
    {
      id: "pilot-property-cielo",
      organizationId: "pilot-estateiq-demo",
      propertyId: "demo-property-estate",
      label: "Cielo Vista Estate",
      isDemo: true
    }
  ],
  featureFlags: [
    {
      id: "ai-concierge-summary",
      label: "AI Concierge Summary",
      enabled: true,
      description: "Human-reviewed owner summary assistance for inspection reports."
    },
    {
      id: "owner-portal",
      label: "Owner Portal",
      enabled: true,
      description: "Luxury homeowner view for reports, updates, and maintenance visibility."
    },
    {
      id: "internal-admin",
      label: "Internal Admin Console",
      enabled: true,
      description: "Pilot monitoring, usage review, feedback, and feature control."
    }
  ],
  usage: [
    {
      organizationId: "pilot-estateiq-demo",
      logins: 0,
      inspectionsCompleted: 0,
      reportsViewed: 0,
      photosUploaded: 0,
      feedbackItems: 0
    }
  ]
};

export async function readPilotDatabase() {
  try {
    const raw = await fs.readFile(pilotPath, "utf8");
    const parsed = JSON.parse(raw) as PilotDatabase;
    return normalizePilotDatabase(parsed);
  } catch {
    await writePilotDatabase(defaultPilotDatabase);
    return defaultPilotDatabase;
  }
}

export async function writePilotDatabase(database: PilotDatabase) {
  await fs.mkdir(path.dirname(pilotPath), { recursive: true });
  await fs.writeFile(pilotPath, JSON.stringify(normalizePilotDatabase(database), null, 2));
}

export async function resetPilotAccount(organizationId: string) {
  const database = await readPilotDatabase();
  const organization = database.organizations.find((item) => item.id === organizationId);
  if (!organization) return null;

  const refreshed: PilotDatabase = {
    ...database,
    users: database.users.map((user) =>
      user.organizationId === organizationId
        ? { ...user, lastLoginAt: undefined, onboardingCompletedAt: undefined }
        : user
    ),
    usage: database.usage.map((usage) =>
      usage.organizationId === organizationId
        ? { ...usage, logins: 0, inspectionsCompleted: 0, reportsViewed: 0, photosUploaded: 0, feedbackItems: 0 }
        : usage
    )
  };

  await writePilotDatabase(refreshed);
  return refreshed;
}

export function buildUsageFromAnalytics(events: AnalyticsEvent[]) {
  const sessions = new Set(events.map((event) => event.sessionId).filter(Boolean));
  const workflowEvents = events.filter((event) => event.name === "workflow_step");
  const reportCreatedEvents = workflowEvents.filter((event) => event.target === "report_created");

  return {
    uniqueSessions: sessions.size,
    loginFrequency: workflowEvents.filter((event) => event.workflow === "onboarding").length,
    inspectionsCompleted: reportCreatedEvents.length,
    reportsViewed: events.filter(
      (event) => event.screen === "Report" || event.target === "download_pdf" || event.target === "print_or_save_pdf"
    ).length,
    photosUploaded: workflowEvents.reduce((total, event) => {
      const photoCount = event.metadata?.photoCount;
      return total + (typeof photoCount === "number" ? photoCount : 0);
    }, 0),
    coPilotDrafts: reportCreatedEvents.filter((event) => event.metadata?.coPilotDrafted === true).length,
    coPilotReviewed: reportCreatedEvents.filter((event) => event.metadata?.coPilotReviewed === true).length,
    narrationReports: reportCreatedEvents.filter((event) => event.metadata?.narrationIncluded === true).length,
    onboardingCompletion: workflowEvents.filter((event) => event.target === "onboarding_completed").length,
    mobileEvents: events.filter((event) => event.metadata?.deviceType === "mobile").length,
    desktopEvents: events.filter((event) => event.metadata?.deviceType === "desktop").length,
    mostUsedFeatures: rankBy(events.map((event) => event.workflow || event.screen || event.target || "Unknown")),
    dropOffPoints: rankBy(events.filter((event) => event.name === "stuck_signal").map((event) => event.screen || "Unknown"))
  };
}

function normalizePilotDatabase(database: PilotDatabase): PilotDatabase {
  return {
    organizations: database.organizations ?? defaultPilotDatabase.organizations,
    users: database.users ?? defaultPilotDatabase.users,
    properties: database.properties ?? defaultPilotDatabase.properties,
    featureFlags: database.featureFlags ?? defaultPilotDatabase.featureFlags,
    usage: database.usage ?? defaultPilotDatabase.usage
  };
}

function rankBy(values: string[]) {
  const counts = new Map<string, number>();
  for (const value of values) counts.set(value, (counts.get(value) ?? 0) + 1);
  return Array.from(counts.entries())
    .map(([label, count]) => ({ label, count }))
    .sort((first, second) => second.count - first.count)
    .slice(0, 6);
}
