import type { NextApiRequest, NextApiResponse } from "next";
import { defaultInspectionType, withInspectionType } from "@/utils/checklists";
import { addInspection } from "@/services/database";
import type { UrgentStatus } from "@/utils/types";

export const config = {
  api: {
    bodyParser: {
      sizeLimit: "25mb"
    }
  }
};

export default async function handler(request: NextApiRequest, response: NextApiResponse) {
  if (request.method !== "POST") {
    response.setHeader("Allow", "POST");
    response.status(405).json({ message: "Method not allowed" });
    return;
  }

  try {
    const inspection = await addInspection({
      propertyId: String(request.body.propertyId ?? ""),
      inspectorName: String(request.body.inspectorName ?? ""),
      interiorTemperature: String(request.body.interiorTemperature ?? ""),
      checklist: withInspectionType(
        Array.isArray(request.body.checklist) ? request.body.checklist.map(String) : [],
        String(request.body.inspectionType ?? defaultInspectionType)
      ),
      executiveSummary: String(request.body.executiveSummary ?? ""),
      notes: String(request.body.notes ?? ""),
      urgent: request.body.urgent === "Yes" ? "Yes" : ("No" as UrgentStatus),
      photos: Array.isArray(request.body.photos)
        ? request.body.photos.map((photo: { name?: string; type?: string; data?: string }) => ({
            name: String(photo.name ?? "inspection-photo"),
            type: String(photo.type ?? ""),
            data: String(photo.data ?? "")
          }))
        : []
    });

    response.status(201).json(inspection);
  } catch (error) {
    response.status(500).json({
      message: `Inspection report could not be saved: ${formatErrorMessage(error)}`
    });
  }
}

function formatErrorMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }

  if (error && typeof error === "object") {
    const maybeError = error as { message?: unknown; code?: unknown; details?: unknown; hint?: unknown };
    const parts = [maybeError.message, maybeError.code, maybeError.details, maybeError.hint]
      .filter(Boolean)
      .map(String);

    if (parts.length) return parts.join(" / ");
  }

  return "Please check Supabase setup and try again.";
}
