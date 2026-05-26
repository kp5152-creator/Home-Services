import fs from "fs/promises";
import path from "path";
import PDFDocument from "pdfkit";
import { getInspectionType, groupChecklistItems, visibleChecklistItems } from "@/utils/checklists";
import { readPhotoAsset } from "@/services/database";
import type { Inspection, InspectionPhoto, Property } from "@/utils/types";

const palette = {
  ink: "#17211f",
  charcoal: "#27312f",
  muted: "#69736f",
  line: "#e6dfd3",
  sand: "#f6f1e8",
  cream: "#fbf8f1",
  gold: "#b88a45",
  green: "#40584d",
  urgent: "#9f352e",
  white: "#ffffff"
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

export async function writeInspectionReportPdf(
  stream: NodeJS.WritableStream,
  property: Property,
  inspection: Inspection
) {
  const status = reportConditionStatus(inspection);
  const doc = new PDFDocument({ margin: 0, size: "LETTER", bufferPages: true });
  doc.pipe(stream);

  const photoAssets = await Promise.all(
    inspection.photos.map(async (photo) => ({
      photo,
      asset: await loadReportPhoto(inspection.id, photo)
    }))
  );

  drawCoverPage(doc, property, inspection, status, photoAssets[0]?.asset?.buffer);
  drawSummaryPage(doc, property, inspection, status);
  drawInspectionRecordPage(doc, inspection, photoAssets);
  addFooters(doc, property);

  doc.end();
}

async function loadReportPhoto(inspectionId: string, photo: InspectionPhoto) {
  const filename = path.basename(photo.url);
  if (photo.url.startsWith("/demo-")) {
    return { buffer: await fs.readFile(path.join(process.cwd(), "public", filename)) };
  }

  return readPhotoAsset(inspectionId, filename);
}

function drawCoverPage(
  doc: PDFKit.PDFDocument,
  property: Property,
  inspection: Inspection,
  status: ReturnType<typeof reportConditionStatus>,
  coverImage?: Buffer
) {
  drawPageBackground(doc);

  if (coverImage) {
    doc.image(coverImage, 48, 42, { fit: [516, 250], align: "center", valign: "center" });
  } else {
    doc.roundedRect(48, 42, 516, 250, 16).fill(palette.sand);
  }

  doc.roundedRect(48, 42, 516, 250, 16).lineWidth(1).strokeColor(palette.line).stroke();
  doc.font("Helvetica").fontSize(9).fillColor(palette.gold).text("ESTATEIQ", 54, 326, {
    characterSpacing: 2.4,
    align: "center",
    width: 504
  });
  doc.font("Helvetica-Bold").fontSize(29).fillColor(palette.ink).text("Homeowner Inspection Report", 70, 352, {
    align: "center",
    width: 472
  });
  doc.font("Helvetica").fontSize(12).fillColor(palette.muted).text(
    "Prepared for confident ownership, clear communication, and white-glove property oversight.",
    94,
    392,
    { align: "center", width: 424, lineGap: 3 }
  );

  drawStatusPill(doc, status.label, status.tone === "urgent" ? palette.urgent : palette.green, 218, 438, 176);
  doc.roundedRect(74, 494, 464, 122, 14).fill(palette.white).strokeColor(palette.line).stroke();
  writeCoverMeta(doc, "Property", property.name, 98, 518);
  writeCoverMeta(doc, "Homeowner", property.owner, 98, 558);
  writeCoverMeta(doc, "Inspection", getInspectionType(inspection.checklist), 322, 518);
  writeCoverMeta(doc, "Completed", formatDateTime(inspection.timestamp), 322, 558);

  doc.font("Helvetica").fontSize(9).fillColor(palette.muted).text(property.address, 74, 654, {
    align: "center",
    width: 464
  });
  doc.moveTo(220, 688).lineTo(392, 688).lineWidth(0.8).strokeColor(palette.gold).stroke();
  doc.fontSize(9).fillColor(palette.gold).text("INSPECT  |  REPORT  |  PROTECT", 74, 704, {
    align: "center",
    width: 464,
    characterSpacing: 1.6
  });
}

function drawSummaryPage(
  doc: PDFKit.PDFDocument,
  property: Property,
  inspection: Inspection,
  status: ReturnType<typeof reportConditionStatus>
) {
  doc.addPage();
  drawPageBackground(doc);
  drawSectionHeader(doc, "Executive Summary", "Homeowner-ready property intelligence", 54, 48);

  doc.roundedRect(54, 112, 504, 120, 14).fill(palette.ink);
  doc.font("Helvetica").fontSize(9).fillColor(palette.gold).text("PROPERTY CONDITION", 78, 138, { characterSpacing: 1.4 });
  doc.font("Helvetica-Bold").fontSize(22).fillColor(palette.white).text(status.label, 78, 160, { width: 280 });
  doc.font("Helvetica").fontSize(10).fillColor("#d8d0c1").text(status.description, 78, 192, { width: 418, lineGap: 2 });

  const completedCount = visibleChecklistItems(inspection.checklist).length;
  drawMetricCard(doc, "Completed Checks", String(completedCount), 54, 266, 154);
  drawMetricCard(doc, "Photos", String(inspection.photos.length), 225, 266, 154);
  drawMetricCard(doc, "Urgent Issues", inspection.urgent, 396, 266, 162, inspection.urgent === "Yes");

  doc.roundedRect(54, 388, 504, 180, 14).fill(palette.white).strokeColor(palette.line).stroke();
  doc.font("Helvetica-Bold").fontSize(13).fillColor(palette.ink).text("Concierge Notes", 78, 414);
  doc.font("Helvetica").fontSize(10.5).fillColor(palette.charcoal).text(
    inspection.executiveSummary || "The property inspection has been completed and is ready for homeowner review.",
    78,
    440,
    { width: 456, lineGap: 4 }
  );

  doc.roundedRect(54, 596, 504, 86, 14).fill(palette.sand).strokeColor(palette.line).stroke();
  doc.font("Helvetica-Bold").fontSize(12).fillColor(palette.ink).text("Visit Details", 78, 620);
  writeInlineDetail(doc, "Inspector", inspection.inspectorName, 78, 646);
  writeInlineDetail(doc, "Interior Temp", inspection.interiorTemperature + " F", 238, 646);
  writeInlineDetail(doc, "Property", property.name, 398, 646);
}

function drawInspectionRecordPage(
  doc: PDFKit.PDFDocument,
  inspection: Inspection,
  photoAssets: Array<{ photo: InspectionPhoto; asset: { buffer: Buffer } | null }>
) {
  doc.addPage();
  drawPageBackground(doc);
  drawSectionHeader(doc, "Inspection Record", "Checklist, notes, and visual documentation", 54, 48);

  doc.roundedRect(54, 104, 504, 72, 14).fill(palette.white).strokeColor(palette.line).stroke();
  doc.font("Helvetica-Bold").fontSize(11).fillColor(palette.ink).text("Notes / Issues Found", 78, 126);
  doc.font("Helvetica").fontSize(9.2).fillColor(palette.charcoal).text(
    inspection.notes || "No issues were noted during this visit.",
    78,
    148,
    { width: 456, lineGap: 2 }
  );

  const sections = groupChecklistItems(inspection.checklist).filter((section) => section.items.length);
  const sectionWidth = 242;
  const sectionY = 202;

  if (!sections.length) {
    doc.font("Helvetica").fontSize(10).fillColor(palette.muted).text("No checklist items were marked complete.", 54, sectionY);
  }

  sections.slice(0, 2).forEach((section, sectionIndex) => {
    const x = sectionIndex === 0 ? 54 : 316;
    doc.roundedRect(x, sectionY, sectionWidth, 250, 14).fill(palette.white).strokeColor(palette.line).stroke();
    doc.font("Helvetica-Bold").fontSize(12).fillColor(palette.gold).text(section.title, x + 18, sectionY + 18);

    let itemY = sectionY + 44;
    section.items.forEach((item) => {
      if (itemY > sectionY + 226) return;
      doc.circle(x + 24, itemY + 4, 3.2).fill(palette.green);
      doc.font("Helvetica").fontSize(7.8).fillColor(palette.charcoal).text(item, x + 36, itemY, {
        width: sectionWidth - 52,
        lineGap: 0.4
      });
      itemY += 14;
    });
  });

  doc.font("Helvetica").fontSize(8).fillColor(palette.gold).text("PHOTO DOCUMENTATION", 54, 486, {
    characterSpacing: 1.2
  });

  const photoY = 508;
  const photoWidth = 154;
  photoAssets.slice(0, 3).forEach(({ photo, asset }, index) => {
    const x = 54 + index * 175;
    doc.roundedRect(x, photoY, photoWidth, 150, 12).fill(palette.white).strokeColor(palette.line).stroke();
    if (asset) {
      try {
        doc.image(asset.buffer, x + 10, photoY + 12, { fit: [photoWidth - 20, 92], align: "center", valign: "center" });
      } catch {
        doc.font("Helvetica").fontSize(8).fillColor(palette.urgent).text("Photo unavailable", x + 12, photoY + 42, {
          width: photoWidth - 24,
          align: "center"
        });
      }
    } else {
      doc.font("Helvetica").fontSize(8).fillColor(palette.urgent).text("Photo unavailable", x + 12, photoY + 42, {
        width: photoWidth - 24,
        align: "center"
      });
    }

    doc.font("Helvetica-Bold").fontSize(7.8).fillColor(palette.ink).text(cleanPhotoName(photo.name), x + 10, photoY + 114, {
      width: photoWidth - 20,
      align: "center"
    });
  });

  doc.roundedRect(54, 686, 504, 34, 12).fill(palette.sand).strokeColor(palette.line).stroke();
  doc.font("Helvetica").fontSize(8.5).fillColor(palette.muted).text(
    "Complete photo set and checklist detail are retained in EstateIQ inspection history.",
    76,
    698,
    { width: 460, align: "center" }
  );
}

function cleanPhotoName(name: string) {
  return name.replace(/\.[^/.]+$/, "");
}

function drawPageBackground(doc: PDFKit.PDFDocument) {
  doc.rect(0, 0, 612, 792).fill(palette.cream);
  doc.rect(0, 0, 612, 18).fill(palette.ink);
  doc.rect(0, 774, 612, 18).fill(palette.ink);
}

function drawSectionHeader(doc: PDFKit.PDFDocument, title: string, subtitle: string, x: number, y: number) {
  doc.font("Helvetica").fontSize(8).fillColor(palette.gold).text("ESTATEIQ", x, y, { characterSpacing: 2 });
  doc.font("Helvetica-Bold").fontSize(22).fillColor(palette.ink).text(title, x, y + 18);
  doc.font("Helvetica").fontSize(10).fillColor(palette.muted).text(subtitle, x, y + 48);
  doc.moveTo(x, y + 70).lineTo(558, y + 70).lineWidth(0.8).strokeColor(palette.line).stroke();
}

function drawStatusPill(doc: PDFKit.PDFDocument, label: string, color: string, x: number, y: number, width: number) {
  doc.roundedRect(x, y, width, 34, 17).fill(color);
  doc.font("Helvetica-Bold").fontSize(10).fillColor(palette.white).text(label, x, y + 11, { width, align: "center" });
}

function writeCoverMeta(doc: PDFKit.PDFDocument, label: string, value: string, x: number, y: number) {
  doc.font("Helvetica").fontSize(8).fillColor(palette.gold).text(label.toUpperCase(), x, y, { characterSpacing: 1.2 });
  doc.font("Helvetica-Bold").fontSize(11).fillColor(palette.ink).text(value, x, y + 15, { width: 180, lineGap: 2 });
}

function drawMetricCard(
  doc: PDFKit.PDFDocument,
  label: string,
  value: string,
  x: number,
  y: number,
  width: number,
  urgent = false
) {
  doc.roundedRect(x, y, width, 86, 14).fill(palette.white).strokeColor(palette.line).stroke();
  doc.font("Helvetica").fontSize(8).fillColor(palette.gold).text(label.toUpperCase(), x + 18, y + 20, {
    characterSpacing: 1.1,
    width: width - 36
  });
  doc.font("Helvetica-Bold").fontSize(24).fillColor(urgent ? palette.urgent : palette.ink).text(value, x + 18, y + 42, {
    width: width - 36
  });
}

function writeInlineDetail(doc: PDFKit.PDFDocument, label: string, value: string, x: number, y: number) {
  doc.font("Helvetica").fontSize(8).fillColor(palette.gold).text(label.toUpperCase(), x, y, { width: 120, characterSpacing: 1 });
  doc.font("Helvetica-Bold").fontSize(10).fillColor(palette.ink).text(value, x, y + 14, { width: 130 });
}

function addFooters(doc: PDFKit.PDFDocument, property: Property) {
  const range = doc.bufferedPageRange();
  for (let i = range.start; i < range.start + range.count; i += 1) {
    doc.switchToPage(i);
    doc.font("Helvetica").fontSize(8).fillColor("#d8d0c1").text("ESTATEIQ", 54, 778, { characterSpacing: 1.5 });
    doc.text(property.name, 150, 778, { width: 300, align: "center" });
    doc.text("Page " + (i + 1) + " of " + range.count, 498, 778, { width: 60, align: "right" });
  }
}

function reportConditionStatus(inspection: { urgent: string; checklist: string[] }) {
  if (inspection.urgent === "Yes") {
    return {
      label: "Attention Recommended",
      tone: "urgent" as const,
      description:
        "This report includes an urgent item that should be reviewed promptly by the homeowner or property manager."
    };
  }

  if (!visibleChecklistItems(inspection.checklist).length) {
    return {
      label: "Report Pending",
      tone: "normal" as const,
      description: "This report has been created, but no completed checklist items were recorded."
    };
  }

  return {
    label: "Property Stable",
    tone: "normal" as const,
    description: "This inspection indicates the property is stable with no urgent homeowner action flagged at this time."
  };
}
