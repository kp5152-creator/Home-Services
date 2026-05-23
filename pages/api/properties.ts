import type { NextApiRequest, NextApiResponse } from "next";
import { addProperty, deleteProperty, readDatabase } from "@/lib/db";

export default async function handler(request: NextApiRequest, response: NextApiResponse) {
  if (request.method === "GET") {
    response.status(200).json(await readDatabase());
    return;
  }

  if (request.method === "POST") {
    const property = await addProperty({
      name: String(request.body.name ?? ""),
      owner: String(request.body.owner ?? ""),
      address: String(request.body.address ?? ""),
      phone: String(request.body.phone ?? ""),
      email: String(request.body.email ?? ""),
      accessNotes: String(request.body.accessNotes ?? "")
    });

    response.status(201).json(property);
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
