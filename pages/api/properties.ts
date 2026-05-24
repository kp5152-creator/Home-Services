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
        message:
          error instanceof Error
            ? error.message
            : "Property could not be saved. Please check the database setup and try again."
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
