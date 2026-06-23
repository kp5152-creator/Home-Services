import type { NextApiRequest, NextApiResponse } from "next";
import { requestAiDraft } from "@/services/aiClient";
import type { AiDraftResponse } from "@/services/aiClient";

type InspectionSummaryResponse =
  | (AiDraftResponse & {
      message?: string;
    })
  | {
      message: string;
    };

export default async function handler(
  request: NextApiRequest,
  response: NextApiResponse<InspectionSummaryResponse>
) {
  if (request.method !== "POST") {
    response.setHeader("Allow", "POST");
    response.status(405).json({ message: "Method not allowed" });
    return;
  }

  try {
    const facts = safeInspectionFacts(asRecord(request.body));
    const draft = await requestAiDraft({
      task: "inspection_summary",
      facts
    });

    response.status(200).json(draft);
  } catch (error) {
    response.status(500).json({
      message: error instanceof Error ? error.message : "AI summary could not be drafted."
    });
  }
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" ? (value as Record<string, unknown>) : {};
}

function safeInspectionFacts(body: Record<string, unknown>) {
  return {
    propertyName: text(body.propertyName),
    inspectionType: text(body.inspectionType),
    inspectorName: text(body.inspectorName),
    completedCount: numberValue(body.completedCount),
    totalCount: numberValue(body.totalCount),
    interiorTemperature: text(body.interiorTemperature),
    photoCount: numberValue(body.photoCount),
    urgent: body.urgent === "Yes",
    narration: text(body.narration),
    notes: text(body.notes),
    checklistItems: stringList(body.checklistItems).slice(0, 12)
  };
}

function text(value: unknown) {
  return typeof value === "string" ? value.slice(0, 2400) : "";
}

function numberValue(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

function stringList(value: unknown) {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
}
