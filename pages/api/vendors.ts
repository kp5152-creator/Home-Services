import type { NextApiRequest, NextApiResponse } from "next";
import { addVendorContact } from "@/lib/db";
import type { VendorType } from "@/lib/types";

const vendorTypes: VendorType[] = [
  "Pool",
  "Landscape",
  "HVAC",
  "Cleaning",
  "Handyman",
  "Plumbing",
  "Electrical",
  "Other"
];

export default async function handler(request: NextApiRequest, response: NextApiResponse) {
  if (request.method !== "POST") {
    response.setHeader("Allow", "POST");
    response.status(405).json({ message: "Method not allowed" });
    return;
  }

  try {
    const name = String(request.body.name ?? "").trim();
    const propertyId = String(request.body.propertyId ?? "").trim();
    const type = vendorTypes.includes(request.body.type) ? request.body.type : "Other";

    if (!propertyId || !name) {
      response.status(400).json({ message: "Property and vendor name are required." });
      return;
    }

    const vendor = await addVendorContact({
      propertyId,
      name,
      type,
      contactName: String(request.body.contactName ?? ""),
      phone: String(request.body.phone ?? ""),
      email: String(request.body.email ?? ""),
      notes: String(request.body.notes ?? "")
    });

    response.status(201).json(vendor);
  } catch (error) {
    response.status(500).json({
      message: `Vendor could not be saved: ${formatErrorMessage(error)}`
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

  return "Please confirm the vendors table exists in Supabase and try again.";
}
