import fs from "fs/promises";
import path from "path";
import PDFDocument from "pdfkit";
import sharp from "sharp";
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
  const propertyPhoto = await loadPropertyPhoto(property.photoUrl);

  drawCoverPage(doc, property, inspection, status, propertyPhoto?.buffer ?? photoAssets[0]?.asset?.buffer);
  drawDetailsPage(doc, inspection, status);
  drawPhotoPages(doc, photoAssets);
  addFooters(doc, property);

  doc.end();
}

async function loadReportPhoto(inspectionId: string, photo: InspectionPhoto) {
  const filename = path.basename(photo.url);
  if (photo.url.startsWith("/demo-")) {
    return { buffer: await pdfReadyImageBuffer(await fs.readFile(path.join(process.cwd(), "public", filename))) };
  }

  const asset = await readPhotoAsset(inspectionId, filename);
  return asset ? { buffer: await pdfReadyImageBuffer(asset.buffer) } : null;
}

async function loadPropertyPhoto(photoUrl: string | undefined) {
  if (!photoUrl) return null;

  if (photoUrl.startsWith("data:image/")) {
    const base64 = photoUrl.split(",").pop();
    return base64 ? { buffer: await pdfReadyImageBuffer(Buffer.from(base64, "base64")) } : null;
  }

  if (photoUrl.startsWith("/") && !photoUrl.startsWith("/api/")) {
    try {
      return { buffer: await pdfReadyImageBuffer(await fs.readFile(path.join(process.cwd(), "public", photoUrl.replace(/^\/+/, "")))) };
    } catch {
      return null;
    }
  }

  return null;
}

async function pdfReadyImageBuffer(buffer: Buffer) {
  if (isPdfSupportedImage(buffer)) return buffer;

  return sharp(buffer).jpeg({ quality: 88 }).toBuffer();
}

function isPdfSupportedImage(buffer: Buffer) {
  const isJpeg = buffer[0] === 0xff && buffer[1] === 0xd8;
  const isPng =
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47;

  return isJpeg || isPng;
}

function drawCoverPage(
  doc: PDFKit.PDFDocument,
  property: Property,
  inspection: Inspection,
  status: ReturnType<typeof reportConditionStatus>,
  coverImage?: Buffer
) {
  doc.rect(0, 0, 612, 792).fill(palette.ink);
  if (coverImage) {
    doc.save();
    doc.rect(0, 0, 612, 470).clip();
    try {
      doc.image(coverImage, 0, 0, { cover: [612, 470], align: "center", valign: "center" });
    } catch {
      doc.rect(0, 0, 612, 470).fill(palette.charcoal);
    }
    doc.restore();
  } else {
    doc.rect(0, 0, 612, 470).fill(palette.charcoal);
  }

  doc.rect(0, 0, 612, 470).fillOpacity(0.62).fill(palette.ink);
  doc.rect(0, 278, 612, 192).fillOpacity(0.34).fill(palette.ink);
  doc.fillOpacity(1);
  doc.rect(0, 470, 612, 322).fill(palette.cream);
  doc.rect(0, 468, 612, 2).fill(palette.gold);

  doc.font("Helvetica").fontSize(8).fillColor(palette.gold).text("ESTATEIQ", 54, 58, {
    characterSpacing: 2.4
  });
  doc.font("Times-Bold").fontSize(44).fillColor(palette.white).text("Homeowner Visit", 54, 94, {
    width: 420,
    lineGap: -2
  });
  doc.font("Times-Bold").fontSize(44).fillColor(palette.white).text("Summary", 54, 144, {
    width: 420
  });
  doc.font("Helvetica").fontSize(10.5).fillColor("#EAE4D8").text(
    "A concise property condition record prepared for homeowner review.",
    56,
    212,
    { width: 310, lineGap: 3 }
  );

  doc.moveTo(54, 292).lineTo(392, 292).lineWidth(0.7).strokeColor(palette.gold).stroke();
  doc.font("Times-Bold").fontSize(24).fillColor(palette.white).text(property.name, 54, 320, { width: 420 });
  doc.font("Helvetica").fontSize(10).fillColor("#EAE4D8").text(`${property.owner} / ${property.address}`, 54, 354, {
    width: 420,
    lineGap: 3
  });

  drawCoverStatusBand(doc, inspection, status);

  doc.font("Helvetica").fontSize(8).fillColor(palette.gold).text("PRIVATE ESTATEIQ HOME WATCH", 54, 706, {
    characterSpacing: 2.4,
    align: "center",
    width: 504
  });
  doc.fontSize(9).fillColor(palette.gold).text("INSPECT  |  REPORT  |  PROTECT", 74, 724, {
    align: "center",
    width: 464,
    characterSpacing: 1.6
  });
}

function drawCoverStatusBand(
  doc: PDFKit.PDFDocument,
  inspection: Inspection,
  status: ReturnType<typeof reportConditionStatus>
) {
  const y = 492;
  doc.roundedRect(54, y, 504, 176, 12).fill(palette.charcoal).strokeColor(palette.line).stroke();
  doc.rect(54, y, 504, 4).fill(palette.gold);
  doc.moveTo(296, y).lineTo(296, y + 176).lineWidth(0.45).strokeColor("#4A4437").stroke();
  doc.moveTo(316, y + 88).lineTo(538, y + 88).lineWidth(0.45).strokeColor("#4A4437").stroke();
  doc.moveTo(426, y).lineTo(426, y + 176).lineWidth(0.45).strokeColor("#4A4437").stroke();

  doc.font("Helvetica").fontSize(8).fillColor(palette.gold).text("PROPERTY STATUS", 78, y + 28, {
    characterSpacing: 1.2
  });
  doc.font("Times-Bold").fontSize(22).fillColor(palette.white).text(status.label, 78, y + 52, { width: 188 });
  doc.font("Helvetica").fontSize(9.5).fillColor("#EAE4D8").text(status.description, 78, y + 86, {
    width: 188,
    lineGap: 3
  });

  writeCoverMetric(doc, "Date", formatDateTime(inspection.timestamp), 316, y + 26, 90);
  writeCoverMetric(doc, "Type", getInspectionType(inspection.checklist), 446, y + 26, 90);
  writeCoverMetric(doc, "Inspector", inspection.inspectorName || "Inspector", 316, y + 114, 90);
  writeCoverMetric(doc, "Photos", String(inspection.photos.length), 446, y + 114, 90);
}

function drawDetailsPage(
  doc: PDFKit.PDFDocument,
  inspection: Inspection,
  status: ReturnType<typeof reportConditionStatus>
) {
  doc.addPage();
  drawPageBackground(doc);
  drawSectionHeader(doc, "Visit Summary", "Concierge notes, inspection checks, and field notes", 54, 48);

  doc.roundedRect(54, 112, 504, 166, 14).fill(palette.white).strokeColor(palette.line).stroke();
  doc.rect(54, 112, 504, 5).fill(palette.gold);
  doc.font("Helvetica").fontSize(8).fillColor(palette.gold).text("CONCIERGE NOTE", 78, 138, {
    characterSpacing: 1.4
  });
  doc.font("Times-Bold").fontSize(20).fillColor(palette.ink).text("What the homeowner needs to know", 78, 158, {
    width: 456
  });
  doc.font("Helvetica").fontSize(10.5).fillColor(palette.charcoal).text(
    inspection.executiveSummary || "The property inspection has been completed and is ready for homeowner review.",
    78,
    194,
    { width: 456, lineGap: 4, height: 62, ellipsis: true }
  );

  doc.roundedRect(54, 304, 242, 122, 12).fill(palette.sand).strokeColor(palette.line).stroke();
  doc.font("Helvetica").fontSize(8).fillColor(palette.gold).text("HOMEOWNER ACTION", 78, 328, {
    characterSpacing: 1.2
  });
  doc.font("Times-Bold").fontSize(16).fillColor(status.tone === "urgent" ? palette.urgent : palette.ink).text(
    status.tone === "urgent" ? "Review promptly" : "No immediate action",
    78,
    350,
    { width: 190 }
  );
  doc.font("Helvetica").fontSize(9).fillColor(palette.charcoal).text(status.description, 78, 378, {
    width: 190,
    lineGap: 2,
    height: 36,
    ellipsis: true
  });

  doc.roundedRect(316, 304, 242, 122, 12).fill(palette.white).strokeColor(palette.line).stroke();
  doc.font("Helvetica").fontSize(8).fillColor(palette.gold).text("VISIT CONTEXT", 340, 328, {
    characterSpacing: 1.2
  });
  writeInlineDetail(doc, "Inspector", inspection.inspectorName || "Inspector", 340, 354);
  writeInlineDetail(doc, "Interior Temp", inspection.interiorTemperature + " F", 460, 354);
  writeInlineDetail(doc, "Inspection", getInspectionType(inspection.checklist), 340, 392);

  const notes = inspection.notes || "No issues were noted during this visit.";
  doc.roundedRect(54, 452, 504, 96, 12).fill(palette.white).strokeColor(palette.line).stroke();
  doc.font("Times-Bold").fontSize(14).fillColor(palette.ink).text("Notes / Issues Found", 78, 474);
  doc.font("Helvetica").fontSize(9.2).fillColor(palette.charcoal).text(
    notes,
    78,
    498,
    { width: 456, lineGap: 3, height: 32, ellipsis: true }
  );

  const sections = groupChecklistItems(inspection.checklist).filter((section) => section.items.length);
  const sectionWidth = 242;
  const sectionY = 574;
  const sectionHeight = 144;

  if (!sections.length) {
    doc.font("Helvetica").fontSize(10).fillColor(palette.muted).text("No checklist items were marked complete.", 54, sectionY);
  }

  sections.slice(0, 2).forEach((section, sectionIndex) => {
    const x = sectionIndex === 0 ? 54 : 316;
    doc.roundedRect(x, sectionY, sectionWidth, sectionHeight, 12).fill(palette.white).strokeColor(palette.line).stroke();
    doc.rect(x, sectionY, sectionWidth, 4).fill(palette.gold);
    doc.font("Times-Bold").fontSize(14).fillColor(palette.ink).text(section.title, x + 18, sectionY + 18);

    let itemY = sectionY + 44;
    section.items.forEach((item) => {
      if (itemY > sectionY + sectionHeight - 24) return;
      doc.circle(x + 24, itemY + 4, 3.2).fill(palette.gold);
      doc.font("Helvetica").fontSize(7.3).fillColor(palette.charcoal).text(item, x + 36, itemY, {
        width: sectionWidth - 52,
        lineGap: 0.4
      });
      itemY += 12;
    });
  });
}

function drawPhotoPages(
  doc: PDFKit.PDFDocument,
  photoAssets: Array<{ photo: InspectionPhoto; asset: { buffer: Buffer } | null }>
) {
  if (!photoAssets.length) return;

  const photoGroups = groupReportPhotos(photoAssets);
  let hasPhotoPage = false;
  let cursorY = 0;

  for (const group of photoGroups) {
    const layout = photoLayoutForGroup();
    let photoIndex = 0;

    while (photoIndex < group.photos.length) {
      const sectionHeight =
        32 + Math.ceil(Math.min(group.photos.length - photoIndex, layout.perRow * layout.rowsPerSection) / layout.perRow) * (layout.cardHeight + layout.rowGap);

      if (!hasPhotoPage || cursorY + sectionHeight > 724) {
        hasPhotoPage = true;
        doc.addPage();
        drawPageBackground(doc);
        drawSectionHeader(doc, "Photo Documentation", "Curated visual record from the property visit", 54, 48);
        cursorY = 120;
      }

      doc.font("Helvetica").fontSize(8).fillColor(palette.gold).text(group.title.toUpperCase(), 54, cursorY, {
        characterSpacing: 1.2
      });
      doc.font("Helvetica").fontSize(8.5).fillColor(palette.muted).text(`${group.photos.length} documented`, 458, cursorY, {
        width: 100,
        align: "right"
      });
      doc.moveTo(54, cursorY + 18).lineTo(558, cursorY + 18).lineWidth(0.45).strokeColor(palette.line).stroke();
      cursorY += 30;

      const capacity = layout.perRow * layout.rowsPerSection;
      const pagePhotos = group.photos.slice(photoIndex, photoIndex + capacity);
      pagePhotos.forEach((photoAsset, index) => {
        const column = index % layout.perRow;
        const row = Math.floor(index / layout.perRow);
        const x = 54 + column * (layout.cardWidth + layout.gap);
        const y = cursorY + row * (layout.cardHeight + layout.rowGap);

        drawReportPhotoCard(doc, photoAsset, x, y, layout.cardWidth, layout.cardHeight);
      });

      cursorY += Math.ceil(pagePhotos.length / layout.perRow) * (layout.cardHeight + layout.rowGap) + 14;
      photoIndex += pagePhotos.length;
    }
  }
}

function photoLayoutForGroup() {
  return { cardWidth: 156, cardHeight: 112, gap: 18, rowGap: 14, perRow: 3, rowsPerSection: 3 };
}

function groupReportPhotos(photoAssets: Array<{ photo: InspectionPhoto; asset: { buffer: Buffer } | null }>) {
  const groups = [
    {
      category: "Exterior",
      title: "Exterior Photos",
      subtitle: "Property exterior, entry, landscape, pool, and outdoor conditions",
      photos: [] as Array<{ photo: InspectionPhoto; asset: { buffer: Buffer } | null }>
    },
    {
      category: "Interior",
      title: "Interior Photos",
      subtitle: "Interior rooms, systems, fixtures, and visible condition",
      photos: [] as Array<{ photo: InspectionPhoto; asset: { buffer: Buffer } | null }>
    },
    {
      category: "Issues",
      title: "Issue Photos",
      subtitle: "Items requiring attention, monitoring, or follow-up",
      photos: [] as Array<{ photo: InspectionPhoto; asset: { buffer: Buffer } | null }>
    }
  ];
  const uncategorizedPhotos: Array<{ photo: InspectionPhoto; asset: { buffer: Buffer } | null }> = [];

  photoAssets.forEach((photoAsset) => {
    const category = reportPhotoCategory(photoAsset.photo.name);
    const group = groups.find((item) => item.category === category);

    if (group) {
      group.photos.push(photoAsset);
      return;
    }

    uncategorizedPhotos.push(photoAsset);
  });

  if (uncategorizedPhotos.length) {
    uncategorizedPhotos.forEach((photoAsset, index) => {
      const groupIndex = Math.min(2, Math.floor((index / uncategorizedPhotos.length) * 3));
      groups[groupIndex].photos.push(photoAsset);
    });
  }

  return groups.filter((group) => group.photos.length);
}

function reportPhotoCategory(name: string) {
  if (name.startsWith("Exterior__")) return "Exterior";
  if (name.startsWith("Interior__")) return "Interior";
  if (name.startsWith("Issues__")) return "Issues";
  return undefined;
}

function drawReportPhotoCard(
  doc: PDFKit.PDFDocument,
  { photo, asset }: { photo: InspectionPhoto; asset: { buffer: Buffer } | null },
  x: number,
  y: number,
  width: number,
  height: number
) {
  doc.save();
  doc.roundedRect(x, y, width, height, 8).fill(palette.charcoal).strokeColor(palette.line).stroke();
  doc.roundedRect(x + 3, y + 3, width - 6, height - 6, 6).clip();
  const imageX = x + 3;
  const imageY = y + 3;
  const imageWidth = width - 6;
  const imageHeight = height - 6;

  if (asset) {
    try {
      doc.image(asset.buffer, imageX, imageY, {
        cover: [imageWidth, imageHeight],
        align: "center",
        valign: "center"
      });
    } catch {
      writePhotoUnavailable(doc, imageX, imageY + imageHeight / 2 - 8, imageWidth);
    }
  } else {
    writePhotoUnavailable(doc, imageX, imageY + imageHeight / 2 - 8, imageWidth);
  }
  doc.restore();
  doc.roundedRect(x, y, width, height, 8).lineWidth(0.65).strokeColor(palette.line).stroke();
}

function writePhotoUnavailable(doc: PDFKit.PDFDocument, x: number, y: number, width: number) {
  doc.font("Helvetica").fontSize(8).fillColor(palette.urgent).text("Photo unavailable", x, y, {
    width,
    align: "center"
  });
}

function cleanPhotoName(name: string) {
  return name.replace(/^(Exterior|Interior|Issues)__/, "").replace(/\.[^/.]+$/, "");
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

function writeCoverMetric(doc: PDFKit.PDFDocument, label: string, value: string, x: number, y: number, width: number) {
  doc.font("Helvetica").fontSize(7.5).fillColor(palette.gold).text(label.toUpperCase(), x, y, {
    width,
    characterSpacing: 1.1
  });
  doc.font("Helvetica-Bold").fontSize(10).fillColor(palette.white).text(value, x, y + 16, {
    width,
    lineGap: 2
  });
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
