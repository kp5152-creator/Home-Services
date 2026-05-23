import path from "path";
import type { NextApiRequest, NextApiResponse } from "next";
import { readPhotoAsset } from "@/lib/db";

const allowedExtensions = new Set([".jpg", ".jpeg", ".png", ".webp"]);

export default async function handler(request: NextApiRequest, response: NextApiResponse) {
  if (request.method !== "GET") {
    response.setHeader("Allow", "GET");
    response.status(405).json({ message: "Method not allowed" });
    return;
  }

  const inspectionId = String(request.query.inspectionId ?? "");
  const filename = String(request.query.filename ?? "");
  const extension = path.extname(filename).toLowerCase();

  if (!inspectionId || !filename || !allowedExtensions.has(extension)) {
    response.status(400).json({ message: "Invalid photo request" });
    return;
  }

  const photo = await readPhotoAsset(inspectionId, filename);

  if (!photo) {
    response.status(404).json({ message: "Photo not found" });
    return;
  }

  response.setHeader("Cache-Control", "private, max-age=0, must-revalidate");
  response.setHeader("Content-Type", photo.contentType);
  response.send(photo.buffer);
}
