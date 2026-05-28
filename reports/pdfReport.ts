import fs from "fs/promises";
import path from "path";
import PDFDocument from "pdfkit";
import { getInspectionType, groupChecklistItems, visibleChecklistItems } from "@/utils/checklists";
import { readPhotoAsset } from "@/services/database";
import type { Inspection, InspectionPhoto, Property } from "@/utils/types";

const palette = {
  ink: "#1F1F1F",
  charcoal: "#252525",
  muted: "#6f6658",
  line: "#E5C76B",
  sand: "#EAE4D8",
  cream: "#F5F2EA",
  gold: "#D4AF37",
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
    doc.save();
    doc.roundedRect(48, 42, 516, 250, 14).clip();
    doc.image(coverImage, 48, 42, { fit: [516, 250], align: "center", valign: "center" });
    doc.rect(48, 42, 516, 250).fillOpacity(0.1).fill(palette.ink);
    doc.restore();
  } else {
    doc.roundedRect(48, 42, 516, 250, 14).fill(palette.sand);
  }

  doc.roundedRect(48, 42, 516, 250, 14).lineWidth(1).strokeColor(palette.line).stroke();
  doc.font("Helvetica").fontSize(9).fillColor(palette.gold).text("PRIVATE ESTATEIQ HOME WATCH", 54, 324, {
    characterSpacing: 2.4,
    align: "center",
    width: 504
  });
  doc.font("Times-Bold").fontSize(36).fillColor(palette.ink).text("Homeowner Packet", 70, 350, {
    align: "center",
    width: 472
  });
  doc.font("Helvetica").fontSize(12).fillColor(palette.muted).text(
    "Prepared for confident ownership, clear communication, and white-glove estate oversight.",
    94,
    398,
    { align: "center", width: 424, lineGap: 3 }
  );

  drawStatusPill(doc, status.label, status.tone === "urgent" ? palette.urgent : palette.gold, 218, 438, 176);
  doc.roundedRect(74, 494, 464, 122, 12).fill(palette.white).strokeColor(palette.line).stroke();
  doc.moveTo(98, 548).lineTo(514, 548).lineWidth(0.4).strokeColor(palette.sand).stroke();
  doc.moveTo(298, 512).lineTo(298, 600).lineWidth(0.4).strokeColor(palette.sand).stroke();
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
  drawSectionHeader(doc, "Homeowner Summary", "Concierge notes and visit context", 54, 48);

  doc.roundedRect(54, 112, 504, 232, 14).fill(palette.white).strokeColor(palette.line).stroke();
  doc.rect(54, 112, 504, 5).fill(palette.gold);
  doc.font("Helvetica").fontSize(9).fillColor(palette.gold).text("CONCIERGE NOTE", 78, 142, {
    characterSpacing: 1.4
  });
  doc.font("Times-Bold").fontSize(22).fillColor(palette.ink).text("What the homeowner needs to know", 78, 164, {
    width: 456
  });
  doc.font("Helvetica").fontSize(10.5).fillColor(palette.charcoal).text(
    inspection.executiveSummary || "The property inspection has been completed and is ready for homeowner review.",
    78,
    206,
    { width: 456, lineGap: 5 }
  );

  doc.roundedRect(54, 372, 242, 142, 12).fill(palette.sand).strokeColor(palette.line).stroke();
  doc.font("Helvetica").fontSize(8).fillColor(palette.gold).text("HOMEOWNER ACTION", 78, 398, {
    characterSpacing: 1.2
  });
  doc.font("Times-Bold").fontSize(16).fillColor(status.tone === "urgent" ? palette.urgent : palette.ink).text(
    status.tone === "urgent" ? "Review promptly" : "No immediate action",
    78,
    420,
    { width: 190 }
  );
  doc.font("Helvetica").fontSize(9.5).fillColor(palette.charcoal).text(status.description, 78, 450, {
    width: 190,
    lineGap: 3
  });

  doc.roundedRect(316, 372, 242, 142, 12).fill(palette.white).strokeColor(palette.line).stroke();
  doc.font("Helvetica").fontSize(8).fillColor(palette.gold).text("VISIT CONTEXT", 340, 398, {
    characterSpacing: 1.2
  });
  writeInlineDetail(doc, "Inspector", inspection.inspectorName, 340, 426);
  writeInlineDetail(doc, "Interior Temp", inspection.interiorTemperature + " F", 460, 426);
  writeInlineDetail(doc, "Inspection", getInspectionType(inspection.checklist), 340, 472);

  doc.roundedRect(54, 550, 504, 104, 12).fill(palette.white).strokeColor(palette.line).stroke();
  doc.font("Times-Bold").fontSize(15).fillColor(palette.ink).text("Included in this packet", 78, 576);
  doc.moveTo(78, 596).lineTo(198, 596).lineWidth(0.8).strokeColor(palette.gold).stroke();
  writePacketItem(doc, "Inspection record", "Checklist observations and any notes from the property visit.", 78, 618);
  writePacketItem(doc, "Photo documentation", "Representative images are included for visual confirmation.", 252, 618);
  writePacketItem(doc, "Service history", "Report details remain available inside EstateIQ for future reference.", 426, 618);
}

function drawInspectionRecordPage(
  doc: PDFKit.PDFDocument,
  inspection: Inspection,
  photoAssets: Array<{ photo: InspectionPhoto; asset: { buffer: Buffer } | null }>
) {
  doc.addPage();
  drawPageBackground(doc);
  drawSectionHeader(doc, "Inspection Record", "Checklist, notes, and visual documentation", 54, 48);

  doc.roundedRect(54, 104, 504, 72, 12).fill(palette.white).strokeColor(palette.line).stroke();
  doc.font("Times-Bold").fontSize(14).fillColor(palette.ink).text("Notes / Issues Found", 78, 126);
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
    doc.roundedRect(x, sectionY, sectionWidth, 250, 12).fill(palette.white).strokeColor(palette.line).stroke();
    doc.rect(x, sectionY, sectionWidth, 4).fill(palette.gold);
    doc.font("Times-Bold").fontSize(14).fillColor(palette.ink).text(section.title, x + 18, sectionY + 18);

    let itemY = sectionY + 44;
    section.items.forEach((item) => {
      if (itemY > sectionY + 226) return;
      doc.circle(x + 24, itemY + 4, 3.2).fill(palette.gold);
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
    doc.roundedRect(x, photoY, photoWidth, 150, 10).fill(palette.white).strokeColor(palette.line).stroke();
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

  doc.roundedRect(54, 686, 504, 34, 10).fill(palette.sand).strokeColor(palette.line).stroke();
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
  doc.rect(0, 0, 612, 24).fill(palette.ink);
  doc.rect(0, 24, 612, 2).fill(palette.gold);
  doc.rect(0, 766, 612, 2).fill(palette.gold);
  doc.rect(0, 768, 612, 24).fill(palette.ink);
}

function drawSectionHeader(doc: PDFKit.PDFDocument, title: string, subtitle: string, x: number, y: number) {
  doc.font("Helvetica").fontSize(8).fillColor(palette.gold).text("ESTATEIQ", x, y, { characterSpacing: 2 });
  doc.font("Times-Bold").fontSize(24).fillColor(palette.ink).text(title, x, y + 18);
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
  doc.roundedRect(x, y, width, 86, 12).fill(palette.white).strokeColor(palette.line).stroke();
  doc.rect(x, y, width, 4).fill(urgent ? palette.urgent : palette.gold);
  doc.font("Helvetica").fontSize(8).fillColor(palette.gold).text(label.toUpperCase(), x + 18, y + 20, {
    characterSpacing: 1.1,
    width: width - 36
  });
  doc.font("Times-Bold").fontSize(26).fillColor(urgent ? palette.urgent : palette.ink).text(value, x + 18, y + 40, {
    width: width - 36
  });
}

function writeInlineDetail(doc: PDFKit.PDFDocument, label: string, value: string, x: number, y: number) {
  doc.font("Helvetica").fontSize(8).fillColor(palette.gold).text(label.toUpperCase(), x, y, { width: 120, characterSpacing: 1 });
  doc.font("Helvetica-Bold").fontSize(10).fillColor(palette.ink).text(value, x, y + 14, { width: 130 });
}

function writePacketItem(doc: PDFKit.PDFDocument, title: string, body: string, x: number, y: number) {
  doc.circle(x, y + 5, 3).fill(palette.gold);
  doc.font("Helvetica-Bold").fontSize(9).fillColor(palette.ink).text(title, x + 12, y, { width: 112 });
  doc.font("Helvetica").fontSize(8).fillColor(palette.muted).text(body, x + 12, y + 16, {
    width: 112,
    lineGap: 2
  });
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
