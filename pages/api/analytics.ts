import type { NextApiRequest, NextApiResponse } from "next";
import { addAnalyticsEvent, readAnalyticsEvents } from "@/services/analytics";
import type { AnalyticsEventName } from "@/utils/types";

const allowedEventNames: AnalyticsEventName[] = [
  "screen_view",
  "click",
  "workflow_step",
  "stuck_signal",
  "feature_visible",
  "error"
];

export default async function handler(request: NextApiRequest, response: NextApiResponse) {
  if (request.method === "GET") {
    const events = await readAnalyticsEvents();
    response.status(200).json({ events: events.slice(0, 200) });
    return;
  }

  if (request.method === "POST") {
    const name = allowedEventNames.includes(request.body?.name) ? request.body.name : "error";
    const event = await addAnalyticsEvent({
      sessionId: String(request.body?.sessionId ?? ""),
      timestamp: typeof request.body?.timestamp === "string" ? request.body.timestamp : undefined,
      name,
      role: optionalString(request.body?.role),
      screen: optionalString(request.body?.screen),
      workflow: optionalString(request.body?.workflow),
      target: optionalString(request.body?.target),
      feature: optionalString(request.body?.feature),
      demoMode: Boolean(request.body?.demoMode),
      metadata: request.body?.metadata
    });

    response.status(202).json({ event });
    return;
  }

  response.setHeader("Allow", "GET, POST");
  response.status(405).json({ message: "Method not allowed" });
}

function optionalString(value: unknown) {
  return typeof value === "string" ? value : undefined;
}
