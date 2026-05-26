import type { NextApiRequest, NextApiResponse } from "next";
import { addOwnerUpdate } from "@/services/database";
import type { OwnerUpdateCategory, OwnerUpdateStatus } from "@/utils/types";

const categories: OwnerUpdateCategory[] = ["Inspection", "Maintenance", "Vendor", "Arrival", "General"];
const statuses: OwnerUpdateStatus[] = ["Draft", "Shared", "Archived"];

export default async function handler(request: NextApiRequest, response: NextApiResponse) {
  if (request.method !== "POST") {
    response.setHeader("Allow", "POST");
    response.status(405).json({ message: "Method not allowed" });
    return;
  }

  try {
    const propertyId = String(request.body.propertyId ?? "").trim();
    const title = String(request.body.title ?? "").trim();
    const category = categories.includes(request.body.category) ? request.body.category : "General";
    const status = statuses.includes(request.body.status) ? request.body.status : "Draft";

    if (!propertyId || !title) {
      response.status(400).json({ message: "Property and update title are required." });
      return;
    }

    const update = await addOwnerUpdate({
      propertyId,
      category,
      title,
      message: String(request.body.message ?? ""),
      status
    });

    response.status(201).json(update);
  } catch (error) {
    response.status(500).json({
      message: `Owner update could not be saved: ${formatErrorMessage(error)}`
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

    if (parts.length) {
      return parts.join(" / ");
    }
  }

  return "Please confirm the owner_updates table exists in Supabase and try again.";
}
