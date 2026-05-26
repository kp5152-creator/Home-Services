import type { NextApiRequest, NextApiResponse } from "next";
import { addMaintenanceIssue, updateMaintenanceIssue } from "@/services/database";
import type { MaintenancePriority, MaintenanceStatus } from "@/utils/types";

const priorities: MaintenancePriority[] = ["Low", "Medium", "High", "Urgent"];
const statuses: MaintenanceStatus[] = ["Open", "Scheduled", "In Progress", "Resolved"];

export const config = {
  api: {
    bodyParser: {
      sizeLimit: "25mb"
    }
  }
};

export default async function handler(request: NextApiRequest, response: NextApiResponse) {
  if (request.method !== "POST" && request.method !== "PATCH") {
    response.setHeader("Allow", "POST, PATCH");
    response.status(405).json({ message: "Method not allowed" });
    return;
  }

  const status = statuses.includes(request.body.status) ? request.body.status : "Open";

  if (request.method === "PATCH") {
    try {
      const issueId = String(request.body.id ?? "");
      const priority = priorities.includes(request.body.priority) ? request.body.priority : undefined;
      const requestedStatus = statuses.includes(request.body.status) ? request.body.status : undefined;

      if (!issueId) {
        response.status(400).json({ message: "Maintenance issue id is required." });
        return;
      }

      const issue = await updateMaintenanceIssue(issueId, {
        title: request.body.title === undefined ? undefined : String(request.body.title ?? "").trim(),
        description: request.body.description === undefined ? undefined : String(request.body.description ?? ""),
        priority,
        status: requestedStatus,
        vendor: request.body.vendor === undefined ? undefined : String(request.body.vendor ?? ""),
        nextStep: request.body.nextStep === undefined ? undefined : String(request.body.nextStep ?? "")
      });

      if (!issue) {
        response.status(404).json({ message: "Maintenance issue not found." });
        return;
      }

      response.status(200).json(issue);
    } catch (error) {
      response.status(500).json({
        message: error instanceof Error ? error.message : "Maintenance issue status could not be updated."
      });
    }
    return;
  }

  const priority = priorities.includes(request.body.priority) ? request.body.priority : "Medium";

  try {
    const issue = await addMaintenanceIssue({
      propertyId: String(request.body.propertyId ?? ""),
      title: String(request.body.title ?? ""),
      description: String(request.body.description ?? ""),
      priority,
      status,
      vendor: String(request.body.vendor ?? ""),
      nextStep: String(request.body.nextStep ?? ""),
      photos: Array.isArray(request.body.photos)
        ? request.body.photos.map((photo: { name?: string; type?: string; data?: string }) => ({
            name: String(photo.name ?? "maintenance-photo"),
            type: String(photo.type ?? ""),
            data: String(photo.data ?? "")
          }))
        : []
    });

    response.status(201).json(issue);
  } catch (error) {
    response.status(500).json({
      message:
        error instanceof Error
          ? error.message
          : "Maintenance issue could not be saved. Please check the Supabase maintenance photo table."
    });
  }
}
