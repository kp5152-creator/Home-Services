import type { NextApiRequest, NextApiResponse } from "next";
import { readDatabase } from "@/services/database";
import { demoDatabase } from "@/reports/demoData";
import { writeInspectionReportPdf } from "@/reports/pdfReport";

export const config = {
  api: {
    responseLimit: false
  }
};

export default async function handler(request: NextApiRequest, response: NextApiResponse) {
  if (request.method !== "GET") {
    response.setHeader("Allow", "GET");
    response.status(405).json({ message: "Method not allowed" });
    return;
  }

  const inspectionId = String(request.query.inspectionId ?? "").replace(/\.pdf$/i, "");
  const database = await readDatabase();
  const inspection =
    database.inspections.find((item) => item.id === inspectionId) ??
    demoDatabase.inspections.find((item) => item.id === inspectionId);
  const property =
    database.properties.find((item) => item.id === inspection?.propertyId) ??
    demoDatabase.properties.find((item) => item.id === inspection?.propertyId);

  if (!inspection || !property) {
    response.status(404).json({ message: "Report not found" });
    return;
  }

  const filename = property.name.replace(/[^a-z0-9]+/gi, "-").toLowerCase() + "-" + inspection.id + ".pdf";
  response.setHeader("Content-Type", "application/pdf");
  response.setHeader("Content-Disposition", "inline; filename=\"" + filename + "\"");

  await writeInspectionReportPdf(response, property, inspection);
}
