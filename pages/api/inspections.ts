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
}
