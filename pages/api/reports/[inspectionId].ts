import path from "path";
import PDFDocument from "pdfkit";
import type { NextApiRequest, NextApiResponse } from "next";
import { groupChecklistItems } from "@/lib/checklists";
import { readDatabase, readPhotoAsset } from "@/lib/db";

export const config = {
  api: {
    responseLimit: false
  }
};

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit"
  }).format(new Date(value));
}

export default async function handler(request: NextApiRequest, response: NextApiResponse) {
  if (request.method !== "GET") {
    response.setHeader("Allow", "GET");
    response.status(405).json({ message: "Method not allowed" });
    return;
  }

  const inspectionId = String(request.query.inspectionId ?? "").replace(/\.pdf$/i, "");
  const database = await readDatabase();
  const inspection = database.inspections.find((item) => item.id === inspectionId);
  const property = database.properties.find((item) => item.id === inspection?.propertyId);

  if (!inspection || !property) {
    response.status(404).json({ message: "Report not found" });
    return;
  }

  const filename = `${property.name.replace(/[^a-z0-9]+/gi, "-").toLowerCase()}-${inspection.id}.pdf`;
  response.setHeader("Content-Type", "application/pdf");
  response.setHeader("Content-Disposition", `inline; filename="${filename}"`);

  const doc = new PDFDocument({ margin: 54, size: "LETTER" });
  doc.pipe(response);

  doc
    .fontSize(10)
    .fillColor("#b76e46")
    .text("COACHELLA VALLEY HOME WATCH", { characterSpacing: 1.2 })
    .moveDown(0.5);
  doc.fontSize(24).fillColor("#17211f").text("Homeowner Inspection Report");
  doc.moveDown(0.4);
  doc.fontSize(12).fillColor("#65706c").text(`${property.name} / ${property.owner}`);
  doc.text(property.address);
  doc.moveDown(1.1);

  writeRow(doc, "Date", formatDateTime(inspection.timestamp));
  writeRow(doc, "Inspector", inspection.inspectorName);
  writeRow(doc, "Interior Temperature", `${inspection.interiorTemperature} F`);
  writeRow(doc, "Urgent Issue", inspection.urgent);
  writeRow(doc, "Photos", `${inspection.photos.length} uploaded`);

  doc.moveDown(0.8).fontSize(13).fillColor("#17211f").text("Completed Checks", { underline: true });
  doc.moveDown(0.4).fontSize(11).fillColor("#17211f");
  if (inspection.checklist.length) {
    groupChecklistItems(inspection.checklist).forEach((section) => {
      if (!section.items.length) {
        return;
      }

      doc.moveDown(0.4).fontSize(11).fillColor("#b76e46").text(section.title);
      doc.fontSize(10).fillColor("#17211f");
      section.items.forEach((item) => doc.text(`- ${item}`, { indent: 10 }));
    });
  } else {
    doc.text("No checklist items were marked complete.");
  }

  doc.moveDown(1).fontSize(13).fillColor("#17211f").text("Notes / Issues", { underline: true });
  doc.moveDown(0.4).fontSize(11).text(inspection.notes || "No issues were noted during this visit.");

  if (inspection.photos.length) {
    doc.addPage();
    doc.fontSize(18).fillColor("#17211f").text("Inspection Photos");
    doc.moveDown(0.8);

    for (const photo of inspection.photos) {
      const filename = path.basename(photo.url);
      const photoAsset = await readPhotoAsset(inspection.id, filename);
      if (doc.y > 520) {
        doc.addPage();
      }

      doc.fontSize(10).fillColor("#65706c").text(photo.name);
      if (photoAsset) {
        try {
          doc.image(photoAsset.buffer, { fit: [486, 320], align: "center" });
          doc.moveDown(1.2);
        } catch {
          doc.fontSize(10).fillColor("#9f352e").text("Photo format could not be embedded in the PDF.");
          doc.moveDown(0.8);
        }
      } else {
        doc.fontSize(10).fillColor("#9f352e").text("Photo file was not found.");
        doc.moveDown(0.8);
      }
    }
  }

  doc.end();
}

function writeRow(doc: PDFKit.PDFDocument, label: string, value: string) {
  const y = doc.y;
  doc.fontSize(10).fillColor("#65706c").text(label, 54, y, { width: 140 });
  doc.fontSize(11).fillColor("#17211f").text(value, 190, y, { width: 330 });
  doc.moveDown(0.7);
}
