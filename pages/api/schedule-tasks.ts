import type { NextApiRequest, NextApiResponse } from "next";
import { addScheduleTask, updateScheduleTaskStatus } from "@/lib/db";
import type { ScheduleTaskStatus, ScheduleTaskType } from "@/lib/types";

const taskTypes: ScheduleTaskType[] = [
  "Home Watch",
  "Pre-Guest Arrival",
  "Post-Checkout",
  "Cleaner",
  "Maintenance",
  "Vendor",
  "Other"
];
const statuses: ScheduleTaskStatus[] = ["Scheduled", "In Progress", "Complete", "Skipped"];

export default async function handler(request: NextApiRequest, response: NextApiResponse) {
  if (request.method !== "POST" && request.method !== "PATCH") {
    response.setHeader("Allow", "POST, PATCH");
    response.status(405).json({ message: "Method not allowed" });
    return;
  }

  if (request.method === "PATCH") {
    try {
      const taskId = String(request.body.id ?? "");
      const status = statuses.includes(request.body.status) ? request.body.status : undefined;

      if (!taskId || !status) {
        response.status(400).json({ message: "Task and valid status are required." });
        return;
      }

      const task = await updateScheduleTaskStatus(taskId, status);

      if (!task) {
        response.status(404).json({ message: "Scheduled task not found." });
        return;
      }

      response.status(200).json(task);
    } catch (error) {
      response.status(500).json({
        message: `Scheduled task could not be updated: ${formatErrorMessage(error)}`
      });
    }
    return;
  }

  try {
    const title = String(request.body.title ?? "").trim();
    const propertyId = String(request.body.propertyId ?? "").trim();
    const scheduledDate = new Date(String(request.body.scheduledFor ?? ""));
    const type = taskTypes.includes(request.body.type) ? request.body.type : "Home Watch";
    const status = statuses.includes(request.body.status) ? request.body.status : "Scheduled";

    if (!propertyId || !title || Number.isNaN(scheduledDate.getTime())) {
      response.status(400).json({ message: "Property, task title, and scheduled date are required." });
      return;
    }

    const task = await addScheduleTask({
      propertyId,
      scheduledFor: scheduledDate.toISOString(),
      type,
      title,
      status,
      assignedTo: String(request.body.assignedTo ?? ""),
      notes: String(request.body.notes ?? "")
    });

    response.status(201).json(task);
  } catch (error) {
    response.status(500).json({
      message: `Scheduled task could not be saved: ${formatErrorMessage(error)}`
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

  return "Please confirm the schedule_tasks table exists in Supabase and try again.";
}
