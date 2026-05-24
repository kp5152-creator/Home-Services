import type { NextApiRequest, NextApiResponse } from "next";
import { addMaintenanceIssue } from "@/lib/db";
import type { MaintenancePriority, MaintenanceStatus } from "@/lib/types";

const priorities: MaintenancePriority[] = ["Low", "Medium", "High", "Urgent"];
const statuses: MaintenanceStatus[] = ["Open", "Scheduled", "In Progress", "Resolved"];

export default async function handler(request: NextApiRequest, response: NextApiResponse) {
  if (request.method !== "POST") {
    response.setHeader("Allow", "POST");
    response.status(405).json({ message: "Method not allowed" });
    return;
  }

  const priority = priorities.includes(request.body.priority) ? request.body.priority : "Medium";
  const status = statuses.includes(request.body.status) ? request.body.status : "Open";

  const issue = await addMaintenanceIssue({
    propertyId: String(request.body.propertyId ?? ""),
    title: String(request.body.title ?? ""),
    description: String(request.body.description ?? ""),
    priority,
    status,
    vendor: String(request.body.vendor ?? ""),
    nextStep: String(request.body.nextStep ?? "")
  });

  response.status(201).json(issue);
}
