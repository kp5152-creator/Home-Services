import type { NextApiRequest, NextApiResponse } from "next";
import { addProperty, deleteProperty, readDatabase } from "@/lib/db";

export default async function handler(request: NextApiRequest, response: NextApiResponse) {
  if (request.method === "GET") {
    response.status(200).json(await readDatabase());
    return;
  }

  if (request.method === "POST") {
    try {
      const name = String(request.body.name ?? "").trim();
      const owner = String(request.body.owner ?? "").trim();
      const address = String(request.body.address ?? "").trim();

      if (!name || !owner || !address) {
        response.status(400).json({ message: "Property name, homeowner, and address are required." });
        return;
      }

      const property = await addProperty({
        name,
        owner,
        address,
        phone: String(request.body.phone ?? ""),
        email: String(request.body.email ?? ""),
        accessNotes: String(request.body.accessNotes ?? "")
      });

      response.status(201).json(property);
    } catch (error) {
      response.status(500).json({
        message: `Property could not be saved: ${formatErrorMessage(error)}`
      });
    }
    return;
  }

  if (request.method === "DELETE") {
    const propertyId = String(request.query.id ?? "");
    const database = await deleteProperty(propertyId);

    if (!database) {
      response.status(404).json({ message: "Property not found" });
      return;
    }

    response.status(200).json(database);
    return;
  }

  response.setHeader("Allow", "GET, POST, DELETE");
  response.status(405).json({ message: "Method not allowed" });
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

  return "Please check the database setup and try again.";
}
