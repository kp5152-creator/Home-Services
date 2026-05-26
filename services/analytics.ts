import { promises as fs } from "fs";
import path from "path";
import type { AnalyticsEvent, AnalyticsEventName } from "@/utils/types";

const analyticsPath = path.join(process.cwd(), "data", "analytics.json");
const allowedEventNames = new Set<AnalyticsEventName>([
  "screen_view",
  "click",
  "workflow_step",
  "stuck_signal",
  "feature_visible",
  "error"
]);

type AnalyticsInput = Omit<AnalyticsEvent, "id" | "timestamp"> & {
  timestamp?: string;
};

export async function readAnalyticsEvents() {
  try {
    const raw = await fs.readFile(analyticsPath, "utf8");
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? (parsed as AnalyticsEvent[]) : [];
  } catch {
    return [];
  }
}

export async function addAnalyticsEvent(input: AnalyticsInput) {
  const event: AnalyticsEvent = {
    id: `event-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    timestamp: input.timestamp || new Date().toISOString(),
    sessionId: cleanText(input.sessionId, 80) || "unknown-session",
    name: allowedEventNames.has(input.name) ? input.name : "error",
    role: cleanText(input.role, 80),
    screen: cleanText(input.screen, 80),
    workflow: cleanText(input.workflow, 80),
    target: cleanText(input.target, 120),
    feature: cleanText(input.feature, 120),
    demoMode: Boolean(input.demoMode),
    metadata: cleanMetadata(input.metadata)
  };

  try {
    await fs.mkdir(path.dirname(analyticsPath), { recursive: true });
    const events = await readAnalyticsEvents();
    await fs.writeFile(analyticsPath, JSON.stringify([event, ...events].slice(0, 2000), null, 2));
  } catch {
    // Analytics should never block inspections, reports, or customer-facing workflows.
  }

  return event;
}

function cleanText(value: unknown, maxLength: number) {
  if (typeof value !== "string") return undefined;
  const cleaned = value.replace(/\s+/g, " ").trim();
  return cleaned ? cleaned.slice(0, maxLength) : undefined;
}

function cleanMetadata(metadata: unknown) {
  if (!metadata || typeof metadata !== "object" || Array.isArray(metadata)) return undefined;

  const entries: Array<[string, string | number | boolean | null]> = [];

  for (const [key, value] of Object.entries(metadata as Record<string, unknown>).slice(0, 20)) {
    const safeKey = cleanText(key, 50);
    if (!safeKey) continue;

    if (typeof value === "string") entries.push([safeKey, cleanText(value, 120) ?? null]);
    if (typeof value === "number" && Number.isFinite(value)) entries.push([safeKey, value]);
    if (typeof value === "boolean" || value === null) entries.push([safeKey, value]);
  }

  return entries.length ? Object.fromEntries(entries) : undefined;
}
